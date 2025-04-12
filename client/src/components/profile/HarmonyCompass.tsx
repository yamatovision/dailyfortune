import React from 'react';
import { Box, Typography, Paper, Tabs, Tab, Divider, Icon, useTheme, useMediaQuery } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BalanceIcon from '@mui/icons-material/Balance';
import PeopleIcon from '@mui/icons-material/People';
import PsychologyIcon from '@mui/icons-material/Psychology';

// 調和のコンパスのインターフェース
export interface IHarmonyCompass {
  version: string;
  type: string;
  sections: {
    strengths: string;    // 強化すべき方向性
    balance: string;      // 注意すべきバランス
    relationships: string; // 人間関係の智慧
    challenges: string;   // 成長のための課題
  };
}

interface HarmonyCompassProps {
  data: string; // JSON文字列として格納されたデータ
}

const HarmonyCompass: React.FC<HarmonyCompassProps> = ({ data }) => {
  const [activeTab, setActiveTab] = React.useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // JSON文字列をパース
  let parsedData: IHarmonyCompass | null = null;
  let isLegacyFormat = true;
  
  try {
    const parsed = JSON.parse(data);
    if (parsed && parsed.type === 'harmony_compass' && parsed.sections) {
      parsedData = parsed;
      isLegacyFormat = false;
    }
  } catch (e) {
    console.warn('調和のコンパスデータのパースに失敗しました。従来形式として表示します。', e);
  }

  // 従来形式の場合はそのまま表示
  if (isLegacyFormat) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          backgroundColor: 'rgba(250, 245, 255, 0.5)'
        }}
      >
        <Typography variant="body2" paragraph>
          {data || 'データがありません'}
        </Typography>
      </Paper>
    );
  }

  // タブの内容定義
  const tabs = [
    {
      id: 'strengths',
      label: '強化すべき方向性',
      icon: <TrendingUpIcon />,
      color: '#4caf50',
      content: parsedData?.sections.strengths || '',
      iconName: 'trending_up'
    },
    {
      id: 'balance',
      label: 'バランス',
      icon: <BalanceIcon />,
      color: '#ff9800',
      content: parsedData?.sections.balance || '',
      iconName: 'balance'
    },
    {
      id: 'relationships',
      label: '人間関係',
      icon: <PeopleIcon />,
      color: '#2196f3',
      content: parsedData?.sections.relationships || '',
      iconName: 'people'
    },
    {
      id: 'challenges',
      label: '成長課題',
      icon: <PsychologyIcon />,
      color: '#9c27b0',
      content: parsedData?.sections.challenges || '',
      iconName: 'psychology'
    }
  ];

  // 調和のコンパスセクションを表示する
  const renderSection = (title: string, content: string, icon: string, color: string) => {
    return (
      <Box
        sx={{
          mb: 2,
          p: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '5px',
            height: '100%',
            backgroundColor: color,
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, pl: 1 }}>
          <Icon sx={{ mr: 1, color: color }}>{icon}</Icon>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ color }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ pl: 1.5 }} paragraph>
          {content}
        </Typography>
      </Box>
    );
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: { xs: 2, sm: 3 },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        backgroundColor: 'rgba(250, 245, 255, 0.5)',
        overflow: 'hidden'
      }}
    >
      <Tabs 
        value={activeTab}
        onChange={handleTabChange}
        aria-label="調和のコンパスタブ"
        sx={{ 
          mb: 2,
          '& .MuiTabs-indicator': {
            backgroundColor: tabs[activeTab]?.color || 'primary.main',
            height: 3,
          },
          '& .Mui-selected': {
            color: tabs[activeTab]?.color || 'primary.main',
            fontWeight: 'bold'
          },
        }}
        variant={isMobile ? "scrollable" : "fullWidth"}
        scrollButtons="auto"
      >
        {tabs.map((tab) => (
          <Tab 
            key={tab.id}
            label={isMobile ? null : tab.label}
            icon={tab.icon}
            iconPosition={isMobile ? "top" : "start"}
            sx={{
              minHeight: isMobile ? '72px' : '48px',
              '&.Mui-selected': {
                transition: 'all 0.3s',
              }
            }}
            aria-label={tab.label}
          />
        ))}
      </Tabs>

      <Divider sx={{ mb: 2 }} />

      {tabs.map((tab, index) => (
        activeTab === index && (
          <Box 
            key={tab.id}
            sx={{ 
              animation: 'fadeIn 0.5s ease-in-out',
              '@keyframes fadeIn': {
                '0%': { opacity: 0, transform: 'translateY(10px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' }
              }
            }}
          >
            {renderSection(tab.label, tab.content, tab.iconName, tab.color)}
          </Box>
        )
      ))}
    </Paper>
  );
};

export default HarmonyCompass;