import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToDatabase } from './config/database';

// 環境変数の読み込み
dotenv.config();

// ロガーのインポート
import logger from './utils/logger';
import { requestTracer, requestLogger, errorLogger } from './utils/logger/middleware';

// ルーターのインポート
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import dayPillarRoutes from './routes/day-pillar.routes';
import publicEndpointsRoutes from './routes/public-endpoints.routes';
import usersRoutes from './routes/users.routes';
import teamRoutes from './routes/team.routes';
import fortuneRoutes from './routes/fortune.routes';
import chatRoutes from './routes/chat.routes';

// セキュリティミドルウェアのインポート
import {
  securityHeaders,
  apiLimiter,
  authLimiter,
  corsOptions,
  sanitizeMongo,
  jsonErrorHandler
} from './middleware/security.middleware';

// 型定義のインポート (共有ディレクトリから)
import { API_BASE_PATH } from './types/index';

// Expressアプリケーションの作成
const app = express();

// ロギングミドルウェアを最初に適用
app.use(requestTracer); // トレースIDを各リクエストに追加
app.use(requestLogger); // リクエストのログ記録

// セキュリティミドルウェアの設定
app.use(securityHeaders); // カスタマイズされたHelmet設定
app.use(cors(corsOptions)); // CORS設定
app.use(express.json()); // JSON解析
app.use(jsonErrorHandler); // JSON解析エラーハンドラー
app.use(sanitizeMongo); // NoSQLインジェクション対策

// 基本的なレート制限を適用
app.use(apiLimiter);

// ルートエンドポイント
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'DailyFortune API Server' });
});

// ステータスエンドポイント
app.get(`${API_BASE_PATH}/status`, (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 認証ルーターには厳しいレート制限を適用
app.use(`${API_BASE_PATH}/auth`, authLimiter, authRoutes);

// 管理者ルーターを設定
app.use(`${API_BASE_PATH}/admin`, adminRoutes);

// 四柱推命プロフィールルーター削除済み - ユーザーモデルに統合

// 日柱情報ルーターを設定
app.use(`${API_BASE_PATH}/day-pillars`, dayPillarRoutes);

// ユーザー情報ルーターを設定
app.use(`${API_BASE_PATH}/users`, usersRoutes);

// チームルーターを設定
app.use(`${API_BASE_PATH}/teams`, teamRoutes);

// 運勢ルーターを設定
app.use(`${API_BASE_PATH}/fortune`, fortuneRoutes);

// チャットルーターを設定
app.use(`${API_BASE_PATH}/chat`, chatRoutes);

// 公開エンドポイントルーターを設定
app.use(`${API_BASE_PATH}/public`, publicEndpointsRoutes);

// エラーロギングミドルウェア
app.use(errorLogger);

// エラーハンドリングミドルウェア
app.use((err: any, req: Request, res: Response, next: any) => {
  // エラーログの強化 - 詳細をログに残す
  logger.error(`エラー処理ミドルウェア: ${err.message}`, { 
    meta: { 
      traceId: req.headers['x-trace-id'],
      path: req.path,
      method: req.method,
      query: req.query,
      body: req.body,
      user: (req as any).user?.uid,
      stack: err.stack,
      name: err.name
    } 
  });

  // CORSヘッダーの強制追加（クライアント側でのエラー表示のため）
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Trace-ID');
  
  // エラーレスポンスの送信
  res.status(500).json({
    message: '内部サーバーエラーが発生しました',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    traceId: req.headers['x-trace-id'], // トレースIDをレスポンスに含める
    timestamp: new Date().toISOString()
  });
});

// 404ハンドリング
app.use((req: Request, res: Response) => {
  logger.warn(`リソースが見つかりません: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    message: 'リクエストされたリソースが見つかりません',
    traceId: req.headers['x-trace-id'] // トレースIDをレスポンスに含める
  });
});

// アプリケーションのエクスポート（テスト用）
export { app };

// サーバーの起動（直接実行時のみ）
if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, async () => {
    logger.info(`サーバーが起動しました: ポート ${PORT}`);
    
    // Firebase Adminの初期化
    try {
      // Firebase Adminの初期化ログを確認（config/firebase.tsで初期化済み）
      logger.info('Firebase Admin SDKが初期化されました');
    } catch (error) {
      logger.error('Firebase Admin SDKの初期化に失敗しました', { meta: { error } });
    }
    
    // MongoDBへの接続
    try {
      await connectToDatabase();
      logger.info('MongoDBに接続しました');
      
      // バッチ処理スケジューラーの開始（本番環境のみ）
      if (process.env.NODE_ENV === 'production') {
        try {
          const { startScheduler } = require('./batch/scheduler');
          startScheduler();
          logger.info('バッチスケジューラーを開始しました');
        } catch (error) {
          logger.error('バッチスケジューラーの開始に失敗しました', { meta: { error } });
        }
      } else {
        logger.info('開発環境のため、バッチスケジューラーは開始されていません');
      }
    } catch (error) {
      logger.error('MongoDBへの接続に失敗しました', { meta: { error } });
    }
  });
}
