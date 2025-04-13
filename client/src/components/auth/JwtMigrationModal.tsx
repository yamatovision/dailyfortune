import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

interface JwtMigrationModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * JWT認証への移行を促すモーダルコンポーネント
 */
const JwtMigrationModal = ({ open, onClose }: JwtMigrationModalProps) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { migrateToJwt } = useAuth();
  
  // パスワードのバリデーション
  const isPasswordValid = () => {
    if (password.length < 8) {
      setError('パスワードは8文字以上である必要があります');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return false;
    }
    
    return true;
  };
  
  // 移行処理
  const handleMigration = async () => {
    setError(null);
    
    if (!isPasswordValid()) {
      return;
    }
    
    setLoading(true);
    try {
      await migrateToJwt(password);
      setSuccess(true);
      // 成功メッセージを表示した後、3秒後に閉じる
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error: any) {
      console.error('JWT認証への移行エラー:', error);
      setError(error.message || 'JWT認証への移行中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };
  
  // モーダルクローズ時の処理
  const handleClose = () => {
    // 成功時は直接閉じる、それ以外は確認
    if (success) {
      onClose();
      return;
    }
    
    // 入力中の場合は確認ダイアログを表示
    if (password || confirmPassword) {
      if (window.confirm('入力内容が破棄されますが、よろしいですか？')) {
        onClose();
      }
    } else {
      onClose();
    }
  };
  
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>JWT認証へのアップグレード</DialogTitle>
      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mt: 2 }}>
            JWT認証への移行が完了しました！より安全な認証方式に切り替わりました。
          </Alert>
        ) : (
          <>
            <Typography variant="body1" sx={{ mb: 2 }}>
              より優れたセキュリティとパフォーマンスを提供する新しい認証システムへの移行をお願いします。
              この移行には新しいパスワードの設定が必要です。
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              ※ この変更によってアプリの使い方が変わることはありません。ログイン方法が改善されるだけです。
            </Typography>
            
            <TextField
              label="新しいパスワード"
              type="password"
              fullWidth
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              error={!!error && password.length > 0}
              helperText={password.length > 0 && password.length < 8 ? 'パスワードは8文字以上にしてください' : ''}
              disabled={loading}
            />
            
            <TextField
              label="パスワード（確認）"
              type="password"
              fullWidth
              variant="outlined"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              error={!!error && confirmPassword.length > 0}
              disabled={loading}
            />
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        {!success && (
          <>
            <Button onClick={handleClose} disabled={loading}>
              キャンセル
            </Button>
            <Button 
              onClick={handleMigration} 
              variant="contained"
              color="primary"
              disabled={loading || !password || !confirmPassword}
            >
              {loading ? <CircularProgress size={24} /> : '移行する'}
            </Button>
          </>
        )}
        {success && (
          <Button onClick={onClose} color="primary">
            閉じる
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default JwtMigrationModal;