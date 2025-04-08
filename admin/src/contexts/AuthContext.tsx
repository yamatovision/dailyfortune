import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth'
import { app } from '../config/firebase'
import { IUser, UserRole } from '@shared/index'

const auth = getAuth(app)

// 認証コンテキストの型定義
type AuthContextType = {
  currentUser: FirebaseUser | null
  userProfile: IUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<FirebaseUser>
  logout: () => Promise<void>
  isSuperAdmin: boolean
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

  // ユーザー認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      
      if (user) {
        // ユーザーの詳細情報（権限など）をAPIから取得
        try {
          const idToken = await user.getIdToken()
          // シンプルに実装 - ローカルのみで動作させるため、バックエンドAPIを呼び出さない
          // スーパー管理者として扱う（Firebase認証のみを使用）
          const userData: Partial<IUser> = {
            id: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Admin User',
            role: UserRole.SUPER_ADMIN,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          setUserProfile(userData as IUser)
          // この行は後で削除。実際はここでAPIを呼び出す
          /* const response = await fetch(`${import.meta.env.VITE_AUTH_API_URL}/profile`, {
            headers: {
              Authorization: `Bearer ${idToken}`
            }
          })
          
          // APIリクエスト部分をコメントアウト
          /*
          if (response.ok) {
            const userData = await response.json()
            setUserProfile(userData)
          } else {
            console.error('ユーザー情報取得エラー:', response.statusText)
            setUserProfile(null)
          }
          */
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

  // ログアウト機能
  const logout = () => {
    return firebaseSignOut(auth)
  }

  // スーパー管理者権限チェック
  const isSuperAdmin = userProfile?.role === UserRole.SUPER_ADMIN

  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    logout,
    isSuperAdmin
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
