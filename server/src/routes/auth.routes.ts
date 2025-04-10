import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { AUTH } from '../types/index';

const router = Router();

// ユーザープロフィール取得
router.get('/profile', authenticate, authController.getProfile);

// ユーザー登録
router.post('/register', authenticate, authController.register);

// パスワードリセット
router.post('/password-reset', authController.requestPasswordReset);

export default router;