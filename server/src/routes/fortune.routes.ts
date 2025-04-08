import { Router } from 'express';
import { fortuneController } from '../controllers/fortune.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/fortune/daily:
 *   get:
 *     summary: 今日の運勢を取得する
 *     description: ログインユーザーの今日の運勢情報を取得します。クエリパラメータで日付を指定することも可能です。
 *     tags:
 *       - Fortune
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: 取得したい日付 (YYYY-MM-DD形式)。指定がない場合は今日の日付
 *     responses:
 *       200:
 *         description: 運勢情報を取得しました
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Fortune'
 *       401:
 *         description: 認証エラー
 *       404:
 *         description: 運勢データが見つかりません
 *       500:
 *         description: サーバーエラー
 */
router.get('/daily', authenticate, fortuneController.getDailyFortune);

// スーパー管理者のみがアクセスできる運勢更新（生成）エンドポイント
// 通常は管理者用ルート（/api/v1/admin/...）に移動させるべき
router.post('/update-fortune', authenticate, fortuneController.generateFortune);

export default router;
