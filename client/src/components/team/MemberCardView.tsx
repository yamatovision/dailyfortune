import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  CircularProgress,
  Chip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Card,
  CardHeader,
  CardContent
} from '@mui/material';
import { Close as CloseIcon, WaterDrop, Whatshot, Park, Public, Diamond } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import teamService from '../../services/team.service';

// 五行属性のアイコンマッピング
const elementIcons: { [key: string]: React.ReactNode } = {
  water: <WaterDrop />,
  fire: <Whatshot />,
  wood: <Park />,
  earth: <Public />,
  metal: <Diamond />
};

// 五行属性の色マッピング
const elementColors: { [key: string]: string } = {
  water: '#1e88e5',
  fire: '#e53935',
  wood: '#43a047',
  earth: '#ff8f00',
  metal: '#fdd835'
};

interface MemberCardViewProps {
  teamId: string;
  userId: string;
  onClose?: () => void;
  isDialog?: boolean;
}

const MemberCardView: React.FC<MemberCardViewProps> = ({ teamId, userId, onClose, isDialog = false }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cardData, setCardData] = useState<any>(null);

  useEffect(() => {
    const fetchMemberCard = async () => {
      try {
        setLoading(true);
        const data = await teamService.getMemberCard(teamId, userId);
        setCardData(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch member card:', err);
        setError('メンバーカルテの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    if (teamId && userId) {
      fetchMemberCard();
    }
  }, [teamId, userId]);

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()} 
            sx={{ mt: 2 }}
          >
            再試行
          </Button>
        </Box>
      );
    }

    if (!cardData) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography>データが見つかりません</Typography>
        </Box>
      );
    }

    // 基本プロファイル情報
    const { userInfo, cardContent, lastUpdated } = cardData;
    const element = userInfo.mainElement || 'water';
    const elementColor = elementColors[element] || '#1e88e5';
    const elementIcon = elementIcons[element] || <WaterDrop />;

    return (
      <Box>
        {/* プロフィールヘッダー */}
        <Box 
          sx={{ 
            p: 2, 
            bgcolor: `${elementColor}20`, 
            borderRadius: isDialog ? 0 : '4px 4px 0 0',
            display: 'flex',
            alignItems: 'center',
            mb: 2
          }}
        >
          <Box 
            sx={{ 
              width: 60, 
              height: 60, 
              borderRadius: '50%', 
              bgcolor: elementColor,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              mr: 2
            }}
          >
            {userInfo.avatarInitial}
          </Box>
          <Box>
            <Typography variant="h6">{userInfo.displayName}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                icon={elementIcon} 
                label={element.toUpperCase()} 
                size="small" 
                sx={{ 
                  bgcolor: elementColor, 
                  color: 'white',
                  '& .MuiChip-icon': { color: 'white' }
                }} 
              />
              <Typography variant="body2">{userInfo.role}</Typography>
            </Box>
          </Box>
        </Box>

        {/* カルテ内容（マークダウン） */}
        <Box sx={{ p: 2 }}>
          <ReactMarkdown className="markdown-content">
            {cardContent}
          </ReactMarkdown>
        </Box>
        
        {/* 更新日時 */}
        <Box sx={{ p: 2, borderTop: '1px solid #eee' }}>
          <Typography variant="caption" color="text.secondary">
            最終更新: {new Date(lastUpdated).toLocaleString('ja-JP')}
          </Typography>
        </Box>
      </Box>
    );
  };

  // ダイアログとして表示する場合
  if (isDialog) {
    return (
      <Dialog
        open={true}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          メンバーカルテ
          {onClose && (
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {renderContent()}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>閉じる</Button>
        </DialogActions>
      </Dialog>
    );
  }

  // 通常のコンポーネントとして表示する場合
  return (
    <Paper elevation={2}>
      {renderContent()}
    </Paper>
  );
};

export default MemberCardView;