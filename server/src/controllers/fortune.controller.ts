import { Request, Response } from 'express';
import { fortuneService } from '../services/fortune.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { Team } from '../models/Team';
import { User } from '../models/User';
import { DailyFortune } from '../models/DailyFortune';

/**
 * 運勢コントローラー
 * 運勢情報を取得・管理するAPIエンドポイントを提供
 */
export class FortuneController {
  /**
   * 今日の運勢を取得する
   * @param req リクエスト - クエリパラメータとして日付(date)を受け付ける
   * @param res レスポンス
   */
  public async getDailyFortune(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: '認証されていません' });
        return;
      }

      // クエリパラメータから日付を取得（指定がなければ今日の日付）
      const dateParam = req.query.date as string;
      let targetDate: Date | undefined;

      if (dateParam) {
        // 日付形式のバリデーション
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateParam)) {
          res.status(400).json({ error: '無効な日付フォーマットです。YYYY-MM-DD形式で指定してください。' });
          return;
        }
        targetDate = new Date(dateParam);
      }

      // 日付または今日の運勢を取得
      const fortune = targetDate
        ? await fortuneService.getUserFortune(userId, targetDate)
        : await fortuneService.getTodayFortune(userId);

      res.status(200).json(fortune);
    } catch (error: any) {
      console.error('運勢取得エラー:', error);
      if (error.message.includes('見つかりません')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
      }
    }
  }

  /**
   * 運勢データを手動で更新（生成）する
   * @param req リクエスト
   * @param res レスポンス
   */
  public async generateFortune(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: '認証されていません' });
        return;
      }

      // 管理者権限のチェック（通常、別のミドルウェアで行うべき）
      if (req.user?.role !== 'SuperAdmin' && req.user?.role !== 'Admin') {
        res.status(403).json({ error: 'この操作には管理者権限が必要です' });
        return;
      }

      // 日付パラメータの取得（指定がなければ今日の日付）
      const dateParam = req.body.date || req.query.date;
      let targetDate = new Date();

      if (dateParam) {
        targetDate = new Date(dateParam);
        if (isNaN(targetDate.getTime())) {
          res.status(400).json({ error: '無効な日付フォーマットです' });
          return;
        }
      }

      // 運勢の生成
      const fortune = await fortuneService.generateFortune(userId, targetDate);
      res.status(201).json(fortune);
    } catch (error: any) {
      console.error('運勢生成エラー:', error);
      if (error.message.includes('見つかりません')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
      }
    }
  }

  /**
   * チームの運勢ランキングを取得
   * @param req リクエスト
   * @param res レスポンス
   */
  public async getTeamFortuneRanking(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: '認証されていません' });
        return;
      }

      const { teamId } = req.params;
      
      // チームが存在するか確認
      const team = await Team.findById(teamId);
      if (!team) {
        res.status(404).json({ error: 'チームが見つかりません' });
        return;
      }
      
      // リクエストユーザーがチームメンバーかを確認
      const isMember = team.members?.some(member => member.userId.toString() === userId) || false;
      if (!isMember) {
        res.status(403).json({ error: 'このチームのデータにアクセスする権限がありません' });
        return;
      }
      
      // 今日の日付 (日本時間)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // チームメンバーのユーザーID一覧を取得
      const memberIds = team.members?.map(member => member.userId) || [];
      
      // チームメンバー全員の今日の運勢を取得
      const fortunes = await DailyFortune.find({
        userId: { $in: memberIds },
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }).lean();
      
      // 各メンバーの詳細情報を取得
      const members = await User.find({ _id: { $in: memberIds } }).lean();
      
      // 運勢ランキングデータを作成
      const ranking = fortunes.map(fortune => {
        const member = members.find(m => m._id.toString() === fortune.userId.toString());
        return {
          userId: fortune.userId,
          displayName: member?.displayName || '不明なユーザー',
          score: fortune.fortuneScore, // scoreプロパティ → fortuneScoreプロパティに修正
          elementAttribute: member?.elementAttribute || 'unknown',
          jobTitle: member?.jobTitle || '',
          isCurrentUser: fortune.userId.toString() === userId
        };
      });
      
      // スコアの降順で並べ替え
      ranking.sort((a, b) => b.score - a.score);
      
      // 順位を追加
      const rankedList = ranking.map((item, index) => ({
        ...item,
        rank: index + 1
      }));
      
      // レスポンスを返す
      res.status(200).json({
        success: true,
        data: {
          teamId,
          teamName: team.name,
          date: today,
          nextUpdateTime: '03:00', // 次回更新時刻（固定）
          ranking: rankedList
        }
      });
    } catch (error: any) {
      console.error('チーム運勢ランキング取得エラー:', error);
      res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
  }
}

// コントローラーのインスタンスをエクスポート
export const fortuneController = new FortuneController();
