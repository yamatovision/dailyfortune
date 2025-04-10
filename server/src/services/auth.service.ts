import { auth } from '../config/firebase';
import { User } from '../models';
import mongoose from 'mongoose';
import { ValidationError, AuthenticationError, NotFoundError } from '../utils';

enum UserRole {
  USER = 'User',
  ADMIN = 'Admin',
  SUPER_ADMIN = 'SuperAdmin'
}

interface RegisterUserData {
  displayName: string;
  uid: string;
  email: string;
}

export class AuthService {
  /**
   * プロフィール情報を取得する
   */
  async getProfile(uid: string): Promise<any> {
    if (!uid) {
      throw new AuthenticationError('認証情報が無効です');
    }
    
    // データベースからユーザー情報を取得
    const user = await User.findById(uid).select('-password');
    
    if (!user) {
      throw new NotFoundError('ユーザーが見つかりません');
    }
    
    return {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  /**
   * ユーザー登録処理
   */
  async register(data: RegisterUserData): Promise<any> {
    // 入力検証
    if (!data.uid || !data.displayName) {
      throw new ValidationError('ユーザーIDと表示名は必須です');
    }
    
    // ユーザー情報が既に存在するか確認
    const existingUser = await User.findById(data.uid);
    
    if (existingUser) {
      throw new ValidationError('ユーザーは既に登録されています');
    }
    
    // 新規ユーザー情報をデータベースに保存
    const newUser = new User({
      _id: new mongoose.Types.ObjectId(data.uid),
      email: data.email,
      displayName: data.displayName,
      role: UserRole.USER,
      plan: 'lite',
      isActive: true
    });
    
    await newUser.save();
    
    return {
      id: newUser._id,
      email: newUser.email,
      displayName: newUser.displayName,
      role: newUser.role,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt
    };
  }

  /**
   * パスワードリセットリクエスト処理
   */
  async requestPasswordReset(email: string): Promise<void> {
    if (!email) {
      throw new ValidationError('メールアドレスは必須です');
    }
    
    try {
      // Firebase認証でパスワードリセットメールを送信
      await auth.generatePasswordResetLink(email);
    } catch (error) {
      if (error instanceof Error) {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }
}