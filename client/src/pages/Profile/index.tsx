import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Paper, 
  Grid, 
  Avatar, 
  Card, 
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Divider,
  Icon,
  CircularProgress,
  useMediaQuery,
  useTheme,
  IconButton,
  FormHelperText,
  Snackbar,
  Alert
} from '@mui/material';
import ParkIcon from '@mui/icons-material/Park'; // 木
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'; // 火
import LandscapeIcon from '@mui/icons-material/Landscape'; // 土 
import StarIcon from '@mui/icons-material/Star'; // 金
import WaterDropIcon from '@mui/icons-material/WaterDrop'; // 水
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PersonIcon from '@mui/icons-material/Person';
import FlagIcon from '@mui/icons-material/Flag';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SecurityIcon from '@mui/icons-material/Security';
import SajuProfileSection from './SajuProfileSection';
import { useAuth } from '../../contexts/AuthContext';
import { getAuth } from 'firebase/auth';
import axios from 'axios';
import { SAJU, USER } from '@shared/index';
import sajuProfileService from '../../services/saju-profile.service';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Profile = () => {
  const [tabValue, setTabValue] = useState(0);
  const { userProfile, loading, updateUserProfile, refreshUserProfile } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loadingCoordinates, setLoadingCoordinates] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  const [formData, setFormData] = useState({
    // 基本プロフィール情報
    displayName: '',
    email: '',
    goal: '',
    // 四柱推命情報
    birthDate: '1990-01-01',
    birthTime: '12:00',
    birthPlace: '東京都',
    gender: 'M',
    // 座標と時差情報
    birthplaceCoordinates: undefined as { longitude: number; latitude: number } | undefined,
    localTimeOffset: undefined as number | undefined,
  });

  useEffect(() => {
    if (userProfile) {
      console.group('👤 ユーザープロフィールデータを処理');
      console.log('生のプロフィールデータ:', userProfile);
      console.log('生年月日データ:', {
        birthDate: userProfile.birthDate,
        birthTime: userProfile.birthTime,
        birthPlace: userProfile.birthPlace
      });
      
      // バックエンドからの四柱推命情報を取得
      const formatDateForInput = (dateStr: string | undefined): string => {
        if (!dateStr) {
          console.log('日付データなし、デフォルト値を使用します');
          return '1990-01-01';
        }
        
        try {
          // 日付文字列のフォーマットをチェック
          console.log('処理対象の日付文字列:', dateStr);
          
          // タイムゾーン問題を解消するためにローカル日付文字列を使用
          const date = new Date(dateStr);
          console.log('JavaScriptのDate型に変換:', date);
          
          // 日付を YYYY-MM-DD 形式に変換
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const formattedDate = `${year}-${month}-${day}`;
          
          console.log(`日付変換結果: ${dateStr} → ${formattedDate}`);
          return formattedDate;
        } catch (e) {
          console.error('日付変換エラー:', e);
          return '1990-01-01';
        }
      };

      // 座標情報がない場合は都市名から取得
      const birthPlace = userProfile.birthPlace || '東京都';
      const hasCoordinates = userProfile.birthplaceCoordinates && 
        typeof userProfile.birthplaceCoordinates.longitude === 'number' && 
        typeof userProfile.birthplaceCoordinates.latitude === 'number';

      setFormData({
        // 基本プロフィール情報
        displayName: userProfile.displayName || '',
        email: userProfile.email || '',
        goal: userProfile.goal || '',
        // 四柱推命情報
        birthDate: formatDateForInput(userProfile.birthDate),
        birthTime: userProfile.birthTime || '12:00',
        birthPlace: birthPlace,
        gender: userProfile.gender || 'M',
        // 座標と時差情報
        birthplaceCoordinates: userProfile.birthplaceCoordinates,
        localTimeOffset: userProfile.localTimeOffset,
      });
      
      // 座標情報がなく、出生地情報がある場合は座標を取得
      if (!hasCoordinates && birthPlace && birthPlace.length >= 2) {
        console.log('座標情報がないため、都市名から座標を取得します:', birthPlace);
        fetchCityCoordinates(birthPlace);
      }
      
      console.groupEnd();
    }
  }, [userProfile]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: any } }) => {
    const { name, value } = e.target;
    console.log(`フィールド "${name}" の値を "${value}" に更新`);
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // 都市名から座標情報を取得する関数
  const fetchCityCoordinates = async (cityName: string) => {
    if (!cityName || cityName.trim().length < 2) {
      return;
    }
    
    setLoadingCoordinates(true);
    try {
      const encodedCityName = encodeURIComponent(cityName.trim());
      console.log(`都市名 "${cityName}" の座標情報を取得中...`);
      
      // 座標情報を取得
      const coordinatesResponse = await axios.get(SAJU.GET_CITY_COORDINATES(encodedCityName));
      
      if (coordinatesResponse.data && coordinatesResponse.data.coordinates) {
        const coordinates = coordinatesResponse.data.coordinates;
        console.log(`座標情報を取得しました:`, coordinates);
        
        // 座標情報を更新
        setFormData(prev => ({
          ...prev,
          birthplaceCoordinates: coordinates
        }));
        
        // 地方時オフセットを計算
        try {
          const offsetResponse = await axios.post(SAJU.CALCULATE_LOCAL_TIME_OFFSET, { coordinates });
          
          if (offsetResponse.data && typeof offsetResponse.data.offsetMinutes === 'number') {
            const offset = offsetResponse.data.offsetMinutes;
            console.log(`地方時オフセットを計算しました: ${offset}分`);
            
            // 地方時オフセットを更新
            setFormData(prev => ({
              ...prev,
              localTimeOffset: offset
            }));
          }
        } catch (offsetError) {
          console.error('地方時オフセットの計算に失敗しました:', offsetError);
        }
      } else {
        console.warn(`"${cityName}" の座標情報が見つかりませんでした`);
      }
    } catch (error) {
      console.error(`座標情報の取得に失敗しました:`, error);
    } finally {
      setLoadingCoordinates(false);
    }
  };

  const handlePersonalFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.group('👤 個人情報フォームが送信されました');
    console.log('送信データ:', formData);
    console.log('日付の検証:', {
      生年月日: formData.birthDate,
      日付型: typeof formData.birthDate,
      有効な日付か: !isNaN(new Date(formData.birthDate).getTime())
    });
    
    setSavingProfile(true);
    
    try {
      // 1. メールアドレス更新（Firebase特有の処理が必要なため別処理）
      if (userProfile?.email !== formData.email) {
        try {
          const auth = getAuth();
          // FirebaseのAuth側でメールアドレスを更新
          await auth.currentUser?.updateEmail(formData.email);
          console.log('Firebaseでメールアドレスを更新しました');
          
          // Firebase側の更新が成功したら、バックエンド側も更新
          await axios({
            method: 'PUT',
            url: USER.UPDATE_EMAIL,
            headers: {
              'Authorization': `Bearer ${await auth.currentUser?.getIdToken(true)}`,
              'Content-Type': 'application/json'
            },
            data: { email: formData.email }
          });
          
        } catch (emailError: any) {
          // Firebaseのエラーコードを確認
          if (emailError.code === 'auth/requires-recent-login') {
            setNotification({
              open: true,
              message: 'セキュリティのため、再度ログインしてからメールアドレスを変更してください',
              severity: 'warning'
            });
            
            console.warn('再認証が必要なため、メールアドレスの更新はスキップします');
            // メール更新エラーは無視して他の更新は続行
          } else {
            throw emailError;
          }
        }
      }
      
      // 2. 統合エンドポイントで他の全ての情報を一括更新
      // 更新データを準備（部分更新）
      const updateData = {
        // 基本情報
        displayName: formData.displayName,
        goal: formData.goal,
        
        // 生年月日情報
        birthDate: formData.birthDate,
        birthTime: formData.birthTime,
        birthPlace: formData.birthPlace,
        gender: formData.gender,
        birthplaceCoordinates: formData.birthplaceCoordinates,
        localTimeOffset: formData.localTimeOffset,
        
        // 四柱推命情報を計算するフラグ
        calculateSaju: true
      };
      
      // 統合エンドポイントを呼び出し
      const updatedProfile = await updateUserProfile(updateData);
      console.log('プロフィール更新完了:', updatedProfile);
      
      // フォームデータに反映
      if (updatedProfile) {
        // 日付変換関数
        const formatDate = (dateStr: string | Date): string => {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0]; // YYYY-MM-DD形式
          }
          return String(dateStr);
        };
        
        // フォームを更新
        setFormData(prev => ({
          ...prev,
          displayName: updatedProfile.displayName || prev.displayName,
          email: updatedProfile.email || prev.email,
          goal: updatedProfile.goal || prev.goal,
          birthDate: updatedProfile.birthDate ? formatDate(updatedProfile.birthDate) : prev.birthDate,
          birthTime: updatedProfile.birthTime || prev.birthTime,
          birthPlace: updatedProfile.birthPlace || prev.birthPlace,
          gender: updatedProfile.gender || prev.gender,
          birthplaceCoordinates: updatedProfile.birthplaceCoordinates || prev.birthplaceCoordinates,
          localTimeOffset: updatedProfile.localTimeOffset || prev.localTimeOffset
        }));
      }
      
      // 正常終了通知
      setNotification({
        open: true,
        message: 'プロフィール情報を更新しました',
        severity: 'success'
      });
      
      console.log('すべての更新が完了しました');
      console.groupEnd();
      
      // 更新が正常終了したらタブを切り替え（四柱推命タブを表示）
      setTabValue(1);
      
      // AuthContextで保持しているuserProfileを最新状態に更新
      await refreshUserProfile();
      
    } catch (error: any) {
      console.error('更新エラー:', error);
      console.groupEnd();
      
      setNotification({
        open: true,
        message: `エラー: ${error.message || '更新処理中にエラーが発生しました'}`,
        severity: 'error'
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // 目標設定は基本プロフィール情報に統合されたため、個別のハンドラーは不要

  const handleSecurityFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // セキュリティ設定フォーム送信処理（実装予定）
    console.log('Security form submitted');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // 通知を閉じる
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ p: 0 }}>
      {/* 通知コンポーネント */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
      
      <Card 
        elevation={0} 
        sx={{ 
          borderRadius: { xs: 0, sm: 3 },
          boxShadow: { xs: 'none', sm: '0 4px 20px rgba(156, 39, 176, 0.15)' },
          mb: { xs: 0, sm: 4 },
          overflow: 'visible',
          background: 'white'
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* ユーザープロフィールヘッダー */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            alignItems: { xs: 'center', sm: 'flex-start' }, 
            justifyContent: 'space-between',
            mb: 3,
            pt: 1
          }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' }, 
              alignItems: { xs: 'center', sm: 'flex-start' }
            }}>
              <Avatar 
                sx={{ 
                  width: 70, 
                  height: 70, 
                  bgcolor: 'primary.main',
                  boxShadow: '0 4px 10px rgba(156, 39, 176, 0.2)',
                  mb: { xs: 2, sm: 0 },
                  mr: { sm: 3 }
                }}
              >
                <AccountCircleIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  {formData.displayName || userProfile?.displayName || '名前未設定'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formData.email || userProfile?.email}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {(userProfile?.elementAttribute || (userProfile?.fourPillars && Object.keys(userProfile.fourPillars).length > 0)) ? (
                    <Box component="span" sx={{ 
                      px: 1.5, 
                      py: 0.5, 
                      borderRadius: 10,
                      bgcolor: () => sajuProfileService.getElementBackground(userProfile?.elementAttribute || 'earth'),
                      color: () => sajuProfileService.getElementColor(userProfile?.elementAttribute || 'earth'),
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      mr: 1
                    }}>
                      {(() => {
                        const element = userProfile?.elementAttribute || 'earth';
                        const elementJp = sajuProfileService.translateElementToJapanese(element);
                        
                        // elementに応じたアイコンを表示
                        return (
                          <>
                            {element === 'wood' && <ParkIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.95rem', verticalAlign: 'text-top' }} />}
                            {element === 'fire' && <LocalFireDepartmentIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.95rem', verticalAlign: 'text-top' }} />}
                            {element === 'earth' && <LandscapeIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.95rem', verticalAlign: 'text-top' }} />}
                            {element === 'metal' && <StarIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.95rem', verticalAlign: 'text-top' }} />}
                            {element === 'water' && <WaterDropIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.95rem', verticalAlign: 'text-top' }} />}
                            {elementJp}
                          </>
                        );
                      })()}
                    </Box>
                  ) : (
                    <Box component="span" sx={{ 
                      px: 1.5, 
                      py: 0.5, 
                      borderRadius: 10,
                      bgcolor: 'primary.light',
                      color: 'primary.dark',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      mr: 1
                    }}>
                      属性未設定
                    </Box>
                  )}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* タブセクション - モバイルではアイコンのみ表示 */}
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="プロフィールタブ"
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTabs-flexContainer': { justifyContent: { xs: 'space-around', sm: 'flex-start' } },
              '& .Mui-selected': { color: 'primary.main', fontWeight: 'bold' },
              mb: 2
            }}
            variant={isMobile ? "fullWidth" : "scrollable"}
            scrollButtons="auto"
          >
            <Tab 
              icon={<PersonIcon />} 
              label={isMobile ? null : "個人情報"} 
              id="profile-tab-0" 
              aria-controls="profile-tabpanel-0"
              iconPosition="start"
            />
            <Tab 
              icon={<AutoAwesomeIcon />} 
              label={isMobile ? null : "四柱推命"} 
              id="profile-tab-1" 
              aria-controls="profile-tabpanel-1"
              iconPosition="start"
            />
            <Tab 
              icon={<SecurityIcon />} 
              label={isMobile ? null : "セキュリティ"} 
              id="profile-tab-2" 
              aria-controls="profile-tabpanel-2"
              iconPosition="start"
            />
          </Tabs>

          {/* 個人情報タブ */}
          <TabPanel value={tabValue} index={0}>
            <Box component="form" onSubmit={handlePersonalFormSubmit}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2, 
                  pb: 1, 
                  borderBottom: '1px solid', 
                  borderColor: 'primary.main',
                  color: 'primary.dark',
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}
              >
                基本プロフィール情報
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                アプリ内でのプロフィール表示に使用される情報です。
              </Typography>

              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="表示名"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    size={isMobile ? "small" : "medium"}
                    helperText="アプリ内での表示名"
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="メールアドレス"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    size={isMobile ? "small" : "medium"}
                    helperText="メールアドレスを変更する場合は、こちらを編集してください"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="個人目標"
                    name="goal"
                    value={formData.goal}
                    onChange={handleInputChange}
                    multiline
                    rows={isMobile ? 2 : 3}
                    size={isMobile ? "small" : "medium"}
                    helperText="あなたの目標を設定してください。デイリー運勢と連携して、目標達成に役立つアドバイスが提供されます。"
                  />
                </Grid>
              </Grid>

              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2, 
                  pb: 1, 
                  borderBottom: '1px solid', 
                  borderColor: 'primary.main',
                  color: 'primary.dark',
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}
              >
                四柱推命情報
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                四柱推命の計算に必要な情報です。正確な情報を入力することで、パーソナライズされた運勢情報が提供されます。
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="生年月日"
                    type="date"
                    name="birthDate"
                    value={formData.birthDate || '1990-01-01'}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    size={isMobile ? "small" : "medium"}
                    helperText="西暦での生年月日を選択してください"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="出生時間"
                    type="time"
                    name="birthTime"
                    value={formData.birthTime}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    size={isMobile ? "small" : "medium"}
                    helperText="24時間形式 (例: 09:30, 15:45)"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ position: 'relative' }}>
                    <TextField
                      fullWidth
                      label="出生地"
                      name="birthPlace"
                      value={formData.birthPlace}
                      onChange={(e) => {
                        handleInputChange(e);
                        // 都市名が変更されたら座標と時差情報を取得
                        if (e.target.value && e.target.value.length >= 2) {
                          fetchCityCoordinates(e.target.value);
                        }
                      }}
                      size={isMobile ? "small" : "medium"}
                      helperText={loadingCoordinates ? "座標情報を取得中..." : "都市名を入力 (例: 東京都, 大阪府, ソウル)"}
                      InputProps={{
                        endAdornment: loadingCoordinates ? (
                          <CircularProgress color="inherit" size={20} sx={{ mr: 1 }} />
                        ) : null
                      }}
                    />
                    {formData.birthplaceCoordinates && (
                      <Box sx={{ 
                        mt: 1,
                        p: 1.5,
                        borderRadius: 1,
                        backgroundColor: 'rgba(250, 245, 255, 0.7)',
                        border: '1px dashed',
                        borderColor: 'primary.light',
                        fontSize: '0.75rem'
                      }}>
                        <Typography variant="caption" component="div" sx={{ fontWeight: 'bold', mb: 0.5, color: 'primary.main' }}>
                          位置情報
                        </Typography>
                        <Typography variant="caption" component="div">
                          経度: {formData.birthplaceCoordinates.longitude.toFixed(4)}° {formData.birthplaceCoordinates.longitude >= 0 ? '東経' : '西経'}
                        </Typography>
                        <Typography variant="caption" component="div">
                          緯度: {formData.birthplaceCoordinates.latitude.toFixed(4)}° {formData.birthplaceCoordinates.latitude >= 0 ? '北緯' : '南緯'}
                        </Typography>
                        {formData.localTimeOffset !== undefined && (
                          <Typography variant="caption" component="div" sx={{ mt: 0.5, fontWeight: 'medium', color: 'info.main' }}>
                            地方時調整: {formData.localTimeOffset > 0 ? '+' : ''}{formData.localTimeOffset}分
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                    <InputLabel id="gender-label">性別</InputLabel>
                    <Select
                      labelId="gender-label"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      label="性別"
                    >
                      <MenuItem value="M">男性</MenuItem>
                      <MenuItem value="F">女性</MenuItem>
                    </Select>
                    <FormHelperText>四柱推命の計算に必要です</FormHelperText>
                  </FormControl>
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={savingProfile}
                  sx={{ 
                    borderRadius: 30,
                    px: 4,
                    background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
                    boxShadow: '0 4px 10px rgba(156, 39, 176, 0.25)',
                    '&:hover': {
                      boxShadow: '0 6px 15px rgba(156, 39, 176, 0.35)',
                    }
                  }}
                >
                  {savingProfile ? (
                    <>
                      <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                      保存中...
                    </>
                  ) : '保存する'}
                </Button>
              </Box>
            </Box>
          </TabPanel>


          {/* 四柱推命タブ */}
          <TabPanel value={tabValue} index={1}>
            <SajuProfileSection />
          </TabPanel>

          {/* セキュリティタブ */}
          <TabPanel value={tabValue} index={2}>
            <Box component="form" onSubmit={handleSecurityFormSubmit}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                アカウントのセキュリティ設定を更新します。定期的なパスワード変更をお勧めします。
              </Typography>
              
              <Box sx={{ mb: 4 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 2, 
                    pb: 1, 
                    borderBottom: '1px solid', 
                    borderColor: 'primary.light',
                    color: 'primary.dark',
                    fontSize: { xs: '1.1rem', sm: '1.25rem' }
                  }}
                >
                  パスワード変更
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="現在のパスワード"
                      name="currentPassword"
                      type="password"
                      size={isMobile ? "small" : "medium"}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="新しいパスワード"
                      name="newPassword"
                      type="password"
                      helperText="8文字以上で、英字・数字・記号を含めてください"
                      size={isMobile ? "small" : "medium"}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="新しいパスワード（確認）"
                      name="confirmPassword"
                      type="password"
                      size={isMobile ? "small" : "medium"}
                    />
                  </Grid>
                </Grid>
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Box sx={{ mb: 4 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 2, 
                    pb: 1, 
                    borderBottom: '1px solid', 
                    borderColor: 'primary.light',
                    color: 'primary.dark',
                    fontSize: { xs: '1.1rem', sm: '1.25rem' }
                  }}
                >
                  通知設定
                </Typography>
                
                <FormGroup>
                  <FormControlLabel 
                    control={<Checkbox defaultChecked />} 
                    label="運勢更新の通知" 
                  />
                  <FormControlLabel 
                    control={<Checkbox defaultChecked />} 
                    label="チームからの招待通知" 
                  />
                  <FormControlLabel 
                    control={<Checkbox />} 
                    label="マーケティングメール" 
                  />
                </FormGroup>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: isMobile ? 'center' : 'flex-end', mt: 3, flexDirection: isMobile ? 'column' : 'row', gap: 2 }}>
                {!isMobile && (
                  <Button
                    variant="outlined"
                    color="primary"
                    sx={{ 
                      borderRadius: 30,
                      px: 4,
                    }}
                  >
                    キャンセル
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth={isMobile}
                  sx={{ 
                    borderRadius: 30,
                    px: 4,
                    background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
                    boxShadow: '0 4px 10px rgba(156, 39, 176, 0.25)',
                    '&:hover': {
                      boxShadow: '0 6px 15px rgba(156, 39, 176, 0.35)',
                    }
                  }}
                >
                  保存する
                </Button>
              </Box>
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Profile;