import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Badge from '@mui/material/Badge'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import FingerprintIcon from '@mui/icons-material/Fingerprint'
import { AuthMode } from '../../services/auth/auth-manager.service'

const UserMenu = () => {
  const { userProfile, logout, authMode, setAuthMode, isSuperAdmin, setShouldPromptMigration } = useAuth()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  const handleProfile = () => {
    navigate('/profile')
    handleClose()
  }
  
  // JWT認証への移行ダイアログを表示
  const handleMigrateToJwt = () => {
    handleClose()
    setShouldPromptMigration(true)
  }
  
  // 認証モード切り替え（開発・テスト用）
  const changeAuthMode = (mode: AuthMode) => {
    setAuthMode(mode)
    handleClose()
  }

  // ユーザーの頭文字を生成
  const getInitials = (name: string) => {
    return name
      ? name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
      : '?'
  }

  return (
    <Box>
      <Tooltip title="アカウント設定">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ ml: 2 }}
          aria-controls={open ? 'account-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <Badge 
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              // 認証モードに応じたバッジ表示
              authMode === AuthMode.JWT ? 
                <Tooltip title="JWT認証モード">
                  <FingerprintIcon color="primary" sx={{ width: 16, height: 16 }} />
                </Tooltip> : 
                authMode === AuthMode.HYBRID ? 
                  <Tooltip title="ハイブリッド認証モード">
                    <FingerprintIcon color="action" sx={{ width: 16, height: 16 }} />
                  </Tooltip> : null
            }
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {userProfile ? getInitials(userProfile.displayName) : '?'}
            </Avatar>
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1">{userProfile?.displayName}</Typography>
          <Typography variant="body2" color="text.secondary">
            {userProfile?.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          プロフィール
        </MenuItem>
        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          設定
        </MenuItem>
        
        {/* Firebase認証からJWT認証への移行オプション（ハイブリッドモードまたはFirebaseモード時） */}
        {(authMode === AuthMode.HYBRID || authMode === AuthMode.FIREBASE) && (
          <MenuItem onClick={handleMigrateToJwt}>
            <ListItemIcon>
              <FingerprintIcon fontSize="small" />
            </ListItemIcon>
            JWT認証に移行
          </MenuItem>
        )}
        
        {/* 開発・テスト用の認証モード切り替え（ローカル環境またはsuperadmin時のみ表示） */}
        {(window.location.hostname === 'localhost' || isSuperAdmin) && (
          <>
            <Divider />
            <MenuItem onClick={() => changeAuthMode(AuthMode.JWT)}>
              <ListItemIcon>
                <FingerprintIcon fontSize="small" color={authMode === AuthMode.JWT ? "primary" : "action"} />
              </ListItemIcon>
              JWT認証モード
            </MenuItem>
            
            <MenuItem onClick={() => changeAuthMode(AuthMode.FIREBASE)}>
              <ListItemIcon>
                <FingerprintIcon fontSize="small" color={authMode === AuthMode.FIREBASE ? "primary" : "action"} />
              </ListItemIcon>
              Firebase認証モード
            </MenuItem>
            
            <MenuItem onClick={() => changeAuthMode(AuthMode.HYBRID)}>
              <ListItemIcon>
                <FingerprintIcon fontSize="small" color={authMode === AuthMode.HYBRID ? "primary" : "action"} />
              </ListItemIcon>
              ハイブリッド認証モード
            </MenuItem>
          </>
        )}
        
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          ログアウト
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default UserMenu