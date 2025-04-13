import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';

// シークレットキーは環境変数から取得するのが理想
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'dailyfortune_access_token_secret';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'dailyfortune_refresh_token_secret';

// トークンの有効期限設定
const ACCESS_TOKEN_EXPIRY = '15m';  // アクセストークンは短め（15分）
const REFRESH_TOKEN_EXPIRY = '7d';  // リフレッシュトークンは長め（7日）

/**
 * JWTサービス
 * トークンの生成と検証を行う
 */
export class JwtService {
  /**
   * アクセストークンを生成
   * @param user ユーザー情報
   * @returns 生成されたアクセストークン
   */
  static generateAccessToken(user: any): string {
    const payload = {
      sub: user._id?.toString(),
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY
    });
  }

  /**
   * リフレッシュトークンを生成
   * @param user ユーザー情報
   * @returns 生成されたリフレッシュトークン
   */
  static generateRefreshToken(user: any): string {
    const payload = {
      sub: user._id?.toString(),
      // リフレッシュトークンには最小限の情報のみ含める
      tokenVersion: user.tokenVersion || 0 // トークン無効化のためのバージョン
    };

    return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY
    });
  }

  /**
   * アクセストークンを検証
   * @param token 検証するトークン
   * @returns 検証結果とペイロード
   */
  static verifyAccessToken(token: string): { valid: boolean; payload?: any; error?: any } {
    try {
      const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error };
    }
  }

  /**
   * リフレッシュトークンを検証
   * @param token 検証するトークン
   * @returns 検証結果とペイロード
   */
  static verifyRefreshToken(token: string): { valid: boolean; payload?: any; error?: any } {
    try {
      const payload = jwt.verify(token, REFRESH_TOKEN_SECRET);
      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error };
    }
  }

  /**
   * トークンからユーザーIDを抽出
   * @param token JWTトークン 
   * @returns ユーザーID
   */
  static getUserIdFromToken(token: string): string | null {
    try {
      const decoded = jwt.decode(token) as { sub?: string };
      return decoded?.sub || null;
    } catch (error) {
      return null;
    }
  }
}