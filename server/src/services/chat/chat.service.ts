import { Types } from 'mongoose';
import { ChatMode } from '../../types';
import { ChatHistory, IChatHistoryDocument } from '../../models/ChatHistory';
import { User } from '../../models/User';
import { generateChatResponse } from '../claude-ai';
import { buildChatContext } from './context-builder.service';

/**
 * ChatService - チャット機能の中核サービス
 * ユーザーのメッセージ処理、チャット履歴管理、AIレスポンス生成などを担当
 */
export class ChatService {
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
      const user = await User.findById(userId);
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

      // AIレスポンスの生成
      const aiResponse = await generateChatResponse(
        chatHistory.messages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.content
        })),
        context,
        aiModel
      );

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
      const user = await User.findById(userId);
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
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.content
      }));

      // トークン上限を調整
      const maxTokens = aiModel === 'haiku' ? 1500 : 4000;

      // コンテキスト情報からプロンプトを構築
      // ストリーム版のClaudeAPI関数を使用
      const { streamClaudeAPI } = await import('../claude-ai');
      const contextPrompt = await this.createContextPrompt(context);
      const formattedMessages = this.formatChatHistory(messages as { role: 'user' | 'assistant', content: string }[]);
      const finalPrompt = `${contextPrompt}\n\n${formattedMessages}`;

      // システムプロンプト取得
      const CHAT_SYSTEM_PROMPT = `
あなたは四柱推命の第一人者として、占術に基づいた運勢予測と人間関係の洞察を提供する専門家です。「デイリーフォーチュン」のプラットフォームを通じて、クライアントの命式と日々の運勢に基づいた専門的アドバイスを提供します。

会話において遵守すべき原則：

1. 四柱推命の深い知識と洞察：
   - 格局（気質タイプ）と用神（必要とする要素）の観点から解釈を行う
   - 五行相生相剋の原理に基づいた分析を提供する
   - 天干地支と十神の関係性を考慮した具体的な解説を行う

2. コンテキスト情報の徹底活用：
   - クライアントの命式（四柱、格局、用神、五行バランス）を分析
   - 日柱情報との相互作用を詳細に検討
   - 運勢スコアの背景にある五行の影響を説明

3. 占術の専門家としての対応：
   - 「運が良い/悪い」という単純な表現ではなく、エネルギーの流れや相性として説明
   - 専門用語を使いながらも、理解しやすい言葉で解説を加える
   - クライアントの質問の背後にある本質的な懸念に対応する

4. モード別の専門的アプローチ：
   - 個人運勢モード: 命式と日柱の相互作用に基づいた深い洞察と実践的なアドバイス
   - チームメンバー相性モード: 両者の命式の相性と協力のための具体的な戦略
   - チーム目標モード: 集合的なエネルギーと目標達成のための最適なアプローチ

クライアントに対して、四柱推命の専門家としての豊富な知識と洞察に基づく、深みのある実用的アドバイスを提供してください。
`;

      // ストリーミングAPIを呼び出し
      let completeResponse = '';
      try {
        const streamGenerator = streamClaudeAPI(finalPrompt, CHAT_SYSTEM_PROMPT, maxTokens);

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
   * コンテキスト情報からプロンプトを作成
   */
  private async createContextPrompt(context: Record<string, any>): Promise<string> {
    try {
      // コンテキスト情報から適切なテンプレートを選択
      let template = '';
      
      const CONTEXT_TEMPLATES = {
        PERSONAL: `
【四柱推命による個人運勢相談】

私は四柱推命の専門家として、あなたの命式と日々の運勢に基づいたアドバイスを提供します。

クライアント情報:
- 名前: {user.displayName}
- 五行属性: {user.elementAttribute}
- 日主: {user.dayMaster}
- 格局: {user.kakukyoku.type}（{user.kakukyoku.strength}）
- 用神: {user.yojin.element}（{user.yojin.tenGod}）
- 五行バランス: 木{user.elementProfile.wood} 火{user.elementProfile.fire} 土{user.elementProfile.earth} 金{user.elementProfile.metal} 水{user.elementProfile.water}

本日の運勢:
- 日付: {dailyFortune.date}
- 日柱: {dayPillar.heavenlyStem}{dayPillar.earthlyBranch}
- 運勢スコア: {fortuneScore}/100
- ラッキーアイテム: 色/{dailyFortune.luckyItems.color}、食べ物/{dailyFortune.luckyItems.item}、飲み物/{dailyFortune.luckyItems.drink}

個人目標: {userGoals}

このコンテキスト情報を参考にしながら、四柱推命の専門家としての観点からクライアントの相談に応じてください。特に格局・用神と本日の日柱との相性に留意し、実践的なアドバイスを提供してください。
`,

        TEAM_MEMBER: `
【チームメンバー相性相談モード】
相談者: {user.displayName}（{user.elementAttribute}の持ち主）
対象メンバー: {targetMember.displayName}（{targetMember.elementAttribute}の持ち主）
相性スコア: {compatibility.score}/100
関係性: {compatibility.relationship}

このコンテキスト情報を参考に、ユーザーの質問に対して、特定のチームメンバーとの相性と効果的な協力方法についてアドバイスを提供してください。
`,

        TEAM_GOAL: `
【チーム目標相談モード】
相談者: {user.displayName}（{user.elementAttribute}の持ち主）
チーム: {team.name}（{team.size}名）
目標: {teamGoal.content}
期限: {teamGoal.deadline || '未設定'}

このコンテキスト情報を参考に、ユーザーの質問に対して、チーム全体の目標達成に向けたアドバイスを提供してください。
`
      };
      
      if (context.targetMember) {
        // チームメンバー相性モード
        template = CONTEXT_TEMPLATES.TEAM_MEMBER;
      } else if (context.teamGoal) {
        // チーム目標モード
        template = CONTEXT_TEMPLATES.TEAM_GOAL;
      } else {
        // 個人運勢モード（デフォルト）
        template = CONTEXT_TEMPLATES.PERSONAL;
      }
      
      // テンプレートの変数をコンテキスト情報で置換
      let prompt = template;
      
      // 複雑なオブジェクトパスを処理するヘルパー関数
      const getNestedValue = (obj: any, path: string) => {
        return path.split('.').reduce((prev, curr) => {
          return prev && prev[curr] !== undefined ? prev[curr] : undefined;
        }, obj);
      };
      
      // プレースホルダーを探して置換
      const placeholders = template.match(/\{([^}]+)\}/g) || [];
      
      for (const placeholder of placeholders) {
        const path = placeholder.slice(1, -1); // {user.name} -> user.name
        const value = getNestedValue(context, path);
        
        if (value !== undefined) {
          // 配列の場合は箇条書きに変換
          if (Array.isArray(value)) {
            const formattedValue = value.map(item => `- ${JSON.stringify(item)}`).join('\n');
            prompt = prompt.replace(placeholder, formattedValue);
          } else {
            prompt = prompt.replace(placeholder, String(value));
          }
        } else {
          // 値が見つからない場合は空文字に置換
          prompt = prompt.replace(placeholder, '未設定');
        }
      }
      
      return prompt;
    } catch (error) {
      console.error('Create context prompt error:', error);
      return '四柱推命による運勢相談を行います。';
    }
  }

  /**
   * チャット履歴をテキスト形式に整形
   */
  private formatChatHistory(messages: { role: 'user' | 'assistant', content: string }[]): string {
    return messages.map(msg => {
      const prefix = msg.role === 'user' ? 'ユーザー: ' : 'AI: ';
      return `${prefix}${msg.content}`;
    }).join('\n\n');
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
      // ユーザー情報の取得
      const user = await User.findById(userId);
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
      const query: any = { userId: userId }; // Firebase UIDはそのまま文字列として検索
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
      let query: any = { userId: userId }; // Firebase UIDはそのまま文字列として検索

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
    // クエリの構築
    const query: any = {
      userId: userId, // Firebase UIDはそのまま文字列として検索
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
      userId: userId, // Firebase UIDはそのまま文字列として保存
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
          // メンバー名を取得
          const member = await User.findById(contextInfo.memberId);
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