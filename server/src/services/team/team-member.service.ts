import mongoose from 'mongoose';
import { User } from '../../models/User';
import { Team } from '../../models/Team';
import { NotFoundError, UnauthorizedError, BadRequestError } from '../../utils/error-handler';
import { isTeamAdmin } from './team.service';

// 具体的なドキュメント型を定義
interface IUserDocument extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  displayName?: string;
  email?: string;
  teamRole?: string;
  elementAttribute?: string;
  motivation?: number;
  leaveRisk?: string;
  teamId?: mongoose.Types.ObjectId;
}

export const getTeamMembers = async (teamId: string | mongoose.Types.ObjectId, userId: string | mongoose.Types.ObjectId): Promise<any[]> => {
  // チームの存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    throw new NotFoundError('チームが見つかりません');
  }

  const teamIdStr = teamId.toString();

  // リクエスト元がチームメンバーまたはチーム管理者かチェック
  const requestUser = await User.findById(userId);
  
  if (!requestUser) {
    throw new NotFoundError('ユーザーが見つかりません');
  }
  
  const isAdmin = await isTeamAdmin(teamId, userId);
  
  const isMember = requestUser.teamId && requestUser.teamId.toString() === teamIdStr;
  
  if (!isAdmin && !isMember) {
    throw new UnauthorizedError('このチームのメンバー情報にアクセスする権限がありません');
  }

  // チーム管理者が自分自身のチームメンバーでない場合は自動追加
  const adminId = team.adminId.toString();
  const adminUser = await User.findById(adminId);
  
  if (adminUser && (!adminUser.teamId || adminUser.teamId.toString() !== teamIdStr)) {
    console.log(`チーム管理者(${adminId})がチームメンバーではないため、自動的に追加します`);
    
    // 管理者をチームメンバーとして追加
    await User.findByIdAndUpdate(
      adminId,
      {
        teamId: teamId,
        teamRole: 'チーム管理者'
      }
    );
  }

  // チームメンバー一覧取得（管理者も含まれるはず）
  const members = await User.find(
    { teamId: teamId },
    {
      _id: 1,
      displayName: 1,
      email: 1,
      teamRole: 1,
      elementAttribute: 1,
      motivation: 1,
      leaveRisk: 1
    }
  );

  // 何らかの理由で管理者がメンバーに含まれていない場合の対応
  if (adminUser && adminUser._id && !members.some(member => member._id && member._id.toString() === adminId)) {
    // 管理者のチームロールが設定されていなければデフォルト値を設定
    if (!adminUser.teamRole) {
      adminUser.teamRole = 'チーム管理者';
    }
    members.push(adminUser);
  }

  return members;
};

/**
 * ユーザーIDを使用してチームメンバーを追加する
 * チーム作成時などの内部処理用に使用
 */
export const addMemberById = async (
  teamId: string | mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId,
  role?: string,
  skipAdminCheck: boolean = false
) => {
  // チームの存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    throw new NotFoundError('チームが見つかりません');
  }

  const teamIdStr = teamId.toString();

  // 追加対象ユーザーの存在確認
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('指定されたユーザーが見つかりません');
  }

  // 管理者チェックをスキップしない場合（通常のケース）
  if (!skipAdminCheck) {
    // 実行者が管理者かどうかを確認
    const isAdmin = await isTeamAdmin(teamId, userId);
    if (!isAdmin) {
      throw new UnauthorizedError('チームメンバーの追加は管理者のみ可能です');
    }
  }

  // ユーザーが既に別のチームに所属しているかチェック
  if (user.teamId && user.teamId.toString() !== teamIdStr) {
    throw new BadRequestError('このユーザーは既に別のチームに所属しています');
  }

  // ユーザーのチーム情報を更新
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      teamId,
      teamRole: role || ''
    },
    { new: true }
  );

  if (!updatedUser) {
    throw new Error('ユーザー情報の更新に失敗しました');
  }

  return updatedUser;
};

/**
 * メールアドレスからユーザーを検索してチームメンバーとして追加する
 * 外部APIエンドポイント用
 */
export const addMember = async (
  teamId: string | mongoose.Types.ObjectId,
  adminId: string | mongoose.Types.ObjectId,
  userEmail: string,
  role?: string
) => {
  // チームの存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    throw new NotFoundError('チームが見つかりません');
  }

  const teamIdStr = teamId.toString();
  const adminIdStr = adminId.toString();

  // チーム管理者権限チェック (isTeamAdminを使わない)
  if (team.adminId.toString() !== adminIdStr) {
    throw new UnauthorizedError('チームメンバーの追加は管理者のみ可能です');
  }

  // 追加対象ユーザーの存在確認
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    throw new NotFoundError('指定されたメールアドレスのユーザーが見つかりません');
  }

  // ユーザーが既に別のチームに所属しているかチェック
  if (user.teamId && user.teamId.toString() !== teamIdStr) {
    throw new BadRequestError('このユーザーは既に別のチームに所属しています');
  }

  // ユーザーのチーム情報を更新
  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    {
      teamId,
      teamRole: role || ''
    },
    { new: true }
  );

  if (!updatedUser) {
    throw new Error('ユーザー情報の更新に失敗しました');
  }

  return updatedUser;
};

export const updateMemberRole = async (
  teamId: string | mongoose.Types.ObjectId,
  adminId: string | mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId,
  role: string
) => {
  // チームの存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    throw new NotFoundError('チームが見つかりません');
  }

  const teamIdStr = teamId.toString();
  const adminIdStr = adminId.toString();
  const userIdStr = userId.toString();

  // 管理者権限チェック
  if (team.adminId.toString() !== adminIdStr) {
    throw new UnauthorizedError('チームメンバーの役割変更は管理者のみ可能です');
  }

  // 対象ユーザーの存在確認
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('ユーザーが見つかりません');
  }

  // ユーザーがチーム管理者であるかチェック
  const isTeamAdmin = team.adminId.toString() === userIdStr;

  // チーム管理者であるがまだチームメンバーとして登録されていない場合、自動追加
  if (isTeamAdmin && (!user.teamId || user.teamId.toString() !== teamIdStr)) {
    console.log(`チーム管理者(${userIdStr})がチームメンバーではないため、自動的に追加します`);
    
    // 管理者をチームメンバーとして追加
    await User.findByIdAndUpdate(
      userId,
      {
        teamId: teamId
      }
    );
  } 
  // 管理者ではなく、チームに所属していない場合はエラー
  else if (!user.teamId || user.teamId.toString() !== teamIdStr) {
    throw new BadRequestError('指定されたユーザーはこのチームのメンバーではありません');
  }

  // ユーザーの役割を更新
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { teamRole: role },
    { new: true }
  );

  return updatedUser;
};

export const removeMember = async (
  teamId: string | mongoose.Types.ObjectId, 
  adminId: string | mongoose.Types.ObjectId, 
  userId: string | mongoose.Types.ObjectId
) => {
  // チームの存在確認
  const team = await Team.findById(teamId);
  if (!team) {
    throw new NotFoundError('チームが見つかりません');
  }

  const teamIdStr = teamId.toString();
  const adminIdStr = adminId.toString();
  const userIdStr = userId.toString();

  // 管理者権限チェック
  if (team.adminId.toString() !== adminIdStr) {
    throw new UnauthorizedError('チームメンバーの削除は管理者のみ可能です');
  }

  // 管理者自身をチームから削除することはできない
  if (userIdStr === adminIdStr) {
    throw new BadRequestError('チーム管理者をメンバーから削除することはできません');
  }

  // 対象ユーザーがチームに所属しているか確認
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('ユーザーが見つかりません');
  }

  if (!user.teamId || user.teamId.toString() !== teamIdStr) {
    throw new BadRequestError('指定されたユーザーはこのチームのメンバーではありません');
  }

  // ユーザーのチーム情報をクリア
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $unset: { teamId: 1, teamRole: 1 } },
    { new: true }
  );

  return updatedUser;
};