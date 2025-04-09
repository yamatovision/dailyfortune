import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/common/ProtectedRoute'

// ページコンポーネント
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Register from './pages/Login/Register'
import ForgotPassword from './pages/Login/ForgotPassword'
import Profile from './pages/Profile'
import Fortune from './pages/Fortune'
import Chat from './pages/Chat'
import Team from './pages/Team'
import AisyouPage from './pages/Team/Aisyou'
import AdminDashboard from './pages/Admin'
import Unauthorized from './pages/Unauthorized'

// テーマ設定
const theme = createTheme({
  palette: {
    primary: {
      main: '#673ab7', // 紫色
      light: '#9575cd',
      dark: '#4527a0',
    },
    secondary: {
      main: '#ff4081', // ピンク
      light: '#ff80ab',
      dark: '#c51162',
    },
    background: {
      default: '#fff',
      paper: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      'Noto Sans JP',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        },
      },
    },
  },
})

function App() {
  const { loading } = useAuth()

  if (loading) {
    // 読み込み中表示
    return <div>Loading...</div>
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* 公開ルート */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* 保護されたルート */}
        <Route element={<Layout />}>
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/fortune" element={
            <ProtectedRoute>
              <Fortune />
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } />
          <Route path="/team" element={
            <ProtectedRoute>
              <Team />
            </ProtectedRoute>
          } />
          <Route path="/team/:teamId" element={
            <ProtectedRoute>
              <Team />
            </ProtectedRoute>
          } />
          <Route path="/team/:teamId/aisyou" element={
            <ProtectedRoute>
              <AisyouPage />
            </ProtectedRoute>
          } />
          
          {/* 管理者ルート */}
          <Route path="/admin/*" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* デフォルトルート */}
          <Route path="/" element={<Navigate to="/fortune" replace />} />
          {/* ワイルドカードルートは / へリダイレクト */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ThemeProvider>
  )
}

export default App
