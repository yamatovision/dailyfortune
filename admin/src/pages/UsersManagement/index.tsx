import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  IconButton,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Pagination,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useNotification } from '../../contexts/NotificationContext';
import { NotificationType } from '../../types';
import AdminService from '../../services/admin.service';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const UsersManagement = () => {
  // ユーザー一覧ステート
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  // ユーザー編集ステート
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editUserRole, setEditUserRole] = useState('');
  const [editUserPlan, setEditUserPlan] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // 削除ダイアログステート
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUserName, setDeleteUserName] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 通知コンテキスト
  const { showNotification } = useNotification();

  // 初期データ読み込み
  useEffect(() => {
    loadUsers();
  }, [page, roleFilter, planFilter]);

  // ユーザー一覧の読み込み
  const loadUsers = async (params: { search?: string, page?: number } = {}) => {
    try {
      setLoading(true);
      
      // 検索パラメータの設定
      const searchParam = params.search || searchTerm;
      const pageParam = params.page || page;
      const roleParam = roleFilter !== 'all' ? roleFilter : undefined;
      const planParam = planFilter !== 'all' ? planFilter : undefined;
      
      // APIリクエスト
      const response = await AdminService.getUsers({
        page: pageParam,
        limit: 10,
        role: roleParam,
        plan: planParam,
        search: searchParam
      });
      
      if (response.data && response.data.users) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('ユーザー一覧の取得に失敗しました:', error);
      showNotification(NotificationType.ERROR, 'ユーザー一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 検索ハンドラー
  const handleSearch = () => {
    setPage(1);
    loadUsers({ search: searchTerm, page: 1 });
  };

  // ページネーション変更ハンドラー
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // ロールフィルター変更ハンドラー
  const handleRoleFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value as string;
    setRoleFilter(value);
    setPage(1);
  };

  // プランフィルター変更ハンドラー
  const handlePlanFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value as string;
    setPlanFilter(value);
    setPage(1);
  };

  // 編集ダイアログを開く
  const openEditDialog = (user: any) => {
    setEditUserId(user.id);
    setEditUserRole(user.role);
    setEditUserPlan(user.plan || 'free');
    setEditDialogOpen(true);
  };

  // ユーザー権限更新
  const updateUserRole = async () => {
    if (!editUserId) return;
    
    try {
      setEditLoading(true);
      
      // APIリクエスト
      await AdminService.updateUserRole(editUserId, editUserRole);
      
      showNotification(NotificationType.SUCCESS, 'ユーザー権限を更新しました');
      setEditDialogOpen(false);
      
      // ユーザー一覧を更新
      loadUsers();
    } catch (error) {
      console.error('ユーザー権限の更新に失敗しました:', error);
      showNotification(NotificationType.ERROR, 'ユーザー権限の更新に失敗しました');
    } finally {
      setEditLoading(false);
    }
  };

  // ユーザープラン更新
  const updateUserPlan = async () => {
    if (!editUserId) return;
    
    try {
      setEditLoading(true);
      
      // APIリクエスト
      await AdminService.updateUserPlan(editUserId, editUserPlan);
      
      showNotification(NotificationType.SUCCESS, 'ユーザープランを更新しました');
      setEditDialogOpen(false);
      
      // ユーザー一覧を更新
      loadUsers();
    } catch (error) {
      console.error('ユーザープランの更新に失敗しました:', error);
      showNotification(NotificationType.ERROR, 'ユーザープランの更新に失敗しました');
    } finally {
      setEditLoading(false);
    }
  };

  // 削除ダイアログを開く
  const openDeleteDialog = (user: any) => {
    setDeleteUserId(user.id);
    setDeleteUserName(user.displayName || user.email);
    setDeleteDialogOpen(true);
  };

  // ユーザー削除
  const deleteUser = async () => {
    if (!deleteUserId) return;
    
    try {
      setDeleteLoading(true);
      
      // APIリクエスト
      await AdminService.removeAdmin(deleteUserId);
      
      showNotification(NotificationType.SUCCESS, 'ユーザーを削除しました');
      setDeleteDialogOpen(false);
      
      // ユーザー一覧を更新
      loadUsers();
    } catch (error) {
      console.error('ユーザーの削除に失敗しました:', error);
      showNotification(NotificationType.ERROR, 'ユーザーの削除に失敗しました');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ロールに基づいたチップの色を取得
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'secondary';
      case 'admin':
        return 'primary';
      default:
        return 'default';
    }
  };

  // プランに基づいたチップの色を取得
  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'premium':
        return 'success';
      case 'elite':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">
        ユーザー管理
      </Typography>

      {/* 検索・フィルターカード */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={12} md={4}>
              <TextField
                fullWidth
                label="ユーザー検索"
                variant="outlined"
                placeholder="名前またはメールアドレス"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel id="role-filter-label">権限</InputLabel>
                <Select
                  labelId="role-filter-label"
                  value={roleFilter}
                  label="権限"
                  onChange={(e: any) => handleRoleFilterChange(e)}
                >
                  <MenuItem value="all">すべて</MenuItem>
                  <MenuItem value="user">一般ユーザー</MenuItem>
                  <MenuItem value="admin">管理者</MenuItem>
                  <MenuItem value="super_admin">スーパー管理者</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel id="plan-filter-label">プラン</InputLabel>
                <Select
                  labelId="plan-filter-label"
                  value={planFilter}
                  label="プラン"
                  onChange={(e: any) => handlePlanFilterChange(e)}
                >
                  <MenuItem value="all">すべて</MenuItem>
                  <MenuItem value="free">無料</MenuItem>
                  <MenuItem value="premium">プレミアム</MenuItem>
                  <MenuItem value="elite">エリート</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={2}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                fullWidth
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : '検索'}
              </Button>
            </Grid>
            <Grid item xs={12} sm={12} md={2}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                fullWidth
              >
                新規追加
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ユーザー一覧 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            ユーザー一覧
          </Typography>
          
          {loading ? (
            <LoadingIndicator />
          ) : (
            <>
              <TableContainer component={Paper} sx={{ my: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>名前</TableCell>
                      <TableCell>メールアドレス</TableCell>
                      <TableCell>権限</TableCell>
                      <TableCell>プラン</TableCell>
                      <TableCell>アクション</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.displayName || '-'}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={user.role === 'super_admin' ? 'スーパー管理者' : user.role === 'admin' ? '管理者' : '一般ユーザー'}
                              color={getRoleColor(user.role) as any}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={user.plan === 'premium' ? 'プレミアム' : user.plan === 'elite' ? 'エリート' : '無料'}
                              color={getPlanColor(user.plan) as any}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => openEditDialog(user)}
                              title="編集"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openDeleteDialog(user)}
                              title="削除"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          ユーザーが見つかりません
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 編集ダイアログ */}
      <Dialog
        open={editDialogOpen}
        onClose={() => !editLoading && setEditDialogOpen(false)}
        aria-labelledby="edit-dialog-title"
      >
        <DialogTitle id="edit-dialog-title">
          ユーザー情報の編集
        </DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 300, mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="role-label">権限</InputLabel>
              <Select
                labelId="role-label"
                value={editUserRole}
                label="権限"
                onChange={(e) => setEditUserRole(e.target.value)}
                disabled={editLoading}
              >
                <MenuItem value="user">一般ユーザー</MenuItem>
                <MenuItem value="admin">管理者</MenuItem>
                <MenuItem value="super_admin">スーパー管理者</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="plan-label">プラン</InputLabel>
              <Select
                labelId="plan-label"
                value={editUserPlan}
                label="プラン"
                onChange={(e) => setEditUserPlan(e.target.value)}
                disabled={editLoading}
              >
                <MenuItem value="free">無料</MenuItem>
                <MenuItem value="premium">プレミアム</MenuItem>
                <MenuItem value="elite">エリート</MenuItem>
              </Select>
            </FormControl>

            {editLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEditDialogOpen(false)}
            disabled={editLoading}
          >
            キャンセル
          </Button>
          <Button
            onClick={updateUserRole}
            color="primary"
            disabled={editLoading}
            variant="contained"
            sx={{ mr: 1 }}
          >
            権限を更新
          </Button>
          <Button
            onClick={updateUserPlan}
            color="primary"
            disabled={editLoading}
            variant="contained"
          >
            プランを更新
          </Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="ユーザーの削除"
        message={`${deleteUserName} を削除しますか？この操作は元に戻せません。`}
        confirmLabel="削除"
        cancelLabel="キャンセル"
        severity="error"
        onConfirm={deleteUser}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Box>
  );
};

export default UsersManagement;