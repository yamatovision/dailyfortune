import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { hybridAuthenticate } from '../middleware/hybrid-auth.middleware';
import { AUTH } from '../types/index';

const router = Router();

// ユーザープロフィール取得
router.get('/profile', hybridAuthenticate, authController.getProfile);

// ユーザー登録
router.post('/register', hybridAuthenticate, authController.register);

// パスワードリセット
router.post('/password-reset', authController.requestPasswordReset);

export default router;