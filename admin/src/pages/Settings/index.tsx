import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Card, 
  CardContent, 
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Pagination,
  Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import UpdateIcon from '@mui/icons-material/Update';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import AdminService from '../../services/admin.service';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import { FortuneUpdateLog, NotificationType } from '../../types';

// タブパネルのプロパティ型
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// タブパネルコンポーネント
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Settings = () => {
  const [tabValue, setTabValue] = useState(0);
  
  // 管理者タブ用のステート
  const [adminEmail, setAdminEmail] = useState('');
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminPage, setAdminPage] = useState(1);
  const [adminTotalPages, setAdminTotalPages] = useState(1);
  
  // 設定タブ用のステート
  const [updateTime, setUpdateTime] = useState('03:00');
  const [updateTimeLoading, setUpdateTimeLoading] = useState(false);
  const [apiLimit, setApiLimit] = useState('10000');
  const [apiLimitLoading, setApiLimitLoading] = useState(false);
  
  // 運勢更新ログ用のステート
  const [fortuneLogs, setFortuneLogs] = useState<FortuneUpdateLog[]>([]);
  const [fortuneLogsLoading, setFortuneLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logsFilter, setLogsFilter] = useState('all');
  
  // 手動更新用のステート
  const [manualUpdateOpen, setManualUpdateOpen] = useState(false);
  const [manualUpdateLoading, setManualUpdateLoading] = useState(false);
  const [manualUpdateDate, setManualUpdateDate] = useState<string>('');
  
  // 統計タブ用のステート
  const [dateRange, setDateRange] = useState('30');
  
  // 認証とコンテキスト
  const { showNotification } = useNotification();
  
  // 初期データの読み込み
  useEffect(() => {
    loadFortuneUpdateSetting();
    loadAdminUsers();
    loadFortuneLogs();
  }, []);

  // タブ変更ハンドラー
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 管理者検索ハンドラー
  const handleAdminSearch = () => {
    loadAdminUsers({ search: adminEmail });
  };

  // 管理者一覧の読み込み
  const loadAdminUsers = async (params: { page?: number, search?: string } = {}) => {
    try {
      setAdminLoading(true);
      
      // 実際のAPIリクエスト
      const response = await AdminService.getUsers({
        page: params.page || adminPage,
        limit: 10,
        role: 'admin',
        search: params.search
      });
      
      if (response.data && response.data.users) {
        setAdminUsers(response.data.users);
        setAdminTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('管理者一覧の取得に失敗しました:', error);
      showNotification(NotificationType.ERROR, '管理者一覧の取得に失敗しました');
    } finally {
      setAdminLoading(false);
    }
  };

  // 管理者ページネーション変更ハンドラー
  const handleAdminPageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setAdminPage(value);
    loadAdminUsers({ page: value });
  };

  // 運勢更新設定の読み込み
  const loadFortuneUpdateSetting = async () => {
    try {
      setUpdateTimeLoading(true);
      
      // 実際のAPIリクエスト
      const response = await AdminService.getFortuneUpdateSettings();
      
      if (response.data && response.data.value) {
        setUpdateTime(response.data.value);
      }
    } catch (error) {
      console.error('運勢更新設定の取得に失敗しました:', error);
      showNotification(NotificationType.ERROR, '運勢更新設定の取得に失敗しました');
    } finally {
      setUpdateTimeLoading(false);
    }
  };

  // 運勢更新設定の更新ハンドラー
  const handleUpdateSetting = async (settingType: string) => {
    try {
      if (settingType === 'time') {
        setUpdateTimeLoading(true);
        
        // 時間フォーマットの検証
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(updateTime)) {
          showNotification(NotificationType.ERROR, '時間は「HH:MM」形式で指定してください（例: 03:00）');
          return;
        }
        
        // 実際のAPIリクエスト
        await AdminService.updateFortuneUpdateSettings(updateTime, '毎日の運勢更新実行時間');
        showNotification(NotificationType.SUCCESS, '運勢更新時間を更新しました');
      } else if (settingType === 'apiLimit') {
        setApiLimitLoading(true);
        
        // APIリクエストをシミュレート（実際のバックエンドAPIはまだ未実装）
        // TODO: 実際のバックエンドAPIが実装されたら、こちらを更新
        setTimeout(() => {
          showNotification(NotificationType.SUCCESS, 'API利用量上限を更新しました');
          setApiLimitLoading(false);
        }, 1000);
      }
    } catch (error) {
      console.error('設定の更新に失敗しました:', error);
      showNotification(NotificationType.ERROR, '設定の更新に失敗しました');
    } finally {
      if (settingType === 'time') {
        setUpdateTimeLoading(false);
      }
    }
  };

  // 運勢更新ログの読み込み
  const loadFortuneLogs = async (params: { page?: number, status?: string } = {}) => {
    try {
      setFortuneLogsLoading(true);
      
      // フィルター条件
      const status = params.status || (logsFilter !== 'all' ? logsFilter : undefined);
      
      // 実際のAPIリクエスト
      const response = await AdminService.getFortuneUpdateLogs({
        page: params.page || logsPage,
        limit: 5,
        status
      });
      
      if (response.data && response.data.logs) {
        setFortuneLogs(response.data.logs);
        setLogsTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('運勢更新ログの取得に失敗しました:', error);
      showNotification(NotificationType.ERROR, '運勢更新ログの取得に失敗しました');
    } finally {
      setFortuneLogsLoading(false);
    }
  };

  // 運勢更新ログのフィルター変更ハンドラー
  const handleLogsFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value as string;
    setLogsFilter(value);
    setLogsPage(1);
    loadFortuneLogs({ page: 1, status: value !== 'all' ? value : undefined });
  };

  // 運勢更新ログのページネーション変更ハンドラー
  const handleLogsPageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setLogsPage(value);
    loadFortuneLogs({ page: value });
  };

  // 手動運勢更新ダイアログを開く
  const openManualUpdateDialog = () => {
    const today = new Date().toISOString().split('T')[0];
    setManualUpdateDate(today);
    setManualUpdateOpen(true);
  };

  // 手動運勢更新を実行
  const handleRunManualUpdate = async () => {
    try {
      setManualUpdateLoading(true);
      
      // 日付の検証
      if (!manualUpdateDate) {
        showNotification(NotificationType.ERROR, '日付を指定してください');
        return;
      }
      
      // 実際のAPIリクエスト
      await AdminService.runFortuneUpdate({
        targetDate: new Date(manualUpdateDate)
      });
      
      setManualUpdateOpen(false);
      showNotification(NotificationType.SUCCESS, '運勢更新ジョブを開始しました');
      
      // ログ一覧を更新
      setTimeout(() => {
        loadFortuneLogs();
      }, 1000);
    } catch (error) {
      console.error('運勢更新の実行に失敗しました:', error);
      showNotification(NotificationType.ERROR, '運勢更新の実行に失敗しました');
    } finally {
      setManualUpdateLoading(false);
    }
  };

  // メンテナンス機能ハンドラー
  const handleMaintenance = (action: string) => {
    // TODO: 実際のメンテナンスロジックを実装
    showNotification(NotificationType.INFO, `${action}処理を開始しました`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">
        システム管理
      </Typography>

      {/* タブ */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="管理者権限" />
          <Tab label="システム設定" />
          <Tab label="利用統計" />
        </Tabs>
      </Box>
      
      {/* 手動運勢更新確認ダイアログ */}
      <ConfirmDialog
        open={manualUpdateOpen}
        title="運勢の手動更新"
        message={
          <Box>
            <Typography gutterBottom>
              指定日付の運勢データを手動で更新します。
            </Typography>
            <TextField
              fullWidth
              label="対象日付"
              type="date"
              value={manualUpdateDate}
              onChange={(e) => setManualUpdateDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              margin="normal"
              disabled={manualUpdateLoading}
            />
            {manualUpdateLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <LoadingIndicator message="処理中..." />
              </Box>
            )}
          </Box>
        }
        confirmLabel="実行"
        cancelLabel="キャンセル"
        severity="warning"
        onConfirm={handleRunManualUpdate}
        onCancel={() => setManualUpdateOpen(false)}
      />

      {/* 管理者権限タブ */}
      <TabPanel value={tabValue} index={0}>
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              管理者アカウントの追加
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="メールアドレス"
                  variant="outlined"
                  placeholder="example@mail.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  disabled={adminLoading}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button 
                  variant="contained" 
                  startIcon={<SearchIcon />}
                  onClick={handleAdminSearch}
                  fullWidth
                  disabled={adminLoading}
                >
                  {adminLoading ? '検索中...' : '検索'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              管理者一覧
            </Typography>
            
            {adminLoading ? (
              <LoadingIndicator />
            ) : (
              <>
                <TableContainer component={Paper} sx={{ my: 2 }}>
                  <Table aria-label="管理者テーブル">
                    <TableHead>
                      <TableRow>
                        <TableCell>ユーザー名</TableCell>
                        <TableCell>メールアドレス</TableCell>
                        <TableCell>権限</TableCell>
                        <TableCell>アクション</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {adminUsers.length > 0 ? (
                        adminUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.displayName || '-'}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Chip 
                                size="small" 
                                label={user.role === 'super_admin' ? 'スーパー管理者' : '管理者'} 
                                color={user.role === 'super_admin' ? 'secondary' : 'primary'}
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton size="small" color="primary" title="編集">
                                <EditIcon />
                              </IconButton>
                              <IconButton size="small" color="error" title="削除">
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            管理者ユーザーがいません
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {adminTotalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Pagination 
                      count={adminTotalPages} 
                      page={adminPage} 
                      onChange={handleAdminPageChange} 
                      color="primary" 
                    />
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* システム設定タブ */}
      <TabPanel value={tabValue} index={1}>
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              運勢更新設定
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={8} md={6} lg={4}>
                <TextField
                  fullWidth
                  label="更新時間（毎日）"
                  type="time"
                  value={updateTime}
                  onChange={(e) => setUpdateTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  disabled={updateTimeLoading}
                />
              </Grid>
              <Grid item xs={12} sm={4} md={2}>
                <Button 
                  variant="contained" 
                  onClick={() => handleUpdateSetting('time')}
                  fullWidth
                  disabled={updateTimeLoading}
                >
                  {updateTimeLoading ? '更新中...' : '更新'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              AI設定
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={8} md={6} lg={4}>
                <TextField
                  fullWidth
                  label="API利用量上限（リクエスト/月）"
                  type="number"
                  value={apiLimit}
                  onChange={(e) => setApiLimit(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  disabled={apiLimitLoading}
                />
              </Grid>
              <Grid item xs={12} sm={4} md={2}>
                <Button 
                  variant="contained" 
                  onClick={() => handleUpdateSetting('apiLimit')}
                  fullWidth
                  disabled={apiLimitLoading}
                >
                  {apiLimitLoading ? '保存中...' : '保存'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" color="primary">
                運勢更新ログ
              </Typography>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="logs-filter-label">ステータス</InputLabel>
                <Select
                  labelId="logs-filter-label"
                  value={logsFilter}
                  onChange={(e: any) => handleLogsFilterChange(e)}
                  label="ステータス"
                >
                  <MenuItem value="all">すべて</MenuItem>
                  <MenuItem value="scheduled">予定</MenuItem>
                  <MenuItem value="running">実行中</MenuItem>
                  <MenuItem value="completed">完了</MenuItem>
                  <MenuItem value="failed">失敗</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            {fortuneLogsLoading ? (
              <LoadingIndicator />
            ) : (
              <>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>日付</TableCell>
                        <TableCell>ステータス</TableCell>
                        <TableCell>開始時間</TableCell>
                        <TableCell>ユーザー数</TableCell>
                        <TableCell>成功/失敗</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fortuneLogs.length > 0 ? (
                        fortuneLogs.map((log) => (
                          <TableRow key={log._id}>
                            <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              {log.status === 'completed' && <Chip size="small" label="完了" color="success" />}
                              {log.status === 'scheduled' && <Chip size="small" label="予定" color="info" />}
                              {log.status === 'running' && <Chip size="small" label="実行中" color="warning" />}
                              {log.status === 'failed' && <Chip size="small" label="失敗" color="error" />}
                            </TableCell>
                            <TableCell>{new Date(log.startTime).toLocaleString()}</TableCell>
                            <TableCell>{log.totalUsers}</TableCell>
                            <TableCell>{log.successCount} / {log.failedCount}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center">ログがありません</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {logsTotalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Pagination 
                      count={logsTotalPages} 
                      page={logsPage} 
                      onChange={handleLogsPageChange} 
                      color="primary" 
                    />
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              システムメンテナンス
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={openManualUpdateDialog}
                startIcon={<UpdateIcon />}
              >
                運勢手動更新
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => handleMaintenance('backup')}
              >
                DBバックアップ
              </Button>
              <Button 
                variant="contained" 
                color="warning"
                onClick={() => handleMaintenance('cache')}
              >
                キャッシュ削除
              </Button>
              <Button 
                variant="contained" 
                color="error"
                onClick={() => handleMaintenance('chatHistory')}
              >
                AIチャット履歴全削除
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </TabPanel>

      {/* 利用統計タブ */}
      <TabPanel value={tabValue} index={2}>
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              データ期間
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <FormControl fullWidth>
                  <InputLabel id="date-range-label">期間</InputLabel>
                  <Select
                    labelId="date-range-label"
                    value={dateRange}
                    label="期間"
                    onChange={(e) => setDateRange(e.target.value)}
                  >
                    <MenuItem value="7">過去7日</MenuItem>
                    <MenuItem value="30">過去30日</MenuItem>
                    <MenuItem value="90">過去90日</MenuItem>
                    <MenuItem value="365">過去1年</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              ユーザー統計
            </Typography>
            <Box 
              sx={{ 
                width: '100%', 
                height: 300, 
                bgcolor: 'grey.100', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed grey.400',
                mb: 3
              }}
            >
              ユーザー登録数グラフ
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      総ユーザー数
                    </Typography>
                    <Typography variant="h4" component="div" color="primary">
                      245
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      アクティブユーザー
                    </Typography>
                    <Typography variant="h4" component="div" color="primary">
                      187
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      新規ユーザー
                    </Typography>
                    <Typography variant="h4" component="div" color="primary">
                      28
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              AI利用統計
            </Typography>
            <Box 
              sx={{ 
                width: '100%', 
                height: 300, 
                bgcolor: 'grey.100', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed grey.400',
                mb: 3
              }}
            >
              AI利用量グラフ
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      総リクエスト数
                    </Typography>
                    <Typography variant="h4" component="div" color="primary">
                      5,843
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      平均レスポンス時間
                    </Typography>
                    <Typography variant="h4" component="div" color="primary">
                      1.2秒
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      1ユーザーあたりの平均利用回数
                    </Typography>
                    <Typography variant="h4" component="div" color="primary">
                      31.2回
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};

export default Settings;