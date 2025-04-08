# チーム管理 API リファレンス

このドキュメントでは、チーム管理機能に関連するAPIエンドポイントについて説明します。

## ベースURL

```
/api/v1/teams
```

## エンドポイント一覧

### チーム管理

| メソッド | エンドポイント                           | 説明                                   |
|---------|----------------------------------------|----------------------------------------|
| GET     | `/api/v1/teams`                        | ユーザーが所属する全チームを取得       |
| GET     | `/api/v1/teams/:teamId`                | 特定チームの詳細情報を取得             |
| POST    | `/api/v1/teams`                        | 新しいチームを作成                     |
| PUT     | `/api/v1/teams/:teamId`                | チーム情報を更新                       |
| DELETE  | `/api/v1/teams/:teamId`                | チームを削除                           |

### チーム目標

| メソッド | エンドポイント                         | 説明                                   |
|---------|--------------------------------------|----------------------------------------|
| GET     | `/api/v1/teams/:teamId/goal`         | チームの目標を取得                     |
| POST    | `/api/v1/teams/:teamId/goal`         | チームの目標を設定・更新               |

### チームメンバー

| メソッド | エンドポイント                           | 説明                                   |
|---------|----------------------------------------|----------------------------------------|
| GET     | `/api/v1/teams/:teamId/members`        | チームメンバー一覧を取得               |
| POST    | `/api/v1/teams/:teamId/members`        | チームにメンバーを追加                 |
| PUT     | `/api/v1/teams/:teamId/members/:userId/role` | メンバーの役割を更新           |
| DELETE  | `/api/v1/teams/:teamId/members/:userId` | メンバーをチームから削除             |

### チーム相性分析

| メソッド | エンドポイント                           | 説明                                   |
|---------|----------------------------------------|----------------------------------------|
| GET     | `/api/v1/teams/:teamId/compatibility`  | チームメンバー間の相性マトリクスを取得 |
| GET     | `/api/v1/teams/:teamId/compatibility/analysis` | チーム全体の相性分析を取得  |

### チーム統計とインサイト

| メソッド | エンドポイント                           | 説明                                   |
|---------|----------------------------------------|----------------------------------------|
| GET     | `/api/v1/teams/:teamId/stats`          | チームの統計情報を取得                 |
| GET     | `/api/v1/teams/:teamId/alerts`         | チームのアラート一覧を取得             |
| GET     | `/api/v1/teams/:teamId/members/:userId/insights` | 特定メンバーのインサイトを取得 |

## 詳細API仕様

### チーム一覧取得

```
GET /api/v1/teams
```

ユーザーがアクセスできるすべてのチームを取得します。

#### レスポンス

```json
{
  "teams": [
    {
      "id": "team-id-1",
      "name": "営業チーム",
      "description": "四半期売上目標達成を目指すチーム",
      "adminId": "user-id-1",
      "iconInitial": "営",
      "iconColor": "primary",
      "memberCount": 5,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": "team-id-2",
      "name": "開発チーム",
      "description": "新機能開発を担当するチーム",
      "adminId": "user-id-2",
      "iconInitial": "開",
      "iconColor": "water",
      "memberCount": 7,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### チーム詳細取得

```
GET /api/v1/teams/:teamId
```

指定されたIDのチーム詳細情報を取得します。

#### レスポンス

```json
{
  "team": {
    "id": "team-id-1",
    "name": "営業チーム",
    "description": "四半期売上目標達成を目指すチーム",
    "adminId": "user-id-1",
    "iconInitial": "営",
    "iconColor": "primary",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "goal": {
      "content": "四半期売上目標（1200万円）の達成と顧客満足度90%の維持",
      "deadline": "2025-06-30T00:00:00.000Z",
      "progress": 65,
      "status": "in_progress"
    }
  }
}
```

### チーム作成

```
POST /api/v1/teams
```

新しいチームを作成します。

#### リクエストボディ

```json
{
  "name": "マーケティングチーム",
  "description": "マーケティング戦略の企画と実行を担当",
  "iconColor": "fire"
}
```

#### レスポンス

```json
{
  "team": {
    "id": "team-id-3",
    "name": "マーケティングチーム",
    "description": "マーケティング戦略の企画と実行を担当",
    "adminId": "current-user-id",
    "iconInitial": "マ",
    "iconColor": "fire",
    "createdAt": "2025-04-08T12:34:56.789Z",
    "updatedAt": "2025-04-08T12:34:56.789Z"
  }
}
```

### チーム目標設定

```
POST /api/v1/teams/:teamId/goal
```

チームの目標を設定または更新します。

#### リクエストボディ

```json
{
  "content": "四半期売上目標（1200万円）の達成と顧客満足度90%の維持",
  "deadline": "2025-06-30T00:00:00.000Z"
}
```

#### レスポンス

```json
{
  "success": true,
  "goal": {
    "teamId": "team-id-1",
    "content": "四半期売上目標（1200万円）の達成と顧客満足度90%の維持",
    "deadline": "2025-06-30T00:00:00.000Z",
    "status": "not_started",
    "progress": 0,
    "createdAt": "2025-04-08T12:34:56.789Z",
    "updatedAt": "2025-04-08T12:34:56.789Z"
  }
}
```

### チームメンバー一覧取得

```
GET /api/v1/teams/:teamId/members
```

チームのメンバー一覧を取得します。

#### レスポンス

```json
{
  "members": [
    {
      "userId": "user-id-1",
      "displayName": "鈴木 花子",
      "email": "hanako.suzuki@example.com",
      "role": "デザイナー",
      "mainElement": "water",
      "avatarInitial": "鈴"
    },
    {
      "userId": "user-id-2",
      "displayName": "田中 太郎",
      "email": "taro.tanaka@example.com",
      "role": "エンジニア",
      "mainElement": "metal",
      "avatarInitial": "田"
    }
  ]
}
```

### メンバー追加

```
POST /api/v1/teams/:teamId/members
```

チームに新しいメンバーを追加します。既存ユーザーでない場合は新規ユーザーも同時に作成します。

#### リクエストボディ

```json
{
  "email": "kenta.watanabe@example.com",
  "password": "initialPassword123",
  "role": "営業",
  "element": "fire"
}
```

#### レスポンス

```json
{
  "success": true,
  "member": {
    "userId": "user-id-3",
    "displayName": "渡辺 健太",
    "email": "kenta.watanabe@example.com",
    "role": "営業"
  }
}
```

### メンバー情報更新

```
PUT /api/v1/teams/:teamId/members/:userId/role
```

チームメンバーの情報（主に役割）を更新します。

#### リクエストボディ

```json
{
  "role": "シニアデザイナー",
  "displayName": "鈴木 花子",
  "email": "hanako.suzuki@example.com"
}
```

#### レスポンス

```json
{
  "success": true,
  "member": {
    "userId": "user-id-1",
    "displayName": "鈴木 花子",
    "email": "hanako.suzuki@example.com",
    "role": "シニアデザイナー"
  }
}
```

### 相性マトリクス取得

```
GET /api/v1/teams/:teamId/compatibility
```

チームメンバー間の相性マトリクスを取得します。

#### レスポンス

```json
{
  "compatibilityMatrix": {
    "user-id-1": {
      "user-id-2": {
        "score": 90,
        "relationship": "相生",
        "description": "水（鈴木）は金（田中）を育てる関係です"
      },
      "user-id-3": {
        "score": 45,
        "relationship": "相克",
        "description": "水（鈴木）は火（渡辺）を抑制する関係です"
      }
    },
    "user-id-2": {
      "user-id-1": {
        "score": 90,
        "relationship": "相生",
        "description": "金（田中）は水（鈴木）に育てられる関係です"
      },
      "user-id-3": {
        "score": 85,
        "relationship": "相生",
        "description": "金（田中）は火（渡辺）を生み出す関係です"
      }
    },
    "user-id-3": {
      "user-id-1": {
        "score": 45,
        "relationship": "相克",
        "description": "火（渡辺）は水（鈴木）に抑制される関係です"
      },
      "user-id-2": {
        "score": 85,
        "relationship": "相生",
        "description": "火（渡辺）は金（田中）から生み出される関係です"
      }
    }
  },
  "teamMembers": [
    {
      "userId": "user-id-1",
      "displayName": "鈴木 花子",
      "element": "water",
      "avatarInitial": "鈴"
    },
    {
      "userId": "user-id-2",
      "displayName": "田中 太郎",
      "element": "metal",
      "avatarInitial": "田"
    },
    {
      "userId": "user-id-3",
      "displayName": "渡辺 健太",
      "element": "fire",
      "avatarInitial": "渡"
    }
  ]
}
```

### チーム相性分析取得

```
GET /api/v1/teams/:teamId/compatibility/analysis
```

チーム全体の相性分析とアドバイスを取得します。

#### レスポンス

```json
{
  "strengths": [
    "田中（金）と鈴木（水）の相性は極めて良好で、論理的分析と創造的発想を組み合わせたプロジェクトに最適です",
    "田中（金）と渡辺（火）の組み合わせは戦略立案と実行の流れに優れています"
  ],
  "challenges": [
    "高橋（木）と鈴木（水）の相性には工夫が必要です",
    "チーム全体として木の要素が不足しており、成長と拡大の機会を逃す可能性があります"
  ],
  "advice": "チーム全体として、土と金の要素が強いため、創造性と成長（水と木）を促進する活動を意識的に取り入れることで、より均衡のとれたチームダイナミクスが形成されます",
  "elementalBalance": {
    "wood": 20,
    "fire": 10,
    "earth": 30,
    "metal": 25,
    "water": 15
  }
}
```

### チーム統計取得

```
GET /api/v1/teams/:teamId/stats
```

チームの統計情報を取得します。

#### レスポンス

```json
{
  "memberCount": 5,
  "averageMotivation": 82,
  "alertCount": 2,
  "turnoverRiskCount": 1
}
```

### チームアラート取得

```
GET /api/v1/teams/:teamId/alerts
```

チームに関連するアラートを取得します。

#### レスポンス

```json
{
  "alerts": [
    {
      "userId": "user-id-3",
      "userName": "渡辺 健太",
      "type": "motivation_drop",
      "level": "medium",
      "description": "過去2週間でモチベーションスコアが25%減少しています。面談を推奨します。"
    },
    {
      "userId": "user-id-5",
      "userName": "高橋 めぐみ",
      "type": "turnover_risk",
      "level": "high",
      "description": "AIチャット分析から離職の可能性が検出されました。早急な対応が必要です。"
    }
  ]
}
```

### メンバーインサイト取得

```
GET /api/v1/teams/:teamId/members/:userId/insights
```

特定のチームメンバーに関するAIインサイトを取得します。

#### レスポンス

```json
{
  "element": "water",
  "analysis": "最近の会話から、新しいデザインツールの導入に興味を持っていることが検出されました。特にUI/UXの効率化について頻繁に言及しています。",
  "interests": ["デザインツール", "UI/UX", "効率化"],
  "todayCompatibility": "本日は「水」の気が強い日であり、鈴木さんの水属性と相性が良いため、創造的な提案を受け入れやすい状態です。",
  "advice": "新しいデザインツールの試験導入について話し合うと良いでしょう。データや具体例を示すとさらに効果的です。"
}
```