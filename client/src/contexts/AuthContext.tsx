import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  getAuth,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth'
import { app } from '../config/firebase'
import { IUser, UserRole, USER, AUTH } from '@shared/index'
import apiService from '../services/api.service'
import authManager, { AuthMode } from '../services/auth/auth-manager.service'
import tokenService from '../services/auth/token.service'

const auth = getAuth(app)

// 認証コンテキストの型定義
type AuthContextType = {
  currentUser: FirebaseUser | null
  userProfile: IUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<any>
  register: (email: string, password: string, displayName: string) => Promise<any>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateEmail: (newEmail: string) => Promise<void>
  updateUserProfile: (profileData: Partial<IUser>) => Promise<IUser>
  refreshUserProfile: () => Promise<IUser | null>
  isAdmin: boolean
  isSuperAdmin: boolean
  activeTeamId: string | null
  setActiveTeamId: (teamId: string) => void
  // JWT認証移行関連
  authMode: AuthMode
  setAuthMode: (mode: AuthMode) => void
  migrateToJwt: (password: string) => Promise<any>
  shouldPromptMigration: boolean
  setShouldPromptMigration: (value: boolean) => void
}

// コンテキスト作成
const AuthContext = createContext<AuthContextType | null>(null)

// 認証プロバイダーの型
type AuthProviderProps = {
  children: ReactNode
}

// 認証プロバイダーコンポーネント
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<IUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authMode, setAuthMode] = useState<AuthMode>(authManager.getCurrentAuthMode())
  // 移行促進ダイアログの表示フラグ
  const [shouldPromptMigration, setShouldPromptMigration] = useState<boolean>(false)
  
  // ローカルストレージから管理者の選択中のアクティブチームを初期化
  const [activeTeamId, setActiveTeamId] = useState<string | null>(() => {
    return localStorage.getItem('activeTeamId')
  })

  // ユーザー認証状態の監視
  useEffect(() => {
    setLoading(true);
    
    // Firebase認証状態監視
    const firebaseUnsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // JWTリフレッシュトークンがある場合はJWT認証を優先
        const hasJwtToken = !!tokenService.getRefreshToken();
        
        if (hasJwtToken) {
          // JWTトークンの有効性を確認
          const isTokenValid = tokenService.isRefreshTokenValid();
          
          if (isTokenValid) {
            try {
              // 有効なJWTトークンがある場合はそれを使用してプロフィールを取得
              await loadUserProfile();
              
              // 認証モードをJWTに設定
              if (authManager.getCurrentAuthMode() !== AuthMode.JWT) {
                authManager.setAuthMode(AuthMode.JWT);
                setAuthMode(AuthMode.JWT);
              }
            } catch (error) {
              console.error('JWTトークンでのプロフィール取得エラー:', error);
              // JWTトークンでエラーが発生した場合はFirebase認証を使用
              await loadUserProfileWithFirebase(user);
            }
          } else {
            // JWTトークンが無効な場合はFirebase認証を使用
            await loadUserProfileWithFirebase(user);
          }
        } else {
          // JWTトークンがない場合はFirebase認証を使用
          await loadUserProfileWithFirebase(user);
          
          // マイグレーション促進フラグを設定（JWT認証への移行を促す）
          // 既に移行済みの場合やJWT認証モードの場合は促さない
          if (authManager.getCurrentAuthMode() === AuthMode.HYBRID || 
              authManager.getCurrentAuthMode() === AuthMode.FIREBASE) {
            // ローカルストレージに移行促進済みフラグがなければ促進する
            const hasPrompted = localStorage.getItem('jwt_migration_prompted');
            if (!hasPrompted) {
              setShouldPromptMigration(true);
              // 一度表示したフラグを設定（毎回表示しない）
              localStorage.setItem('jwt_migration_prompted', 'true');
            }
          }
        }
      } else {
        // ユーザーがログアウトした場合
        setUserProfile(null);
      }
      
      setLoading(false);
    });
    
    // JWTトークンの自動更新タイマー
    const tokenRefreshInterval = setInterval(() => {
      if (authManager.getCurrentAuthMode() !== AuthMode.FIREBASE) {
        authManager.refreshJwtTokenIfNeeded().catch(err => {
          console.error('トークン自動更新エラー:', err);
        });
      }
    }, 60 * 1000); // 1分ごとにチェック
    
    return () => {
      firebaseUnsubscribe();
      clearInterval(tokenRefreshInterval);
    };
  }, []);
  
  // Firebase認証でのユーザープロフィール取得
  // user引数はFirebaseユーザーオブジェクト
  const loadUserProfileWithFirebase = async (_user: FirebaseUser) => {
    try {
      // ApiServiceを使用してプロフィールを取得
      const response = await apiService.get<IUser>(AUTH.PROFILE);
      
      if (response.status === 200) {
        const userData = response.data;
        
        // ユーザープロフィール取得後にもう一度詳細情報を取得
        try {
          const profileResponse = await apiService.get<IUser>(USER.GET_PROFILE);
          
          if (profileResponse.status === 200) {
            const profileData = profileResponse.data;
            
            // 統合ユーザーデータ作成
            const enrichedUserData = {
              ...userData,
              birthDate: profileData.birthDate || userData.birthDate,
              birthTime: profileData.birthTime || userData.birthTime,
              birthPlace: profileData.birthPlace || userData.birthPlace,
              gender: profileData.gender || userData.gender,
              birthplaceCoordinates: profileData.birthplaceCoordinates || userData.birthplaceCoordinates,
              localTimeOffset: profileData.localTimeOffset || userData.localTimeOffset,
              goal: profileData.goal || userData.goal,
              jobTitle: profileData.jobTitle || userData.jobTitle || "一般社員",
              elementAttribute: profileData.elementAttribute || userData.elementAttribute,
              dayMaster: profileData.dayMaster || userData.dayMaster,
              fourPillars: profileData.fourPillars || userData.fourPillars,
              personalityDescription: profileData.personalityDescription || userData.personalityDescription,
              careerAptitude: profileData.careerAptitude || userData.careerAptitude
            };
            
            setUserProfile(enrichedUserData);
          } else {
            setUserProfile(userData);
          }
        } catch (profileError) {
          console.error('詳細プロフィール取得エラー:', profileError);
          setUserProfile(userData);
        }
      } else {
        console.error('ユーザー情報取得エラー:', response.statusText);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('ユーザー情報取得エラー:', error);
      setUserProfile(null);
    }
  };
  
  // JWT認証でのユーザープロフィール取得
  const loadUserProfile = async () => {
    try {
      // アクセストークンを更新
      await authManager.refreshJwtTokenIfNeeded();
      
      // プロフィールを取得
      const response = await apiService.get<IUser>(USER.GET_PROFILE);
      
      if (response.status === 200) {
        setUserProfile(response.data);
        return response.data;
      } else {
        throw new Error('プロフィール取得に失敗しました');
      }
    } catch (error) {
      console.error('JWT認証でのプロフィール取得エラー:', error);
      throw error;
    }
  };

  // ログイン機能
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await authManager.login(email, password);
      
      // ユーザープロフィールを取得
      await refreshUserProfile();
      
      return result;
    } finally {
      setLoading(false);
    }
  };

  // 会員登録機能
  const register = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      const result = await authManager.register(email, password, displayName);
      
      // ユーザープロフィールを取得
      await refreshUserProfile();
      
      return result;
    } finally {
      setLoading(false);
    }
  };

  // パスワードリセット機能
  const resetPassword = async (email: string) => {
    try {
      if (authManager.getCurrentAuthMode() === AuthMode.JWT) {
        // JWT認証のパスワードリセット（実装予定）
        throw new Error('JWT認証のパスワードリセットは未実装です');
      } else {
        // Firebase認証のパスワードリセット
        // Firebase 9以降はメソッドが変更されたため修正
        const { sendPasswordResetEmail } = await import('firebase/auth');
        return sendPasswordResetEmail(auth, email);
      }
    } catch (error) {
      console.error('パスワードリセットエラー:', error);
      throw error;
    }
  };

  // ログアウト機能
  const logout = async () => {
    try {
      await authManager.logout();
      setUserProfile(null);
      setCurrentUser(null);
    } catch (error) {
      console.error('ログアウトエラー:', error);
      throw error;
    }
  };
  
  // メールアドレス更新機能
  const updateEmail = async (newEmail: string) => {
    if (!userProfile) {
      throw new Error('ユーザーが認証されていません');
    }
    
    try {
      // バックエンド側でメールアドレスを更新
      const response = await apiService.put(USER.UPDATE_EMAIL, { email: newEmail });
      
      if (response.status !== 200) {
        throw new Error('バックエンドでのメールアドレス更新に失敗しました');
      }
      
      // ユーザープロフィールを更新
      await refreshUserProfile();
    } catch (error: any) {
      console.error('メールアドレス更新エラー:', error);
      throw error;
    }
  };
  
  // ユーザープロフィール更新機能
  const updateUserProfile = async (profileData: Partial<IUser>) => {
    if (!userProfile) {
      throw new Error('ユーザーが認証されていません');
    }

    try {
      // バックエンド側でプロフィールを更新
      const response = await apiService.patch(USER.PATCH_PROFILE, profileData);
      
      if (response.status !== 200) {
        throw new Error('プロフィール更新に失敗しました');
      }
      
      // レスポンスからユーザープロフィールを更新
      const updatedUserData = response.data;
      setUserProfile(updatedUserData);
      
      return updatedUserData;
    } catch (error: any) {
      console.error('プロフィール更新エラー:', error);
      throw error;
    }
  };
  
  // ユーザープロフィール再取得
  const refreshUserProfile = async () => {
    if ((!currentUser && !tokenService.getAccessToken())) {
      return null;
    }
    
    try {
      // apiServiceを使用してプロフィールを取得
      const response = await apiService.get(USER.GET_PROFILE);
      
      if (response.status !== 200) {
        throw new Error('プロフィール取得に失敗しました');
      }
      
      const userData = response.data;
      setUserProfile(userData);
      return userData;
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
      return null;
    }
  };
  
  // Firebase認証からJWT認証への移行
  const migrateToJwt = async (password: string) => {
    try {
      setLoading(true);
      const result = await authManager.migrateToJwt(password);
      
      // 認証モードを更新
      setAuthMode(AuthMode.JWT);
      
      // プロフィールを再取得
      await refreshUserProfile();
      
      return result;
    } finally {
      setLoading(false);
    }
  };
  
  // 認証モードの更新
  const handleSetAuthMode = (mode: AuthMode) => {
    authManager.setAuthMode(mode);
    setAuthMode(mode);
  };

  // 管理者権限チェック - サーバー側のrole名とenum値が一致しない場合に対応
  const userRole = userProfile?.role as string; // 型を文字列として扱う
  const isAdmin = userRole === UserRole.ADMIN || 
                  userRole === 'admin' || 
                  userRole === 'Admin' || 
                  userRole === UserRole.SUPER_ADMIN || 
                  userRole === 'super_admin' || 
                  userRole === 'SuperAdmin';
  
  // スーパー管理者権限チェック - サーバー側のrole名とenum値が一致しない場合に対応
  const isSuperAdmin = userRole === UserRole.SUPER_ADMIN || 
                       userRole === 'super_admin' || 
                       userRole === 'SuperAdmin';

  // アクティブチームIDが変更されたらローカルストレージに保存
  const handleSetActiveTeamId = (teamId: string) => {
    localStorage.setItem('activeTeamId', teamId);
    setActiveTeamId(teamId);
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    logout,
    resetPassword,
    updateEmail,
    updateUserProfile,
    refreshUserProfile,
    isAdmin,
    isSuperAdmin,
    activeTeamId,
    setActiveTeamId: handleSetActiveTeamId,
    // JWT認証移行関連
    authMode,
    setAuthMode: handleSetAuthMode,
    migrateToJwt,
    shouldPromptMigration,
    setShouldPromptMigration
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 認証コンテキストフック
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};