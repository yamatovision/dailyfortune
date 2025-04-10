# プロジェクト開発 - 進行状況 (2025/04/07更新)

> [!WARNING]
> ## APIルーティングの実装に関する重要ルール
> 
> バックエンドのExpressルーティング実装時は以下のルールを遵守してください：
> 
> 1. **index.ts**と**routes/*.ts**の役割分担：
>    - **index.ts**: `app.use(${API_BASE_PATH}/xxx, xxxRoutes)`でベースパスを設定
>    - **routes/*.ts**: 各ルートハンドラでは`/`から始まる相対パスのみを指定（例: `/profile`）
> 
> 2. **正しい例**:
>    ```typescript
>    // index.ts
>    app.use(`${API_BASE_PATH}/auth`, authRoutes);
>    
>    // auth.routes.ts
>    router.get('/profile', authenticate, authController.getProfile);
>    ```
>    結果のURL: `/api/v1/auth/profile`
> 
> 3. **間違った例** (パスの二重定義):
>    ```typescript
>    // index.ts
>    app.use(`${API_BASE_PATH}/auth`, authRoutes);
>    
>    // auth.routes.ts 
>    router.get(AUTH.PROFILE.replace('/api/v1', ''), authenticate, authController.getProfile);
>    ```
>    この場合、パスの二重変換により予測困難なルーティングエラーが発生します。
> 
> 詳細なルールは `shared/index.ts` のドキュメントを参照してください。

## 全体進捗
- 完成予定ファイル数: 未定
- 作成済みファイル数: 50以上
- 進捗率: 70%
- 最終更新日: 2025/04/07

## テスト環境 (TestLAB)
- [x] 複数AI連携用のTestLAB環境を構築 (100%)
  - 説明: テスト環境の標準化と自動化を実現する中央管理システム
  - ステータス: 完了
  - 関連ファイル:
    - [x] docs/testlab.md - テスト環境の詳細ガイドライン
    - [x] docs/testlab_summary.md - テスト環境の概要
    - [x] server/scripts/setup-testlab.sh - 環境セットアップスクリプト
    - [x] server/scripts/reset-testlab.sh - 環境リセットスクリプト
    - [x] server/scripts/run-test.sh - テスト実行スクリプト
    - [x] server/scripts/run-admin-tests.sh - 管理者API専用テスト実行スクリプト
    - [x] server/scripts/get-token.js - 認証トークン取得ツール

## アーキテクチャ改善
- [x] アーキテクチャ評価と改善計画の策定 (100%)
  - 説明: 現状のアーキテクチャを評価し、改善計画を立案
  - ステータス: 完了
  - 関連ファイル:
    - [x] docs/architecture_assessment.md - アーキテクチャ評価レポート

- [x] サービス層導入によるリファクタリング (100%)
  - 説明: ビジネスロジックとデータアクセスをコントローラーから分離
  - ステータス: 完了
  - 関連ファイル:
    - [x] server/src/services/index.ts - サービス層のエントリーポイント
    - [x] server/src/services/user.service.ts - ユーザー管理サービス
    - [x] server/src/services/auth.service.ts - 認証サービス
    - [x] server/src/utils/error-handler.ts - 共通エラーハンドリング

## スコープ状況

### 完了済みスコープ
- [x] データモデル設計 (100%)
  - 説明: アプリケーションのデータモデルとデータベース設計を作成
  - ステータス: 完了
  - スコープID: scope-1744074125873
  - 関連ファイル:
    - [x] docs/data_models.md - データモデル定義
    - [x] server/src/models/ - Mongooseスキーマ実装（19モデル）
    - [x] server/src/tests/models/ - モデルユニットテスト（100%カバレッジ達成）

- [x] 認証認可システム構築 (100%)
  - 説明: Firebase Authを活用した認証認可システムの実装
  - ステータス: 完了
  - スコープID: scope-1744159526731
  - 関連ファイル:
    - [x] server/src/config/firebase.ts - Firebase Admin SDK設定
    - [x] server/src/middleware/auth.middleware.ts - 認証ミドルウェア
    - [x] server/src/controllers/auth.controller.ts - 認証コントローラー
    - [x] server/src/routes/auth.routes.ts - 認証ルート
    - [x] server/src/middleware/security.middleware.ts - セキュリティミドルウェア
    - [x] server/src/tests/auth/auth.test.ts - 認証テスト
    - [x] server/src/tests/security/owasp.test.ts - セキュリティテスト
    - [x] client/src/contexts/AuthContext.tsx - クライアント認証コンテキスト
    - [x] client/src/components/common/ProtectedRoute.tsx - 保護されたルート
    - [x] admin/src/contexts/AuthContext.tsx - 管理者認証コンテキスト
    - [x] admin/src/components/common/SuperAdminRoute.tsx - スーパー管理者ルート

- [x] デプロイ環境構築 (100%)
  - 説明: Firebase HostingとGoogle Cloud Runを使用したデプロイ環境の構築
  - ステータス: 完了
  - スコープID: scope-1744318935421
  - 関連ファイル:
    - [x] docs/deploy.md - デプロイガイド
    - [x] server/Dockerfile - バックエンドDockerファイル
    - [x] server/src/types/index.ts - バックエンド用型定義（共有モジュールのコピー）
    - [x] server/tsconfig.build.json - ビルド用TypeScript設定
    - [x] shared/index.ts - 共有型定義・API定数
    - [x] docs/scopes/prompts/★deploy_assistant.md - 汎用デプロイ支援プロンプト

- [x] 管理者API実装 (100%)
  - 説明: 運勢更新設定・ログ管理機能の実装
  - ステータス: 完了
  - スコープID: scope-1744484530123
  - 関連ファイル:
    - [x] server/src/controllers/admin.controller.ts - 管理者共通コントローラー
    - [x] server/src/controllers/admin/fortune-update.controller.ts - 運勢更新コントローラー
    - [x] server/src/routes/admin.routes.ts - 管理者APIルート定義
    - [x] server/src/models/DailyFortuneUpdateLog.ts - 運勢更新ログモデル
    - [x] server/src/tests/admin/real-auth-fortune-update.test.ts - 実認証テスト
    - [x] docs/admin_api.md - 管理者API仕様書
    - [x] docs/admin_dataflow.md - 管理者データフロー図
    - [x] admin/src/services/admin.service.ts - 管理者APIサービス
    - [x] admin/src/services/api.service.ts - API基本サービス

### 進行中スコープ
- [ ] UI/UXデザイン (85%)
  - 説明: アプリケーションのUI/UXデザインを作成
  - ステータス: 進行中
  - スコープID: scope-1743840122587
  - 関連ファイル:
    - [x] mockups/integrated-chat.html - 統合AIチャットページ
    - [x] mockups/team-page.html - チームページ
    - [x] mockups/daily-fortune.html - デイリー運勢ページ
    - [x] mockups/login-page.html - ログインページ
    - [x] mockups/profile-settings.html - プロフィール設定ページ
    - [x] mockups/saju-profile-designs.html - 四柱推命プロフィールデザイン集

- [x] 四柱推命プロフィールと日柱データ実装 (100%)
  - 説明: 四柱推命データと日柱データの実装・APIエンドポイントの作成
  - ステータス: 完了
  - スコープID: scope-1744484126982
  - 関連ファイル:
    - [x] server/src/controllers/day-pillar.controller.ts - 日柱データコントローラー
    - [x] server/src/routes/day-pillar.routes.ts - 日柱データルート
    - [x] server/src/services/saju-engine.service.ts - 四柱推命エンジン連携サービス
    - [x] server/src/models/DayPillar.ts - 日柱データモデル
    - [x] server/src/batch/day-pillar-generator.ts - 日柱生成バッチ処理
    - [x] server/src/batch/scheduler.ts - バッチ処理スケジューラー
    - [x] server/src/tests/controllers/real-auth-day-pillar.test.ts - 日柱実認証テスト
    - [x] server/src/tests/batch/day-pillar-generator.test.ts - 日柱バッチテスト
    - [x] server/src/tests/batch/scheduler.test.ts - スケジューラーテスト
    - [x] client/src/services/saju-profile.service.ts - プロフィールサービス（フロント）
    - [x] client/src/components/profile/SajuProfileCard.tsx - プロフィール表示カード
    - [x] client/src/pages/Profile/SajuProfileSection.tsx - プロフィールセクション

  **実装メモ**
  - 四柱推命データはSajuProfileモデルからUserモデルに統合 (2025/04/08)
  - 四柱推命関連のAPIエンドポイントをUsersAPIエンドポイントに統合完了
  - SajuEngine連携による年柱・月柱・日柱・時柱の計算が可能
  - 日柱生成バッチ処理の実装完了
  - フロントエンド部分（プロフィール表示コンポーネント）の実装完了

### 未着手スコープ
- [ ] デイリー運勢機能の実装 (0%)
  - 説明: 日次運勢生成とAPIエンドポイントの実装
  - ステータス: 未着手
  - スコープID: scope-1744484212345
  - 予定ファイル:
    - [ ] server/src/services/fortune.service.ts
    - [ ] server/src/services/fortune-batch.service.ts
    - [ ] server/src/controllers/daily-fortune.controller.ts
    - [ ] server/src/routes/daily-fortune.routes.ts
    - [ ] server/src/batch/daily-fortune-update.ts
    - [ ] client/src/services/fortune.service.ts
    - [ ] client/src/pages/Fortune/index.tsx
    - [ ] client/src/components/fortune/FortuneCard.tsx
    - [ ] client/src/components/fortune/FortuneDetails.tsx

- [ ] チームと目標機能の実装 (30%)
  - 説明: チーム管理とユーザー/チーム目標の設定機能実装
  - ステータス: 進行中
  - スコープID: scope-1744484301234
  - 関連ファイル:
    - [x] server/src/services/team/team.service.ts
    - [x] server/src/services/team/team-member.service.ts
    - [x] server/src/services/team/team-goal.service.ts
    - [x] server/src/tests/services/team.service.test.ts
    - [x] server/src/tests/services/team-member.service.test.ts
    - [x] server/src/tests/services/team-goal.service.test.ts
    - [ ] server/src/services/user-goal.service.ts
    - [ ] server/src/controllers/team/team.controller.ts
    - [ ] server/src/controllers/team/team-member.controller.ts
    - [ ] server/src/controllers/team/team-goal.controller.ts
    - [ ] server/src/controllers/user-goal.controller.ts
    - [ ] server/src/routes/team.routes.ts
    - [ ] server/src/routes/user-goal.routes.ts
    - [ ] client/src/pages/Team/index.tsx
    - [ ] client/src/components/team/TeamMembersList.tsx
    - [ ] client/src/components/profile/GoalSetting.tsx

- [ ] 相性機能とAIチャットの実装 (0%)
  - 説明: チームメンバー間の相性計算とAIチャット機能の実装
  - ステータス: 未着手
  - スコープID: scope-1744484409876
  - 予定ファイル:
    - [ ] server/src/controllers/compatibility.controller.ts
    - [ ] server/src/controllers/chat.controller.ts
    - [ ] server/src/services/compatibility.service.ts
    - [ ] server/src/services/claude.service.ts
    - [ ] client/src/pages/Chat/index.tsx
    - [ ] client/src/components/chat/ChatInterface.tsx

## 次の実装優先順位

実装の依存関係を再検討した結果、以下の順序で実装を進めることが最適です：

1. **Team API実装** (最優先)
   - server/src/controllers/team.controller.ts の作成
   - server/src/routes/team.routes.ts の作成
   - チーム作成・管理の基本機能実装

2. **TeamGoal API実装** (高優先度)
   - server/src/controllers/team-goal.controller.ts の作成
   - server/src/routes/team-goal.routes.ts の作成
   - チーム目標設定・管理機能の実装

3. **フロントエンド - チーム管理UI** (中優先度)
   - client/src/services/team.service.ts の実装
   - client/src/components/team/TeamMembersList.tsx の実装
   - client/src/pages/Team/index.tsx の実装

4. **UserGoal API実装** (高優先度)
   - server/src/controllers/user-goal.controller.ts の作成
   - server/src/routes/user-goal.routes.ts の作成
   - 個人目標管理機能の実装

5. **フロントエンド - 目標設定UI** (中優先度)
   - client/src/services/user-goal.service.ts の実装
   - client/src/components/profile/GoalSetting.tsx の実装
   - client/src/pages/Profile/GoalsSection.tsx の実装

6. **DailyFortune生成バッチ処理** (高優先度)
   - server/src/batch/daily-fortune-generator.ts の作成
   - 既存の日柱データを基にした運勢予測の実装
   - DayPillar生成バッチ処理との連携

7. **バッチジョブの依存関係設定**
   - DayPillar生成 → DailyFortune更新 の順序設定
   - エラーハンドリングと再試行ロジックの実装

## 優先順位変更の理由

実装の依存関係を再検討した結果、チーム機能を先行して実装する必要があることが判明しました。デイリー運勢の機能（特にチーム運勢ランキングやチーム目標アドバイス）はチーム機能が前提となるため、チームAPIとチーム目標APIを先に実装することで、後続の機能開発をスムーズに進めることができます。

## システムアーキテクチャ

DailyFortuneは以下の2つの独立したアプリケーションで構成されます：

1. **メインアプリケーション**: 一般ユーザーとAdmin（経営者）向け
2. **SuperAdmin管理サイト**: システム全体の管理機能を提供

### アーキテクチャ決定事項:
- **フロントエンド**: React.js + TypeScript + Material UI
- **バックエンド**: Node.js + Express.js + TypeScript
- **データベース**: MongoDB
- **認証**: Firebase Authentication
- **ホスティング**: 
  - フロントエンド: Firebase Hosting
  - バックエンド: Google Cloud Run
  - データベース: MongoDB Atlas

### アーキテクチャ改善:
バックエンドアーキテクチャを改善し、以下の変更を実施:

1. **サービス層の導入**:
   - ビジネスロジックとデータアクセスをコントローラーから分離
   - UserServiceとAuthServiceの実装
   - 再利用可能なビジネスロジックを抽象化

2. **共通エラーハンドリング**:
   - AppError基底クラスによる統一的なエラー管理
   - ValidationError、AuthorizationError等の特殊化されたエラークラス
   - handleError関数によるエラー応答の標準化

3. **アーキテクチャ評価**:
   - 現状の課題と強みの分析
   - 段階的改善計画の策定
   - 詳細は [アーキテクチャ評価レポート](./architecture_assessment.md) を参照

## 最終的なディレクトリ構造
```
DailyFortune/
├── README.md                    # プロジェクト概要
├── docs/                        # プロジェクトドキュメント
│   ├── requirements.md          # 要件定義
│   ├── CURRENT_STATUS.md        # 開発状況
│   ├── deploy.md                # デプロイガイド
│   ├── env.md                   # 環境変数リスト
│   └── auth_architecture.md     # 認証設計
├── shared/                      # 共有コード
│   └── index.ts                 # データモデルとAPIパス定義
├── client/                      # フロントエンドアプリケーション
│   ├── public/                  # 静的ファイル
│   │   ├── assets/              # 画像、フォント等
│   │   └── index.html           # エントリーHTMLファイル
│   ├── src/
│   │   ├── App.tsx              # ルートコンポーネント
│   │   ├── index.tsx            # エントリーポイント
│   │   ├── components/          # 再利用可能なコンポーネント
│   │   │   ├── common/          # 共通UIコンポーネント
│   │   │   ├── chat/            # チャット関連コンポーネント
│   │   │   ├── dashboard/       # ダッシュボード関連コンポーネント
│   │   │   ├── fortune/         # 運勢表示関連コンポーネント
│   │   │   ├── profile/         # プロフィール関連コンポーネント
│   │   │   └── team/            # チーム関連コンポーネント
│   │   ├── contexts/            # コンテキストプロバイダー
│   │   │   ├── AuthContext.tsx  # 認証コンテキスト
│   │   │   └── FortuneContext.tsx # 運勢データコンテキスト
│   │   ├── hooks/               # カスタムフック
│   │   ├── pages/               # ページコンポーネント
│   │   │   ├── Login/           # ログイン関連ページ
│   │   │   ├── Profile/         # プロフィール関連ページ
│   │   │   ├── Fortune/         # デイリー運勢ページ
│   │   │   ├── Chat/            # AIチャットページ
│   │   │   ├── Team/            # チーム関連ページ
│   │   │   └── Admin/           # 管理者ページ
│   │   ├── services/            # APIサービス
│   │   │   ├── api.ts           # APIクライアント
│   │   │   ├── auth.ts          # 認証サービス
│   │   │   ├── fortune.ts       # 運勢取得サービス
│   │   │   └── claude.ts        # Claude AIサービス
│   │   └── utils/               # ユーティリティ関数
│   ├── package.json             # フロントエンド依存関係
│   ├── tsconfig.json            # TypeScript設定
│   └── vite.config.ts           # Viteビルド設定
├── server/                      # バックエンドアプリケーション
│   ├── src/
│   │   ├── index.ts             # エントリーポイント
│   │   ├── config/              # 設定ファイル
│   │   │   ├── database.ts      # DB接続設定
│   │   │   └── env.ts           # 環境変数管理
│   │   ├── controllers/         # コントローラー
│   │   │   ├── auth.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── team.controller.ts
│   │   │   ├── fortune.controller.ts
│   │   │   └── claude.controller.ts
│   │   ├── models/              # データモデル
│   │   │   ├── user.model.ts
│   │   │   ├── team.model.ts
│   │   │   ├── fortune.model.ts
│   │   │   └── chat.model.ts
│   │   ├── routes/              # APIルート
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── team.routes.ts
│   │   │   ├── fortune.routes.ts
│   │   │   └── claude.routes.ts
│   │   ├── services/            # ビジネスロジック
│   │   │   ├── saju.service.ts  # 四柱推命計算サービス
│   │   │   ├── fortune.service.ts # 運勢生成サービス
│   │   │   └── claude.service.ts  # Claude AI連携サービス
│   │   ├── middleware/          # ミドルウェア
│   │   │   ├── auth.middleware.ts # 認証ミドルウェア
│   │   │   └── validate.middleware.ts # 入力検証
│   │   └── utils/               # ユーティリティ関数
│   ├── package.json             # バックエンド依存関係
│   └── tsconfig.json            # TypeScript設定
├── admin/                       # SuperAdmin管理サイト
│   ├── public/                  # 静的ファイル
│   ├── src/                     # ソースコード
│   │   ├── App.tsx              # ルートコンポーネント
│   │   ├── index.tsx            # エントリーポイント
│   │   ├── components/          # 管理用コンポーネント
│   │   ├── pages/               # 管理ページ
│   │   │   ├── Dashboard/       # 管理ダッシュボード
│   │   │   ├── Users/           # ユーザー管理
│   │   │   ├── Teams/           # チーム管理
│   │   │   ├── Settings/        # システム設定
│   │   │   └── Stats/           # 統計情報
│   │   └── services/            # APIサービス
│   ├── package.json             # 管理サイト依存関係
│   └── tsconfig.json            # TypeScript設定
└── sajuengine_package/          # 四柱推命計算エンジン
```

## 現在のディレクトリ構造
```
DailyFortune/
├── docs/
│   ├── requirements.md
│   ├── CURRENT_STATUS.md
│   ├── deploy.md              # デプロイガイド（更新済み）
│   ├── implementation_handover.md # 実装引き継ぎ資料（新規作成）
│   ├── implementation_order.md # 実装順序計画（新規作成）
│   ├── implementation_tasks.md # 実装タスク詳細計画（新規作成）
│   ├── architecture_assessment.md # アーキテクチャ評価レポート（新規作成）
│   ├── system_architecture.md # システムアーキテクチャ設計
│   ├── data_models.md
│   ├── auth_architecture.md
│   ├── admin_api.md           # 管理者API仕様書（新規作成）
│   ├── admin_dataflow.md      # 管理者データフロー図（新規作成）
│   ├── env.md
│   ├── testlab.md             # 新規作成：テスト環境詳細ガイドライン
│   ├── testlab_summary.md     # 新規作成：テスト環境概要
│   └── scopes/
│       └── prompts/          # 各種開発支援用プロンプト
│           ├── ★system_architecture.md
│           ├── ★deploy_assistant.md   # 新規作成：汎用的なデプロイ支援
│           └── ... (その他のプロンプト)
├── mockups/
│   ├── integrated-chat.html
│   ├── team-page.html
│   ├── daily-fortune.html
│   ├── login-page.html
│   ├── profile-settings.html
│   └── saju-profile-designs.html
├── server/
│   ├── scripts/
│   │   ├── createAdmin.ts
│   │   ├── generateModelDocs.ts
│   │   ├── setup-testlab.sh     # 新規作成：テスト環境セットアップスクリプト
│   │   ├── reset-testlab.sh     # 新規作成：テスト環境リセットスクリプト
│   │   └── run-test.sh          # 新規作成：テスト実行スクリプト
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── firebase.ts      # Firebase認証設定（更新済み）
│   │   │   └── env.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts # サービス層使用に更新
│   │   │   ├── day-pillar.controller.ts # 新規作成：日柱コントローラー
│   │   │   ├── admin.controller.ts # 新規作成：管理者共通コントローラー
│   │   │   └── admin/
│   │   │       ├── users.controller.ts # サービス層使用に更新
│   │   │       └── fortune-update.controller.ts # 新規作成：運勢更新コントローラー
│   │   ├── models/
│   │   │   ├── Alert.ts
│   │   │   ├── AuditLog.ts
│   │   │   ├── BatchJobLog.ts
│   │   │   ├── ChatHistory.ts
│   │   │   ├── Compatibility.ts
│   │   │   ├── DailyFortune.ts
│   │   │   ├── DailyFortuneUpdateLog.ts # 新規作成：運勢更新ログモデル
│   │   │   ├── DayPillar.ts
│   │   │   ├── Invoice.ts
│   │   │   ├── NotificationLog.ts
│   │   │   ├── Organization.ts
│   │   │   ├── PricePlan.ts
│   │   │   ├── Subscription.ts
│   │   │   ├── SystemSetting.ts
│   │   │   ├── Team.ts
│   │   │   ├── TeamGoal.ts
│   │   │   ├── UsageStatistics.ts
│   │   │   ├── User.ts
│   │   │   └── UserGoal.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── security.middleware.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── day-pillar.routes.ts # 新規作成：日柱データルート
│   │   │   └── admin.routes.ts # 新規作成：管理者APIルート
│   │   ├── services/            # 新規作成：サービス層
│   │   │   ├── index.ts         # サービスインデックス
│   │   │   ├── auth.service.ts  # 認証サービス
│   │   │   ├── user.service.ts  # ユーザー管理サービス
│   │   │   ├── saju-engine.service.ts # 新規作成：四柱推命エンジン連携サービス
│   │   │   └── saju-profile.service.ts # 新規作成：プロフィール管理サービス
│   │   ├── batch/               # 新規作成：バッチ処理
│   │   │   ├── day-pillar-generator.ts # 日柱生成バッチ処理
│   │   │   └── scheduler.ts     # バッチ処理スケジューラー
│   │   ├── utils/               # 新規作成：ユーティリティ
│   │   │   ├── index.ts         # ユーティリティインデックス
│   │   │   └── error-handler.ts # 共通エラーハンドリング
│   │   ├── tests/
│   │   │   ├── auth/
│   │   │   │   └── auth.test.ts
│   │   │   ├── admin/
│   │   │   │   └── real-auth-fortune-update.test.ts # 新規作成：実認証テスト
│   │   │   ├── controllers/
│   │   │   │   ├── real-auth-saju-profile.test.ts # 新規作成：四柱推命実認証テスト
│   │   │   │   └── real-auth-day-pillar.test.ts # 新規作成：日柱実認証テスト
│   │   │   ├── batch/
│   │   │   │   ├── day-pillar-generator.test.ts # 新規作成：日柱バッチテスト
│   │   │   │   └── scheduler.test.ts # 新規作成：スケジューラーテスト
│   │   │   ├── security/
│   │   │   │   └── owasp.test.ts
│   │   │   └── models/
│   │   │       ├── ChatHistory.test.ts
│   │   │       ├── Compatibility.test.ts
│   │   │       └── ... (その他のテストファイル)
│   │   ├── types/
│   │   │   └── index.ts         # バックエンド用型定義（共有モジュールのコピー）
│   ├── Dockerfile               # デプロイ用Docker設定（更新済み）
│   ├── package.json
│   ├── tsconfig.json
│   └── tsconfig.build.json
├── client/
│   ├── src/
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── components/
│   │   │   └── common/
│   │   │       └── ProtectedRoute.tsx
│   │   └── pages/
│   │       └── Fortune/
│   │           └── index.tsx    # 準備中ページ
│   └── package.json
├── admin/
│   ├── src/
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── components/
│   │   │   └── common/
│   │   │       └── SuperAdminRoute.tsx
│   │   ├── services/
│   │   │   ├── api.service.ts   # 新規作成：API基本サービス
│   │   │   └── admin.service.ts # 新規作成：管理者APIサービス
│   │   └── pages/
│   └── package.json
├── shared/
│   └── index.ts                 # 共有型定義・API定数（更新済み）
└── sajuengine_package/
```

## UI/UXデザイン
- [x] mockups/integrated-chat.html - 統合AIチャットページ

**実装メモ**
- 統合AIチャットページでは、従来の3つのチャット機能（個人運勢相談、チームメイト相性相談、チーム目標アドバイス）を1つのインターフェースに統合
- モバイルファーストのレスポンシブデザインを採用し、特にスマートフォンでの操作性を重視
- 紫を基調としたグラデーションカラーで、スピリチュアルな雰囲気を演出
- 音声入力機能と会話管理機能（保存・クリア）を追加
- モード切替機能で3つの異なるコンテキスト（個人/チームメイト/チーム目標）を簡単に切り替え可能
- シンプルで洗練されたUI/UXを実現

- [x] mockups/team-page.html - チームページ

**実装メモ**
- チーム全体の運勢ランキングをトップに表示し、今日最も運勢の良いメンバーを強調
- メンバーリストで各メンバーとの相性を五行に基づいた直感的な表示で可視化
- 詳細情報モーダルで個別メンバーとの相性詳細や協力のためのアドバイスを表示
- モバイルファーストのレスポンシブデザインでスマートフォンからもチーム情報にアクセス可能

- [x] mockups/daily-fortune.html - デイリー運勢ページ

**実装メモ**
- 五行に基づいた色表現で直感的な運勢の特徴を表示（木・火・土・金・水の属性に対応）
- Chart.jsを使用した円グラフによる運勢スコアの視覚的表示
- マークダウン形式の運勢詳細コンテンツで、AIが生成した内容を構造化して表示
- 今日のラッキーポイント（色、アイテム、ドリンクなど）をカード形式で表示
- AIアシスタントへの相談ボタンで相談ページへの自然な誘導
- 「個人目標へのアドバイス」と「チーム目標へのアドバイス」を明確に分けてパース可能な構造で提供

- [x] mockups/login-page.html - ログインページ

**実装メモ**
- モバイルファーストのレスポンシブデザインで、スマートフォンから快適にログイン可能
- Material UIのコンポーネントをベースにした洗練されたフォームデザイン
- 紫を基調としたシンプルなカラースキームでブランドイメージを統一
- フォームバリデーション機能を実装し、ユーザー入力のエラーを即座にフィードバック
- パスワードリセットと新規登録へのアクセスポイントを明確に提供
- アクセシビリティに配慮したUI設計で、多様なユーザーがアクセス可能

- [x] mockups/profile-settings.html - プロフィール設定ページ

**実装メモ**
- タブ形式で個人情報、個人目標、四柱推命、セキュリティを切り替え可能な直感的なUI
- 生年月日・出生時間・出生地を詳細に設定できるインターフェース
- Flatpickrを使用した日付・時間選択UXの最適化
- 期限付き個人目標の設定機能（キャリア目標・チーム目標・個人的な目標）
- デイリー運勢からのアドバイスと連携するための具体的な期限設定
- 管理者設定による役割表示（ユーザー自身では編集不可）
- 四柱推命情報を視覚的に魅力的なカード形式で表示
- 四柱（年柱、月柱、日柱、時柱）情報の詳細表示
- 性格特性や仕事適性に関する解説コンテンツの提供
- 五行属性に基づいた視覚的フィードバックの提供
- パスワード変更・通知設定などのセキュリティ機能

- [x] mockups/saju-profile-designs.html - 四柱推命プロフィールデザイン集

**実装メモ**
- 四柱推命情報を4つの異なるデザインコンセプトで表示するモックアップ
- RPGスキル風デザイン：ゲーム的要素を取り入れた五行スキルやステータス表示
- チャートデザイン：Chart.jsを活用した五行バランスやパーソナリティの視覚化
- 命盤ビジュアライザー：四柱の年柱・月柱・日柱・時柱を直感的に把握できる表示
- クラシックデザイン：伝統的な四柱推命情報の表示方法
- タブ切り替えで複数デザインを簡単に比較できるインターフェース
- ユーザー体験を高めるアニメーションと視覚効果
- モバイルファーストのレスポンシブデザインで様々なデバイスに対応

## 四柱推命プロフィールと日柱データ実装
- [x] server/src/services/saju-engine.service.ts - 四柱推命エンジン連携

**実装メモ**
- sajuengine_packageとの連携インターフェースを実装
- 年柱、月柱、日柱、時柱の計算ロジックを連携
- lunar-javascriptライブラリ連携時の型定義問題を解決
- 天干地支、蔵干、十神の取得メソッドを実装
- 五行属性の判定ロジックを実装
- 任意の日付の日柱計算機能を実装

- [x] server/src/controllers/saju-profile.controller.ts - 四柱推命プロフィールAPI

**実装メモ**
- プロフィール作成エンドポイント (`POST /api/v1/saju-profiles`)を実装
- プロフィール取得エンドポイント (`GET /api/v1/saju-profiles/me`)を実装
- プロフィール更新エンドポイント (`PUT /api/v1/saju-profiles/me`)を実装
- バリデーションミドルウェアを実装
- 存在チェックミドルウェアを実装
- Firebase UIDとMongoDBのObjectIdの連携を改善

- [x] server/src/batch/day-pillar-generator.ts - 日柱生成バッチ処理

**実装メモ**
- 毎日の日柱生成ロジックを実装
- スケジューラー設定 (毎日0時実行)
- エラーハンドリングと再試行ロジックを実装
- ログ記録機能を実装
- 実行結果通知を実装
- バッチ処理の統合テストを作成

### 参考資料
- 要件定義書: docs/requirements.md
- デプロイガイド: docs/deploy.md
- テスト環境ガイド: docs/testlab.md
- アーキテクチャ評価: docs/architecture_assessment.md
- 実装順序計画: docs/implementation_order.md
- 実装タスク詳細計画: docs/implementation_tasks.md
- 実装引き継ぎ資料: docs/implementation_handover.md