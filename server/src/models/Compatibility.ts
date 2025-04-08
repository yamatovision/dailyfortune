import mongoose, { Document, Schema } from 'mongoose';

/**
 * 相性モデルのインターフェース
 */
export interface ICompatibility {
  user1Id: mongoose.Types.ObjectId;
  user2Id: mongoose.Types.ObjectId;
  compatibilityScore: number;
  relationship: 'mutual_generation' | 'mutual_restriction' | 'neutral';
  user1Element: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
  user2Element: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
  detailDescription: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface ICompatibilityDocument extends ICompatibility, Document {}

/**
 * 相性スキーマ定義
 */
const compatibilitySchema = new Schema<ICompatibilityDocument>(
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
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// データ保存前の処理
compatibilitySchema.pre('save', function(next) {
  // ユーザーIDを常に小さい方が最初に来るように設定
  if (this.user1Id > this.user2Id) {
    // user1IdとuserY2Idを入れ替え
    const tempId = this.user1Id;
    this.user1Id = this.user2Id;
    this.user2Id = tempId;
    
    // 属性も入れ替え
    const tempElement = this.user1Element;
    this.user1Element = this.user2Element;
    this.user2Element = tempElement;
  }
  next();
});

// インデックスの設定
compatibilitySchema.index({ user1Id: 1, user2Id: 1 }, { unique: true });
compatibilitySchema.index({ user1Id: 1 });
compatibilitySchema.index({ user2Id: 1 });
compatibilitySchema.index({ compatibilityScore: -1 });

/**
 * 相性モデル
 */
export const Compatibility = mongoose.model<ICompatibilityDocument>('Compatibility', compatibilitySchema);