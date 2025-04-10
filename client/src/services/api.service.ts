import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getAuth } from 'firebase/auth';

// トレースIDを生成する関数
const generateTraceId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;
  private isDebugMode = true; // 環境変数で制御可能

  constructor() {
    // 相対パスを使用 - '/api/v1'で始まるパスはViteプロキシにより8080ポートへ転送される
    this.baseURL = ''; 

    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    this.api.interceptors.request.use(
      async (config) => {
        const auth = getAuth();
        const user = auth.currentUser;

        // トレースIDを生成し、ヘッダーに追加（サーバー側との紐付け用）
        const traceId = generateTraceId();
        config.headers['X-Trace-ID'] = traceId;

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
      (error: AxiosError) => {
        // エラーレスポンスからトレースIDを取得
        const requestTraceId = error.config?.headers?.['X-Trace-ID'] as string;
        const responseTraceId = error.response?.headers?.['x-trace-id'] || requestTraceId;
        
        this.logError(error, responseTraceId);
        
        // エラーにトレースIDを追加（エラーハンドリング用）
        const enhancedError = error as any;
        enhancedError.traceId = responseTraceId;
        
        if (error.response) {
          const status = error.response.status;
          
          if (status === 401) {
            console.error(`認証エラー: 再ログインが必要です [TraceID: ${responseTraceId}]`);
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