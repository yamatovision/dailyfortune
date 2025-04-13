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
      
      // デバッグ用にリフレッシュトークンの一部を表示（セキュリティのため完全なトークンは表示しない）
      const tokenPreview = refreshToken.substring(0, 10) + '...' + refreshToken.substring(refreshToken.length - 10);
      console.log(`リフレッシュトークン使用: ${tokenPreview} (長さ: ${refreshToken.length})`);
      
      // カスタムヘッダーを追加して、リクエストを直接送信
      // 通常のAPIサービスのインターセプターをバイパスしてトークン更新の循環を防ぐ
      const axios = (await import('axios')).default;
      const baseURL = import.meta.env.PROD 
        ? import.meta.env.VITE_API_URL 
        : '';
      
      console.log('リフレッシュトークンリクエスト送信中...');
      const response = await axios({
        method: 'post',
        url: `${baseURL}${JWT_AUTH.REFRESH_TOKEN}`,
        data: { refreshToken },
        headers: {
          'Content-Type': 'application/json',
          'X-Direct-Refresh': 'true' // カスタムヘッダーを追加して直接リフレッシュを示す
        }
      });
      
      console.log('リフレッシュレスポンス受信:', response.status);
      
      if (response.status === 200 && response.data.tokens) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;
        
        // 新しいトークンの一部をログに出力（デバッグ用）
        const newTokenPreview = newRefreshToken.substring(0, 10) + '...' + newRefreshToken.substring(newRefreshToken.length - 10);
        console.log(`新しいリフレッシュトークン受信: ${newTokenPreview} (長さ: ${newRefreshToken.length})`);
        
        // 新しいトークンをローカルストレージに保存
        tokenService.setTokens(accessToken, newRefreshToken);
        console.log('新しいトークンを保存しました');
        
        return true;
      } else {
        console.warn('リフレッシュレスポンスにトークンが含まれていません');
        return false;
      }
    } catch (error: any) {
      console.error('トークンリフレッシュエラー:', error);
      
      // リフレッシュトークンの不一致エラーを特定して自動修復を試みる
      if (error.response?.status === 401 && 
          (error.response?.data?.message === 'リフレッシュトークンが一致しません' ||
           error.response?.data?.message === 'トークンバージョンが一致しません')) {
        
        console.warn('リフレッシュトークンの不一致を検出、自動修復を試みます...');
        
        // リフレッシュトークンをクリアして次回ログイン時に再取得させる
        tokenService.clearTokens();
        
        // ページを再読み込みして再認証を促す
        // 注意: この部分はUIで適切に処理すべきですが、緊急対応として実装
        setTimeout(() => {
          window.location.href = '/login?expired=true';
        }, 500);
      }
      
      return false;
    }
  }
  
  // 認証状態をチェック
  isAuthenticated(): boolean {
    return tokenService.isAccessTokenValid();
  }
}

export default new JwtAuthServiceImpl();