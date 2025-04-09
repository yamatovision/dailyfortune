import { Request, Response } from 'express';
import { AuthRequest, UserRole } from '../../middleware/auth.middleware';
import { fortuneController } from '../../controllers/fortune.controller';
import { Team } from '../../models/Team';
import { User } from '../../models/User';
import { DailyFortune } from '../../models/DailyFortune';
import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';

// 環境変数を読み込む
config({ path: path.resolve(__dirname, '../../../.env') });

// 実際のMongoDB接続を使用
beforeAll(async () => {
  // MongoDB接続
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB接続成功 - fortune.controller.team-ranking.test.ts');
  } catch (error) {
    console.error('MongoDB接続エラー:', error);
    throw error;
  }
});

// テスト終了後にデータベース接続を閉じる
afterAll(async () => {
  await mongoose.disconnect();
  console.log('MongoDB接続終了 - fortune.controller.team-ranking.test.ts');
});

describe('FortuneController - Team Ranking', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let testTeamId: string;
  let testUser1Id: string;
  let testUser2Id: string;
  let testUser3Id: string;
  let today: Date;

  // テスト前のセットアップ
  beforeEach(async () => {
    // レスポンスオブジェクトのモック
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // 今日の日付（0時0分0秒）
    today = new Date();
    today.setHours(0, 0, 0, 0);

    // テスト用ユーザーを準備
    const testUsers = await Promise.all([
      User.findOne({ email: 'test.user1@example.com' }),
      User.findOne({ email: 'test.user2@example.com' }),
      User.findOne({ email: 'test.user3@example.com' })
    ]);

    if (testUsers[0] && testUsers[1] && testUsers[2]) {
      testUser1Id = testUsers[0]._id.toString();
      testUser2Id = testUsers[1]._id.toString();
      testUser3Id = testUsers[2]._id.toString();
    } else {
      // テスト用ユーザーを作成
      const newUsers = await Promise.all([
        User.create({
          _id: new mongoose.Types.ObjectId('65fdc1f9e38f04d2d7636222'),
          email: 'test.user1@example.com',
          displayName: 'Test User 1',
          elementAttribute: 'wood',
          role: 'User',
          uid: 'test-uid-1',
          jobTitle: 'Developer'
        }),
        User.create({
          _id: new mongoose.Types.ObjectId('65fdc1f9e38f04d2d7636223'),
          email: 'test.user2@example.com',
          displayName: 'Test User 2',
          elementAttribute: 'fire',
          role: 'User',
          uid: 'test-uid-2',
          jobTitle: 'Designer'
        }),
        User.create({
          _id: new mongoose.Types.ObjectId('65fdc1f9e38f04d2d7636224'),
          email: 'test.user3@example.com',
          displayName: 'Test User 3',
          elementAttribute: 'earth',
          role: 'User',
          uid: 'test-uid-3',
          jobTitle: 'Manager'
        })
      ]);

      testUser1Id = newUsers[0]._id.toString();
      testUser2Id = newUsers[1]._id.toString();
      testUser3Id = newUsers[2]._id.toString();
    }

    // テスト用チームを準備
    const testTeam = await Team.findOne({ name: 'Test Team for Ranking' });
      
    if (testTeam) {
      testTeamId = testTeam._id.toString();
      
      // メンバーが含まれていることを確認
      const memberIds = [testUser1Id, testUser2Id, testUser3Id];
      let updated = false;
      
      for (const userId of memberIds) {
        const hasUser = testTeam.members.some(m => m.userId.toString() === userId);
        if (!hasUser) {
          testTeam.members.push({ 
            userId: new mongoose.Types.ObjectId(userId), 
            role: userId === testUser1Id ? 'admin' : 'member' 
          });
          updated = true;
        }
      }
      
      if (updated) {
        await testTeam.save();
      }
    } else {
      // テスト用チームを作成
      const newTeam = await Team.create({
        name: 'Test Team for Ranking',
        description: 'Team for fortune ranking testing',
        members: [
          { userId: new mongoose.Types.ObjectId(testUser1Id), role: 'admin' },
          { userId: new mongoose.Types.ObjectId(testUser2Id), role: 'member' },
          { userId: new mongoose.Types.ObjectId(testUser3Id), role: 'member' }
        ]
      });
      
      testTeamId = newTeam._id.toString();
    }

    // テスト用運勢データを準備
    const fortunes = await Promise.all([
      DailyFortune.findOne({ 
        userId: testUser1Id,
        date: { 
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }),
      DailyFortune.findOne({ 
        userId: testUser2Id,
        date: { 
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }),
      DailyFortune.findOne({ 
        userId: testUser3Id,
        date: { 
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      })
    ]);

    // 運勢データが存在しない場合は作成
    const dayPillarId = new mongoose.Types.ObjectId();
    
    if (!fortunes[0]) {
      await DailyFortune.create({
        userId: testUser1Id,
        date: today,
        dayPillarId: dayPillarId,
        fortuneScore: 85,
        advice: 'Test advice for user 1',
        luckyItems: {
          color: 'Red',
          item: 'Pen',
          drink: 'Coffee'
        }
      });
    }
    
    if (!fortunes[1]) {
      await DailyFortune.create({
        userId: testUser2Id,
        date: today,
        dayPillarId: dayPillarId,
        fortuneScore: 75,
        advice: 'Test advice for user 2',
        luckyItems: {
          color: 'Blue',
          item: 'Notebook',
          drink: 'Tea'
        }
      });
    }
    
    if (!fortunes[2]) {
      await DailyFortune.create({
        userId: testUser3Id,
        date: today,
        dayPillarId: dayPillarId,
        fortuneScore: 65,
        advice: 'Test advice for user 3',
        luckyItems: {
          color: 'Green',
          item: 'Book',
          drink: 'Water'
        }
      });
    }

    // リクエストオブジェクトのモック
    req = {
      user: {
        uid: 'test-uid-1',
        email: 'test.user1@example.com',
        role: UserRole.USER,
        id: testUser1Id
      },
      params: {
        teamId: testTeamId
      }
    };
  });

  describe('getTeamFortuneRanking', () => {
    it('should return team fortune ranking when user is a team member', async () => {
      await fortuneController.getTeamFortuneRanking(req as AuthRequest, res as Response);

      // レスポンスのステータスコードを確認
      expect(res.status).toHaveBeenCalledWith(200);
      
      // レスポンスのデータ構造を確認
      const jsonResponse = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonResponse.success).toBe(true);
      
      // データの形式を確認
      const data = jsonResponse.data;
      expect(data.teamId).toBe(testTeamId);
      expect(data.teamName).toBe('Test Team for Ranking');
      expect(data.date).toBeInstanceOf(Date);
      expect(data.nextUpdateTime).toBe('03:00');
      
      // ランキングの確認
      expect(Array.isArray(data.ranking)).toBe(true);
      expect(data.ranking.length).toBe(3);
      
      // ランキングが正しくソートされていることを確認（スコアの降順）
      expect(data.ranking[0].score).toBeGreaterThanOrEqual(data.ranking[1].score);
      expect(data.ranking[1].score).toBeGreaterThanOrEqual(data.ranking[2].score);
      
      // 順位が正しく設定されていることを確認
      expect(data.ranking[0].rank).toBe(1);
      expect(data.ranking[1].rank).toBe(2);
      expect(data.ranking[2].rank).toBe(3);
      
      // 自分のユーザーが判別されていることを確認
      const currentUser = data.ranking.find((item: any) => item.userId.toString() === testUser1Id);
      expect(currentUser.isCurrentUser).toBe(true);
    });

    it('should return 401 when user is not authenticated', async () => {
      req.user = undefined;

      await fortuneController.getTeamFortuneRanking(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: '認証されていません' });
    });

    it('should return 404 when team is not found', async () => {
      req.params = { teamId: new mongoose.Types.ObjectId().toString() };

      await fortuneController.getTeamFortuneRanking(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'チームが見つかりません' });
    });

    it('should return 403 when user is not a team member', async () => {
      // 非メンバーユーザーを作成
      const nonMember = await User.create({
        email: 'non.member@example.com',
        displayName: 'Non Member',
        elementAttribute: 'metal',
        role: 'User',
        uid: 'non-member-uid'
      });
      
      req.user = {
        uid: 'non-member-uid',
        email: 'non.member@example.com',
        role: UserRole.USER,
        id: nonMember._id.toString()
      };

      await fortuneController.getTeamFortuneRanking(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'このチームのデータにアクセスする権限がありません' });
      
      // テスト後にユーザーを削除
      await User.findByIdAndDelete(nonMember._id);
    });
  });
});