import mongoose, { Document, Schema } from 'mongoose';

/**
 * チームコンテキスト運勢モデルのインターフェース
 */
export interface ITeamContextFortune {
  userId: mongoose.Types.ObjectId;  // ユーザーID
  teamId: mongoose.Types.ObjectId;  // チームID
  date: Date;                                // 日付
  dayPillarId: mongoose.Types.ObjectId;      // 日柱ID
  teamGoalId?: mongoose.Types.ObjectId;      // チーム目標ID（オプション）
  fortuneScore: number;                      // 運勢スコア
  teamContextAdvice: string;                 // チームコンテキスト特化アドバイス
  collaborationTips: string[];               // チーム協力のためのヒント
  createdAt: Date;                           // 作成日時
  updatedAt: Date;                           // 更新日時
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface ITeamContextFortuneDocument extends ITeamContextFortune, Document {}

/**
 * チームコンテキスト運勢スキーマ定義
 */
const teamContextFortuneSchema = new Schema<ITeamContextFortuneDocument>(
  {
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
      required: [true, '日付は必須です']
    },
    dayPillarId: {
      type: Schema.Types.ObjectId,
      ref: 'DayPillar',
      required: [true, '日柱IDは必須です']
    },
    teamGoalId: {
      type: Schema.Types.ObjectId,
      ref: 'TeamGoal'
    },
    fortuneScore: {
      type: Number,
      required: [true, '運勢スコアは必須です'],
      min: [0, '運勢スコアは0以上である必要があります'],
      max: [100, '運勢スコアは100以下である必要があります']
    },
    teamContextAdvice: {
      type: String,
      required: [true, 'チームコンテキストアドバイスは必須です']
    },
    collaborationTips: {
      type: [String],
      required: [true, 'チーム協力のヒントは必須です'],
      validate: {
        validator: function(v: string[]) {
          return Array.isArray(v) && v.length > 0;
        },
        message: '少なくとも1つのチーム協力ヒントが必要です'
      }
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// インデックスの設定
// ユニーク制約 - 同じユーザーの同じチーム・同じ日付での重複を防止
teamContextFortuneSchema.index({ userId: 1, teamId: 1, date: 1 }, { unique: true });
teamContextFortuneSchema.index({ teamId: 1, date: 1 });  // チーム単位での検索最適化
teamContextFortuneSchema.index({ date: 1 });             // 日付単位での検索最適化
teamContextFortuneSchema.index({ fortuneScore: -1 });    // スコア降順での検索最適化

/**
 * チームコンテキスト運勢モデル
 */
export const TeamContextFortune = mongoose.model<ITeamContextFortuneDocument>('TeamContextFortune', teamContextFortuneSchema);