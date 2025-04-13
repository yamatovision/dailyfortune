import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getAuth } from 'firebase/auth';

/**
 * APIクライアントサービス
 * バックエンドAPIとの通信を行うための基本クラス
 */
class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    // API基本URLを環境変数から取得（デフォルトはローカル開発環境）
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

    // axiosインスタンスの初期化
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10秒タイムアウト
    });

    // リクエストインターセプター：トークンの追加
    this.api.interceptors.request.use(
      async (config) => {
        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
          try {
            const token = await user.getIdToken(true);
            config.headers['Authorization'] = `Bearer ${token}`;
          } catch (error) {
            console.error('トークン取得エラー:', error);
          }
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // レスポンスインターセプター：エラーハンドリング
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          // サーバーからのエラーレスポンス
          const status = error.response.status;
          
          if (status === 401) {
            // 認証エラー：再ログインを促す
            console.error('認証エラー: 再ログインが必要です');
            // 必要に応じてログアウト処理やログイン画面へのリダイレクトを行う
            // 例: auth.signOut().then(() => window.location.href = '/login');
          } else if (status === 403) {
            // 権限エラー
            console.error('権限エラー: 必要な権限がありません');
          } else if (status >= 500) {
            // サーバーエラー
            console.error('サーバーエラー:', error.response.data);
          }
        } else if (error.request) {
          // リクエスト送信後にレスポンスが返ってこない
          console.error('ネットワークエラー: サーバーから応答がありません');
        } else {
          // リクエスト設定時のエラー
          console.error('リクエスト設定エラー:', error.message);
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * GETリクエスト
   */
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.get<T>(url, config);
  }

  /**
   * POSTリクエスト
   */
  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, data, config);
  }

  /**
   * PUTリクエスト
   */
  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.put<T>(url, data, config);
  }

  /**
   * DELETEリクエスト
   */
  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.delete<T>(url, config);
  }

  /**
   * PATCHリクエスト
   */
  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.patch<T>(url, data, config);
  }
}

// シングルトンインスタンスをエクスポート
export default new ApiService();