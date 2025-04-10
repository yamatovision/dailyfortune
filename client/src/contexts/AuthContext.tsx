import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  sendPasswordResetEmail
} from 'firebase/auth'
import { app } from '../config/firebase'
import { IUser, UserRole, USER, AUTH } from '@shared/index'
import apiService from '../services/api.service'

const auth = getAuth(app)

// 認証コンテキストの型定義
type AuthContextType = {
  currentUser: FirebaseUser | null
  userProfile: IUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<FirebaseUser>
  register: (email: string, password: string, displayName: string) => Promise<FirebaseUser>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateEmail: (newEmail: string) => Promise<void>
  updateUserProfile: (profileData: Partial<IUser>) => Promise<IUser>
  refreshUserProfile: () => Promise<IUser | null>
  isAdmin: boolean
  isSuperAdmin: boolean
  activeTeamId: string | null
  setActiveTeamId: (teamId: string) => void
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
  // ローカルストレージから管理者の選択中のアクティブチームを初期化
  const [activeTeamId, setActiveTeamId] = useState<string | null>(() => {
    return localStorage.getItem('activeTeamId')
  })

  // ユーザー認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      
      if (user) {
        // ユーザーの詳細情報（権限など）をAPIから取得
        try {
          // ApiServiceを使用してプロフィールを取得
          const response = await apiService.get<IUser>(AUTH.PROFILE);
          
          if (response.status === 200) {
            const userData = response.data
            console.log('AuthContext: ユーザープロフィール取得成功', userData);
            
            // 生年月日情報のデバッグログ
            console.log('AuthContext: 生年月日データ:', {
              birthDate: userData.birthDate,
              birthTime: userData.birthTime,
              birthPlace: userData.birthPlace,
              type: typeof userData.birthDate
            });
            
            // ユーザープロフィール取得後にもう一度詳細情報を取得
            try {
              const profileResponse = await apiService.get<IUser>(USER.GET_PROFILE);
              
              if (profileResponse.status === 200) {
                const profileData = profileResponse.data;
                console.log('AuthContext: 詳細プロフィール取得成功', profileData);
                
                // birthDateなどの情報があれば、元のuserDataに追加
                const enrichedUserData = {
                  ...userData,
                  birthDate: profileData.birthDate || userData.birthDate,
                  birthTime: profileData.birthTime || userData.birthTime,
                  birthPlace: profileData.birthPlace || userData.birthPlace,
                  gender: profileData.gender || userData.gender,
                  birthplaceCoordinates: profileData.birthplaceCoordinates || userData.birthplaceCoordinates,
                  localTimeOffset: profileData.localTimeOffset || userData.localTimeOffset,
                  // 個人目標
                  goal: profileData.goal || userData.goal,
                  // チーム関連情報を追加
                  jobTitle: profileData.jobTitle || userData.jobTitle || "一般社員", // jobTitleを設定
                  // 四柱推命関連情報も追加
                  elementAttribute: profileData.elementAttribute || userData.elementAttribute,
                  dayMaster: profileData.dayMaster || userData.dayMaster,
                  fourPillars: profileData.fourPillars || userData.fourPillars,
                  personalityDescription: profileData.personalityDescription || userData.personalityDescription,
                  careerAptitude: profileData.careerAptitude || userData.careerAptitude
                };
                
                console.log('AuthContext: 統合ユーザーデータ:', {
                  birthDate: enrichedUserData.birthDate,
                  birthTime: enrichedUserData.birthTime,
                  birthPlace: enrichedUserData.birthPlace,
                  goal: enrichedUserData.goal,
                  elementAttribute: enrichedUserData.elementAttribute,
                  fourPillarsExists: !!enrichedUserData.fourPillars
                });
                
                setUserProfile(enrichedUserData);
              } else {
                console.warn('AuthContext: 詳細プロフィール取得失敗、基本情報のみを使用します');
                setUserProfile(userData);
              }
            } catch (profileError) {
              console.error('AuthContext: 詳細プロフィール取得エラー:', profileError);
              setUserProfile(userData);
            }
          } else {
            console.error('ユーザー情報取得エラー:', response.statusText)
            setUserProfile(null)
          }
        } catch (error) {
          console.error('ユーザー情報取得エラー:', error)
          setUserProfile(null)
        }
      } else {
        setUserProfile(null)
      }
      
      setLoading(false)
    })

    return unsubscribe
  }, [])

  // ログイン機能
  const login = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password)
    return result.user
  }

  // 会員登録機能
  const register = async (email: string, password: string, displayName: string) => {
    // Firebaseで認証ユーザー作成
    const result = await createUserWithEmailAndPassword(auth, email, password)
    
    // バックエンドAPIにユーザー情報を登録
    await apiService.post(AUTH.REGISTER, { displayName });
    
    return result.user
  }

  // パスワードリセット機能
  const resetPassword = (email: string) => {
    return sendPasswordResetEmail(auth, email)
  }

  // ログアウト機能
  const logout = () => {
    return firebaseSignOut(auth)
  }
  
  // メールアドレス更新機能
  const updateEmail = async (newEmail: string) => {
    if (!currentUser) {
      throw new Error('ユーザーが認証されていません')
    }
    
    try {
      // Firebase側でメールアドレスを更新
      // 注意: この操作は最近認証したユーザーのみ可能
      // 必要に応じて再認証を行う必要がある
      // 型エラー回避のため、@firebase/auth からのメソッドを直接使用
      // await currentUser.updateEmail(newEmail)
      
      // バックエンド側でメールアドレスを更新
      const response = await apiService.put(USER.UPDATE_EMAIL, { email: newEmail });
      
      if (response.status !== 200) {
        throw new Error('バックエンドでのメールアドレス更新に失敗しました')
      }
    } catch (error: any) {
      console.error('メールアドレス更新エラー:', error)
      // エラーメッセージをより詳細に
      if (error.code === 'auth/requires-recent-login') {
        throw new Error('セキュリティのため、再度ログインしてからメールアドレスを変更してください')
      }
      throw error
    }
  }
  
  // ユーザープロフィール更新機能（統合エンドポイント）
  const updateUserProfile = async (profileData: Partial<IUser>) => {
    if (!currentUser) {
      throw new Error('ユーザーが認証されていません')
    }

    try {
      // バックエンド側でプロフィールを更新（apiServiceを使用）
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
  }
  
  // ユーザープロフィール再取得
  const refreshUserProfile = async () => {
    if (!currentUser) {
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
  }

  // 管理者権限チェック - サーバー側のrole名とenum値が一致しない場合に対応
  const userRole = userProfile?.role as string; // 型を文字列として扱う
  const isAdmin = userRole === UserRole.ADMIN || 
                  userRole === 'admin' || 
                  userRole === 'Admin' || 
                  userRole === UserRole.SUPER_ADMIN || 
                  userRole === 'super_admin' || 
                  userRole === 'SuperAdmin'
  
  // スーパー管理者権限チェック - サーバー側のrole名とenum値が一致しない場合に対応
  const isSuperAdmin = userRole === UserRole.SUPER_ADMIN || 
                       userRole === 'super_admin' || 
                       userRole === 'SuperAdmin'
                       
  // デバッグログ
  console.log('AuthContext roles:', {
    role: userProfile?.role,
    expectedSuperAdmin: UserRole.SUPER_ADMIN,
    isAdmin,
    isSuperAdmin
  })

  // アクティブチームIDが変更されたらローカルストレージに保存
  const handleSetActiveTeamId = (teamId: string) => {
    localStorage.setItem('activeTeamId', teamId);
    setActiveTeamId(teamId);
  }

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
    setActiveTeamId: handleSetActiveTeamId
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// 認証コンテキストフック
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
