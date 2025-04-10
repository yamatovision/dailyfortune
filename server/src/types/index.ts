/**
 * ===== バックエンド用型定義・APIパス =====
 * 
 * 【重要】このファイルは shared/index.ts からコピーされた型定義です。
 * デプロイ時の問題を回避するため、バックエンドではこのファイルを使用します。
 * 
 * 型定義の変更手順:
 * 1. まず shared/index.ts に変更を加える
 * 2. 次に、このファイルに同じ変更を手動でコピーする
 * 3. バックエンドのコードでは @shared/index ではなく ./types/index を参照する
 * 
 * 【警告】このファイルを直接編集しないでください。
 * shared/index.ts からの一貫性が失われる可能性があります。
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
 * 【変更履歴】
 * - 2025/04/06: 初回作成 - shared/index.ts からコピー (Tatsuya)
 * - 2025/04/07: Expressルーティング実装ルールを追加 (Claude)
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

// ========== 四柱推命プロフィール関連 ==========
export const SAJU_PROFILE = {
  CREATE: `${API_BASE_PATH}/saju-profiles`,
  GET_MY_PROFILE: `${API_BASE_PATH}/saju-profiles/me`,
  GET_USER_PROFILE: (userId: string) => `${API_BASE_PATH}/saju-profiles/${userId}`,
  UPDATE: `${API_BASE_PATH}/saju-profiles`,
  GET_BY_ELEMENT: (element: string) => `${API_BASE_PATH}/saju-profiles/element/${element}`,
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
  UPDATE_PROFILE: `${API_BASE_PATH}/users/profile`,
  UPDATE_EMAIL: `${API_BASE_PATH}/users/email`,
  SET_BIRTH_INFO: `${API_BASE_PATH}/users/birth-info`,
  CALCULATE_SAJU: `${API_BASE_PATH}/users/calculate-saju`, // 四柱推命計算エンドポイント
  GET_SAJU_PROFILE: `${API_BASE_PATH}/users/saju-profile`,
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
  UPDATE_FORTUNE: `${API_BASE_PATH}/fortune/update-fortune`, // 個人運勢の更新・生成
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
  
  // 運勢更新管理
  GET_FORTUNE_UPDATE_SETTINGS: `${API_BASE_PATH}/admin/settings/fortune-update`,
  UPDATE_FORTUNE_UPDATE_SETTINGS: `${API_BASE_PATH}/admin/settings/fortune-update`,
  GET_FORTUNE_UPDATE_LOGS: `${API_BASE_PATH}/admin/settings/fortune-updates/logs`,
  GET_FORTUNE_UPDATE_LOG_DETAIL: (logId: string) => `${API_BASE_PATH}/admin/settings/fortune-updates/logs/${logId}`,
  RUN_FORTUNE_UPDATE: `${API_BASE_PATH}/admin/settings/fortune-updates/manual-run`,
  
  // 日柱管理
  GET_DAY_PILLARS: `${API_BASE_PATH}/admin/settings/day-pillars`,
  GET_DAY_PILLAR_LOGS: `${API_BASE_PATH}/admin/settings/day-pillars/logs`,
  GET_DAY_PILLAR_LOG_DETAIL: (logId: string) => `${API_BASE_PATH}/admin/settings/day-pillars/logs/${logId}`,
  RUN_DAY_PILLAR_GENERATION: `${API_BASE_PATH}/admin/settings/day-pillars/manual-run`,
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
  birthDate?: Date;
  birthTime?: number; // 0-23時
  birthPlace?: string;
  gender?: Gender;
  sajuProfile?: ISajuProfile;
  createdAt: Date;
  updatedAt: Date;
}

// 四柱推命プロフィール
export interface ISajuProfile {
  userId: string;
  birthplace: string;
  birthplaceCoordinates?: IGeoCoordinates; // 出生地の座標情報
  localTimeOffset?: number; // 地方時オフセット（分単位）
  fourPillars: {
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
  mainElement: Element;
  secondaryElement?: Element;
  elementProfile: {
    wood: number; // 0-100の五行バランス
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
  organizationId: string; // 組織への参照
  description?: string;
  iconInitial?: string;
  iconColor?: 'primary' | 'water' | 'wood' | 'fire' | 'earth' | 'metal';
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
  relatedInfo?: {
    memberId?: string; // チームメイトモード時の対象ユーザーID
    teamGoalId?: string; // 目標相談時のチーム目標ID
  };
  messages: IChatMessage[];
  tokenCount: number; // メッセージのトークン数合計
  contextData: Record<string, any>;
  aiModel: 'sonnet' | 'haiku'; // 使用しているAIモデル
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date; // 最終メッセージ時間
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
  birthTime: number; // 0-23時
  birthPlace: string;
  gender: Gender;
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
  password?: string;
  displayName?: string;
}

// チャットメッセージ送信リクエスト
export interface ChatMessageRequest {
  message: string;
  mode: ChatMode;
  contextInfo?: {
    memberId?: string; // チームメイトモード時の対象ユーザーID
    teamGoalId?: string; // チーム目標相談時の目標ID
  };
}

// チャットメッセージレスポンス
export interface ChatMessageResponse {
  success: boolean;
  response?: {
    message: string;
    timestamp: string;
  };
  chatHistory?: {
    id: string;
    messages: IChatMessage[];
  };
  error?: {
    code: string;
    message: string;
  };
}

// チャット履歴取得レスポンス
export interface ChatHistoryResponse {
  success: boolean;
  chatHistories: {
    id: string;
    chatType: ChatMode;
    messages: IChatMessage[];
    createdAt: string;
    lastMessageAt: string;
  }[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

// チャットモード設定リクエスト
export interface ChatModeRequest {
  mode: ChatMode;
  contextInfo?: {
    memberId?: string;
    teamGoalId?: string;
  };
}

// チャットモード設定レスポンス
export interface ChatModeResponse {
  success: boolean;
  mode: ChatMode;
  contextInfo?: {
    memberId?: string;
    teamGoalId?: string;
  };
  welcomeMessage?: string;
  error?: {
    code: string;
    message: string;
  };
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
};