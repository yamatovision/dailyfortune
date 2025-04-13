import { Request, Response } from 'express';
import { enhancedCompatibilityService } from '../../services/team/enhanced-compatibility.service';
import { handleError } from '../../utils/error-handler';
import { User } from '../../models/User';

/**
 * 拡張版チーム相性コントローラクラス
 * 四柱推命の詳細な要素に基づく高度な相性診断を提供
 */
class EnhancedCompatibilityController {
  /**
   * チーム内の全メンバー間の拡張相性情報を取得
   * @param req リクエスト
   * @param res レスポンス
   */
  async getTeamEnhancedCompatibilities(req: Request, res: Response): Promise<void> {
    try {
      const { teamId } = req.params;
      
      // チーム内の全メンバー間の拡張相性を取得
      const compatibilities = await enhancedCompatibilityService.getTeamEnhancedCompatibilities(teamId);
      
      // レスポンスを整形
      const formattedCompatibilities = await Promise.all(
        compatibilities.map(async (compatibility) => {
          const [user1, user2] = await Promise.all([
            User.findById(compatibility.user1Id),
            User.findById(compatibility.user2Id)
          ]);
          
          if (!user1 || !user2) {
            throw new Error('ユーザー情報が見つかりません');
          }
          
          return {
            id: compatibility._id,
            users: [
              {
                id: user1._id,
                displayName: user1.displayName,
                element: compatibility.user1Element
              },
              {
                id: user2._id,
                displayName: user2.displayName,
                element: compatibility.user2Element
              }
            ],
            score: compatibility.compatibilityScore,
            relationshipType: compatibility.relationshipType,
            detailDescription: compatibility.detailDescription,
            teamInsight: compatibility.teamInsight,
            collaborationTips: compatibility.collaborationTips,
            enhancedDetails: compatibility.enhancedDetails
          };
        })
      );
      
      res.status(200).json({
        success: true,
        data: formattedCompatibilities
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  /**
   * 特定の2人のチームメンバー間の拡張相性情報を取得
   * @param req リクエスト
   * @param res レスポンス
   */
  async getMemberEnhancedCompatibility(req: Request, res: Response): Promise<void> {
    try {
      const { teamId, userId1, userId2 } = req.params;
      
      // 2人のユーザー間の拡張相性を取得
      const compatibility = await enhancedCompatibilityService.getTeamMemberEnhancedCompatibility(
        teamId, 
        userId1, 
        userId2
      );
      
      // ユーザー情報を取得
      const [user1, user2] = await Promise.all([
        User.findById(compatibility.user1Id),
        User.findById(compatibility.user2Id)
      ]);
      
      if (!user1 || !user2) {
        throw new Error('ユーザーが見つかりません');
      }
      
      // ユーザーIDがレスポンスのユーザー順序と一致するように調整
      const isUser1First = compatibility.user1Id.toString() === userId1;
      
      // レスポンスデータを整形
      const formattedCompatibility = {
        id: compatibility._id,
        users: [
          {
            id: isUser1First ? user1._id : user2._id,
            displayName: isUser1First ? user1.displayName : user2.displayName,
            element: isUser1First ? compatibility.user1Element : compatibility.user2Element
          },
          {
            id: isUser1First ? user2._id : user1._id,
            displayName: isUser1First ? user2.displayName : user1.displayName,
            element: isUser1First ? compatibility.user2Element : compatibility.user1Element
          }
        ],
        score: compatibility.compatibilityScore,
        relationshipType: compatibility.relationshipType,
        detailDescription: compatibility.detailDescription,
        teamInsight: compatibility.teamInsight,
        collaborationTips: compatibility.collaborationTips,
        enhancedDetails: compatibility.enhancedDetails
      };
      
      res.status(200).json({
        success: true,
        compatibility: formattedCompatibility
      });
    } catch (error) {
      handleError(error, res);
    }
  }
}

export const enhancedCompatibilityController = new EnhancedCompatibilityController();