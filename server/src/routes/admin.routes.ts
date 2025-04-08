import { Router } from 'express';
import * as adminController from '../controllers/admin';
import { authenticate, requireSuperAdmin } from '../middleware/auth.middleware';
import { ADMIN } from '../types/index';

const router = Router();

// ======== ユーザー管理API ========

// ユーザー一覧取得（SuperAdmin専用）
router.get(
  '/admins',
  authenticate,
  requireSuperAdmin,
  adminController.getUsers
);

// 新規ユーザー作成
router.post(
  '/admins',
  authenticate,
  requireSuperAdmin,
  adminController.createUser
);

// ユーザー権限変更（SuperAdmin専用）
router.put(
  '/admins/:userId/role',
  authenticate,
  requireSuperAdmin,
  adminController.updateUserRole
);

// ユーザープラン変更（SuperAdmin専用）
router.put(
  '/admins/:userId/plan',
  authenticate,
  requireSuperAdmin,
  adminController.updateUserPlan
);

// ユーザー削除（SuperAdmin専用）
router.delete(
  '/admins/:userId',
  authenticate,
  requireSuperAdmin,
  adminController.deleteUser
);

// ======== 運勢更新設定API ========

// 運勢更新設定取得
router.get(
  '/settings/fortune-update',
  authenticate,
  requireSuperAdmin,
  adminController.getFortuneUpdateSettings
);

// 運勢更新設定更新（SuperAdmin専用）
router.put(
  '/settings/fortune-update',
  authenticate,
  requireSuperAdmin,
  adminController.updateFortuneUpdateSettings
);

// 運勢更新ログ一覧取得（SuperAdmin専用）
router.get(
  '/settings/fortune-updates/logs',
  authenticate,
  requireSuperAdmin,
  adminController.getFortuneUpdateLogs
);

// 運勢更新ログ詳細取得（SuperAdmin専用）
router.get(
  '/settings/fortune-updates/logs/:logId',
  authenticate,
  requireSuperAdmin,
  adminController.getFortuneUpdateLogDetail
);

// 手動運勢更新実行（SuperAdmin専用）
router.post(
  '/settings/fortune-updates/manual-run',
  authenticate,
  requireSuperAdmin,
  adminController.runFortuneUpdate
);

// ======== 日柱管理API ========

// 日柱生成ログ一覧取得（SuperAdmin専用）
router.get(
  '/settings/day-pillars/logs',
  authenticate,
  requireSuperAdmin,
  adminController.getDayPillarLogs
);

// 日柱生成ログ詳細取得（SuperAdmin専用）
router.get(
  '/settings/day-pillars/logs/:logId',
  authenticate,
  requireSuperAdmin,
  adminController.getDayPillarLogDetail
);

// 既存の日柱情報一覧取得（SuperAdmin専用）
router.get(
  '/settings/day-pillars',
  authenticate,
  requireSuperAdmin,
  adminController.getDayPillars
);

// 手動日柱生成実行（SuperAdmin専用）
router.post(
  '/settings/day-pillars/manual-run',
  authenticate,
  requireSuperAdmin,
  adminController.runDayPillarGeneration
);

export default router;