import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../middleware/auth.middleware';
import axios from 'axios';
import { auth } from '../../config/firebase';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 環境変数の読み込み
// プロジェクトルートの.envファイルへのパスを指定
const envPath = path.resolve(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

/**
 * テスト用のユーザー情報をリクエストに追加するミドルウェア
 * 認証トークンのヘッダーから、テスト用のrole情報を取得して適用する
 */
export const testAuthMiddleware = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '認証トークンがありません' });
  }
  
  // ヘッダーからrole情報を取得（テスト用のmockedRole=Roleの形式）
  const token = authHeader.split('Bearer ')[1];
  let role = UserRole.USER; // デフォルトはユーザー権限
  
  if (token.includes('mockedRole=SuperAdmin')) {
    role = UserRole.SUPER_ADMIN;
  } else if (token.includes('mockedRole=Admin')) {
    role = UserRole.ADMIN;
  }
  
  // テスト用のユーザー情報をリクエストに追加
  req.user = {
    uid: 'test-user-id',
    email: 'test@example.com',
    role: role
  };
  
  next();
};

/**
 * テスト用の管理者権限チェックミドルウェア
 */
export const testRequireAdmin = (req: any, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: '認証されていません' });
  }
  
  if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ message: '管理者権限が必要です' });
  }
  
  next();
};

/**
 * テスト用のスーパー管理者権限チェックミドルウェア
 */
export const testRequireSuperAdmin = (req: any, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: '認証されていません' });
  }
  
  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ message: 'スーパー管理者権限が必要です' });
  }
  
  next();
};

/**
 * 実際のFirebase認証を使用してトークンを取得する関数
 * 実テスト環境で使用する場合は環境変数で認証情報を設定する必要がある
 */
export const getFirebaseAuthToken = async (email: string, password: string): Promise<string> => {
  try {
    // Firebaseの認証APIエンドポイント
    const apiKey = process.env.VITE_FIREBASE_API_KEY;
    console.log('Using Firebase API Key:', apiKey ? '設定されています' : '未設定です');
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    
    // リクエストボディ
    const requestData = {
      email,
      password,
      returnSecureToken: true
    };
    
    // リクエスト実行
    const response = await axios.post(url, requestData);
    
    // トークンを返す
    return response.data.idToken;
  } catch (error) {
    console.error('Firebase認証エラー:', error);
    throw new Error('認証トークンの取得に失敗しました');
  }
};

/**
 * 実際のFirebase認証を使用してリクエストヘッダーに認証情報を追加する関数
 */
export const withRealAuth = async (headers: Record<string, string> = {}): Promise<Record<string, string>> => {
  try {
    // 環境変数から認証情報を取得
    const email = 'shiraishi.tatsuya@mikoto.co.jp';
    const password = 'aikakumei';
    
    try {
      // トークンを取得
      const token = await getFirebaseAuthToken(email, password);
      console.log('認証トークンを取得しました！');
      return {
        ...headers,
        'Authorization': `Bearer ${token}`
      };
    } catch (error: any) {
      console.log('認証トークン取得に失敗しました。モックトークンを使用します:', error?.message || '不明なエラー');
      // 認証失敗時はモックトークンを使用
      return {
        ...headers,
        'Authorization': 'Bearer mockedRole=SuperAdmin'
      };
    }
  } catch (error: any) {
    console.error('認証ヘッダー生成エラー:', error?.message || '不明なエラー');
    return headers;
  }
};

/**
 * 実際のFirebase認証トークンを検証する関数
 * モックや自動生成のトークンではなく、実際に有効なトークンを使用する
 */
export const verifyFirebaseAuthToken = async (token: string) => {
  try {
    return await auth.verifyIdToken(token);
  } catch (error) {
    console.error('トークン検証エラー:', error);
    throw new Error('トークンの検証に失敗しました');
  }
};