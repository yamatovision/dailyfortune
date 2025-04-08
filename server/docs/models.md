# DailyFortune モデル定義ドキュメント

このドキュメントは自動生成されています。直接編集しないでください。

生成日時: 2025/4/8 12:28:42

## 目次

- [Alert](#alert)
- [AuditLog](#auditlog)
- [BatchJobLog](#batchjoblog)
- [ChatHistory](#chathistory)
- [Compatibility](#compatibility)
- [DailyFortune](#dailyfortune)
- [DailyFortuneUpdateLog](#dailyfortuneupdatelog)
- [DayPillar](#daypillar)
- [Invoice](#invoice)
- [MemberInsight](#memberinsight)
- [NotificationLog](#notificationlog)
- [Organization](#organization)
- [PricePlan](#priceplan)
- [Subscription](#subscription)
- [SystemSetting](#systemsetting)
- [Team](#team)
- [TeamCompatibilityReport](#teamcompatibilityreport)
- [TeamGoal](#teamgoal)
- [TeamStatistics](#teamstatistics)
- [UsageStatistics](#usagestatistics)
- [User](#user)
- [UserGoal](#usergoal)

## Alert

### 型定義

```typescript
interface IAlert {
teamId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'motivation_low' | 'leave_risk';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### スキーマ定義

```typescript
const alertSchema = new Schema({
{
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: [true, 'チームIDは必須です']
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ユーザーIDは必須です']
    },
    type: {
      type: String,
      enum: {
        values: ['motivation_low', 'leave_risk'],
        message: '{VALUE}は有効なアラートタイプではありません'
      },
      required: [true, 'アラートタイプは必須です']
    },
    severity: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: '{VALUE}は有効な重要度ではありません'
      },
      required: [true, '重要度は必須です']
    },
    description: {
      type: String,
      required: [true, 'アラート説明は必須です']
    },
    suggestion: {
      type: String,
      required: [true, '対応案は必須です']
    },
    isRead: {
      type: Boolean,
      default: false
    }
});
```

### インデックス

- `alertSchema.index({ teamId: 1 });`
- `alertSchema.index({ userId: 1 });`
- `alertSchema.index({ severity: 1 });`
- `alertSchema.index({ isRead: 1 });`
- `alertSchema.index({ createdAt: -1 });`

---

## AuditLog

### 型定義

```typescript
interface IAuditLog {
organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'payment' | 'subscription_change';
  resourceType: 'user' | 'team' | 'subscription' | 'organization' | 'system_setting';
  resourceId?: mongoose.Types.ObjectId;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
```

### スキーマ定義

```typescript
const auditlogSchema = new Schema({
{
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, '組織IDは必須です']
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ユーザーIDは必須です']
    },
    action: {
      type: String,
      enum: {
        values: ['create', 'update', 'delete', 'login', 'logout', 'payment', 'subscription_change'],
        message: '{VALUE}は有効なアクションではありません'
      },
      required: [true, 'アクションは必須です']
    },
    resourceType: {
      type: String,
      enum: {
        values: ['user', 'team', 'subscription', 'organization', 'system_setting'],
        message: '{VALUE}は有効なリソースタイプではありません'
      },
      required: [true, 'リソースタイプは必須です']
    },
    resourceId: {
      type: Schema.Types.ObjectId
    },
    details: {
      type: Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    }
});
```

### インデックス

- `auditLogSchema.index({ organizationId: 1 });`
- `auditLogSchema.index({ userId: 1 });`
- `auditLogSchema.index({ action: 1 });`
- `auditLogSchema.index({ resourceType: 1 });`
- `auditLogSchema.index({ resourceId: 1 });`
- `auditLogSchema.index({ createdAt: -1 });`

---

## BatchJobLog

### 型定義

```typescript
interface IBatchJobLog {
  jobType: 'daily_fortune_update' | 'subscription_check' | 'backup' | 'day-pillar-generator';
  status: 'started' | 'running' | 'completed' | 'completed_with_errors' | 'failed';
  startTime: Date;
  endTime?: Date;
  totalItems: number;
  processedItems: number;
  errorItems: number;
  errorList: IBatchJobError[]; // errors -> errorList に名前変更
  details?: Record<string, any>;
  params?: Record<string, any>; // 追加パラメータ
  scheduledBy?: string; // スケジューラーによる実行かを示す
  result?: Record<string, any>; // 実行結果
  createdAt: Date;
  updatedAt: Date;
}
```

### スキーマ定義

```typescript
const batchjoblogSchema = new Schema({
  jobType: {
    type: String,
    enum: {
      values: ['daily_fortune_update', 'subscription_check', 'backup', 'day-pillar-generator'],
      message: '{VALUE}は有効なジョブタイプではありません'
    },
    required: [true, 'ジョブタイプは必須です']
  },
  status: {
    type: String,
    enum: {
      values: ['started', 'running', 'completed', 'completed_with_errors', 'failed'],
      message: '{VALUE}は有効なステータスではありません'
    },
    required: [true, 'ステータスは必須です']
  },
  params: {
    type: Schema.Types.Mixed,
    default: {}
  },
  scheduledBy: {
    type: String
  },
  result: {
    type: Schema.Types.Mixed
  },
  startTime: {
    type: Date,
    required: [true, '開始時間は必須です'],
    default: Date.now
  },
  endTime: {
    type: Date
  },
  totalItems: {
    type: Number,
    required: [true, '合計アイテム数は必須です'],
    default: 0,
    min: [0, '合計アイテム数は0以上である必要があります']
  },
  processedItems: {
    type: Number,
    required: [true, '処理済みアイテム数は必須です'],
    default: 0,
    min: [0, '処理済みアイテム数は0以上である必要があります']
  },
  errorItems: {
    type: Number,
    required: [true, 'エラーアイテム数は必須です'],
    default: 0,
    min: [0, 'エラーアイテム数は0以上である必要があります']
  },
  errorList: {
    type: [batchJobErrorSchema],
    default: []
  },
  details: {
    type: Schema.Types.Mixed,
    default: {}
  }
});
```

### インデックス

- `batchJobLogSchema.index({ jobType: 1 });`
- `batchJobLogSchema.index({ status: 1 });`
- `batchJobLogSchema.index({ startTime: -1 });`
- `batchJobLogSchema.index({ jobType: 1, startTime: -1 });`

---

## ChatHistory

### 型定義

```typescript
interface IChatHistory {
sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
}
```

### スキーマ定義

```typescript
const chathistorySchema = new Schema({
{
    sender: {
      type: String,
      enum: {
        values: ['user', 'ai'],
        message: '{VALUE}は有効な送信者ではありません'
      },
      required: [true, '送信者は必須です']
    },
    content: {
      type: String,
      required: [true, 'メッセージ内容は必須です']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
});
```

### インデックス

- `chatHistorySchema.index({ userId: 1 });`
- `chatHistorySchema.index({ userId: 1, chatType: 1 });`
- `chatHistorySchema.index({ lastMessageAt: -1 });`
- `chatHistorySchema.index({ tokenCount: 1 });`
- `chatHistorySchema.index({ 'relatedInfo.teamMemberId': 1 });`
- `chatHistorySchema.index({ 'relatedInfo.teamGoalId': 1 });`

---

## Compatibility

### 型定義

```typescript
interface ICompatibility {
  user1Id: mongoose.Types.ObjectId;
  user2Id: mongoose.Types.ObjectId;
  compatibilityScore: number;
  relationship: 'mutual_generation' | 'mutual_restriction' | 'neutral';
  relationshipType?: '相生' | '相克' | '中和';
  user1Element: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
  user2Element: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
  detailDescription: string;
  teamInsight?: string;
  collaborationTips?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### スキーマ定義

```typescript
const compatibilitySchema = new Schema({
{
    user1Id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ユーザー1IDは必須です']
    },
    user2Id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ユーザー2IDは必須です']
    },
    compatibilityScore: {
      type: Number,
      required: [true, '相性スコアは必須です'],
      min: [0, '相性スコアは0以上である必要があります'],
      max: [100, '相性スコアは100以下である必要があります']
    },
    relationship: {
      type: String,
      enum: {
        values: ['mutual_generation', 'mutual_restriction', 'neutral'],
        message: '{VALUE}は有効な関係タイプではありません'
      },
      required: [true, '関係タイプは必須です']
    },
    relationshipType: {
      type: String,
      enum: {
        values: ['相生', '相克', '中和'],
        message: '{VALUE}は有効な関係タイプではありません'
      }
    },
    user1Element: {
      type: String,
      enum: {
        values: ['wood', 'fire', 'earth', 'metal', 'water'],
        message: '{VALUE}は有効な五行属性ではありません'
      },
      required: [true, 'ユーザー1の五行属性は必須です']
    },
    user2Element: {
      type: String,
      enum: {
        values: ['wood', 'fire', 'earth', 'metal', 'water'],
        message: '{VALUE}は有効な五行属性ではありません'
      },
      required: [true, 'ユーザー2の五行属性は必須です']
    },
    detailDescription: {
      type: String,
      required: [true, '相性の詳細説明は必須です']
    },
    teamInsight: {
      type: String,
      trim: true
    },
    collaborationTips: {
      type: String,
      trim: true
    }
});
```

### インデックス

- `compatibilitySchema.index({ user1Id: 1, user2Id: 1 }, { unique: true });`
- `compatibilitySchema.index({ user1Id: 1 });`
- `compatibilitySchema.index({ user2Id: 1 });`
- `compatibilitySchema.index({ compatibilityScore: -1 });`

---

## DailyFortune

### 型定義

```typescript
interface IDailyFortune {
  userId: mongoose.Types.ObjectId;
  date: Date;
  dayPillarId: mongoose.Types.ObjectId;
  fortuneScore: number;
  advice: string;
  luckyItems: {
    color: string;
    item: string;
    drink: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### スキーマ定義

```typescript
const dailyfortuneSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ユーザーIDは必須です']
  },
  date: {
    type: Date,
    required: [true, '日付は必須です']
  },
  dayPillarId: {
    type: Schema.Types.ObjectId,
    ref: 'DayPillar',
    required: [true, '日柱IDは必須です']
  },
  fortuneScore: {
    type: Number,
    required: [true, '運勢スコアは必須です'],
    min: [0, '運勢スコアは0以上である必要があります'],
    max: [100, '運勢スコアは100以下である必要があります']
  },
  advice: {
    type: String,
    required: [true, 'アドバイスは必須です']
  },
  luckyItems: {
    color: {
      type: String,
      required: [true, 'ラッキーカラーは必須です'],
      trim: true
    },
    item: {
      type: String,
      required: [true, 'ラッキーアイテムは必須です'],
      trim: true
    },
    drink: {
      type: String,
      required: [true, 'ラッキードリンクは必須です'],
      trim: true
    }
  }
});
```

### インデックス

- `dailyFortuneSchema.index({ userId: 1, date: 1 }, { unique: true });`
- `dailyFortuneSchema.index({ date: 1 });`
- `dailyFortuneSchema.index({ fortuneScore: -1 });`

---

## DailyFortuneUpdateLog

### 型定義

```typescript
interface IDailyFortuneUpdateLog {
  date: Date;  // 更新実行日
  status: 'scheduled' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  totalUsers: number;  // 更新対象ユーザー数
  successCount: number;  // 成功数
  failedCount: number;  // 失敗数
  isAutomaticRetry: boolean;  // 自動リトライかどうか
  retryCount?: number;  // リトライ回数
  lastRetryAt?: Date;  // 最終リトライ日時
  createdBy: mongoose.Types.ObjectId;  // 作成者（自動実行の場合はシステム管理者ID）
  updateErrors?: IUpdateError[];  // エラー情報 (errors名を変更)
}
```

### スキーマ定義

```typescript
const dailyfortuneupdatelogSchema = new Schema({
  date: {
    type: Date,
    required: [true, '更新実行日は必須です'],
    index: true
  },
  status: {
    type: String,
    enum: {
      values: ['scheduled', 'running', 'completed', 'failed'],
      message: '{VALUE} は有効なステータスではありません'
    },
    required: [true, 'ステータスは必須です'],
    index: true
  },
  startTime: {
    type: Date,
    required: [true, '開始時間は必須です']
  },
  endTime: {
    type: Date
  },
  totalUsers: {
    type: Number,
    required: [true, '対象ユーザー数は必須です'],
    min: [0, '対象ユーザー数は0以上である必要があります']
  },
  successCount: {
    type: Number,
    required: [true, '成功数は必須です'],
    default: 0,
    min: [0, '成功数は0以上である必要があります']
  },
  failedCount: {
    type: Number,
    required: [true, '失敗数は必須です'],
    default: 0,
    min: [0, '失敗数は0以上である必要があります']
  },
  updateErrors: [
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      message: {
        type: String,
        required: [true, 'エラーメッセージは必須です']
      },
      stack: String
    }
  ],
  isAutomaticRetry: {
    type: Boolean,
    required: [true, '自動リトライフラグは必須です'],
    default: false
  },
  retryCount: {
    type: Number,
    default: 0,
    min: [0, 'リトライ回数は0以上である必要があります']
  },
  lastRetryAt: {
    type: Date
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '作成者は必須です']
  }
});
```

### インデックス

- `dailyFortuneUpdateLogSchema.index({ date: 1 });`
- `dailyFortuneUpdateLogSchema.index({ status: 1 });`
- `dailyFortuneUpdateLogSchema.index({ isAutomaticRetry: 1, status: 1 });`

---

## DayPillar

### 型定義

```typescript
interface IDayPillar {
date: Date;
  heavenlyStem: string;
  earthlyBranch: string;
  hiddenStems: string[];
  energyDescription: string;
  createdAt: Date;
}
```

### スキーマ定義

```typescript
const daypillarSchema = new Schema({
{
    date: {
      type: Date,
      required: [true, '日付は必須です'],
      unique: true
    },
    heavenlyStem: {
      type: String,
      required: [true, '天干は必須です'],
      trim: true
    },
    earthlyBranch: {
      type: String,
      required: [true, '地支は必須です'],
      trim: true
    },
    hiddenStems: {
      type: [String],
      default: []
    },
    energyDescription: {
      type: String,
      required: [true, 'エネルギーの説明は必須です']
    }
});
```

### インデックス

- `dayPillarSchema.index({ date: 1 }, { unique: true });`
- `dayPillarSchema.index({ heavenlyStem: 1, earthlyBranch: 1 });`

---

## Invoice

### 型定義

```typescript
interface IInvoice {
description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}
```

### スキーマ定義

```typescript
const invoiceSchema = new Schema({
{
    description: {
      type: String,
      required: [true, '説明は必須です'],
      trim: true
    },
    quantity: {
      type: Number,
      required: [true, '数量は必須です'],
      min: [1, '数量は1以上である必要があります']
    },
    unitPrice: {
      type: Number,
      required: [true, '単価は必須です'],
      min: [0, '単価は0以上である必要があります']
    },
    amount: {
      type: Number,
      required: [true, '金額は必須です'],
      min: [0, '金額は0以上である必要があります']
    }
});
```

### インデックス

- `invoiceSchema.index({ organizationId: 1 });`
- `invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });`
- `invoiceSchema.index({ status: 1 });`
- `invoiceSchema.index({ dueDate: 1 });`
- `invoiceSchema.index({ billingPeriodStart: 1, billingPeriodEnd: 1 });`

---

## NotificationLog

### 型定義

```typescript
interface INotificationLog {
organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'payment_failed' | 'subscription_expiring' | 'system_alert';
  channel: 'email' | 'in_app';
  status: 'pending' | 'sent' | 'failed' | 'read';
  subject: string;
  content: string;
  metadata?: Record<string, any>;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### スキーマ定義

```typescript
const notificationlogSchema = new Schema({
{
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, '組織IDは必須です']
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ユーザーIDは必須です']
    },
    type: {
      type: String,
      enum: {
        values: ['payment_failed', 'subscription_expiring', 'system_alert'],
        message: '{VALUE}は有効な通知タイプではありません'
      },
      required: [true, '通知タイプは必須です']
    },
    channel: {
      type: String,
      enum: {
        values: ['email', 'in_app'],
        message: '{VALUE}は有効な通知チャネルではありません'
      },
      required: [true, '通知チャネルは必須です']
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'sent', 'failed', 'read'],
        message: '{VALUE}は有効な通知ステータスではありません'
      },
      required: [true, '通知ステータスは必須です'],
      default: 'pending'
    },
    subject: {
      type: String,
      required: [true, '件名は必須です'],
      trim: true
    },
    content: {
      type: String,
      required: [true, '内容は必須です']
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    sentAt: {
      type: Date
    },
    readAt: {
      type: Date
    }
});
```

### インデックス

- `notificationLogSchema.index({ organizationId: 1 });`
- `notificationLogSchema.index({ userId: 1 });`
- `notificationLogSchema.index({ type: 1 });`
- `notificationLogSchema.index({ status: 1 });`
- `notificationLogSchema.index({ createdAt: -1 });`
- `notificationLogSchema.index({ userId: 1, status: 1 });`

---

## Organization

### 型定義

```typescript
interface IOrganization {
name: string;
  superAdminId: mongoose.Types.ObjectId;
  subscriptionPlan: {
    type: 'none' | 'active' | 'trial' | 'cancelled';
    isActive: boolean;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
}
```

### スキーマ定義

```typescript
const organizationSchema = new Schema({
{
    name: {
      type: String,
      required: [true, '組織名は必須です'],
      trim: true,
      minlength: [2, '組織名は2文字以上である必要があります'],
      maxlength: [100, '組織名は100文字以下である必要があります']
    },
    superAdminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'スーパー管理者IDは必須です']
    },
    subscriptionPlan: {
      type: {
        type: String,
        enum: {
          values: ['none', 'active', 'trial', 'cancelled'],
          message: '{VALUE}は有効なサブスクリプションタイプではありません'
        },
        default: 'none'
      },
      isActive: {
        type: Boolean,
        default: false
      },
      currentPeriodStart: {
        type: Date,
        default: Date.now
      },
      currentPeriodEnd: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30日後
      }
    },
    billingInfo: {
      companyName: {
        type: String,
        trim: true
      },
      contactName: {
        type: String,
        required: [true, '請求先担当者名は必須です'],
        trim: true
      },
      contactEmail: {
        type: String,
        required: [true, '請求先メールアドレスは必須です'],
        trim: true,
        lowercase: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          '有効なメールアドレスを入力してください'
        ]
      },
      address: {
        type: String,
        trim: true
      },
      postalCode: {
        type: String,
        trim: true
      },
      country: {
        type: String,
        trim: true,
        default: 'Japan'
      },
      taxId: {
        type: String,
        trim: true
      },
      paymentMethodId: {
        type: String,
        trim: true
      }
    }
});
```

### インデックス

- `organizationSchema.index({ superAdminId: 1 });`
- `organizationSchema.index({ 'subscriptionPlan.isActive': 1 });`

---

## PricePlan

### 型定義

```typescript
interface IPricePlan {
name: string;
  code: 'elite' | 'lite';
  price: number;
  userType: 'Admin' | 'User';
  features: {
    aiModel: 'sonnet' | 'haiku';
    allowTeamCreation: boolean;
    maxChatsPerDay?: number;
}
```

### スキーマ定義

```typescript
const priceplanSchema = new Schema({
{
    name: {
      type: String,
      required: [true, 'プラン名は必須です'],
      trim: true
    },
    code: {
      type: String,
      enum: {
        values: ['elite', 'lite'],
        message: '{VALUE}は有効なプランコードではありません'
      },
      required: [true, 'プランコードは必須です'],
      unique: true
    },
    price: {
      type: Number,
      required: [true, '価格は必須です'],
      min: [0, '価格は0以上である必要があります']
    },
    userType: {
      type: String,
      enum: {
        values: ['Admin', 'User'],
        message: '{VALUE}は有効なユーザータイプではありません'
      },
      required: [true, 'ユーザータイプは必須です']
    },
    features: {
      aiModel: {
        type: String,
        enum: {
          values: ['sonnet', 'haiku'],
          message: '{VALUE}は有効なAIモデルではありません'
        },
        required: [true, 'AIモデルは必須です']
      },
      allowTeamCreation: {
        type: Boolean,
        required: [true, 'チーム作成権限は必須です']
      },
      maxChatsPerDay: {
        type: Number,
        min: [0, '1日あたりの最大チャット数は0以上である必要があります']
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
});
```

### インデックス

- `pricePlanSchema.index({ code: 1 }, { unique: true });`
- `pricePlanSchema.index({ isActive: 1 });`
- `pricePlanSchema.index({ userType: 1 });`

---


## Subscription

### 型定義

```typescript
interface ISubscription {
organizationId: mongoose.Types.ObjectId;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  priceId: string;
  quantity: number;
  totalAmount: number;
  currency: string;
  paymentMethodId?: string;
  adminCount: number;
  userCount: number;
  lastInvoiceId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### スキーマ定義

```typescript
const subscriptionSchema = new Schema({
{
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, '組織IDは必須です'],
      unique: true
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'trialing', 'past_due', 'canceled', 'incomplete'],
        message: '{VALUE}は有効なサブスクリプションステータスではありません'
      },
      required: [true, 'ステータスは必須です'],
      default: 'incomplete'
    },
    currentPeriodStart: {
      type: Date,
      required: [true, '期間開始日は必須です'],
      default: Date.now
    },
    currentPeriodEnd: {
      type: Date,
      required: [true, '期間終了日は必須です'],
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30日後
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    },
    priceId: {
      type: String,
      required: [true, '料金プランIDは必須です']
    },
    quantity: {
      type: Number,
      required: [true, 'ユーザー数は必須です'],
      min: [1, 'ユーザー数は1以上である必要があります']
    },
    totalAmount: {
      type: Number,
      required: [true, '合計金額は必須です'],
      min: [0, '合計金額は0以上である必要があります']
    },
    currency: {
      type: String,
      required: [true, '通貨は必須です'],
      default: 'JPY'
    },
    paymentMethodId: {
      type: String
    },
    adminCount: {
      type: Number,
      required: [true, '管理者数は必須です'],
      min: [0, '管理者数は0以上である必要があります'],
      default: 0
    },
    userCount: {
      type: Number,
      required: [true, 'ユーザー数は必須です'],
      min: [0, 'ユーザー数は0以上である必要があります'],
      default: 0
    },
    lastInvoiceId: {
      type: String
    }
});
```

### インデックス

- `subscriptionSchema.index({ organizationId: 1 }, { unique: true });`
- `subscriptionSchema.index({ status: 1 });`
- `subscriptionSchema.index({ currentPeriodEnd: 1 });`

---

## SystemSetting

### 型定義

```typescript
interface ISystemSetting {
organizationId?: mongoose.Types.ObjectId;
  key: string;
  value: string;
  description: string;
  updatedAt: Date;
  updatedBy: mongoose.Types.ObjectId;
}
```

### スキーマ定義

```typescript
const systemsettingSchema = new Schema({
{
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization'
    },
    key: {
      type: String,
      required: [true, '設定キーは必須です'],
      trim: true
    },
    value: {
      type: String,
      required: [true, '設定値は必須です']
    },
    description: {
      type: String,
      required: [true, '説明は必須です']
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '更新者IDは必須です']
    }
});
```

### インデックス

- `systemSettingSchema.index({ key: 1, organizationId: 1 }, { unique: true });`
- `systemSettingSchema.index({ organizationId: 1 });`

---

## Team

### 型定義

```typescript
interface ITeam {
  name: string;
  adminId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  description?: string;
  iconInitial?: string;
  iconColor?: 'primary' | 'water' | 'wood' | 'fire' | 'earth' | 'metal';
  createdAt: Date;
  updatedAt: Date;
}
```

### スキーマ定義

```typescript
const teamSchema = new Schema({
{
    name: {
      type: String,
      required: [true, 'チーム名は必須です'],
      trim: true,
      minlength: [2, 'チーム名は2文字以上である必要があります'],
      maxlength: [50, 'チーム名は50文字以下である必要があります']
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '管理者IDは必須です']
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, '組織IDは必須です']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'チームの説明は500文字以下である必要があります']
    },
    iconInitial: {
      type: String,
      maxlength: [2, 'アイコン文字は2文字以下である必要があります'],
      default: function() {
        return this.name ? this.name.charAt(0) : '';
      }
    },
    iconColor: {
      type: String,
      enum: {
        values: ['primary', 'water', 'wood', 'fire', 'earth', 'metal'],
        message: '{VALUE}は有効なアイコンカラーではありません'
      },
      default: 'primary'
    }
});
```

### インデックス

- `teamSchema.index({ organizationId: 1 });`
- `teamSchema.index({ adminId: 1 });`
- `teamSchema.index({ name: 1, organizationId: 1 }, { unique: true });`

---

## TeamGoal

### 型定義

```typescript
interface ITeamGoal {
  teamId: mongoose.Types.ObjectId;
  content: string;
  deadline?: Date;
  status?: 'not_started' | 'in_progress' | 'at_risk' | 'completed';
  progress?: number;
  collaborators?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
```

### スキーマ定義

```typescript
const teamgoalSchema = new Schema({
{
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: [true, 'チームIDは必須です']
    },
    content: {
      type: String,
      required: [true, '目標内容は必須です'],
      trim: true,
      minlength: [5, '目標内容は5文字以上である必要があります'],
      maxlength: [500, '目標内容は500文字以下である必要があります']
    },
    deadline: {
      type: Date
    },
    status: {
      type: String,
      enum: {
        values: ['not_started', 'in_progress', 'at_risk', 'completed'],
        message: '{VALUE}は有効な目標状態ではありません'
      },
      default: 'not_started'
    },
    progress: {
      type: Number,
      min: [0, '進捗は0%以上である必要があります'],
      max: [100, '進捗は100%以下である必要があります'],
      default: 0
    },
    collaborators: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
});
```

### インデックス

- `teamGoalSchema.index({ teamId: 1 });`
- `teamGoalSchema.index({ deadline: 1 });`
- `teamGoalSchema.index({ status: 1 });`

---

## UsageStatistics

### 型定義

```typescript
interface IUsageStatistics {
organizationId: mongoose.Types.ObjectId;
  type: 'user' | 'ai';
  date: Date;
  metrics: {
    totalUsers?: number;
    activeUsers?: number;
    newUsers?: number;
    aiRequests?: number;
    averageResponseTime?: number;
    haikusUsed?: number;
    sonnetsUsed?: number;
}
```

### スキーマ定義

```typescript
const usagestatisticsSchema = new Schema({
{
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, '組織IDは必須です']
    },
    type: {
      type: String,
      enum: {
        values: ['user', 'ai'],
        message: '{VALUE}は有効な統計タイプではありません'
      },
      required: [true, '統計タイプは必須です']
    },
    date: {
      type: Date,
      required: [true, '日付は必須です']
    },
    metrics: {
      totalUsers: Number,
      activeUsers: Number,
      newUsers: Number,
      aiRequests: Number,
      averageResponseTime: Number,
      haikusUsed: Number,
      sonnetsUsed: Number
    }
});
```

### インデックス

- `usageStatisticsSchema.index({ organizationId: 1, date: 1 });`
- `usageStatisticsSchema.index({ organizationId: 1, type: 1 });`
- `usageStatisticsSchema.index({ date: 1 });`

---

## User

> 注意: 以前の SajuProfile モデルは User モデルに完全に統合されました。四柱推命プロフィール関連のすべてのデータは、現在 User モデル内に直接保存されています。SajuProfile は別のモデルとしては存在しなくなりました。(2025/04/08)

### 型定義

```typescript
interface IUser {
  email: string;
  password: string;
  displayName: string;
  role: 'SuperAdmin' | 'Admin' | 'User';
  organizationId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  jobTitle?: string;
  teamRole?: string;            // チーム内での役割（デザイナー、エンジニアなど）
  motivation?: number;          // モチベーションスコア（0-100）
  leaveRisk?: 'none' | 'low' | 'medium' | 'high';  // 離職リスク
  
  // 基本的な誕生情報
  birthDate?: Date;                 // 生年月日
  birthTime?: string;               // 出生時間（HH:MM形式）
  birthPlace?: string;              // 出生地
  gender?: 'M' | 'F';               // 性別
  birthplaceCoordinates?: {         // 出生地の座標
    longitude: number;
    latitude: number;
  };
  localTimeOffset?: number;         // 地方時オフセット（分単位）
  
  // 個人目標
  goal?: string;                    // ユーザーの設定した目標
  
  // 四柱推命情報
  elementAttribute?: 'wood' | 'fire' | 'earth' | 'metal' | 'water';  // 五行属性
  dayMaster?: string;               // 日主
  fourPillars?: {                   // 四柱（年月日時）
    year: {
      heavenlyStem: string;         // 天干
      earthlyBranch: string;        // 地支
      heavenlyStemTenGod?: string;  // 天干十神
      earthlyBranchTenGod?: string; // 地支十神
      hiddenStems?: string[];       // 隠れ干
    };
    month: {
      heavenlyStem: string;
      earthlyBranch: string;
      heavenlyStemTenGod?: string;
      earthlyBranchTenGod?: string;
      hiddenStems?: string[];
    };
    day: {
      heavenlyStem: string;
      earthlyBranch: string;
      heavenlyStemTenGod?: string;
      earthlyBranchTenGod?: string;
      hiddenStems?: string[];
    };
    hour: {
      heavenlyStem: string;
      earthlyBranch: string;
      heavenlyStemTenGod?: string;
      earthlyBranchTenGod?: string;
      hiddenStems?: string[];
    };
  };
  elementProfile?: {               // 五行バランス
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  personalityDescription?: string;  // 性格特性の説明
  careerAptitude?: string;          // 職業適性の説明
  
  sajuProfileId?: mongoose.Types.ObjectId;  // レガシー参照（後で削除予定）
  plan: 'elite' | 'lite';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### スキーマ定義

```typescript
const userSchema = new Schema({
  _id: {
    type: Schema.Types.Mixed, // FirebaseのUIDを格納できるように変更
    required: true
  },
  email: {
    type: String,
    required: [true, 'メールアドレスは必須です'],
    unique: true,
    index: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      '有効なメールアドレスを入力してください'
    ]
  },
  password: {
    type: String,
    required: [true, 'パスワードは必須です'],
    minlength: [8, 'パスワードは8文字以上である必要があります'],
    select: false // デフォルトではパスワードを取得しない
  },
  displayName: {
    type: String,
    required: [true, '表示名は必須です'],
    trim: true,
    minlength: [2, '表示名は2文字以上である必要があります'],
    maxlength: [50, '表示名は50文字以下である必要があります']
  },
  role: {
    type: String,
    enum: {
      values: ['SuperAdmin', 'Admin', 'User'],
      message: '{VALUE}は有効な権限ではありません'
    },
    required: [true, '権限は必須です'],
    default: 'User',
    index: true
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    // 必須ではなくする
    index: true
  },
  teamId: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    // 必須ではなくする
    index: true
  },
  jobTitle: {
    type: String,
    trim: true
  },
  teamRole: {
    type: String,
    trim: true,
    maxlength: [50, 'チーム内の役割は50文字以下である必要があります']
  },
  motivation: {
    type: Number,
    min: [0, 'モチベーションは0%以上である必要があります'],
    max: [100, 'モチベーションは100%以下である必要があります'],
    default: 100
  },
  leaveRisk: {
    type: String,
    enum: {
      values: ['none', 'low', 'medium', 'high'],
      message: '{VALUE}は有効な離職リスクレベルではありません'
    },
    default: 'none'
  },
  
  // 個人目標
  goal: {
    type: String,
    trim: true,
    maxlength: [1000, '目標は1000文字以下である必要があります']
  },
  
  // 基本的な誕生情報
  birthDate: {
    type: Date
  },
  birthTime: {
    type: String,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, '時間はHH:MM形式で入力してください']
  },
  birthPlace: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: {
      values: ['M', 'F'],
      message: '{VALUE}は有効な性別ではありません'
    }
  },
  birthplaceCoordinates: {
    longitude: {
      type: Number,
      min: [-180, '経度は-180度以上である必要があります'],
      max: [180, '経度は180度以下である必要があります']
    },
    latitude: {
      type: Number,
      min: [-90, '緯度は-90度以上である必要があります'],
      max: [90, '緯度は90度以下である必要があります']
    }
  },
  localTimeOffset: {
    type: Number,
    description: '地方時オフセット（分単位）'
  },
  
  // 四柱推命情報
  elementAttribute: {
    type: String,
    enum: {
      values: ['wood', 'fire', 'earth', 'metal', 'water'],
      message: '{VALUE}は有効な五行属性ではありません'
    }
  },
  dayMaster: {
    type: String
  },
  fourPillars: {
    year: {
      heavenlyStem: String,
      earthlyBranch: String,
      heavenlyStemTenGod: String,
      earthlyBranchTenGod: String,
      hiddenStems: [String]
    },
    month: {
      heavenlyStem: String,
      earthlyBranch: String,
      heavenlyStemTenGod: String,
      earthlyBranchTenGod: String,
      hiddenStems: [String]
    },
    day: {
      heavenlyStem: String,
      earthlyBranch: String,
      heavenlyStemTenGod: String,
      earthlyBranchTenGod: String,
      hiddenStems: [String]
    },
    hour: {
      heavenlyStem: String,
      earthlyBranch: String,
      heavenlyStemTenGod: String,
      earthlyBranchTenGod: String,
      hiddenStems: [String]
    }
  },
  elementProfile: {
    wood: Number,
    fire: Number,
    earth: Number,
    metal: Number,
    water: Number
  },
  personalityDescription: {
    type: String
  },
  careerAptitude: {
    type: String
  },
  teamRole: {
    type: String,
    trim: true,
    maxlength: [50, 'チーム内の役割は50文字以下である必要があります']
  },
  motivation: {
    type: Number,
    min: [0, 'モチベーションは0%以上である必要があります'],
    max: [100, 'モチベーションは100%以下である必要があります'],
    default: 100
  },
  leaveRisk: {
    type: String,
    enum: {
      values: ['none', 'low', 'medium', 'high'],
      message: '{VALUE}は有効な離職リスクレベルではありません'
    },
    default: 'none'
  },
  
  // 個人目標
  goal: {
    type: String,
    trim: true,
    maxlength: [1000, '目標は1000文字以下である必要があります']
  },
  
  // 基本的な誕生情報
  birthDate: {
    type: Date
  },
  birthTime: {
    type: String,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, '時間はHH:MM形式で入力してください']
  },
  birthPlace: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: {
      values: ['M', 'F'],
      message: '{VALUE}は有効な性別ではありません'
    }
  },
  birthplaceCoordinates: {
    longitude: {
      type: Number,
      min: [-180, '経度は-180度以上である必要があります'],
      max: [180, '経度は180度以下である必要があります']
    },
    latitude: {
      type: Number,
      min: [-90, '緯度は-90度以上である必要があります'],
      max: [90, '緯度は90度以下である必要があります']
    }
  },
  localTimeOffset: {
    type: Number,
    description: '地方時オフセット（分単位）'
  },
  
  // 四柱推命情報
  elementAttribute: {
    type: String,
    enum: {
      values: ['wood', 'fire', 'earth', 'metal', 'water'],
      message: '{VALUE}は有効な五行属性ではありません'
    }
  },
  dayMaster: {
    type: String
  },
  fourPillars: {
    year: {
      heavenlyStem: String,
      earthlyBranch: String,
      heavenlyStemTenGod: String,
      earthlyBranchTenGod: String,
      hiddenStems: [String]
    },
    month: {
      heavenlyStem: String,
      earthlyBranch: String,
      heavenlyStemTenGod: String,
      earthlyBranchTenGod: String,
      hiddenStems: [String]
    },
    day: {
      heavenlyStem: String,
      earthlyBranch: String,
      heavenlyStemTenGod: String,
      earthlyBranchTenGod: String,
      hiddenStems: [String]
    },
    hour: {
      heavenlyStem: String,
      earthlyBranch: String,
      heavenlyStemTenGod: String,
      earthlyBranchTenGod: String,
      hiddenStems: [String]
    }
  },
  elementProfile: {
    wood: Number,
    fire: Number,
    earth: Number,
    metal: Number,
    water: Number
  },
  personalityDescription: {
    type: String
  },
  careerAptitude: {
    type: String
  },
  
  // レガシーフィールド（後で削除予定）
  sajuProfileId: {
    type: Schema.Types.ObjectId,
    ref: 'SajuProfile'
  },
  plan: {
    type: String,
    enum: {
      values: ['elite', 'lite'],
      message: '{VALUE}は有効なプランではありません'
    },
    required: [true, 'プランは必須です'],
    default: 'lite'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
});
```

### インデックス

- `userSchema.index({ email: 1 }, { unique: true });`
- `userSchema.index({ teamId: 1 });`
- `userSchema.index({ role: 1 });`
- `userSchema.index({ organizationId: 1 });`
- `userSchema.index({ organizationId: 1, role: 1 });`
- `userSchema.index({ organizationId: 1, plan: 1 });`
- `userSchema.index({ isActive: 1 });`
- `userSchema.index({ teamRole: 1 });`
- `userSchema.index({ motivation: 1 });`
- `userSchema.index({ leaveRisk: 1 });`

### メソッドとフック

- `userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);`

---

## TeamCompatibilityReport

### 型定義

```typescript
interface ITeamCompatibilityReport {
  teamId: mongoose.Types.ObjectId;
  date: Date;
  strengths: string;
  challenges: string;
  advice: string;
  dominantElements: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### スキーマ定義

```typescript
const teamCompatibilityReportSchema = new Schema({
  teamId: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: [true, 'チームIDは必須です']
  },
  date: {
    type: Date,
    required: [true, '日付は必須です'],
    default: Date.now
  },
  strengths: {
    type: String,
    required: [true, 'チームの強みは必須です']
  },
  challenges: {
    type: String,
    required: [true, 'チームの課題は必須です']
  },
  advice: {
    type: String,
    required: [true, 'チームへのアドバイスは必須です']
  },
  dominantElements: {
    wood: {
      type: Number,
      default: 0
    },
    fire: {
      type: Number,
      default: 0
    },
    earth: {
      type: Number,
      default: 0
    },
    metal: {
      type: Number,
      default: 0
    },
    water: {
      type: Number,
      default: 0
    }
  }
}, { timestamps: true });
```

### インデックス

- `teamCompatibilityReportSchema.index({ teamId: 1, date: 1 });`

---

## TeamStatistics

### 型定義

```typescript
interface ITeamStatistics {
  teamId: mongoose.Types.ObjectId;
  date: Date;
  memberCount: number;
  averageMotivation: number;
  alertCount: number;
  leaveRiskCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### スキーマ定義

```typescript
const teamStatisticsSchema = new Schema({
  teamId: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: [true, 'チームIDは必須です']
  },
  date: {
    type: Date,
    required: [true, '日付は必須です'],
    default: Date.now
  },
  memberCount: {
    type: Number,
    required: [true, 'メンバー数は必須です'],
    min: [0, 'メンバー数は0以上である必要があります'],
    default: 0
  },
  averageMotivation: {
    type: Number,
    required: [true, '平均モチベーションは必須です'],
    min: [0, '平均モチベーションは0以上である必要があります'],
    max: [100, '平均モチベーションは100以下である必要があります'],
    default: 0
  },
  alertCount: {
    type: Number,
    required: [true, 'アラート数は必須です'],
    min: [0, 'アラート数は0以上である必要があります'],
    default: 0
  },
  leaveRiskCount: {
    type: Number,
    required: [true, '離職リスク数は必須です'],
    min: [0, '離職リスク数は0以上である必要があります'],
    default: 0
  }
}, { timestamps: true });
```

### インデックス

- `teamStatisticsSchema.index({ teamId: 1, date: 1 });`
- `teamStatisticsSchema.index({ date: -1 });`

---

## MemberInsight

### 型定義

```typescript
interface IMemberInsight {
  userId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  date: Date;
  aiAnalysis: string;
  dailyAdvice: string;
  interestTags: string[];
  concernTags: string[];
  dayElementStrength: 'water' | 'wood' | 'fire' | 'earth' | 'metal';
  createdAt: Date;
  updatedAt: Date;
}
```

### スキーマ定義

```typescript
const memberInsightSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ユーザーIDは必須です']
  },
  teamId: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: [true, 'チームIDは必須です']
  },
  date: {
    type: Date,
    required: [true, '日付は必須です'],
    default: Date.now
  },
  aiAnalysis: {
    type: String,
    required: [true, 'AI分析内容は必須です']
  },
  dailyAdvice: {
    type: String,
    required: [true, '日々のアドバイスは必須です']
  },
  interestTags: [{
    type: String,
    trim: true
  }],
  concernTags: [{
    type: String,
    trim: true
  }],
  dayElementStrength: {
    type: String,
    enum: {
      values: ['water', 'wood', 'fire', 'earth', 'metal'],
      message: '{VALUE}は有効な五行属性ではありません'
    }
  }
}, { timestamps: true });
```

### インデックス

- `memberInsightSchema.index({ userId: 1, date: 1 });`
- `memberInsightSchema.index({ teamId: 1, date: 1 });`
- `memberInsightSchema.index({ date: -1 });`

---

## UserGoal

### 型定義

```typescript
interface IUserGoal {
  userId: mongoose.Types.ObjectId;
  type: 'career' | 'team' | 'personal';
  content: string;
  deadline: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### スキーマ定義

```typescript
const usergoalSchema = new Schema({
{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ユーザーIDは必須です']
    },
    type: {
      type: String,
      enum: {
        values: ['career', 'team', 'personal'],
        message: '{VALUE}は有効な目標タイプではありません'
      },
      required: [true, '目標タイプは必須です']
    },
    content: {
      type: String,
      required: [true, '目標内容は必須です'],
      trim: true,
      minlength: [5, '目標内容は5文字以上である必要があります'],
      maxlength: [500, '目標内容は500文字以下である必要があります']
    },
    deadline: {
      type: Date,
      required: [true, '目標期限は必須です']
    }
});
```

### インデックス

- `userGoalSchema.index({ userId: 1 });`
- `userGoalSchema.index({ userId: 1, type: 1 });`
- `userGoalSchema.index({ deadline: 1 });`

---