import mongoose, { Document, Schema } from 'mongoose';

/**
 * デイリー運勢モデルのインターフェース
 */
export interface IDailyFortune {
  userId: mongoose.Types.ObjectId | string;  // MongoDB ObjectIDまたは文字列を許容
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

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface IDailyFortuneDocument extends IDailyFortune, Document {}

/**
 * デイリー運勢スキーマ定義
 */
const dailyFortuneSchema = new Schema<IDailyFortuneDocument>(
  {
    userId: {
      type: Schema.Types.Mixed,  // ObjectIDまたは文字列を許容
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
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// インデックスの設定
dailyFortuneSchema.index({ userId: 1, date: 1 }, { unique: true });
dailyFortuneSchema.index({ date: 1 });
dailyFortuneSchema.index({ fortuneScore: -1 });

/**
 * デイリー運勢モデル
 */
export const DailyFortune = mongoose.model<IDailyFortuneDocument>('DailyFortune', dailyFortuneSchema);