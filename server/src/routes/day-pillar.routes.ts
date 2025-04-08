import { Router } from 'express';
import { 
  getTodayDayPillar, 
  getDayPillarByDate, 
  getDayPillarRange 
} from '../controllers/day-pillar.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/day-pillars/today:
 *   get:
 *     summary: 今日の日柱情報を取得
 *     description: 現在の日付の日柱情報を取得します
 *     tags: [DayPillar]
 *     responses:
 *       200:
 *         description: 今日の日柱情報
 */
router.get('/today', getTodayDayPillar);

/**
 * @swagger
 * /api/v1/day-pillars/{date}:
 *   get:
 *     summary: 特定の日付の日柱情報を取得
 *     description: 指定された日付の日柱情報を取得します
 *     tags: [DayPillar]
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: YYYY-MM-DD形式の日付
 *     responses:
 *       200:
 *         description: 指定日の日柱情報
 *       400:
 *         description: 無効な日付フォーマットです
 */
router.get('/:date', getDayPillarByDate);

/**
 * @swagger
 * /api/v1/day-pillars:
 *   get:
 *     summary: 日付範囲の日柱情報を取得（管理者用）
 *     description: 指定された日付範囲の日柱情報を取得します（管理者権限が必要）
 *     tags: [DayPillar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: 開始日（YYYY-MM-DD形式）
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: 終了日（YYYY-MM-DD形式）
 *     responses:
 *       200:
 *         description: 日付範囲の日柱情報
 *       400:
 *         description: 入力データが不正です
 *       401:
 *         description: 認証されていません
 *       403:
 *         description: 管理者権限が必要です
 */
router.get('/', authenticate, getDayPillarRange);

export default router;