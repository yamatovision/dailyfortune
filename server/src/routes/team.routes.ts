import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { 
  teamController, 
  teamMemberController, 
  teamGoalController,
  teamMemberCardController
} from '../controllers/team';

const router = express.Router();

// チーム関連のルート
router.get('/', authenticate, teamController.getTeams);
router.post('/', authenticate, teamController.createTeam);
router.get('/:teamId', authenticate, teamController.getTeamById);
router.put('/:teamId', authenticate, teamController.updateTeam);
router.delete('/:teamId', authenticate, teamController.deleteTeam);

// チームメンバー関連のルート
router.get('/:teamId/members', authenticate, teamMemberController.getTeamMembers);
router.post('/:teamId/members', authenticate, teamMemberController.addMember);
router.put('/:teamId/members/:userId/role', authenticate, teamMemberController.updateMemberRole);
router.delete('/:teamId/members/:userId', authenticate, teamMemberController.removeMember);

// メンバーカルテ関連のルート
router.get('/:teamId/members/:userId/card', authenticate, teamMemberCardController.getMemberCard);
// テスト用エンドポイント - ルート直下に配置して動作を確認
router.get('/test-card', (req, res) => {
  console.log('テストカードエンドポイントにアクセスされました');
  res.status(200).json({ message: 'テストカードエンドポイントは正常に動作しています' });
});

// チーム目標関連のルート
router.get('/:teamId/goal', authenticate, teamGoalController.getTeamGoal);
router.post('/:teamId/goal', authenticate, teamGoalController.createOrUpdateTeamGoal);
router.put('/:teamId/goal/progress', authenticate, teamGoalController.updateTeamGoalProgress);

export default router;