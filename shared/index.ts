/**
 * ===== 統合型定義・APIパスガイドライン =====
 * 
 * 【重要】このファイルはフロントエンド（client）からは直接インポートして使用します。
 * バックエンド（server）では、このファイルをリファレンスとして、
 * server/src/types/index.ts に必要な型定義をコピーして使用してください。
 * これはデプロイ時の問題を回避するためのアプローチです。
 * 
 * 【絶対に守るべき原則】
 * 1. フロントエンドとバックエンドで異なる型を作らない
 * 2. 同じデータ構造に対して複数の型を作らない
 * 3. 新しいプロパティは必ずオプショナルとして追加
 * 4. データの形はこのファイルで一元的に定義し、バックエンドはこれをコピーして使用
 * 5. APIパスは必ずこのファイルで一元管理する
 * 6. コード内でAPIパスをハードコードしない
 * 7. パスパラメータを含むエンドポイントは関数として提供する
 * 
 * 【変更手順】
 * 1. このファイルに型定義やAPIパスを追加/更新
 * 2. バックエンド用に server/src/types/index.ts にも同じ変更を手動で反映
 * 3. 両ファイルの一貫性を確保することで「単一の真実源」の概念を維持
 * 
 * 【Expressルーティング実装のルール】
 * 1. ベースパスの二重定義を避けるため、index.tsとroutes/*.tsでは以下の役割分担をする：
 *   - index.ts: `app.use(${API_BASE_PATH}/xxx, xxxRoutes)`でベースパスを設定
 *   - routes/*.ts: 各ルートハンドラでは`/`から始まる相対パスのみを指定（例: `/profile`）
 * 
 * 2. 正しいルーティング例:
 *   - index.ts: `app.use(${API_BASE_PATH}/auth, authRoutes)`
 *   - auth.routes.ts: `router.get('/profile', authenticate, authController.getProfile)`
 *   - 結果のパス: `/api/v1/auth/profile`
 * 
 * 3. 間違ったルーティング例 (二重定義):
 *   - index.ts: `app.use(${API_BASE_PATH}/auth, authRoutes)`
 *   - auth.routes.ts: `router.get(AUTH.PROFILE.replace('/api/v1', ''), authenticate, authController.getProfile)`
 *   - 結果: 混乱とバグの原因
 * 
 * 4. FE側ではこのファイルのAPIパス定数を直接使用する:
 *   - ✅ 正解: `fetch(AUTH.PROFILE)`
 *   - ❌ 不正解: `fetch('/api/v1/auth/profile')`
 * 
 * 【命名規則】
 * - データモデル: [Model]Type または I[Model]
 * - リクエスト: [Model]Request
 * - レスポンス: [Model]Response
 * 
 * 【変更履歴】
 * - 2025/04/05: 初期モデル・APIパス定義 (Claude)
 * - 2025/04/06: バックエンド用のリファレンス方式に変更 (Tatsuya)
 * - 2025/04/07: Expressルーティング実装ルールを追加 (Claude)
 * - 2025/04/08: SajuProfileの削除とUserモデルへの統合 (Claude)
 */

// API基本パス
export const API_BASE_PATH = '/api/v1';

// ========== 認証関連 ==========
export const AUTH = {
  LOGIN: `${API_BASE_PATH}/auth/login`,
  REGISTER: `${API_BASE_PATH}/auth/register`,
  PROFILE: `${API_BASE_PATH}/auth/profile`,
  PASSWORD_RESET: `${API_BASE_PATH}/auth/password-reset`,
  LOGOUT: `${API_BASE_PATH}/auth/logout`,
  REFRESH_TOKEN: `${API_BASE_PATH}/auth/refresh-token`,
  VERIFY_EMAIL: `${API_BASE_PATH}/auth/verify-email`,
};

// ========== 四柱推命関連 (ユーザーモデルに統合) ==========
export const SAJU = {
  GET_AVAILABLE_CITIES: `${API_BASE_PATH}/public/saju/available-cities`,
  GET_CITY_COORDINATES: (cityName: string) => `${API_BASE_PATH}/public/saju/city-coordinates/${encodeURIComponent(cityName)}`,
  CALCULATE_LOCAL_TIME_OFFSET: `${API_BASE_PATH}/public/saju/local-time-offset`,
};

// ========== 日柱関連 ==========
export const DAY_PILLAR = {
  GET_TODAY: `${API_BASE_PATH}/day-pillars/today`,
  GET_BY_DATE: (date: string) => `${API_BASE_PATH}/day-pillars/${date}`,
  GET_RANGE: `${API_BASE_PATH}/day-pillars`,
};

// ========== ユーザー関連 ==========
export const USER = {
  GET_USER: (userId: string) => `${API_BASE_PATH}/users/${userId}`,
  UPDATE_USER: (userId: string) => `${API_BASE_PATH}/users/${userId}`,
  LIST_USERS: `${API_BASE_PATH}/users`,
  GET_PROFILE: `${API_BASE_PATH}/users/profile`,
  UPDATE_PROFILE: `${API_BASE_PATH}/users/profile`, // 統合エンドポイント（PUT）
  PATCH_PROFILE: `${API_BASE_PATH}/users/profile`, // 部分更新エンドポイント（PATCH）
  UPDATE_EMAIL: `${API_BASE_PATH}/users/email`,
  SET_BIRTH_INFO: `${API_BASE_PATH}/users/birth-info`, // レガシーエンドポイント（互換性のため維持）
  CALCULATE_SAJU: `${API_BASE_PATH}/users/calculate-saju`, // レガシーエンドポイント（互換性のため維持）
  GET_SAJU_PROFILE: `${API_BASE_PATH}/users/profile`, // サポート注: 四柱推命データはユーザープロフィールに含まれます
  SET_GOALS: `${API_BASE_PATH}/users/goals`,
  GET_GOALS: `${API_BASE_PATH}/users/goals`,
  DELETE_GOAL: (goalId: string) => `${API_BASE_PATH}/users/goals/${goalId}`,
  UPDATE_GOAL: (goalId: string) => `${API_BASE_PATH}/users/goals/${goalId}`,
};

// ========== チーム関連 ==========
export const TEAM = {
  CREATE_TEAM: `${API_BASE_PATH}/teams`,
  GET_TEAM: (teamId: string) => `${API_BASE_PATH}/teams/${teamId}`,
  UPDATE_TEAM: (teamId: string) => `${API_BASE_PATH}/teams/${teamId}`,
  DELETE_TEAM: (teamId: string) => `${API_BASE_PATH}/teams/${teamId}`,
  LIST_TEAMS: `${API_BASE_PATH}/teams`,
  GET_TEAM_MEMBERS: (teamId: string) => `${API_BASE_PATH}/teams/${teamId}/members`,
  ADD_TEAM_MEMBER: (teamId: string) => `${API_BASE_PATH}/teams/${teamId}/members`,
  REMOVE_TEAM_MEMBER: (teamId: string, userId: string) => `${API_BASE_PATH}/teams/${teamId}/members/${userId}`,
  UPDATE_TEAM_MEMBER_ROLE: (teamId: string, userId: string) => `${API_BASE_PATH}/teams/${teamId}/members/${userId}/role`,
  SET_TEAM_GOAL: (teamId: string) => `${API_BASE_PATH}/teams/${teamId}/goal`,
  GET_TEAM_GOAL: (teamId: string) => `${API_BASE_PATH}/teams/${teamId}/goal`,
  GET_TEAM_COMPATIBILITY: (teamId: string) => `${API_BASE_PATH}/teams/${teamId}/compatibility`,
  GET_MEMBER_COMPATIBILITY: (teamId: string, userId1: string, userId2: string) => 
    `${API_BASE_PATH}/teams/${teamId}/compatibility/${userId1}/${userId2}`,
};

// ========== 運勢関連 ==========
export const FORTUNE = {
  GET_DAILY_FORTUNE: `${API_BASE_PATH}/fortune/daily`,
  GET_USER_FORTUNE: (userId: string) => `${API_BASE_PATH}/fortune/user/${userId}`,
  GET_TEAM_FORTUNE_RANKING: (teamId: string) => `${API_BASE_PATH}/fortune/team/${teamId}/ranking`,
  UPDATE_ALL_FORTUNES: `${API_BASE_PATH}/fortune/update-all`, // SuperAdmin専用
};

// ========== AIチャット関連 ==========
export const CHAT = {
  SEND_MESSAGE: `${API_BASE_PATH}/chat/message`,
  GET_HISTORY: `${API_BASE_PATH}/chat/history`,
  CLEAR_HISTORY: `${API_BASE_PATH}/chat/clear`,
  SET_CHAT_MODE: `${API_BASE_PATH}/chat/mode`,
};

// ========== 管理者専用 ==========
export const ADMIN = {
  DASHBOARD: `${API_BASE_PATH}/admin/dashboard`,
  USER_INSIGHTS: (userId: string) => `${API_BASE_PATH}/admin/insights/user/${userId}`,
  TEAM_INSIGHTS: (teamId: string) => `${API_BASE_PATH}/admin/insights/team/${teamId}`,
  SYSTEM_SETTINGS: `${API_BASE_PATH}/admin/settings`,
  UPDATE_SETTING: (settingKey: string) => `${API_BASE_PATH}/admin/settings/${settingKey}`,
  STATS: `${API_BASE_PATH}/admin/stats`,
  MANAGE_ADMINS: `${API_BASE_PATH}/admin/admins`,
  ADD_ADMIN: `${API_BASE_PATH}/admin/admins`,
  REMOVE_ADMIN: (userId: string) => `${API_BASE_PATH}/admin/admins/${userId}`,
  UPDATE_ADMIN_ROLE: (userId: string) => `${API_BASE_PATH}/admin/admins/${userId}/role`,
};

// ========== データモデル ==========

// 権限レベル
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

// 性別
export enum Gender {
  MALE = 'M',
  FEMALE = 'F',
}

// 目標タイプ
export enum GoalType {
  CAREER = 'career',
  TEAM = 'team',
  PERSONAL = 'personal',
}

// チャットモード
export enum ChatMode {
  PERSONAL = 'personal',
  TEAM_MEMBER = 'team_member',
  TEAM_GOAL = 'team_goal',
}

// 五行属性
export enum Element {
  WOOD = 'wood',
  FIRE = 'fire',
  EARTH = 'earth',
  METAL = 'metal',
  WATER = 'water',
}

// 五行関係タイプ
export enum ElementRelation {
  PRODUCING = 'producing', // 相生
  CONTROLLING = 'controlling', // 相克
  NEUTRAL = 'neutral', // 中和
}

// 地理座標インターフェース
export interface IGeoCoordinates {
  longitude: number; // 経度（東経プラス、西経マイナス）
  latitude: number;  // 緯度（北緯プラス、南緯マイナス）
}

// ユーザーモデル
export interface IUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  teamId?: string;
  jobTitle?: string; // 役割（エンジニア、営業など）
  goal?: string; // 個人目標
  
  // 四柱推命関連フィールド（旧SajuProfileから統合）
  birthDate?: Date;
  birthTime?: string; // HH:MM形式
  birthPlace?: string;
  gender?: Gender;
  birthplaceCoordinates?: IGeoCoordinates;
  localTimeOffset?: number; // 地方時オフセット（分単位）
  elementAttribute?: Element; // 五行属性
  dayMaster?: string; // 日主
  fourPillars?: {
    year: {
      heavenlyStem: string;
      earthlyBranch: string;
      heavenlyStemTenGod?: string;
      earthlyBranchTenGod?: string;
      hiddenStems?: string[];
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
  elementProfile?: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  personalityDescription?: string;
  careerAptitude?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// 後方互換性のための型定義
// (注意: 実際のデータはIUserに統合済み、これはAPIの後方互換性のためだけに存在)
export interface ISajuProfile {
  userId: string;
  birthplace: string;
  birthplaceCoordinates?: IGeoCoordinates;
  localTimeOffset?: number;
  fourPillars: {
    year: {
      heavenlyStem: string;
      earthlyBranch: string;
    };
    month: {
      heavenlyStem: string;
      earthlyBranch: string;
    };
    day: {
      heavenlyStem: string;
      earthlyBranch: string;
    };
    hour: {
      heavenlyStem: string;
      earthlyBranch: string;
    };
  };
  mainElement: Element;
  secondaryElement?: Element;
  elementProfile: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  personalityDescription: string;
  careerAptitude: string;
  createdAt: Date;
  updatedAt: Date;
}

// ユーザー目標
export interface IGoal {
  id: string;
  userId: string;
  type: GoalType;
  content: string;
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// チームモデル
export interface ITeam {
  id: string;
  name: string;
  adminId: string; // チーム管理者のユーザーID
  goal?: string;
  createdAt: Date;
  updatedAt: Date;
}

// チームメンバー
export interface ITeamMember {
  userId: string;
  teamId: string;
  role: string; // チーム内での役割（エンジニア、営業など）
  joinedAt: Date;
}

// 運勢データ
export interface IFortune {
  id: string;
  userId: string;
  date: Date;
  dayPillar: {
    heavenlyStem: string;
    earthlyBranch: string;
  };
  score: number; // 0-100点
  advice: string; // マークダウン形式のアドバイス（運勢詳細、個人目標アドバイス、チーム目標アドバイスを含む）
  luckyItems: {
    color: string;
    item: string;
    drink: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// 相性データ
export interface ICompatibility {
  id: string;
  userId1: string;
  userId2: string;
  score: number; // 0-100点
  relationType: ElementRelation;
  element1: Element;
  element2: Element;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// チャットデータ
export interface IChat {
  id: string;
  userId: string;
  mode: ChatMode;
  relatedUserId?: string; // チームメイトモード時の対象ユーザーID
  messages: IChatMessage[];
  contextData: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// チャットメッセージ
export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// システム設定
export interface ISystemSetting {
  key: string;
  value: string;
  description: string;
  updatedAt: Date;
  updatedBy: string;
}

// ========== リクエスト/レスポンス型 ==========

// ログインリクエスト
export interface LoginRequest {
  email: string;
  password: string;
}

// ログインレスポンス
export interface LoginResponse {
  user: IUser;
  token: string;
  refreshToken: string;
}

// 登録リクエスト
export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

// 出生情報設定リクエスト
export interface BirthInfoRequest {
  birthDate: Date;
  birthTime: string; // HH:MM形式
  birthPlace: string;
  gender: Gender;
  birthplaceCoordinates?: IGeoCoordinates;
  localTimeOffset?: number;
}

// 目標設定リクエスト
export interface GoalRequest {
  type: GoalType;
  content: string;
  deadline?: Date;
}

// チーム作成リクエスト
export interface TeamRequest {
  name: string;
  goal?: string;
}

// チームメンバー追加リクエスト
export interface AddTeamMemberRequest {
  email: string;
  role: string;
}

// チャットメッセージ送信リクエスト
export interface ChatMessageRequest {
  message: string;
  mode: ChatMode;
  relatedUserId?: string; // チームメイトモード時の対象ユーザーID
}

// チャットモード設定リクエスト
export interface ChatModeRequest {
  mode: ChatMode;
  relatedUserId?: string;
}

// 管理者ダッシュボードレスポンス
export interface AdminDashboardResponse {
  totalUsers: number;
  activeUsers: number;
  totalTeams: number;
  alerts: {
    userId: string;
    userName: string;
    teamId: string;
    teamName: string;
    type: 'motivation_drop' | 'turnover_risk';
    level: 'low' | 'medium' | 'high';
    description: string;
  }[];
}

// システム統計レスポンス
export interface SystemStatsResponse {
  userStats: {
    total: number;
    active: number;
    byRole: {
      [key in UserRole]: number;
    };
    registrationTrend: {
      date: string;
      count: number;
    }[];
  };
  aiStats: {
    totalRequests: number;
    averageResponseTime: number;
    requestsByDay: {
      date: string;
      count: number;
    }[];
  };
}