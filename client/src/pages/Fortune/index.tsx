import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import FortuneCard from '../../components/fortune/FortuneCard';
import LuckyItems from '../../components/fortune/LuckyItems';
import FortuneDetails from '../../components/fortune/FortuneDetails';
import AiConsultButton from '../../components/fortune/AiConsultButton';
import fortuneService from '../../services/fortune.service';
import { IFortune } from '../../../../shared';
import './../../components/fortune/styles.css';

const Fortune: React.FC = () => {
  const [fortune, setFortune] = useState<IFortune | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const fetchFortune = async () => {
      try {
        setLoading(true);
        const fortuneData = await fortuneService.getDailyFortune();
        setFortune(fortuneData);
        setError(null);

        // 日付をフォーマット
        const date = fortuneData.date instanceof Date 
          ? fortuneData.date 
          : new Date(fortuneData.date);
        
        setCurrentDate(fortuneService.formatDate(date));
      } catch (err) {
        console.error('運勢データの取得に失敗しました', err);
        
        // エラーメッセージを設定
        setError('運勢データの取得に失敗しました。しばらくしてからもう一度お試しください。');
        
        // デモ用：エラー時はモックデータを使用
        if (process.env.NODE_ENV !== 'production') {
          const mockFortune = fortuneService.generateMockFortune();
          setFortune(mockFortune);
          setCurrentDate(fortuneService.formatDate(mockFortune.date));
          setError(null); // エラー状態を解除
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFortune();
  }, []);

  // コンテンツが読み込まれた後にアニメーションを有効化
  useEffect(() => {
    const animateSections = () => {
      const sections = document.querySelectorAll('.animate-on-load');
      sections.forEach((section, index) => {
        setTimeout(() => {
          section.classList.add('animated-section');
        }, index * 150); // 各セクションを順番に表示
      });
    };

    if (fortune && !loading) {
      setTimeout(animateSections, 100);
    }
  }, [fortune, loading]);

  return (
    <Box sx={{ p: 2, pb: 10, minHeight: '100vh', bgcolor: 'var(--bg-paper, #f5f5f5)' }}>
      {/* 日付表示 */}
      {currentDate && (
        <Typography 
          variant="body1" 
          align="center" 
          className="date-display"
          sx={{ 
            mb: 1, 
            mt: 1, 
            color: 'primary.dark',
            fontWeight: 400
          }}
        >
          <span style={{ fontWeight: 500 }}>{currentDate}</span>の運勢
        </Typography>
      )}
      
      {loading ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: '70vh'
        }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert 
          severity="error" 
          sx={{ 
            mt: 2,
            borderRadius: 3
          }}
        >
          {error}
        </Alert>
      ) : fortune ? (
        <>
          {/* 運勢カード（アニメーション付き） */}
          <div className="animate-on-load">
            <FortuneCard fortune={fortune} />
          </div>
          
          {/* ラッキーアイテム（アニメーション付き） */}
          <div className="animate-on-load">
            <LuckyItems fortune={fortune} />
          </div>
          
          {/* 運勢詳細（アニメーション付き） */}
          <Paper 
            elevation={1}
            className="animate-on-load"
            sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              boxShadow: '0 3px 8px rgba(156, 39, 176, 0.1)',
              mb: 3
            }}
          >
            <FortuneDetails fortune={fortune} />
          </Paper>
          
          {/* AIアシスタント相談ボタン（アニメーション付き） */}
          <div className="animate-on-load">
            <AiConsultButton />
          </div>
        </>
      ) : (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Alert 
            severity="warning" 
            sx={{ 
              mt: 2,
              mb: 3,
              borderRadius: 3,
              maxWidth: 600,
              mx: 'auto'
            }}
          >
            運勢データが見つかりませんでした。四柱推命プロフィールを設定してください。
          </Alert>
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            パーソナライズされた運勢予測を受け取るには、四柱推命プロフィールの設定が必要です。
          </Typography>
          
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => window.location.reload()}
            sx={{
              borderRadius: 30,
              px: 3,
              py: 1,
              background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
              boxShadow: '0 4px 10px rgba(156, 39, 176, 0.25)',
              '&:hover': {
                boxShadow: '0 6px 15px rgba(156, 39, 176, 0.35)',
              }
            }}
          >
            四柱推命プロフィールを設定する
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Fortune;