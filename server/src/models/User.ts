import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * ユーザーモデルのインターフェース
 */
export interface IUser {
  _id?: string | mongoose.Types.ObjectId;  // MongoDBのObjectIDまたは文字列ID
  email: string;
  password: string;
  displayName: string;
  role: 'SuperAdmin' | 'Admin' | 'User';
  organizationId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  jobTitle?: string;
  teamRole?: string;                // チーム内での役割（デザイナー、エンジニアなど）
  motivation?: number;              // モチベーションスコア（0-100）
  leaveRisk?: 'none' | 'low' | 'medium' | 'high';  // 離職リスク
  
  // JWT認証関連
  refreshToken?: string;            // JWTリフレッシュトークン
  tokenVersion?: number;            // リフレッシュトークンの無効化に使用するバージョン
  lastLogin?: Date;                 // 最終ログイン日時
  
  // Firebase 関連（移行期間中に使用）
  firebaseUid?: string;             // Firebase UID (Firebase認証からの移行用)
  uid?: string;                     // 後方互換のためのUID（移行完了後に削除）
  
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
  // 国際対応拡張情報
  timeZone?: string;                // タイムゾーン識別子（例：'Asia/Tokyo'）
  extendedLocation?: {              // 拡張されたロケーション情報
    name?: string;                  // 都市名
    country?: string;               // 国名
    coordinates: {                  // 座標（必須）
      longitude: number;
      latitude: number;
    };
    timeZone?: string;              // タイムゾーン識別子
  };
  
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

/**
 * Mongoose用のドキュメントインターフェース
 */
export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * ユーザースキーマ定義
 */
const userSchema = new Schema<IUserDocument>(
  {
    _id: {
      type: Schema.Types.Mixed, // FirebaseのUIDを格納できるように変更
      required: true
    },
    uid: {
      type: String,
      index: true,
      sparse: true // すべてのドキュメントにこのフィールドがあるとは限らない
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
    // 国際対応拡張情報
    timeZone: {
      type: String,
      trim: true,
      description: 'タイムゾーン識別子（例：Asia/Tokyo）'
    },
    extendedLocation: {
      name: {
        type: String,
        trim: true
      },
      country: {
        type: String,
        trim: true
      },
      coordinates: {
        longitude: {
          type: Number,
          min: [-180, '経度は-180度以上である必要があります'],
          max: [180, '経度は180度以下である必要があります'],
          required: [true, '経度は必須です']
        },
        latitude: {
          type: Number,
          min: [-90, '緯度は-90度以上である必要があります'],
          max: [90, '緯度は90度以下である必要があります'],
          required: [true, '緯度は必須です']
        }
      },
      timeZone: {
        type: String,
        trim: true
      }
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
    
    // JWT認証関連フィールド
    refreshToken: {
      type: String,
      select: false  // セキュリティ上、通常のクエリでは取得しない
    },
    tokenVersion: {
      type: Number,
      default: 0    // トークンの無効化に使用
    },
    lastLogin: {
      type: Date
    },
    firebaseUid: {
      type: String,
      index: true,
      sparse: true  // 移行期間中のみ使用
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
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// パスワードのハッシュ化
userSchema.pre('save', async function(next) {
  // パスワードが変更されていない場合はスキップ
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // ソルトを生成
    const salt = await bcrypt.genSalt(10);
    // パスワードをハッシュ化
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// パスワード比較メソッド
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// インデックスの設定
userSchema.index({ organizationId: 1, role: 1 });
userSchema.index({ organizationId: 1, plan: 1 });
userSchema.index({ teamRole: 1 });
userSchema.index({ motivation: 1 });
userSchema.index({ leaveRisk: 1 });

/**
 * ユーザーモデル
 */
export const User = mongoose.model<IUserDocument>('User', userSchema);