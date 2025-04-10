import apiService from '../api.service';
import tokenService from './token.service';
import { JWT_AUTH } from '@shared/index';

// JWT認証サービスの型定義
export interface JwtAuthService {
  login(email: string, password: string): Promise<any>;
  register(email: string, password: string, displayName: string): Promise<any>;
  logout(): Promise<void>;
  refreshToken(): Promise<boolean>;
  migrateToJwt(password: string): Promise<any>;
  isAuthenticated(): boolean;
}

class JwtAuthServiceImpl implements JwtAuthService {
  // ログイン処理
  async login(email: string, password: string): Promise<any> {
    try {
      const response = await apiService.post(JWT_AUTH.LOGIN, { email, password });
      
      if (response.status === 200 && response.data.tokens) {
        const { accessToken, refreshToken } = response.data.tokens;
        
        // トークンをローカルストレージに保存
        tokenService.setTokens(accessToken, refreshToken);
        
        return response.data;
      } else {
        throw new Error('ログインレスポンスが不正です');
      }
    } catch (error: any) {
      console.error('JWT認証ログインエラー:', error);
      throw error;
    }
  }

  // ユーザー登録処理
  async register(email: string, password: string, displayName: string): Promise<any> {
    try {
      const response = await apiService.post(JWT_AUTH.REGISTER, { 
        email, 
        password, 
        displayName 
      });
      
      if (response.status === 201 && response.data.tokens) {
        const { accessToken, refreshToken } = response.data.tokens;
        
        // トークンをローカルストレージに保存
        tokenService.setTokens(accessToken, refreshToken);
        
        return response.data;
      } else {
        throw new Error('ユーザー登録レスポンスが不正です');
      }
    } catch (error) {
      console.error('JWT認証ユーザー登録エラー:', error);
      throw error;
    }
  }

  // Firebase認証からJWT認証への移行
  async migrateToJwt(password: string): Promise<any> {
    try {
      // このエンドポイントはFirebase認証が必要
      const response = await apiService.post(JWT_AUTH.MIGRATE_TO_JWT, { password });
      
      if (response.status === 200 && response.data.tokens) {
        const { accessToken, refreshToken } = response.data.tokens;
        
        // トークンをローカルストレージに保存
        tokenService.setTokens(accessToken, refreshToken);
        
        return response.data;
      } else {
        throw new Error('JWT認証移行レスポンスが不正です');
      }
    } catch (error) {
      console.error('JWT認証移行エラー:', error);
      throw error;
    }
  }

  // ログアウト処理
  async logout(): Promise<void> {
    try {
      // リフレッシュトークンを取得
      const refreshToken = tokenService.getRefreshToken();
      
      if (refreshToken) {
        // サーバー側のリフレッシュトークンを無効化
        await apiService.post(JWT_AUTH.LOGOUT, { refreshToken });
      }
      
      // ローカルのトークンをクリア
      tokenService.clearTokens();
    } catch (error) {
      console.error('JWT認証ログアウトエラー:', error);
      // エラーが発生してもローカルのトークンは必ずクリア
      tokenService.clearTokens();
      throw error;
    }
  }

  // トークンリフレッシュ処理
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = tokenService.getRefreshToken();
      
      if (!refreshToken) {
        console.warn('リフレッシュトークンがありません');
        return false;
      }
      
      const response = await apiService.post(JWT_AUTH.REFRESH_TOKEN, { refreshToken });
      
      if (response.status === 200 && response.data.tokens) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;
        
        // 新しいトークンをローカルストレージに保存
        tokenService.setTokens(accessToken, newRefreshToken);
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('トークンリフレッシュエラー:', error);
      return false;
    }
  }
  
  // 認証状態をチェック
  isAuthenticated(): boolean {
    return tokenService.isAccessTokenValid();
  }
}

export default new JwtAuthServiceImpl();