import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import tokenService from '../../services/auth/token.service'
// import { UserRole } from '@shared/index'

type ProtectedRouteProps = {
  children: ReactNode
  requiredRole?: 'user' | 'admin' | 'super_admin'
}

// 保護されたルートコンポーネント
export const ProtectedRoute = ({ 
  children, 
  requiredRole = 'user'  // デフォルトは一般ユーザー
}: ProtectedRouteProps) => {
  const { currentUser, userProfile, loading, isAdmin, isSuperAdmin } = useAuth()
  const location = useLocation()

  // 認証状態ロード中は何も表示しない
  if (loading) {
    return <div>Loading...</div>
  }

  // JWT認証のアクセストークンを確認
  const hasJwtToken = tokenService.getAccessToken() !== null;
  
  // 未ログインの場合はログインページにリダイレクト
  // Firebase認証またはJWT認証のいずれかが有効であればOK
  if (!currentUser && !hasJwtToken) {
    console.log("認証情報がありません。ログイン画面へリダイレクトします。");
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // ユーザープロフィールが取得できていない場合もログインページにリダイレクト
  if (!userProfile) {
    console.log("ユーザープロフィールが取得できていません。ログイン画面へリダイレクトします。");
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 権限チェック
  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/unauthorized" replace />
  }

  if (requiredRole === 'super_admin' && !isSuperAdmin) {
    return <Navigate to="/unauthorized" replace />
  }

  // 認証&権限チェック通過後、子コンポーネントをレンダリング
  return <>{children}</>
}
