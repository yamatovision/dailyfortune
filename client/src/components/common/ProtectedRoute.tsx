import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { UserRole } from '@shared/index'

type ProtectedRouteProps = {
  children: ReactNode
  requiredRole?: 'user' | 'admin' | 'super_admin'
}

// 保護されたルートコンポーネント
export const ProtectedRoute = ({ 
  children, 
  requiredRole = 'user'  // デフォルトは一般ユーザー
}: ProtectedRouteProps) => {
  const { currentUser, loading, isAdmin, isSuperAdmin } = useAuth()
  const location = useLocation()

  // 認証状態ロード中は何も表示しない
  if (loading) {
    return <div>Loading...</div>
  }

  // 未ログインの場合はログインページにリダイレクト
  if (!currentUser) {
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
