import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { User } from '../models/User';
import { JwtService } from '../services/jwt.service';

// Userモデルに合わせた独自の権限列挙型
export enum UserRole {
  USER = 'User',
  ADMIN = 'Admin',
  SUPER_ADMIN = 'SuperAdmin'
}

/**
 * リクエスト型拡張 - ユーザー情報を含める
 */
export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: UserRole;
    id: string;
    organizationId?: string;
  };
  authMethod?: 'firebase' | 'jwt'; // どの認証方式で認証されたかを保持
}

/**
 * 認証不要なパスのリスト
 * フォーム入力支援など、認証前に必要となるエンドポイント
 */
const PUBLIC_PATHS = [
  // JWT認証関連のエンドポイント
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh-token',
  
  // 四柱推命プロフィール関連の公開API
  '/api/v1/saju-profiles/available-cities',
  '/api/v1/saju-profiles/city-coordinates',
  '/api/v1/saju-profiles/local-time-offset',
];

/**
 * 認証をバイパスできるパスかチェックする
 * @param path リクエストパス
 * @returns 認証不要なパスならtrue
 */
const isPublicPath = (path: string): boolean => {
  return PUBLIC_PATHS.some(publicPath => 
    path === publicPath || 
    (publicPath.endsWith('/') ? path.startsWith(publicPath) : path.startsWith(publicPath + '/'))
  );
};

/**
 * Firebase認証を試行
 * @param token 認証トークン
 * @returns 認証結果とユーザー情報
 */
const tryFirebaseAuth = async (token: string) => {
  try {
    const decodedToken = await auth.verifyIdToken(token);
    
    if (!decodedToken.uid) {
      return { authenticated: false };
    }
    
    // カスタムクレームから権限情報を取得
    let role = UserRole.USER;
    
    if (decodedToken.role === 'super_admin') {
      role = UserRole.SUPER_ADMIN;
    } else if (decodedToken.role === 'admin') {
      role = UserRole.ADMIN;
    } else if (decodedToken.role) {
      role = decodedToken.role as UserRole;
    }
    
    // ユーザー情報を返す
    return {
      authenticated: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        role,
        id: decodedToken.uid,
        organizationId: decodedToken.organizationId
      },
      method: 'firebase' as const
    };
  } catch (error) {
    console.error('Firebase認証エラー:', error);
    return { authenticated: false };
  }
};

/**
 * JWT認証を試行
 * @param token 認証トークン
 * @returns 認証結果とユーザー情報
 */
const tryJwtAuth = async (token: string) => {
  try {
    const verification = JwtService.verifyAccessToken(token);
    
    if (!verification.valid || !verification.payload) {
      return { authenticated: false };
    }
    
    const userId = verification.payload.sub;
    if (!userId) {
      return { authenticated: false };
    }
    
    // データベースからユーザー情報を取得
    const user = await User.findById(userId);
    if (!user) {
      return { authenticated: false };
    }
    
    // ユーザー情報を返す
    return {
      authenticated: true,
      user: {
        uid: user._id ? user._id.toString() : '',
        email: user.email,
        role: user.role as UserRole,
        id: user._id ? user._id.toString() : '',
        organizationId: user.organizationId?.toString()
      },
      method: 'jwt' as const
    };
  } catch (error) {
    console.error('JWT認証エラー:', error);
    return { authenticated: false };
  }
};

/**
 * ハイブリッド認証ミドルウェア
 * Firebase認証とJWT認証の両方をサポート
 */
export const hybridAuthenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // 認証不要なパスの場合はスキップ
  if (isPublicPath(req.path)) {
    return next();
  }

  try {
    // トークンをヘッダーまたはクエリパラメータから取得
    let token: string | undefined;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split('Bearer ')[1];
    }
    
    // クエリパラメータからのトークン取得（SSE用）
    if (!token && req.query.token) {
      token = req.query.token as string;
    }
    
    if (!token) {
      return res.status(401).json({ message: '認証トークンがありません' });
    }
    
    // JWT認証を最初に試行
    const jwtAuthResult = await tryJwtAuth(token);
    
    if (jwtAuthResult.authenticated) {
      // JWT認証成功
      req.user = jwtAuthResult.user;
      req.authMethod = jwtAuthResult.method;
      return next();
    }
    
    // Firebase認証を試行
    const firebaseAuthResult = await tryFirebaseAuth(token);
    
    if (firebaseAuthResult.authenticated) {
      // Firebase認証成功
      req.user = firebaseAuthResult.user;
      req.authMethod = firebaseAuthResult.method;
      return next();
    }
    
    // 両方の認証に失敗
    return res.status(401).json({ message: '認証に失敗しました' });
  } catch (error) {
    console.error('ハイブリッド認証エラー:', error);
    return res.status(401).json({ message: '認証処理中にエラーが発生しました' });
  }
};

/**
 * 管理者権限を検証するミドルウェア
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: '認証されていません' });
  }
  
  if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ message: '管理者権限が必要です' });
  }
  
  next();
};

/**
 * スーパー管理者権限を検証するミドルウェア
 */
export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: '認証されていません' });
  }
  
  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ message: 'スーパー管理者権限が必要です' });
  }
  
  next();
};