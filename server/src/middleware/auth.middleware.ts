import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

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
    // uid: string; // Firebase UID式のフィールドは非推奨です
    id: string; // MongoDB ObjectIDを文字列化した値
    email: string;
    role: UserRole;
    organizationId?: string;
  };
}

/**
 * Firebase認証を検証するミドルウェア
 */
/**
 * 認証不要なパスのリスト
 * フォーム入力支援など、認証前に必要となるエンドポイント
 */
const PUBLIC_PATHS = [
  // 四柱推命プロフィール関連の公開API
  '/api/v1/saju-profiles/available-cities',
  '/api/v1/saju-profiles/city-coordinates', // 前方一致で判定
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
 * Firebase認証を検証するミドルウェア
 * 特定の公開APIパスは認証をスキップする
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // 認証不要なパスの場合はスキップ
  if (isPublicPath(req.path)) {
    console.log(`公開APIへのアクセス: ${req.path}`);
    return next();
  }

  try {
    // トークンをヘッダーまたはクエリパラメータから取得
    // EventSourceがヘッダーを設定できないため、SSE用にクエリパラメータからもトークンを取得できるようにする
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
    
    // Firebaseでトークン検証
    try {
      const decodedToken = await auth.verifyIdToken(token);
    
    
    if (!decodedToken.uid) {
      return res.status(401).json({ message: '無効なトークンです' });
    }
    
    // カスタムクレームから権限情報を取得
    // Firebase上では'super_admin'形式、コード内では'SuperAdmin'形式で扱う
    let role = UserRole.USER;
    
    // カスタムクレームのroleを適切な形式に変換
    if (decodedToken.role === 'super_admin') {
      role = UserRole.SUPER_ADMIN;
    } else if (decodedToken.role === 'admin') {
      role = UserRole.ADMIN;
    } else if (decodedToken.role) {
      role = decodedToken.role as UserRole;
    }
    
    // リクエストオブジェクトにユーザー情報を添付
    req.user = {
      email: decodedToken.email || '',
      role,
      id: decodedToken.uid,
      organizationId: decodedToken.organizationId
    };
    
    next();
    } catch (verifyError) {
      console.error('トークン検証エラー:', verifyError);
      return res.status(401).json({ message: 'トークンの検証に失敗しました' });
    }
  } catch (error) {
    console.error('認証エラー:', error);
    return res.status(401).json({ message: '認証に失敗しました' });
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

/**
 * 認証処理はFirebase Authenticationを使用し、
 * カスタムクレームから権限情報を取得するように変更
 * データベース連携は将来的に実装予定
 */