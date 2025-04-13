import { User } from '../models';
import { auth } from '../config/firebase';
import mongoose from 'mongoose';
import { ValidationError, AuthorizationError, NotFoundError } from '../utils';

// 型定義
enum UserRole {
  USER = 'User',
  ADMIN = 'Admin',
  SUPER_ADMIN = 'SuperAdmin'
}

interface UserListOptions {
  page: number;
  limit: number;
  role?: string;
  plan?: string;
  search?: string;
}

interface UserListResult {
  users: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

interface CreateUserData {
  email: string;
  password: string;
  displayName: string;
  role?: string;
  plan?: string;
  organizationId?: string;
  teamId?: string;
}

interface UserCreator {
  uid: string;
  role: string;
}

export class UserService {
  /**
   * ユーザー一覧を取得する
   */
  async getUsers(options: UserListOptions): Promise<UserListResult> {
    const { page, limit, role, plan, search } = options;
    
    // フィルター条件を構築
    const filter = this.buildUserFilter(role, plan, search);
    
    // 総件数取得
    const totalUsers = await User.countDocuments(filter);
    
    // ユーザー一覧取得
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    return {
      users,
      pagination: {
        total: totalUsers,
        page,
        limit,
        pages: Math.ceil(totalUsers / limit)
      }
    };
  }

  /**
   * 新規ユーザーを作成する
   */
  async createUser(data: CreateUserData, creator: UserCreator): Promise<any> {
    // 入力検証
    if (!data.email || !data.password || !data.displayName) {
      throw new ValidationError('メールアドレス、パスワード、表示名は必須です');
    }
    
    // 権限チェック
    const isSuperAdmin = creator.role === UserRole.SUPER_ADMIN;
    const isAdmin = creator.role === UserRole.ADMIN;
    
    // SuperAdmin以外は一般ユーザーのみ作成可能
    if (!isSuperAdmin && data.role && data.role !== UserRole.USER) {
      throw new AuthorizationError('一般ユーザー以外の作成権限がありません');
    }
    
    // ロールとプランの設定
    const userRole = isSuperAdmin && data.role ? data.role : UserRole.USER;
    const userPlan = isSuperAdmin && data.plan ? data.plan : 'lite';
    
    try {
      // Firebase Authenticationでユーザー作成
      const userRecord = await auth.createUser({
        email: data.email,
        password: data.password,
        displayName: data.displayName
      });
      
      // カスタムクレーム設定
      await auth.setCustomUserClaims(userRecord.uid, { role: userRole });
      
      // MongoDBにユーザー情報を保存
      const newUser = new User({
        _id: userRecord.uid, // FirebaseのUIDをそのまま使用
        uid: userRecord.uid, // UIDも保存
        email: data.email,
        password: data.password, // パスワードも保存（ハッシュ化される）
        displayName: data.displayName,
        role: userRole,
        plan: userPlan,
        organizationId: data.organizationId || null,
        teamId: data.teamId || null,
        isActive: true
      });
      
      await newUser.save();
      
      return {
        id: newUser._id,
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role,
        plan: newUser.plan,
        organizationId: newUser.organizationId,
        teamId: newUser.teamId,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt
      };
    } catch (error) {
      // Firebaseエラーのハンドリング
      if (error instanceof Error) {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }

  /**
   * ユーザー権限を変更する
   */
  async updateUserRole(userId: string, role: string, updater: UserCreator): Promise<any> {
    // SuperAdmin権限チェック
    if (updater.role !== UserRole.SUPER_ADMIN) {
      throw new AuthorizationError('ユーザー権限の変更にはSuperAdmin権限が必要です');
    }
    
    // 入力検証
    if (!role || !['SuperAdmin', 'Admin', 'User'].includes(role)) {
      throw new ValidationError('有効な権限を指定してください');
    }
    
    // ユーザー取得
    const user = await User.findById(userId);
    
    if (!user) {
      throw new NotFoundError('ユーザーが見つかりません');
    }
    
    // ユーザー権限更新 - 型アサーションで変換
    user.role = role as 'SuperAdmin' | 'Admin' | 'User';
    await user.save();
    
    try {
      // Firebase カスタムクレーム更新
      await auth.setCustomUserClaims(userId, { role });
    } catch (error) {
      // Firebaseエラーは記録するが、データベース更新は維持
      console.error('Firebase更新エラー:', error);
    }
    
    return {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      updatedAt: user.updatedAt
    };
  }

  /**
   * ユーザープランを変更する
   */
  async updateUserPlan(userId: string, plan: string, updater: UserCreator): Promise<any> {
    // SuperAdmin権限チェック
    if (updater.role !== UserRole.SUPER_ADMIN) {
      throw new AuthorizationError('ユーザープランの変更にはSuperAdmin権限が必要です');
    }
    
    // 入力検証
    if (!plan || !['elite', 'lite'].includes(plan)) {
      throw new ValidationError('有効なプランを指定してください');
    }
    
    // ユーザー取得
    const user = await User.findById(userId);
    
    if (!user) {
      throw new NotFoundError('ユーザーが見つかりません');
    }
    
    // ユーザープラン更新 - 型アサーションで変換
    user.plan = plan as 'elite' | 'lite';
    await user.save();
    
    return {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      plan: user.plan,
      updatedAt: user.updatedAt
    };
  }

  /**
   * ユーザーを削除する
   */
  async deleteUser(userId: string, deleter: UserCreator): Promise<{message: string, deletedUserId: string}> {
    // SuperAdmin権限チェック
    if (deleter.role !== UserRole.SUPER_ADMIN) {
      throw new AuthorizationError('ユーザー削除にはSuperAdmin権限が必要です');
    }
    
    // ユーザー取得
    const user = await User.findById(userId);
    
    if (!user) {
      throw new NotFoundError('ユーザーが見つかりません');
    }
    
    // Firebaseユーザー削除を試みる（存在しない場合もエラーにしない）
    try {
      await auth.deleteUser(userId);
      console.log(`Firebase ユーザー削除成功: ${userId}`);
    } catch (error) {
      // Firebaseユーザーが見つからない場合など、エラーはログに記録するだけで処理を続行
      console.error('Firebase削除エラー:', error);
      console.log(`Firebase ユーザーは存在しないか、すでに削除されています。データベースのユーザー削除を続行します。`);
    }
    
    // MongoDBユーザー削除（Firebaseの結果に関わらず実行）
    await User.findByIdAndDelete(userId);
    
    return {
      message: 'ユーザーを削除しました',
      deletedUserId: userId
    };
  }

  /**
   * ユーザーフィルターを構築する（内部メソッド）
   */
  private buildUserFilter(role?: string, plan?: string, search?: string): any {
    const filter: any = {};
    
    // ロール条件
    if (role && ['SuperAdmin', 'Admin', 'User'].includes(role)) {
      filter.role = role;
    }
    
    // プラン条件
    if (plan && ['elite', 'lite'].includes(plan)) {
      filter.plan = plan;
    }
    
    // 検索条件
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter['$or'] = [
        { displayName: searchRegex },
        { email: searchRegex }
      ];
    }
    
    return filter;
  }
}