import mongoose, { Types } from 'mongoose';
import { ChatMode } from '../../types';
import { ChatHistory, IChatHistoryDocument } from '../../models/ChatHistory';
import { User } from '../../models/User';
import { claudeApiClient } from '../claude-api-client';
import { buildChatContext } from './context-builder.service';
import { CHAT_SYSTEM_PROMPT, createContextPrompt, formatChatHistory } from './chat-contexts';

/**
 * ChatService - チャット機能の中核サービス
 * ユーザーのメッセージ処理、チャット履歴管理、AIレスポンス生成などを担当
 */
export class ChatService {
  /**
   * ユーザーを検索するヘルパー - MongoDB ObjectIDのみを使用
   * @param userId ユーザーID（MongoDBのObjectID）
   * @returns ユーザーオブジェクト
   */
  private async findUserById(userId: string): Promise<any> {
    try {
      return await User.findById(new mongoose.Types.ObjectId(userId));
    } catch (error) {
      console.error('User search error:', error);
      throw error;
    }
  }
  /**
   * 新しいメッセージを処理し、AI応答を返す
   */
  public async processMessage(
    userId: string,
    message: string,
    mode: ChatMode,
    contextInfo?: {
      memberId?: string;
      teamGoalId?: string;
    }
  ): Promise<{
    aiResponse: string;
    chatHistory: IChatHistoryDocument;
  }> {
    try {
      // ユーザー情報の取得（エリートかライトプランかを判断するため）
      // 柔軟な検索ヘルパーを使用
      const user = await this.findUserById(userId);
      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }

      // AIモデルの選択（エリートプランならSonnet、ライトプランならHaiku）
      const aiModel = user.plan === 'elite' ? 'sonnet' : 'haiku';

      // 関連情報の検証
      await this.validateContextInfo(mode, contextInfo);

      // アクティブなチャット履歴を取得または作成
      let chatHistory = await this.getOrCreateChatSession(userId, mode, contextInfo, aiModel) as IChatHistoryDocument;

      // ユーザーメッセージを追加
      this.addUserMessage(chatHistory, message);

      // チャットコンテキストの構築
      const context = await buildChatContext(user, mode, contextInfo);

      // コンテキストプロンプトの構築
      const contextPrompt = createContextPrompt(context);
      
      // メッセージをAPIフォーマットに変換
      const messages = chatHistory.messages.map(m => ({
        role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: m.content
      }));
      
      // AI modelの選択
      const model = aiModel === 'sonnet' ? 'claude-3-7-sonnet-20250219' : 'claude-3-haiku-20240307';
      
      // AIレスポンスの生成
      const aiResponse = await claudeApiClient.callAPI({
        messages,
        system: CHAT_SYSTEM_PROMPT,
        maxTokens: aiModel === 'sonnet' ? 4000 : 1500,
        model
      });

      // AIレスポンスをチャット履歴に追加
      this.addAIMessage(chatHistory, aiResponse);

      // チャット履歴を保存
      await chatHistory.save();

      return {
        aiResponse,
        chatHistory
      };
    } catch (error) {
      console.error('Chat service error:', error);
      throw error;
    }
  }

  /**
   * 新しいメッセージを処理し、AI応答をストリーミングで返す
   */
  public async *streamMessage(
    userId: string,
    message: string,
    mode: ChatMode,
    contextInfo?: {
      memberId?: string;
      teamGoalId?: string;
    }
  ): AsyncGenerator<string, { chatHistory: IChatHistoryDocument }, unknown> {
    try {
      // ユーザー情報の取得（エリートかライトプランかを判断するため）
      // 柔軟な検索ヘルパーを使用
      const user = await this.findUserById(userId);
      
      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }

      // AIモデルの選択（エリートプランならSonnet、ライトプランならHaiku）
      const aiModel = user.plan === 'elite' ? 'sonnet' : 'haiku';

      // 関連情報の検証
      await this.validateContextInfo(mode, contextInfo);

      // アクティブなチャット履歴を取得または作成
      let chatHistory = await this.getOrCreateChatSession(userId, mode, contextInfo, aiModel) as IChatHistoryDocument;

      // ユーザーメッセージを追加
      this.addUserMessage(chatHistory, message);

      // チャットコンテキストの構築
      const context = await buildChatContext(user, mode, contextInfo);

      // メッセージと役割をマッピング
      const messages = chatHistory.messages.map(m => ({
        role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: m.content
      }));

      // トークン上限を調整
      const maxTokens = aiModel === 'haiku' ? 1500 : 4000;
      
      // AI modelの選択
      const model = aiModel === 'sonnet' ? 'claude-3-7-sonnet-20250219' : 'claude-3-haiku-20240307';

      // コンテキストプロンプトの構築
      const contextPrompt = createContextPrompt(context);
      
      // ストリーミングAPIを呼び出し
      let completeResponse = '';
      try {
        // ストリームジェネレータを作成
        const streamGenerator = claudeApiClient.streamAPI({
          messages: messages,
          system: CHAT_SYSTEM_PROMPT,
          maxTokens: maxTokens,
          model: model,
          stream: true
        });

        // チャンクを順次受け取り転送
        for await (const chunk of streamGenerator) {
          completeResponse += chunk;
          yield chunk;
        }
      } catch (error) {
        console.error('Streaming error:', error);
        throw error;
      }

      // AIレスポンスをチャット履歴に追加
      this.addAIMessage(chatHistory, completeResponse);

      // チャット履歴を保存
      await chatHistory.save();

      return { chatHistory };
    } catch (error) {
      console.error('Chat streaming service error:', error);
      throw error;
    }
  }


  /**
   * チャットモードを切り替え、ウェルカムメッセージを返す
   */
  public async changeMode(
    userId: string,
    mode: ChatMode,
    contextInfo?: {
      memberId?: string;
      teamGoalId?: string;
    }
  ): Promise<{
    welcomeMessage: string;
    chatHistory: IChatHistoryDocument;
  }> {
    try {
      // ユーザー情報の取得 - 柔軟な検索ヘルパーを使用
      const user = await this.findUserById(userId);
      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }

      // AIモデルの選択
      const aiModel = user.plan === 'elite' ? 'sonnet' : 'haiku';

      // 関連情報の検証
      await this.validateContextInfo(mode, contextInfo);

      // 新しいチャットセッションを作成
      const chatHistory = await this.createNewChatSession(userId, mode, contextInfo, aiModel) as IChatHistoryDocument;

      // モードに応じたウェルカムメッセージを取得
      const welcomeMessage = await this.generateWelcomeMessage(mode, contextInfo);

      // AIメッセージとしてウェルカムメッセージを追加
      this.addAIMessage(chatHistory, welcomeMessage);

      // チャット履歴を保存
      await chatHistory.save();

      return {
        welcomeMessage,
        chatHistory
      };
    } catch (error) {
      console.error('Chat mode change error:', error);
      throw error;
    }
  }

  /**
   * チャット履歴を取得する
   */
  public async getChatHistory(
    userId: string,
    options: {
      mode?: ChatMode;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    chatHistories: IChatHistoryDocument[];
    total: number;
    hasMore: boolean;
  }> {
    const { mode, limit = 10, offset = 0 } = options;

    try {
      // クエリの構築
      const query: any = { userId }; // そのままuserIdを使用（文字列のまま）
      if (mode) {
        query.chatType = mode;
      }

      // 合計数の取得
      const total = await ChatHistory.countDocuments(query);

      // チャット履歴の取得
      const chatHistories = await ChatHistory.find(query)
        .sort({ lastMessageAt: -1 })
        .skip(offset)
        .limit(limit);

      return {
        chatHistories,
        total,
        hasMore: offset + chatHistories.length < total
      };
    } catch (error) {
      console.error('Get chat history error:', error);
      throw error;
    }
  }

  /**
   * チャット履歴をクリアする
   */
  public async clearChatHistory(
    userId: string,
    options: {
      mode?: ChatMode;
      chatId?: string;
    } = {}
  ): Promise<{
    deletedCount: number;
  }> {
    const { mode, chatId } = options;

    try {
      const objectId = new mongoose.Types.ObjectId(userId);
      let query: any = { userId: objectId };

      // 特定のチャットIDが指定されている場合
      if (chatId) {
        query._id = new Types.ObjectId(chatId);
      }
      // 特定のモードが指定されている場合
      else if (mode) {
        query.chatType = mode;
      }

      // チャット履歴の削除
      const result = await ChatHistory.deleteMany(query);

      return {
        deletedCount: result.deletedCount || 0
      };
    } catch (error) {
      console.error('Clear chat history error:', error);
      throw error;
    }
  }

  /**
   * アクティブなチャットセッションを取得または作成する
   */
  private async getOrCreateChatSession(
    userId: string,
    mode: ChatMode,
    contextInfo?: {
      memberId?: string;
      teamGoalId?: string;
    },
    aiModel: 'sonnet' | 'haiku' = 'haiku'
  ): Promise<IChatHistoryDocument> {
    // クエリの構築 - MongoDB ObjectIDを使用
    const query: any = {
      userId: new mongoose.Types.ObjectId(userId),
      chatType: mode
    };

    // relatedInfoの構築
    if (contextInfo) {
      if (mode === ChatMode.TEAM_MEMBER && contextInfo.memberId) {
        query['relatedInfo.teamMemberId'] = new Types.ObjectId(contextInfo.memberId);
      } else if (mode === ChatMode.TEAM_GOAL && contextInfo.teamGoalId) {
        query['relatedInfo.teamGoalId'] = new Types.ObjectId(contextInfo.teamGoalId);
      }
    }

    // 最新のチャット履歴を取得
    let chatHistory = await ChatHistory.findOne(query).sort({ lastMessageAt: -1 });

    // チャット履歴が存在しない場合は新規作成
    if (!chatHistory) {
      return await this.createNewChatSession(userId, mode, contextInfo, aiModel);
    }

    return chatHistory;
  }

  /**
   * 新しいチャットセッションを作成する
   */
  private async createNewChatSession(
    userId: string,
    mode: ChatMode,
    contextInfo?: {
      memberId?: string;
      teamGoalId?: string;
    },
    aiModel: 'sonnet' | 'haiku' = 'haiku'
  ): Promise<IChatHistoryDocument> {
    // relatedInfoの構築
    const relatedInfo: any = {};
    if (contextInfo) {
      if (mode === ChatMode.TEAM_MEMBER && contextInfo.memberId) {
        relatedInfo.teamMemberId = new Types.ObjectId(contextInfo.memberId);
      } else if (mode === ChatMode.TEAM_GOAL && contextInfo.teamGoalId) {
        relatedInfo.teamGoalId = new Types.ObjectId(contextInfo.teamGoalId);
      }
    }

    // 新しいチャット履歴の作成
    const chatHistory = new ChatHistory({
      userId: new mongoose.Types.ObjectId(userId),
      chatType: mode,
      relatedInfo: Object.keys(relatedInfo).length > 0 ? relatedInfo : undefined,
      aiModel,
      messages: [],
      tokenCount: 0,
      contextData: {},
      lastMessageAt: new Date()
    });

    return chatHistory;
  }

  /**
   * ユーザーメッセージをチャット履歴に追加する
   */
  private addUserMessage(chatHistory: IChatHistoryDocument, message: string): void {
    chatHistory.messages.push({
      sender: 'user',
      content: message,
      timestamp: new Date()
    });
    chatHistory.lastMessageAt = new Date();
  }

  /**
   * AIメッセージをチャット履歴に追加する
   */
  private addAIMessage(chatHistory: IChatHistoryDocument, message: string): void {
    chatHistory.messages.push({
      sender: 'ai',
      content: message,
      timestamp: new Date()
    });
    chatHistory.lastMessageAt = new Date();

    // トークン数の簡易計算 (実際の実装ではもっと精密な計算が必要)
    chatHistory.tokenCount += this.estimateTokenCount(message);
  }

  /**
   * 簡易的なトークン数の計算
   */
  private estimateTokenCount(text: string): number {
    // 英語では単語数の約1.3倍がトークン数の目安
    // 日本語ではもっと複雑なので、文字数を4で割った値を使用
    return Math.ceil(text.length / 4);
  }

  /**
   * チャットモードに応じたウェルカムメッセージを生成
   */
  private async generateWelcomeMessage(
    mode: ChatMode,
    contextInfo?: {
      memberId?: string;
      teamGoalId?: string;
    }
  ): Promise<string> {
    switch (mode) {
      case ChatMode.PERSONAL:
        return 'こんにちは。今日の運勢や個人的な質問について相談したいことがあれば、お気軽にお尋ねください。';

      case ChatMode.TEAM_MEMBER:
        if (contextInfo?.memberId) {
          // メンバー名を取得 - 柔軟な検索を使用
          const member = await this.findUserById(contextInfo.memberId);
          if (member) {
            return `${member.displayName}さんとの相性について相談モードに切り替えました。何について知りたいですか？`;
          }
        }
        return 'チームメンバーとの相性について相談モードに切り替えました。相談したいメンバーを選択してください。';

      case ChatMode.TEAM_GOAL:
        return 'チーム目標達成のための相談モードに切り替えました。目標達成に向けたアドバイスが必要な場合は、具体的な状況を教えてください。';

      default:
        return 'こんにちは。何かお手伝いできることはありますか？';
    }
  }

  /**
   * チャットモードに応じた関連情報の検証
   */
  private async validateContextInfo(
    mode: ChatMode,
    contextInfo?: {
      memberId?: string;
      teamGoalId?: string;
    }
  ): Promise<void> {
    if (mode === ChatMode.TEAM_MEMBER && contextInfo?.memberId) {
      // メンバーIDの検証
      const member = await User.findById(contextInfo.memberId);
      if (!member) {
        throw new Error('指定されたチームメンバーが見つかりません');
      }
    } else if (mode === ChatMode.TEAM_GOAL && contextInfo?.teamGoalId) {
      // チーム目標IDの検証
      const TeamGoal = require('../../models/TeamGoal').TeamGoal;
      const teamGoal = await TeamGoal.findById(contextInfo.teamGoalId);
      if (!teamGoal) {
        throw new Error('指定されたチーム目標が見つかりません');
      }
    }
  }
}

// シングルトンインスタンスのエクスポート
export const chatService = new ChatService();