# DailyFortune TestLAB ガイドライン

このドキュメントはDailyFortuneプロジェクトのAIを活用したテスト環境(TestLAB)の中央管理ガイドラインです。複数のAIやテスト環境での開発を効率的に行うための標準プロセスを定義します。

## 1. 環境設定標準プロセス

### 1.1 環境変数と認証情報

- **環境変数ルール**: すべての環境変数はプロジェクトルートの`.env`ファイルに定義されています
- **環境変数の優先順位**: プロジェクトルート > サブディレクトリ > サンプル値
- **認証情報**:
  - Firebase認証情報は`.env`ファイルに定義されています:
    - **FIREBASE_SERVICE_ACCOUNT_PATH**: Firebase認証用JSONキーファイルの絶対パス（必須）
      - `/Users/tatsuya/Desktop/システム開発/DailyFortune/docs/scopes/sys-76614112762438486420044584-firebase-adminsdk-fbsvc-cfd0a33bc9.json`を使用してください
    - **FIREBASE_PROJECT_ID**: Firebaseプロジェクトのプロジェクトコード
    - **FIREBASE_CLIENT_EMAIL**: サービスアカウントのメールアドレス
  - **⚠️ 重要**: テスト環境でも本番環境と同じ認証情報を使用します。ダミー値やモック値を使用しないでください。
  - **テスト用認証情報**:
    - メールアドレス: `shiraishi.tatsuya@mikoto.co.jp`
    - パスワード: `aikakumei`
    - 権限: `super_admin`
  - MongoDB接続情報も`.env`ファイルで定義（MONGODB_URI）

### 1.2 サーバー起動・停止プロセス

**起動前の確認事項**:
```bash
# ポートの使用状況を確認
lsof -i :8080

# 使用中の場合は停止
kill -9 <PID>
```

**起動方法**:
```bash
# サーバーディレクトリで
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/server

# ビルド & 起動
npm run build && node dist/index.js
```

**停止方法**:
```bash
# Ctrl+C でターミナルプロセスを停止
# または別ターミナルから
lsof -i :8080
kill -9 <PID>
```

### 1.3 環境のリセット

```bash
# MongoDB接続をリセット
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/server
npm run db:reset  # ※実装必要

# ソースコードのリビルド
npm run build
```

## 2. テスト実行ガイドライン

### 2.1 モデルテスト

```bash
# 特定のモデルテストの実行
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/server
npm test src/tests/models/[モデル名].test.ts

# 全モデルテスト実行
npm test src/tests/models/
```

### 2.2 API統合テスト

```bash
# 特定のAPIテストの実行
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/server
npm test src/tests/api/[APIカテゴリ].test.ts

# 全APIテスト実行
npm test src/tests/api/
```

### 2.3 管理者APIテスト（実認証使用）

```bash
# 管理者API専用テスト実行スクリプト
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/server
./scripts/run-admin-tests.sh

# 個別の実認証テストファイルを実行
npm test -- --testPathPattern=src/tests/admin/real-auth-users.test.ts
npm test -- --testPathPattern=src/tests/admin/real-auth-users-actions.test.ts
npm test -- --testPathPattern=src/tests/admin/real-auth-fortune-update.test.ts
npm test -- --testPathPattern=src/tests/admin/real-auth-fortune-logs.test.ts
npm test -- --testPathPattern=src/tests/admin/real-auth-fortune-run.test.ts

# 実際の認証情報を使用してトークンを取得
node scripts/get-token.js shiraishi.tatsuya@mikoto.co.jp aikakumei
```

#### 2.3.1 管理者API実認証テスト

管理者APIテストでは実際のFirebase認証を使用する新しいアプローチを採用しています：

- **実認証テストファイル**:
  - `real-auth-users.test.ts`: ユーザー一覧取得API
  - `real-auth-users-actions.test.ts`: ユーザー権限・プラン変更API
  - `real-auth-fortune-update.test.ts`: 運勢更新設定API
  - `real-auth-fortune-logs.test.ts`: 運勢更新ログAPI
  - `real-auth-fortune-run.test.ts`: 手動運勢更新実行API

- **認証方法**:
  - テスト認証情報：`shiraishi.tatsuya@mikoto.co.jp`/`aikakumei`（SuperAdmin権限）
  - 専用のテストヘルパー：`withRealAuth()` 関数を使用してリクエストヘッダーに認証情報を追加
  - 認証トークン取得ツール：`get-token.js`で実際の認証トークンを取得可能

- **エラー処理**:
  - 認証情報が利用できない場合は適切にスキップして安全にテストを進行
  - モックトークンへのフォールバック機能があり、認証失敗時にもテストを継続可能

- **検証方法**:
  - API応答のステータスコードと構造を検証
  - 特定の条件下でのみ詳細な検証を実施（認証成功時）
  - データベースへの変更が実際に反映されているかも確認

**重要**: モックベースのテスト（users.test.ts, fortune-update.test.ts, users.complete.test.ts, fortune-update.complete.test.ts）は廃止され、実認証テスト（real-auth-*.test.ts）に置き換えられました。モックの維持が複雑で信頼性の低いテスト結果になるため、実認証テストを優先的に使用してください。

### 2.4 テスト記録

- 各テスト実行の記録はログファイルに保存
- ログディレクトリ: `/Users/tatsuya/Desktop/システム開発/DailyFortune/logs/tests/`

## 3. 問題デバッグガイド

### 3.1 一般的な問題と解決策

| 問題 | 解決策 |
|------|--------|
| MongoDB接続エラー | `.env`のMONGODB_URIを確認 |
| Firebase認証エラー | `.env`のFIREBASE_*変数を確認、特にFIREBASE_PRIVATE_KEYの改行文字(`\\n`) |
| ポート使用中エラー | `lsof -i :8080`で確認し`kill -9 <PID>`で解放 |
| データモデル型エラー | モデル定義とテストコードの型一致を確認 |
| コントローラーエラー | `UserRole`などの定義を確認。auth.middleware.tsから正しくインポートしているか確認 |

### 3.2 テスト失敗時のチェックリスト

1. 環境変数は正しく読み込まれているか
2. MongoDB接続は成功しているか
3. Firebase認証情報は正しいか
4. ビルドは最新か（`npm run build`を実行済みか）
5. 既存のプロセスと競合していないか

## 4. AIアシスタント連携ガイドライン

### 4.1 AIへの指示標準フォーマット

```
## テスト目的
[テストの意図と目的を記述]

## 実行環境
- サーバー状態: [起動済み/停止中]
- 使用DB: [本番/テスト]
- 認証方法: [Firebase/テスト用]

## 実行手順
1. [手順1]
2. [手順2]
3. [...]

## 期待結果
[期待される出力または振る舞い]
```

### 4.2 AIの動作制限

- **サーバープロセス**: 既存のサーバーがある場合は停止してからテスト開始
- **環境変数**: 直接編集せず、必要なら上書きして一時的に使用
- **DB操作**: テスト用DBのみ使用し、本番データは参照のみ
- **ポート使用**: 8080, 3000, 3001以外のポートを使用する場合は明示的に指定

## 5. テスト実装規約

### 5.1 モデルテスト

```typescript
// テンプレート
import mongoose from 'mongoose';
import { ModelName } from '../../models/ModelName';

describe('ModelName Tests', () => {
  // 事前セットアップ (共通)
  beforeAll(async () => {
    // テスト用DB接続
  });

  afterAll(async () => {
    // 接続クローズ
  });

  beforeEach(async () => {
    // コレクションクリア
  });

  // テストケース
  it('should do something expected', async () => {
    // テスト実装
  });
});
```

### 5.2 APIテスト

```typescript
// テンプレート
import request from 'supertest';
import { app } from '../../app';
import { generateTestToken } from '../util/auth-helper';

describe('API Tests', () => {
  // 認証トークン準備
  let authToken: string;

  beforeAll(async () => {
    authToken = await generateTestToken(/* roleなど */);
  });

  // テストケース
  it('should return correct response', async () => {
    const response = await request(app)
      .get('/api/path')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    // その他のアサーション
  });
});
```

## 6. テスト管理システム

### 6.1 テスト実行結果の保存

テスト結果はJSON形式で保存し、実行日時・実行者・結果・パフォーマンスを記録:

```json
{
  "testId": "uuid-generated",
  "testName": "ModelName Tests",
  "timestamp": "2025-04-07T10:30:00Z",
  "executor": "AIアシスタント名",
  "status": "PASS/FAIL",
  "duration": 1250,
  "failedTests": [],
  "logs": "..."
}
```

### 6.2 AI実行記録

AIが実行した操作の記録:

```json
{
  "sessionId": "uuid-generated",
  "timestamp": "2025-04-07T10:30:00Z",
  "aiName": "AIアシスタント名",
  "commands": [
    {
      "command": "npm test src/tests/models/DailyFortuneUpdateLog.test.ts",
      "result": "PASS/FAIL",
      "duration": 1250
    }
  ],
  "modifications": [
    {
      "file": "/path/to/file",
      "type": "EDIT/CREATE/DELETE",
      "timestamp": "2025-04-07T10:31:00Z"
    }
  ]
}
```

## 7. リソース・参照情報

### 7.1 プロジェクト構造

```
/Users/tatsuya/Desktop/システム開発/DailyFortune/
  ├── server/                   # バックエンド
  │   ├── src/                  # ソースコード
  │   │   ├── config/           # 設定
  │   │   ├── controllers/      # コントローラー
  │   │   ├── middleware/       # ミドルウェア
  │   │   ├── models/           # データモデル
  │   │   ├── routes/           # ルーティング
  │   │   ├── tests/            # テスト
  │   │   └── index.ts          # エントリーポイント
  │   ├── dist/                 # ビルド済みコード
  │   └── .env                  # 環境変数（サーバー固有）
  ├── client/                   # フロントエンド
  ├── admin/                    # 管理画面
  ├── docs/                     # ドキュメント
  │   └── testlab.md            # このガイドライン
  ├── .env                      # 環境変数（プロジェクト全体）
  └── logs/                     # ログ
      └── tests/                # テスト実行ログ
```

### 7.2 重要なモデルと関連

- `User`: ユーザー情報
- `SajuProfile`: 四柱推命プロフィール
- `DailyFortune`: 日々の運勢データ
- `DailyFortuneUpdateLog`: 運勢更新ログ
- `Team`: チーム情報
- `Compatibility`: 相性データ

## 8. 緊急時の対応手順

### 8.1 テスト環境リセット

```bash
# 全環境リセット
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/
./scripts/reset-testlab.sh  # ※実装必要

# データベースのみリセット
cd server
npm run db:reset:test  # ※実装必要
```

### 8.2 サポート連絡先

- テスト環境の問題: [担当者名] ([連絡先])
- 認証関連の問題: [担当者名] ([連絡先])
- データモデル・API: [担当者名] ([連絡先])

### 8.3 管理者API実証試験ツール

**認証トークン取得**:
```bash
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/server
node scripts/get-token.js shiraishi.tatsuya@mikoto.co.jp aikakumei
```

**管理者APIテスト**:
```bash
cd /Users/tatsuya/Desktop/システム開発/DailyFortune/server
./scripts/run-admin-tests.sh
```

---

**注意**: このガイドラインは継続的に更新されます。最新バージョンを参照してください。

**最終更新**: 2025-04-07