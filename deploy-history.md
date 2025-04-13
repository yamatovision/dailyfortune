# DailyFortune デプロイ履歴

## 2025-04-14: 管理画面JWTログイン修正

### 1. デプロイ概要
- デプロイコンポーネント: 管理画面(admin)
- 主な変更点: Firebase認証からJWT認証への完全移行、認証フローの改善
- デプロイ担当者: Claude

### 2. デプロイ手順
```bash
# 管理画面ビルド
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/admin
npm run build

# Firebaseにデプロイ（admin側のみ）
cd /Users/tatsuya/Desktop/システム開発/DailyFortune
firebase deploy --only hosting:admin
```

### 3. 変更内容
- AuthContext.tsxを完全書き換え：Firebaseの依存関係を削除し、JWT認証に完全移行
- api.service.tsを修正：トークン有効期限確認機能を追加
- SuperAdminRoute.tsxを修正：認証状態チェックを改善、ログイン状態の保持を強化
- Login/index.tsxを更新：ログイン処理の安定性向上、遅延リダイレクト実装

### 4. 発生した問題と解決策
- 問題: JWTでログイン後もドメイン再読み込み時に即ログアウト
  - 原因: Firebaseベースの認証フローからの移行が不完全
  - 解決策: AuthContextを完全にJWTベースで再実装

- 問題: ログイン成功後すぐリダイレクトするため状態更新が間に合わない
  - 原因: 非同期処理のタイミングの問題
  - 解決策: 成功フラグを追加し、遅延リダイレクトを実装

### 5. デプロイ結果
- 管理画面URL: https://dailyfortune-admin.web.app
- 確認した機能: JWTログイン、セッション維持、ルート保護

## 2025-04-14: 全コンポーネント再デプロイ

### 1. デプロイ概要
- デプロイコンポーネント: バックエンド、フロントエンド、管理画面
- 主な変更点: FortuneScoreResultインターフェース修正、sajuengine_package参照パス修正
- デプロイ担当者: Claude

### 2. デプロイ手順

#### バックエンド再デプロイ
```bash
# FortuneScoreResultインターフェースを修正
# sajuengine_packageの参照パスを修正
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/server
npm run build
mkdir -p /Users/tatsuya/Desktop/システム開発/DailyFortune/server/sajuengine_package
cp -r /Users/tatsuya/Desktop/システム開発/DailyFortune/sajuengine_package/src /Users/tatsuya/Desktop/システム開発/DailyFortune/server/sajuengine_package/
npm install luxon date-fns-tz @types/luxon
npm run build
gcloud builds submit --tag gcr.io/yamatovision-blue-lamp/dailyfortune-api

# Cloud Runにデプロイ
gcloud run deploy dailyfortune-api --image gcr.io/yamatovision-blue-lamp/dailyfortune-api:latest --platform managed --region asia-northeast1 --allow-unauthenticated --set-env-vars NODE_ENV=production,MONGODB_URI=mongodb+srv://[USERNAME]:[PASSWORD]@motherprompt-cluster.np3xp.mongodb.net/dailyfortune,CLIENT_URL=https://dailyfortune.web.app,ADMIN_URL=https://dailyfortune-admin.web.app,FIREBASE_DATABASE_URL=https://sys-76614112762438486420044584.firebaseio.com,JWT_SECRET=[SECRET_KEY],FIREBASE_API_KEY=[FIREBASE_API_KEY],ANTHROPIC_API_KEY=[ANTHROPIC_API_KEY]
```

#### フロントエンドデプロイ
```bash
# client環境変数設定
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/client
# .env.productionを作成・編集
npm run build

# admin環境変数設定
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/admin
# .env.productionを編集
npm run build

# Firebaseにデプロイ
cd /Users/tatsuya/Desktop/システム開発/DailyFortune
firebase deploy --only hosting
```

### 3. 発生した問題と解決策
- 問題1: FortuneScoreResultインターフェースの不足
  - 症状: サーバーのビルドでプロパティが不足しているというエラー
  - 原因: バックエンドコードがFortuneScoreResultに追加のプロパティを使用していた
  - 解決策: FortuneScoreResultインターフェースに不足していたプロパティを追加

- 問題2: sajuengine_packageのインポートエラー
  - 症状: Docker内でのビルド時に'saju-engine'モジュールが見つからないエラー
  - 原因: sajuengine_packageへの相対パスが正確でなかった
  - 解決策: パスを修正し、サーバーディレクトリにsajuengine_packageをコピー

- 問題3: 依存関係の不足
  - 症状: luxonとdate-fns-tzモジュールが見つからないエラー
  - 原因: sajuengine_packageが使用する依存関係がインストールされていなかった
  - 解決策: 不足していた依存関係をインストール

### 4. デプロイ結果
- バックエンドURL: https://dailyfortune-api-235426778039.asia-northeast1.run.app
- クライアントURL: https://dailyfortune.web.app
- 管理画面URL: https://dailyfortune-admin.web.app
- 確認した機能: サーバー基本動作

### 5. 今後の課題
- モジュール依存関係の整理（sajuengine_packageの扱い）
- コード分割によるパフォーマンス改善（大きなチャンクの分割）
- 自動デプロイパイプラインの構築

## 2025-04-10: サーバーサイドデプロイ

### 1. デプロイ準備

```bash
# 環境確認
gcloud auth list
gcloud config list
```

現在のアカウント: `lisence@mikoto.co.jp`  
プロジェクト: `yamatovision-blue-lamp`  
リージョン: `asia-northeast1`

### 2. 最初のデプロイ試行

```bash
# 共有型定義を更新
cp shared/index.ts server/src/types/index.ts

# サーバービルド
cd server && npm run build

# Dockerイメージビルド・送信
gcloud builds submit --tag gcr.io/yamatovision-blue-lamp/dailyfortune-api
```

**問題発生**: ビルド中に `sajuengine_package` モジュールのインポートエラー

**原因**: サーバーコードが参照しているパスが間違っていた

**解決策**: 
- `saju-engine.service.ts`のインポートパスを修正
  - 変更前: `import { SajuEngine, SajuResult } from '../../../sajuengine_package/src';`
  - 変更後: `import { SajuEngine, SajuResult } from '../../sajuengine_package/src';`

### 3. 2回目のデプロイ試行

```bash
# セットアップ修正後のビルド
mkdir -p /Users/tatsuya/Desktop/システム開発/DailyFortune/server/sajuengine_package
cp -r /Users/tatsuya/Desktop/システム開発/DailyFortune/sajuengine_package/src /Users/tatsuya/Desktop/システム開発/DailyFortune/server/sajuengine_package/
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/server && npm run build

# Dockerイメージビルド・送信
gcloud builds submit --tag gcr.io/yamatovision-blue-lamp/dailyfortune-api

# Cloud Runへのデプロイ
gcloud run deploy dailyfortune-api \
  --image gcr.io/yamatovision-blue-lamp/dailyfortune-api \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,MONGODB_URI=mongodb+srv://[USERNAME]:[PASSWORD]@motherprompt-cluster.np3xp.mongodb.net/dailyfortune,CLIENT_URL=https://dailyfortune.web.app,ADMIN_URL=https://dailyfortune-admin.web.app,FIREBASE_DATABASE_URL=https://sys-76614112762438486420044584.firebaseio.com,JWT_SECRET=[SECRET_KEY],FIREBASE_API_KEY=[FIREBASE_API_KEY]" \
  --set-secrets="FIREBASE_SERVICE_ACCOUNT=firebase-admin-sdk:latest"
```

**問題発生**: Cloud Runでコンテナが起動できない

**エラーログ**:
```
Error: Cannot find module '/app/dist/index.js'
```

**原因**: Dockerfileの問題。ビルド成果物が適切にコピーされていない

**解決策**:
- Dockerfileを修正して、`sajuengine_package` ディレクトリをコピーするように変更
- `RUN ls -la && ls -la dist` コマンドを追加して構造を確認

### 4. 3回目のデプロイ試行

```bash
# 修正したDockerfileでイメージビルド
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/server && gcloud builds submit --tag gcr.io/yamatovision-blue-lamp/dailyfortune-api
```

**問題発生**: ビルドは成功したが、起動時にエントリーポイントのパスが間違っている  

**原因**: TypeScriptビルド後のディレクトリ構造と実行コマンドが一致していない  

**エラーログ**:
```
Error: Cannot find module '/app/dist/index.js'
```

**解決策**:
- `ls -la dist` を見ると、実際のJSファイルは `dist/src/index.js` にある
- Dockerfileを更新して正しいエントリーポイントを指定

```diff
- CMD ["node", "dist/index.js"]
+ CMD ["node", "dist/src/index.js"]
```

### 5. 4回目のデプロイ試行

```bash
# 修正したDockerfileでイメージビルド
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/server && gcloud builds submit --tag gcr.io/yamatovision-blue-lamp/dailyfortune-api

# Cloud Runへのデプロイ
gcloud run deploy dailyfortune-api \
  --image gcr.io/yamatovision-blue-lamp/dailyfortune-api \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,MONGODB_URI=mongodb+srv://[USERNAME]:[PASSWORD]@motherprompt-cluster.np3xp.mongodb.net/dailyfortune,CLIENT_URL=https://dailyfortune.web.app,ADMIN_URL=https://dailyfortune-admin.web.app,FIREBASE_DATABASE_URL=https://sys-76614112762438486420044584.firebaseio.com,JWT_SECRET=[SECRET_KEY],FIREBASE_API_KEY=[FIREBASE_API_KEY]" \
  --set-secrets="FIREBASE_SERVICE_ACCOUNT=firebase-admin-sdk:latest"
```

**問題発生**: Anthropic (Claude) API Keyが設定されていないためサーバーが起動できない

**エラーログ**:
```
Error: Claude API Key is not configured. Please set ANTHROPIC_API_KEY in your environment variables.
```

**原因**: サーバーコード内で必須環境変数`ANTHROPIC_API_KEY`をチェックしている (`src/utils/claude-ai.ts`)

**解決策**:
- 環境変数に`ANTHROPIC_API_KEY`を追加

### 6. 5回目のデプロイ試行

```bash
# 環境変数を追加してデプロイ
gcloud run deploy dailyfortune-api \
  --image gcr.io/yamatovision-blue-lamp/dailyfortune-api \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,MONGODB_URI=mongodb+srv://[USERNAME]:[PASSWORD]@motherprompt-cluster.np3xp.mongodb.net/dailyfortune,CLIENT_URL=https://dailyfortune.web.app,ADMIN_URL=https://dailyfortune-admin.web.app,FIREBASE_DATABASE_URL=https://sys-76614112762438486420044584.firebaseio.com,JWT_SECRET=[SECRET_KEY],FIREBASE_API_KEY=[FIREBASE_API_KEY],ANTHROPIC_API_KEY=[ANTHROPIC_API_KEY]" \
  --set-secrets="FIREBASE_SERVICE_ACCOUNT=firebase-admin-sdk:latest"
```

**結果**: バックエンドデプロイ成功！

**サービスURL**: https://dailyfortune-api-235426778039.asia-northeast1.run.app

**ステータス確認**:
```
Status: "ok" - indicating the server is running properly
Timestamp: 2025-04-10T04:12:38.583Z
```

## 2025-04-10: フロントエンドのAPI連携修正

### 1回目の修正: API参照の修正

**問題**: デプロイしたバックエンドAPIに対して、フロントエンドからの接続が確立できない問題が発生。

**原因**: 
- フロントエンドアプリの `api.service.ts` で、baseURLが空文字列に固定されており、本番環境変数が使用されていなかった
- `.env.production` ファイルでは正しいCloud Run URLが設定されていたが、それが使用されていなかった
- このため、本番環境でもローカル開発のプロキシ設定が使われ、リクエストが `https://dailyfortune.web.app/api/v1/...` に送信されていた

**解決策**:
1. `api.service.ts` を修正して環境に応じて適切なbaseURLを設定:

```typescript
// 修正前
this.baseURL = ''; 

// 修正後
this.baseURL = import.meta.env.PROD 
  ? import.meta.env.VITE_API_URL 
  : ''; // 開発環境では空文字列（プロキシ使用）
```

2. フロントエンドアプリを再ビルドして再デプロイ:

```bash
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/client && npm run build
cd /Users/tatsuya/Desktop/システム開発/DailyFortune && firebase deploy --only hosting:client
```

### 2回目の修正: URL重複問題の解決

**問題**: API呼び出しで `/api/v1` パスが重複するため、404エラーが発生
```
GET https://dailyfortune-api-235426778039.asia-northeast1.run.app/api/v1/api/v1/fortune/daily 404 (Not Found)
```

**原因**: 
- 環境変数 `VITE_API_URL` に既に `/api/v1` パスが含まれている
- 同時に、フロントエンドコードでもパス定義に `/api/v1` を含んでいる
- これにより、リクエストURLで `/api/v1` が重複している

**解決策**:
1. 環境変数から `/api/v1` 部分を削除:

```diff
- VITE_API_URL=https://dailyfortune-api-235426778039.asia-northeast1.run.app/api/v1
- VITE_AUTH_API_URL=https://dailyfortune-api-235426778039.asia-northeast1.run.app/api/v1/auth
+ VITE_API_URL=https://dailyfortune-api-235426778039.asia-northeast1.run.app
+ VITE_AUTH_API_URL=https://dailyfortune-api-235426778039.asia-northeast1.run.app
```

2. フロントエンドアプリを再ビルドして再デプロイ:

```bash
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/client && npm run build
cd /Users/tatsuya/Desktop/システム開発/DailyFortune && firebase deploy --only hosting:client
```

## デプロイ時の主な課題と解決策

1. **モジュールパス参照の問題**
   - 相対パスの計算が間違っていた
   - 解決: 正しい相対パスに修正

2. **ビルド構造とDockerfile設定の不一致**
   - TypeScriptビルド後のディレクトリ構造が予想と異なっていた
   - 解決: `Dockerfile`のコピー先と実行パスを正しく指定

3. **必須環境変数の不足**
   - Firebase認証、MongoDB接続、Claude API Keyなど設定漏れ
   - 解決: 全ての必要な環境変数を設定

4. **開発・本番環境の切り替え問題**
   - API URLが環境に応じて適切に切り替わっていなかった
   - 解決: 環境変数の適切な使用と条件分岐の実装

5. **URL構造の問題**
   - APIパス（/api/v1）の重複によるルーティング問題
   - 解決: 環境変数を修正して基本URLのみを指定し、パス部分はフロントエンドコードで扱う

## 今後のアクション項目

1. **機密情報の安全な管理**
   - API KeyやMongoDB URIなどの機密情報はSecret Managerに移行する
   - 環境変数で平文指定せず、`--set-secrets`を利用する

2. **CI/CDパイプラインの構築**
   - GitHubからの自動デプロイを設定
   - 環境変数ツールで一元管理

3. **ログ監視の設定**
   - Cloud Loggingアラートを設定
   - エラー発生時に通知を受け取る

4. **スケーリング設定の最適化**
   - トラフィックに応じた適切なスケーリング設定
   - コスト最適化

## デプロイ完了状況

✅ **フロントエンド**: デプロイ完了、API連携修正済み (2025-04-14)  
✅ **バックエンド**: デプロイ完了 (2025-04-14)  
✅ **認証サービス**: 設定完了  
✅ **データベース**: 接続完了