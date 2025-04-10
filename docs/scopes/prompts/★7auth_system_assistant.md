# 認証認可システム構築アシスタント

## 概要
このプロンプトは、様々な認証方式（JWT、OAuth、Firebase、Auth0など）を活用したウェブアプリケーションの認証・認可システムを実装するためのガイドラインです。フロントエンドとバックエンドの両方を含み、エラーが起こりにくい安定した実装を目指します。

## システム要件（カスタマイズ可能）

- **認証バックエンド**: 
  - 選択肢: JWT認証、OAuth/OpenID Connect、Firebase Authentication、Auth0、Cognito、カスタム認証など
  - 考慮点: セキュリティ要件、拡張性、開発工数、運用コスト
  - 主要な選択基準:
    - セルフホスト vs マネージドサービス
    - コスト（初期・運用）
    - 必要な認証機能（ソーシャルログイン、MFA、パスワードレス認証など）
    - コンプライアンス要件（GDPR、HIPAA、PCI DSSなど）
    - スケーラビリティ要件

- **バックエンド**: 
  - 選択肢: Node.js/Express、Spring Boot、Django、Laravel、FastAPIなど
  - 言語: TypeScript/JavaScript、Java、Python、PHP、Go、Rustなど

- **フロントエンド**: 
  - 選択肢: React、Vue、Angular、Svelte、Next.js、Nuxt.jsなど
  - UI: Material UI、Tailwind CSS、Bootstrap、Chakra UI、独自デザインなど

- **権限管理**: 
  - 選択肢: ロールベースアクセス制御(RBAC)、属性ベースアクセス制御(ABAC)、ポリシーベースなど
  - 権限レベル: 一般ユーザー、管理者、スーパー管理者など（プロジェクト要件に応じてカスタマイズ）

- **セキュリティ**: OWASP Top 10基準に準拠

## 実装ステップ

### 1. 要件と仕様の調査・分析

- [ ] `docs/auth_architecture.md` - 認証設計を確認
- [ ] `docs/CURRENT_STATUS.md` - 現在の開発状況を確認
- [ ] `docs/requirements.md` - 要件定義を確認
- [ ] `/mockups` - 関連するUIデザインを確認
- [ ] `docs/deploy.md` - デプロイ手順を確認
- [ ] `docs/data_models.md` - データモデルを確認

**ポイント**:
- クライアント、サーバー、管理者の各コンポーネントを別々にセットアップする構造を理解する
- 権限レベルとアクセス制御のルールを明確にする
- 認証フローの詳細を理解する (ログイン、登録、パスワードリセット、ログアウト)

### 2. 環境変数の検証と設定

- [ ] `.env`ファイルを確認し、必要な環境変数を理解する
- [ ] 開発環境用の`.env`ファイルを作成・更新する
- [ ] Firebaseプロジェクト情報の確認（API Key、Auth Domain、Project ID等）

**エラー回避ポイント**:
- Firebase設定が環境変数として正しく設定されているか確認
- 秘密鍵の形式が正しいか確認（特にエスケープシーケンスに注意）
- APIエンドポイントのURLが正しく設定されているか確認

### 3. バックエンド実装

#### バックエンド実装 - 認証方式別ガイド

**JWT認証の実装**
- [ ] JWT依存関係の導入 (`jsonwebtoken`など)
- [ ] JWTシークレット設定（環境変数）
- [ ] トークン生成ユーティリティの実装 (`server/src/utils/jwt.ts`)
- [ ] トークン検証ミドルウェアの実装 (`server/src/middleware/auth.middleware.ts`)
- [ ] リフレッシュトークン機能の実装（オプション）
- [ ] トークン失効管理（オプション）

**Firebase認証の実装**
- [ ] Firebase Admin SDKの設定 (`server/src/config/firebase.ts`)
- [ ] 認証ミドルウェアの実装 (`server/src/middleware/auth.middleware.ts`)
- [ ] カスタムクレーム設定（ロール情報など）

**OAuth/OpenID Connectの実装**
- [ ] OAuthプロバイダー設定（Google、GitHub、Facebookなど）
- [ ] OAuthミドルウェアの設定 (`passport.js`など)
- [ ] コールバックハンドラー実装
- [ ] プロフィール情報マッピング

**共通実装**
- [ ] セキュリティミドルウェアの実装 (CORS, レート制限など)
- [ ] 認証コントローラーの実装 (`server/src/controllers/auth.controller.ts`)
- [ ] APIルートの定義 (`server/src/routes/auth.routes.ts`)
- [ ] 型定義の共有設定 (`shared/index.ts` とのパスマッピング)

**エラー回避ポイント**:
- 認証関連ライブラリの初期化を1度だけ行うように設計
- 認証シークレット・鍵の適切な取り扱い（環境変数またはファイル）
- `tsconfig.json`でパスエイリアスを正しく設定
- 共有モジュールの参照が正しく解決されるよう`tsconfig-paths`の設定
- 認証スコープの適切な設定（必要最小限の権限）
- トークン有効期限の適切な設定（短すぎず長すぎない）

### 4. TypeScriptエラーチェック（バックエンド）

- [ ] 依存関係が正しくインストールされているか確認
- [ ] `npm run typecheck`でTypeScriptエラーを検証
- [ ] モジュール解決とパスエイリアスの問題を解決
- [ ] 必要に応じて`tsconfig.json`の調整

**エラー回避ポイント**:
- モジュールインポートパスが正しいか確認（特に`@shared/`などのエイリアス）
- 型定義ファイル（`.d.ts`）の確認
- ライブラリの型定義がインストールされているか確認（`@types/...`）

### 5. 管理者アカウント作成スクリプト

- [ ] 管理者作成スクリプトの実装 (`server/scripts/createAdmin.ts`)
- [ ] Firebase Admin SDKを利用したユーザー作成と権限設定
- [ ] データベース連携（必要に応じて）

**エラー回避ポイント**:
- Firebase Admin SDKの初期化時の例外処理
- パスの解決問題（相対パスやエイリアスパス）への対応
- JSON解析時のエラーハンドリング

### 6. バックエンドサーバー起動テスト

- [ ] 依存関係インストール（`npm install`）
- [ ] 開発サーバー起動（`npm run dev`）
- [ ] エラーログの確認と修正
- [ ] 環境変数の読み込み確認

**エラー回避ポイント**:
- Firebase初期化の失敗に対処（正しいサービスアカウント情報を確認）
- パスマッピングの問題を解決（モジュール解決エラー）
- `package.json`スクリプトにtsconfig-pathsを追加

### 7. フロントエンド実装

#### フロントエンド実装 - 認証方式別ガイド

**JWT認証のフロントエンド実装**
- [ ] JWTストレージ管理ユーティリティ (`client/src/utils/auth.ts`)
- [ ] 認証ヘッダー付加インターセプター (`client/src/utils/api.ts`)
- [ ] 認証コンテキスト実装 (`client/src/contexts/AuthContext.tsx`)
- [ ] トークン有効期限管理とリフレッシュロジック
- [ ] トークンの安全な保存（HttpOnly Cookie/localStorage/sessionStorage選定）

**Firebase認証のフロントエンド実装**
- [ ] Firebaseクライアント設定 (`client/src/config/firebase.ts`)
- [ ] Firebase Auth利用の認証コンテキスト実装
- [ ] onAuthStateChanged活用のログイン状態監視

**OAuth/OpenID Connectのフロントエンド実装**
- [ ] OAuthリダイレクトフロー管理
- [ ] OAuthプロバイダーボタン実装
- [ ] コールバックURIハンドリング
- [ ] ステート管理によるCSRF保護

**共通実装**
- [ ] 保護されたルート実装 (`client/src/components/common/ProtectedRoute.tsx`)
- [ ] ログインページ実装 (`client/src/pages/Login/index.tsx`) - mockupベース
- [ ] 登録ページ実装 (`client/src/pages/Login/Register.tsx`)
- [ ] パスワードリセットページ実装 (`client/src/pages/Login/ForgotPassword.tsx`)
- [ ] 権限エラーページ実装 (`client/src/pages/Unauthorized/index.tsx`)
- [ ] その他必要なページのプレースホルダー実装

**エラー回避ポイント**:
- コンポーネントパスの構造を一貫して維持
- UIフレームワークのテーマ設定を正しく適用
- ページコンポーネントのディレクトリ構造を事前に作成
- React Routerの設定を正しく行う
- トークン更新失敗時の適切なエラーハンドリング
- 認証状態変更時の適切なUI更新
- ロード状態の適切な表示

### 8. TypeScriptエラーチェック（フロントエンド）

- [ ] 依存関係が正しくインストールされているか確認
- [ ] `npm run typecheck`でTypeScriptエラーを検証
- [ ] コンポーネントのprops型とイベントハンドラーの型を確認
- [ ] Firebase認証関連の型定義を確認

**エラー回避ポイント**:
- Firebase関連の型定義のインポート方法を確認
- Reactコンポーネントの型定義の正確性を確認
- イベントハンドラーの型（FormEvent等）

### 9. フロントエンドサーバー起動テスト

- [ ] 依存関係インストール（`npm install`）
- [ ] 開発サーバー起動（`npm run dev`）
- [ ] インポート解決エラーの確認と修正
- [ ] コンポーネント構造の確認

**エラー回避ポイント**:
- パスエイリアスの設定確認
- 不足しているディレクトリやファイルの作成
- Vite設定の確認
- 環境変数の設定確認（`.env`ファイル）

### 10. 認証フローテスト

- [ ] ログイン機能のテスト
- [ ] 新規登録機能のテスト
- [ ] パスワードリセット機能のテスト
- [ ] 認証状態の永続化確認
- [ ] 権限に基づいたルーティングのテスト

**エラー回避ポイント**:
- Firebase Emulatorを活用したローカルテスト
- エラーハンドリングの検証（不正なログイン試行など）
- 非同期処理の適切な管理（loading状態など）

### 11. セキュリティテスト

- [ ] OWASP Top 10に基づくセキュリティチェック
- [ ] XSS対策の検証
- [ ] CSRF対策の検証
- [ ] レート制限の検証
- [ ] 不適切なアクセス制御のテスト

**エラー回避ポイント**:
- セキュリティヘッダーの確認
- フォーム入力のバリデーション
- Content Security Policyの設定
- MongoDBインジェクション対策

### 12. デプロイ準備

- [ ] 環境変数の本番設定
- [ ] ビルドプロセスのテスト (`npm run build`)
- [ ] 静的資産の最適化
- [ ] デプロイスクリプトの準備

**エラー回避ポイント**:
- 本番環境と開発環境の違いを考慮
- 環境ごとの設定の分離
- ビルド成果物の検証
- CI/CDパイプラインの構成

### 13. ドキュメント更新

- [ ] `docs/CURRENT_STATUS.md`の更新
- [ ] `docs/deploy.md`の更新（必要に応じて）
- [ ] 新規作成ファイルとその役割の記録
- [ ] トラブルシューティングガイドの追加

**エラー回避ポイント**:
- 実装の詳細と理由の記録
- 設定手順の明確な文書化
- 環境変数の説明と例の提供
- トラブルシューティングセクションの充実

### 14. GitHub連携

- [ ] リポジトリ初期化（必要に応じて）
- [ ] `.gitignore`ファイルの適切な設定
- [ ] 機密情報の管理（環境変数と.envファイル）
- [ ] ブランチ戦略の設定
- [ ] CI/CD設定（オプション）

**エラー回避ポイント**:
- 機密情報がGitに含まれないよう確認
- 適切なコミットメッセージの規約
- PRテンプレートの設定
- ブランチ保護ルールの設定

## 最終チェックリスト

- [ ] Firebase認証が正しく機能するか
- [ ] バックエンドのAPIエンドポイントが正しく保護されているか
- [ ] フロントエンドのルートが権限に基づいて制限されているか
- [ ] エラーハンドリングが適切か
- [ ] セキュリティベストプラクティスが適用されているか
- [ ] コード品質とテストカバレッジ
- [ ] ドキュメントが最新か
- [ ] デプロイ準備が整っているか

## トラブルシューティング

### 認証方式別トラブルシューティング

#### JWT認証の一般的な問題と解決策

1. **トークン検証エラー**
   - JWTシークレットが一致しているか確認
   - アルゴリズム（HS256、RS256など）設定が一致しているか確認
   - トークン有効期限が切れていないか確認
   - トークン形式が正しいか確認（ヘッダー.ペイロード.署名）

2. **リフレッシュトークン問題**
   - リフレッシュトークンの有効期限設定確認
   - 安全なストレージ方法の確認（HttpOnlyクッキーなど）
   - トークン再発行ロジックの検証

3. **CSRF脆弱性**
   - CSRFトークンの実装確認
   - Double Submitクッキーパターンの適用
   - SameSite属性設定確認

#### Firebase認証の一般的な問題と解決策

1. **Firebase初期化の失敗**
   - サービスアカウントJSONの形式を確認
   - 環境変数の設定を確認
   - Firebaseプロジェクト設定を確認

2. **カスタムクレーム問題**
   - クレーム設定のタイミング確認
   - クレームサイズ制限（1KB）の考慮
   - 適切なクレーム命名規則の適用

3. **トークン検証エラー**
   - Firebase Admin SDK初期化確認
   - IDトークンとアクセストークンの区別
   - トークン期限切れ自動更新の実装

#### OAuth/OpenID Connectの一般的な問題と解決策

1. **リダイレクトループ**
   - リダイレクトURI設定確認
   - ステート変数の管理確認
   - 適切なエラーハンドリング実装

2. **スコープ関連問題**
   - 必要なスコープの明示的指定
   - スコープ制限（最小権限原則）の適用
   - プロバイダー固有のスコープフォーマット確認

3. **OAuthプロバイダー設定エラー**
   - クライアントID/シークレット確認
   - 許可されたリダイレクトURI登録確認
   - プロバイダー固有の制限確認

### 共通の問題と解決策

1. **モジュール解決エラー**
   - `tsconfig.json`のパスマッピングを確認
   - `tsconfig-paths`の設定を確認
   - 相対パスとの競合を解決

2. **CORS関連エラー**
   - 正しいCORS設定確認（許可オリジン、メソッド、ヘッダー）
   - クレデンシャル含むリクエスト設定
   - プリフライトリクエスト処理確認

3. **TypeScriptエラー**
   - 型定義のインポートパスの確認
   - 必要なライブラリの型定義（@types）のインストール
   - 共有型定義のアクセシビリティ確認

4. **デプロイ問題**
   - 環境変数の設定確認
   - ビルドプロセスの検証
   - 本番環境と開発環境の違いの確認

## 認証方式別実装サンプル

### JWT認証実装サンプル

**バックエンド (Node.js/Express/TypeScript)**

```typescript
// utils/jwt.ts
import jwt from 'jsonwebtoken';
import { UserRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '1h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export const generateTokens = (payload: TokenPayload) => {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ userId: payload.userId }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
  
  return { accessToken, refreshToken };
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('無効なトークンです');
  }
};
```

**認証ミドルウェア**

```typescript
// middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UserRole } from '../types';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '認証トークンがありません' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decoded = verifyToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: '認証に失敗しました' });
  }
};

export const requireRole = (role: UserRole) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    
    if (req.user.role !== role) {
      return res.status(403).json({ message: '権限がありません' });
    }
    
    next();
  };
};
```

**フロントエンド (React/TypeScript)**

```typescript
// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data.user);
        } catch (error) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data;
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(user);
  };

  const register = async (email: string, password: string, name: string) => {
    await api.post('/auth/register', { email, password, name });
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## パフォーマンス最適化

- [ ] 認証状態のキャッシュと永続化
- [ ] トークンの自動更新メカニズム
- [ ] レンダリングの最適化
- [ ] レート制限の適切な設定
- [ ] データベースクエリの最適化
- [ ] トークン検証のキャッシュ（Redis等の活用）
- [ ] セッション管理の効率化

## セキュリティ強化オプション

- [ ] 多要素認証(MFA)の実装
- [ ] パスワード強度の要件強化
- [ ] 不審なログイン検出と通知
- [ ] ログイン履歴の追跡
- [ ] IDP連携（Google、Apple、GitHubなど）
- [ ] ブルートフォース攻撃対策（アカウントロックアウト）
- [ ] IPアドレスベースの制限
- [ ] 管理者向け監査ログ
- [ ] バイオメトリクス認証連携（WebAuthn/FIDO2）
- [ ] パスワードレス認証オプション


