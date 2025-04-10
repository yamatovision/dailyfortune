import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getAuth } from 'firebase/auth';
import authManager, { AuthMode } from './auth/auth-manager.service';
import tokenService from './auth/token.service';

// トレースIDを生成する関数
const generateTraceId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;
  private isDebugMode = true; // 環境変数で制御可能
  // 認証トークンのリフレッシュ処理中フラグ
  private isRefreshingToken = false;
  // トークンリフレッシュ中のリクエストを保持するキュー
  private tokenRefreshQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  constructor() {
    // 環境に応じてベースURLを設定
    // 本番環境では環境変数のAPI URLを使用し、開発環境ではViteプロキシを活用
    let initialBaseURL = import.meta.env.PROD 
      ? import.meta.env.VITE_API_URL 
      : ''; // 開発環境では空文字列（プロキシ使用）
    
    // 本番環境で '/api/v1' パスの重複を防ぐための処理
    // APIパスの定数に既に '/api/v1' が含まれているため、環境変数側から除去
    if (initialBaseURL.includes('/api/v1')) {
      console.warn('⚠️ Removing duplicate /api/v1 from baseURL to prevent path duplication');
      this.baseURL = initialBaseURL.replace('/api/v1', '');
    } else {
      this.baseURL = initialBaseURL;
    }
    
    console.log(`🌐 API baseURL: ${this.baseURL || '(using proxy)'}`);

    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    this.api.interceptors.request.use(
      async (config) => {
        // トレースIDを生成し、ヘッダーに追加（サーバー側との紐付け用）
        const traceId = generateTraceId();
        config.headers['X-Trace-ID'] = traceId;
        
        // 現在の認証モードを取得
        const authMode = authManager.getCurrentAuthMode();
        
        // JWTトークンを使用する場合（JWT または ハイブリッドモード）
        if (authMode === AuthMode.JWT || authMode === AuthMode.HYBRID) {
          let accessToken = tokenService.getAccessToken();
          
          if (accessToken) {
            // トークンの有効期限が近い場合は更新を試みる
            await authManager.refreshJwtTokenIfNeeded();
            // 最新のトークンを取得
            accessToken = tokenService.getAccessToken();
            
            if (accessToken) {
              config.headers['Authorization'] = `Bearer ${accessToken}`;
              
              if (this.isDebugMode) {
                console.log('🔐 JWT Authorization トークンをセットしました');
              }
            }
          }
        }
        
        // Firebase認証を使用する場合（Firebase または ハイブリッドモード）
        if ((authMode === AuthMode.FIREBASE || authMode === AuthMode.HYBRID) && 
            !config.headers['Authorization']) {
          const auth = getAuth();
          const user = auth.currentUser;
          
          if (user) {
            try {
              // 現在のトークン情報をログ
              const currentToken = await user.getIdTokenResult();
              if (this.isDebugMode) {
                console.group('🔐 Firebase Token Info');
                console.log('Token exists:', !!currentToken.token);
                console.log('Token length:', currentToken.token.length);
                console.log('Token expiration:', currentToken.expirationTime);
                console.log('Claims:', currentToken.claims);
                console.groupEnd();
                
                // トークン有効性確認
                const tokenAge = new Date(currentToken.expirationTime).getTime() - Date.now();
                if (tokenAge < 0) {
                  console.warn('⚠️ Token is expired! Forcing refresh...');
                  // 強制更新
                  const freshToken = await user.getIdToken(true);
                  config.headers['Authorization'] = `Bearer ${freshToken}`;
                } else {
                  console.log(`🔐 Token valid for ${Math.floor(tokenAge / 1000 / 60)} minutes`);
                  config.headers['Authorization'] = `Bearer ${currentToken.token}`;
                }
              } else {
                // デバッグモード以外では通常のトークン設定のみ
                const token = await user.getIdToken(true);
                config.headers['Authorization'] = `Bearer ${token}`;
              }
            } catch (error) {
              console.error('トークン取得エラー:', error);
            }
          } else if (this.isDebugMode) {
            console.warn('⚠️ No user logged in, request will be unauthorized');
          }
        }
        
        this.logRequest(config, traceId);
        return config;
      },
      (error) => {
        this.logError(error);
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => {
        // レスポンスヘッダーからトレースIDを取得（サーバー側で設定されたもの）
        const requestTraceId = response.config.headers?.['X-Trace-ID'] as string;
        const responseTraceId = response.headers?.['x-trace-id'] || requestTraceId;
        
        this.logResponse(response, responseTraceId);
        return response;
      },
      async (error: AxiosError) => {
        // エラーレスポンスからトレースIDを取得
        const requestTraceId = error.config?.headers?.['X-Trace-ID'] as string;
        const responseTraceId = error.response?.headers?.['x-trace-id'] || requestTraceId;
        
        this.logError(error, responseTraceId);
        
        // エラーにトレースIDを追加（エラーハンドリング用）
        const enhancedError = error as any;
        enhancedError.traceId = responseTraceId;
        
        // 現在の認証モードを取得
        const authMode = authManager.getCurrentAuthMode();
        
        if (error.response) {
          const status = error.response.status;
          
          // JWT認証の場合のトークン期限切れ対応
          if (status === 401 && 
             (authMode === AuthMode.JWT || authMode === AuthMode.HYBRID) && 
              tokenService.getRefreshToken() && 
              error.config) {
            
            // リクエスト設定の存在確認と再試行フラグ確認
            const config = error.config;
            if (!config.headers?._retry) {
              // トークンのリフレッシュを試みる
              try {
                // 同時複数リクエストの場合はリフレッシュ処理を一回にまとめる
                let newToken: string | null = null;
                
                if (!this.isRefreshingToken) {
                  this.isRefreshingToken = true;
                  
                  try {
                    // トークンをリフレッシュ
                    const refreshSuccess = await authManager.refreshJwtTokenIfNeeded();
                    
                    if (refreshSuccess) {
                      // リフレッシュに成功したら新しいトークンを取得
                      newToken = tokenService.getAccessToken();
                      
                      // キューにたまっているリクエストを処理
                      this.tokenRefreshQueue.forEach(({ resolve }) => {
                        if (newToken) resolve(newToken);
                      });
                      this.tokenRefreshQueue = [];
                    } else {
                      // リフレッシュに失敗したらエラーを伝播
                      this.tokenRefreshQueue.forEach(({ reject }) => {
                        reject(new Error('トークンのリフレッシュに失敗しました'));
                      });
                      this.tokenRefreshQueue = [];
                    }
                  } finally {
                    this.isRefreshingToken = false;
                  }
                } else {
                  // 既にリフレッシュ処理が進行中の場合は結果を待つ
                  newToken = await new Promise<string>((resolve, reject) => {
                    this.tokenRefreshQueue.push({ resolve, reject });
                  });
                }
                
                // 新しいトークンでリクエストを再試行
                if (newToken) {
                  // リクエスト設定を更新
                  config.headers = config.headers || {};
                  config.headers.Authorization = `Bearer ${newToken}`;
                  config.headers._retry = true; // リトライフラグを設定
                  
                  console.log('トークン更新成功、リクエストを再試行します');
                  // 更新した設定で再リクエスト
                  return this.api(config);
                }
              } catch (retryError) {
                console.error('トークンリフレッシュに失敗しました', retryError);
              }
            }
          } else if (status === 401 && 
                    (authMode === AuthMode.FIREBASE || authMode === AuthMode.HYBRID) && 
                     getAuth().currentUser) {
            // Firebase認証の場合のトークン更新
            try {
              // Firebase認証のトークンを強制的に更新
              const auth = getAuth();
              const user = auth.currentUser;
              
              if (user && error.config && !error.config.headers?._retry) {
                console.log('Firebase認証エラー発生、トークン再取得を試みます');
                // 強制的に新しいトークンを取得
                const freshToken = await user.getIdToken(true);
                
                // リクエスト設定を更新
                const config = error.config;
                config.headers = config.headers || {};
                config.headers.Authorization = `Bearer ${freshToken}`;
                config.headers._retry = true; // リトライフラグを設定
                
                console.log('Firebase トークン再取得成功、リクエストを再試行します');
                // 更新した設定で再リクエスト
                return this.api(config);
              }
            } catch (retryError) {
              console.error('Firebase トークン再取得に失敗しました', retryError);
            }
          } else if (status === 403) {
            console.error(`権限エラー: 必要な権限がありません [TraceID: ${responseTraceId}]`);
          } else if (status >= 500) {
            console.error(`サーバーエラー [TraceID: ${responseTraceId}]:`, error.response.data);
          }
        } else if (error.request) {
          console.error(`ネットワークエラー: サーバーから応答がありません [TraceID: ${responseTraceId}]`);
          console.error('サーバーは起動していますか？CORSの設定は正しいですか？');
        } else {
          console.error(`リクエスト設定エラー [TraceID: ${responseTraceId}]:`, error.message);
        }
        
        return Promise.reject(enhancedError);
      }
    );
  }

  private logRequest(config: AxiosRequestConfig, traceId: string) {
    if (!this.isDebugMode) return;
    
    const method = config.method?.toUpperCase() || 'GET';
    const url = typeof config.url === 'string' ? config.url : 'unknown';
    
    // 実際のリクエストURLをより詳細に表示（デバッグ用）
    const fullUrl = url.startsWith('http') 
      ? url 
      : window.location.origin + (url.startsWith('/') ? url : '/' + url);
    
    console.group(`🌐 API Request: ${method} ${url} [TraceID: ${traceId}]`);
    console.log('Full URL:', fullUrl);
    console.log('Headers:', config.headers);
    console.log('Params:', config.params);
    console.log('Data:', config.data);
    console.groupEnd();
    
    // 開発者ツール用に特別なメッセージ
    console.log('%c🔍 NETWORK DEBUG: 以下のリクエストをネットワークタブで追跡してください', 'color: blue; font-weight: bold');
    console.log(`${method} ${fullUrl}`);
    console.table({
      'TraceID': traceId,
      'Actual URL': fullUrl,
      'Path with Proxy': url.startsWith('/api') ? '✅ Will use proxy' : '⚠️ May not use proxy',
      'Header Authorization': config.headers?.['Authorization'] ? 'Bearer ...[token]' : 'None',
      'Content-Type': config.headers?.['Content-Type'],
      'Request Body': config.data ? JSON.stringify(config.data).substring(0, 100) + '...' : 'None'
    });
  }

  private logResponse(response: AxiosResponse, traceId?: string) {
    if (!this.isDebugMode) return;
    
    const method = response.config.method?.toUpperCase() || 'GET';
    const url = typeof response.config.url === 'string' ? response.config.url : 'unknown';
    
    console.group(`✅ API Response: ${response.status} ${method} ${url} ${traceId ? `[TraceID: ${traceId}]` : ''}`);
    console.log('Data:', response.data);
    console.log('Headers:', response.headers);
    console.log('Status:', response.status);
    console.groupEnd();
  }

  private logError(error: any, traceId?: string) {
    const traceInfo = traceId ? `[TraceID: ${traceId}]` : '';
    
    console.group(`❌ API Error: ${error.config?.method?.toUpperCase() || 'UNKNOWN'} ${error.config?.url || 'unknown'} ${traceInfo}`);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
      console.log('Headers:', error.response.headers);
    } else if (error.request) {
      console.log('Request made but no response received');
      console.log(error.request);
      console.log('CORS問題や、サーバー接続の問題が考えられます');
    } else {
      console.log('Error:', error.message);
    }
    console.log('Config:', error.config);
    console.groupEnd();
  }

  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.get<T>(url, config);
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, data, config);
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.put<T>(url, data, config);
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.delete<T>(url, config);
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.patch<T>(url, data, config);
  }
}

export default new ApiService();