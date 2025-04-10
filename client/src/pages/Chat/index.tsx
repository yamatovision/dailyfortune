import React from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ChatContainer from '../../components/chat/ChatContainer';
import { ChatMode } from '../../../../shared';

/**
 * チャットページコンポーネント
 * AIとのチャットインターフェースを提供
 */
const ChatPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // URLクエリパラメータからモードを取得
  const queryParams = new URLSearchParams(location.search);
  const initialMode = queryParams.get('mode') as ChatMode || ChatMode.PERSONAL;
  
  // 戻るハンドラー
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Box 
      sx={{ 
        height: '100%', 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        pt: 0, // ヘッダーの下のパディングを削除
        // モバイルではフルスクリーンライク
        px: { xs: 0, md: 2 },
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* チャットコンテナ */}
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        overflow: 'hidden',
        width: '100%',
        // デスクトップでは最大幅を設定
        maxWidth: { md: '600px' },
        mx: 'auto'  // 中央揃え
      }}>
        <ChatContainer
          initialMode={initialMode}
          onBack={handleBack}
        />
      </Box>
    </Box>
  );
};

export default ChatPage;