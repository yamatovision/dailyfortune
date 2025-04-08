import { IUser, ISystemSetting } from '@shared/index';

/**
 * ユーザー一覧レスポンス
 */
export interface UsersListResponse {
  users: IUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * 運勢更新設定レスポンス
 */
export interface FortuneUpdateSettingResponse extends ISystemSetting {}

/**
 * 運勢更新ログレスポンス
 */
export interface FortuneUpdateLog {
  _id: string;
  date: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  totalUsers: number;
  successCount: number;
  failedCount: number;
  isAutomaticRetry: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 運勢更新ログ一覧レスポンス
 */
export interface FortuneUpdateLogsResponse {
  logs: FortuneUpdateLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * 運勢更新実行レスポンス
 */
export interface RunFortuneUpdateResponse {
  message: string;
  jobId: string;
  startTime: string;
  status: string;
}

/**
 * エラーレスポンス
 */
export interface ErrorResponse {
  message: string;
  errors?: any;
}