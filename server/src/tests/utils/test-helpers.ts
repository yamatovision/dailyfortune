import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';
import { User } from '../../models/User';
import { UserRole } from '../../middleware/auth.middleware';

/**
 * テスト用モック型定義
 * Pは元の型、Rはモック返り値の型
 */
export type MockType<T> = T & jest.Mock;

/**
 * テスト用ユーザータイプ
 */
export type MockUserType = 'superadmin' | 'admin' | 'user';

/**
 * Firebase認証のモック用関数
 */
export const mockFirebaseAuth = () => {
  jest.mock('../../config/firebase', () => ({
    auth: {
      verifyIdToken: jest.fn(),
    }
  }));
};

/**
 * テスト用ユーザー作成関数
 */
export const createMockUser = async (
  type: MockUserType = 'user',
  overrides: Partial<any> = {}
) => {
  let role: 'SuperAdmin' | 'Admin' | 'User';
  let plan: 'elite' | 'lite' = 'lite';
  
  switch (type) {
    case 'superadmin':
      role = 'SuperAdmin';
      plan = 'elite';
      break;
    case 'admin':
      role = 'Admin';
      plan = 'elite';
      break;
    default:
      role = 'User';
      break;
  }

  const userId = new mongoose.Types.ObjectId();
  
  // 組織IDとチームIDを生成（必須フィールド）
  const organizationId = new mongoose.Types.ObjectId();
  const teamId = new mongoose.Types.ObjectId();
  
  const userData = {
    _id: userId,
    firebaseUid: `firebase-${userId}`,
    email: `${type}-${userId}@example.com`,
    password: 'Password123!', // 必須フィールド
    displayName: `Test ${type.charAt(0).toUpperCase() + type.slice(1)}`,
    role,
    plan,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    organizationId, // 必須フィールド
    teamId, // 必須フィールド
    ...overrides
  };

  return await User.create(userData);
};

/**
 * Firebase認証トークン検証のモック関数
 */
export const mockVerifyIdToken = (auth: any, user: any) => {
  (auth.verifyIdToken as jest.Mock).mockResolvedValue({
    uid: user.firebaseUid,
    email: user.email
  });
};

/**
 * テスト用のアプリケーションインスタンスを作成
 */
export const createTestApp = () => {
  const app = express();
  app.use(express.json());
  return app;
};

/**
 * テストサーバーのリクエスト生成関数
 */
export const createTestRequest = (app: express.Application) => {
  return request(app);
};

/**
 * テスト用の認証トークンを生成
 */
export const generateTestToken = (userId: string = 'test-user') => {
  return `test-token-${userId}`;
};

/**
 * テストの実行前にデータベースをクリーンアップする関数
 */
export const cleanDatabase = async () => {
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
};