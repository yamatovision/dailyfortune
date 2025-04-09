# DailyFortune - 経営者向け人材管理ツール

DailyFortuneは、四柱推命に基づいた日々の運勢とチームメンバーとの相性を可視化する経営者向けの人材管理ツールです。

## データモデル管理について

このプロジェクトのデータモデル定義は `/docs/data_models.md` で一元管理されています。

AI開発者の皆さんへ：
- モデルに関する変更が必要な場合は、必ず最初に `data_models.md` を確認・更新してください
- 変更内容と日付を変更履歴セクションに記録してください
- その後、実装（`shared/index.ts` および `server/src/types/index.ts` など）を更新してください

## デプロイURL

- 一般ユーザー向け: [https://dailyfortune.web.app](https://dailyfortune.web.app)
- 管理者向け: [https://dailyfortune-admin.web.app](https://dailyfortune-admin.web.app)

## 機能概要

- ユーザーの四柱推命プロファイル作成
- 日々の運勢と仕事のアドバイス提供
- チームメンバー間の相性分析
- AIチャットによる個人・チーム運勢相談
- 管理者向けダッシュボード

## プロジェクト構成

- **クライアントアプリ**: React.js + TypeScript + Material UI
- **管理者用アプリ**: React.js + TypeScript + Material UI
- **バックエンドAPI**: Node.js + Express + TypeScript + MongoDB
- **認証**: Firebase Authentication

## 開発環境のセットアップ

### 前提条件

- Node.js (v18以上)
- MongoDB
- Firebase プロジェクト

### インストール

1. リポジトリをクローン
   ```
   git clone https://github.com/yamatovision/dailyfortune.git
   cd dailyfortune
   ```

2. 各ディレクトリで依存関係をインストール
   ```
   # クライアントアプリ
   cd client
   npm install

   # バックエンドAPI
   cd ../server
   npm install

   # 管理者用アプリ
   cd ../admin
   npm install
   ```

3. 環境変数の設定

各ディレクトリに`.env`ファイルを作成し、必要な環境変数を設定してください。サンプル設定は`docs/env.md`を参照してください。

### 開発サーバーの起動

```
# クライアントアプリ
cd client
npm run dev

# バックエンドAPI
cd server
npm run dev

# 管理者用アプリ
cd admin
npm run dev
```

## ライセンス

本プロジェクトはプライベートソフトウェアであり、許可なく使用、複製、配布することはできません。