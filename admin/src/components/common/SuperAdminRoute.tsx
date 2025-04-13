import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

type SuperAdminRouteProps = {
  children: ReactNode
}

// スーパー管理者専用ルート保護コンポーネント
export const SuperAdminRoute = ({ children }: SuperAdminRouteProps) => {
  const { currentUser, loading, isSuperAdmin } = useAuth()
  const location = useLocation()

  // 認証状態ロード中は何も表示しない
  if (loading) {
    return <div>Loading...</div>
  }

  // 未ログインの場合はログインページにリダイレクト
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // スーパー管理者権限チェック
  if (!isSuperAdmin) {
    return <Navigate to="/unauthorized" replace />
  }

  // 認証&権限チェック通過後、子コンポーネントをレンダリング
  return <>{children}</>
}
