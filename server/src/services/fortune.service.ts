import mongoose from 'mongoose';
import { DailyFortune } from '../models/DailyFortune';
import { DayPillar } from '../models/DayPillar';
import { User } from '../models/User';

/**
 * 運勢サービス
 * ユーザーの四柱推命プロファイルと日柱に基づいた運勢情報を生成・取得する
 */
export class FortuneService {
  /**
   * 特定日の運勢情報を取得する
   * @param userId ユーザーID
   * @param date 日付（指定がない場合は今日）
   * @returns 運勢情報
   */
  public async getUserFortune(userId: string, date?: Date): Promise<any> {
    // 日付が指定されていない場合は今日の日付を使用
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0); // 時刻部分をリセット

    // ユーザーIDがObjectIDかどうかを確認
    let userIdQuery: string | mongoose.Types.ObjectId = userId;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userIdQuery = new mongoose.Types.ObjectId(userId);
    }

    // 既存の運勢データを検索
    const fortune = await DailyFortune.findOne({
      userId: userIdQuery,
      date: {
        $gte: targetDate,
        $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) // 翌日
      }
    }).populate('dayPillarId');

    // 運勢データが見つかった場合はそれを返す
    if (fortune) {
      const dayPillar = fortune.dayPillarId as any;
      return {
        id: fortune._id,
        userId: fortune.userId,
        date: fortune.date,
        dayPillar: {
          heavenlyStem: dayPillar.heavenlyStem,
          earthlyBranch: dayPillar.earthlyBranch
        },
        score: fortune.fortuneScore,
        advice: fortune.advice,
        luckyItems: fortune.luckyItems,
        createdAt: fortune.createdAt,
        updatedAt: fortune.updatedAt
      };
    }

    // 運勢データが見つからない場合はエラーを返す
    throw new Error('運勢データが見つかりません');
  }

  /**
   * 今日の運勢情報を取得する
   * @param userId ユーザーID
   * @returns 今日の運勢情報
   */
  public async getTodayFortune(userId: string): Promise<any> {
    return this.getUserFortune(userId);
  }

  /**
   * 運勢データを生成する
   * @param userId ユーザーID
   * @param date 日付
   * @returns 生成された運勢情報
   */
  public async generateFortune(userId: string, date: Date): Promise<any> {
    // ユーザー情報と四柱推命プロファイルを取得
    // ユーザーIDがObjectIDかどうかを確認して適切なクエリを実行
    let user;
    
    // FirebaseのUID形式の場合はまず _id で直接検索
    // User モデルでは _id に Firebase UID を直接格納する場合がある
    user = await User.findById(userId);
    
    // 見つからなければ uid フィールドで検索
    if (!user) {
      user = await User.findOne({ uid: userId });
    }
    
    // それでも見つからなければエラー
    if (!user) {
      console.log(`ユーザーが見つかりません。検索ID: ${userId}`);
      throw new Error('ユーザーが見つかりません');
    }

    // ユーザーの四柱推命データの存在をチェック
    // 注: 四柱推命データはUserモデルに直接保存されており、elementAttributeの存在で確認
    if (!user.elementAttribute) {
      throw new Error('ユーザーの四柱推命情報が見つかりません');
    }

    // 日付の日柱情報を取得
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0); // 時刻部分をリセット

    const dayPillar = await DayPillar.findOne({
      date: {
        $gte: targetDate,
        $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) // 翌日
      }
    });

    if (!dayPillar) {
      throw new Error('日柱情報が見つかりません');
    }

    // 運勢スコアを計算（ユーザーの五行属性と日柱の相性から）
    const fortuneScore = this.calculateFortuneScore(
      user.elementAttribute || 'water',
      dayPillar.heavenlyStem,
      dayPillar.earthlyBranch
    );

    // マークダウン形式のアドバイスを生成
    const advice = await this.generateFortuneAdvice(
      user,
      dayPillar,
      fortuneScore
    );

    // ラッキーアイテムを生成
    const luckyItems = this.generateLuckyItems(
      user.elementAttribute || 'water',
      dayPillar.heavenlyStem,
      dayPillar.earthlyBranch
    );

    // 運勢データを保存
    const fortune = new DailyFortune({
      userId: userId,
      date: targetDate,
      dayPillarId: dayPillar._id,
      fortuneScore: fortuneScore,
      advice: advice,
      luckyItems: luckyItems
    });

    await fortune.save();

    return {
      id: fortune._id,
      userId: fortune.userId,
      date: fortune.date,
      dayPillar: {
        heavenlyStem: dayPillar.heavenlyStem,
        earthlyBranch: dayPillar.earthlyBranch
      },
      score: fortune.fortuneScore,
      advice: fortune.advice,
      luckyItems: fortune.luckyItems,
      createdAt: fortune.createdAt,
      updatedAt: fortune.updatedAt
    };
  }

  /**
   * 運勢スコアを計算する
   * @param userElement ユーザーの五行属性
   * @param heavenlyStem 天干
   * @param earthlyBranch 地支
   * @returns 運勢スコア（0-100）
   */
  private calculateFortuneScore(
    userElement: string,
    heavenlyStem: string,
    earthlyBranch: string
  ): number {
    // 天干と地支の五行要素を取得
    const stemElement = this.getStemElement(heavenlyStem);
    const branchElement = this.getBranchElement(earthlyBranch);

    // ユーザーの五行属性と天干・地支の相性を計算
    const stemCompatibility = this.calculateElementCompatibility(userElement, stemElement);
    const branchCompatibility = this.calculateElementCompatibility(userElement, branchElement);

    // 天干と地支の相性を重み付けして最終スコアを計算（天干:地支 = 6:4）
    const weightedScore = stemCompatibility * 0.6 + branchCompatibility * 0.4;
    
    // 0-100の範囲にスケーリング
    return Math.round(weightedScore * 20 + 50);
  }

  /**
   * マークダウン形式の運勢アドバイスを生成する
   * @param user ユーザー情報
   * @param dayPillar 日柱情報
   * @param fortuneScore 運勢スコア
   * @param sajuProfile 四柱推命プロファイル（オプション）
   * @returns マークダウン形式のアドバイス
   */
  private async generateFortuneAdvice(
    user: any,
    dayPillar: any,
    fortuneScore: number
  ): Promise<string> {
    // 環境変数から利用モードを取得
    const useClaudeAPI = process.env.USE_CLAUDE_API === 'true';
    
    if (useClaudeAPI) {
      try {
        return await this.generateAdviceWithClaude(user, dayPillar, fortuneScore);
      } catch (error) {
        console.error('Claude API呼び出しエラー:', error);
        // APIエラー時はフォールバックとしてテンプレートベースのアドバイスを使用
        return this.generateTemplateBasedAdvice(user, dayPillar, fortuneScore);
      }
    } else {
      // Claude APIを使用しない場合はテンプレートベースのアドバイスを使用
      return this.generateTemplateBasedAdvice(user, dayPillar, fortuneScore);
    }
  }
  
  /**
   * Claude APIを使用して運勢アドバイスを生成する
   */
  private async generateAdviceWithClaude(
    user: any,
    dayPillar: any,
    fortuneScore: number
  ): Promise<string> {
    // Anthropic APIのSDKを使用
    try {
      // 環境変数からAPIキーを取得
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('Anthropic API Key is not configured');
      }
      
      // @anthropic-ai/sdk の動的インポート
      const { Anthropic } = await import('@anthropic-ai/sdk');
      
      const anthropic = new Anthropic({
        apiKey: apiKey
      });
      
      // 四柱推命情報からプロンプトを作成
      const userElement = user.elementAttribute || 'water';
      const dayElement = this.getStemElement(dayPillar.heavenlyStem);
      const stemElement = this.getStemElement(dayPillar.heavenlyStem);
      
      // 運勢の種類を決定
      let fortuneType = 'neutral';
      if (fortuneScore >= 80) {
        fortuneType = 'excellent';
      } else if (fortuneScore >= 60) {
        fortuneType = 'good';
      } else if (fortuneScore <= 20) {
        fortuneType = 'bad';
      } else if (fortuneScore <= 40) {
        fortuneType = 'poor';
      }
      
      // プロンプトの構築
      const prompt = `
あなたは四柱推命に基づいて運勢アドバイスを作成する専門家です。以下の情報に基づいて、マークダウン形式のアドバイスを作成してください。

# ユーザー情報
- 五行属性: ${userElement}
- 目標: ${user.goal || '設定なし'}
- チーム役割: ${user.teamRole || '設定なし'}

# 本日の日柱情報
- 天干: ${dayPillar.heavenlyStem}
- 地支: ${dayPillar.earthlyBranch} 
- 五行属性: ${stemElement}

# 運勢スコア: ${fortuneScore}/100
- 運勢タイプ: ${fortuneType}

以下の3セクションからなるマークダウン形式のアドバイスを作成してください：
1. 「今日のあなたの運気」- 今日の全体的な運気と五行属性の相性について
2. 「個人目標へのアドバイス」- ユーザーの目標に関連したアドバイス
3. 「チーム目標へのアドバイス」- チームでの役割に関連したアドバイス

それぞれのセクションは200-300文字程度にしてください。四柱推命の知識に基づいた具体的で実用的なアドバイスを提供してください。
      `;
      
      // Claude 3.7 Sonnetモデルを使用
      const message = await anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      });
      
      // レスポンスからテキスト内容を取得
      const contentBlock = message.content[0];
      
      // 型チェックを行い安全に値を取り出す
      if (contentBlock && typeof contentBlock === 'object' && 'text' in contentBlock) {
        return contentBlock.text;
      } else if (contentBlock && typeof contentBlock === 'object' && 'type' in contentBlock) {
        // APIの応答形式が変わった場合の対応（どのような型であっても対応）
        return (contentBlock as any).value || '';
      }
      
      // どちらにも当てはまらない場合はデフォルトメッセージを返す
      return "今日は自分の直感を信じて行動してみましょう。新しい発見があるかもしれません。";
      
    } catch (error) {
      console.error('Claude API呼び出しエラー:', error);
      throw error;
    }
  }
  
  /**
   * テンプレートベースのアドバイスを生成する（Claude API非使用時のフォールバック）
   */
  private generateTemplateBasedAdvice(
    user: any,
    dayPillar: any,
    fortuneScore: number
  ): string {
    const userElement = user.elementAttribute || 'water';
    const stemElement = this.getStemElement(dayPillar.heavenlyStem);

    // 運勢の種類を決定
    let fortuneType = 'neutral';
    if (fortuneScore >= 80) {
      fortuneType = 'excellent';
    } else if (fortuneScore >= 60) {
      fortuneType = 'good';
    } else if (fortuneScore <= 20) {
      fortuneType = 'bad';
    } else if (fortuneScore <= 40) {
      fortuneType = 'poor';
    }

    // 各属性と相性の組み合わせに応じたテンプレートを作成
    const dayDescription = this.getDayDescription(userElement, stemElement, fortuneType);
    const personalGoalAdvice = this.getPersonalGoalAdvice(userElement, stemElement, fortuneType, user.goal);
    const teamGoalAdvice = this.getTeamGoalAdvice(userElement, stemElement, fortuneType, user.teamRole);

    // マークダウン形式で結合
    return `# 今日のあなたの運気

${dayDescription}

# 個人目標へのアドバイス

${personalGoalAdvice}

# チーム目標へのアドバイス

${teamGoalAdvice}`;
  }

  /**
   * 日の説明を生成
   */
  private getDayDescription(userElement: string, dayElement: string, fortuneType: string): string {
    const elementDescriptions: { [key: string]: string } = {
      'wood': '木の気',
      'fire': '火の気',
      'earth': '土の気',
      'metal': '金の気',
      'water': '水の気'
    };

    const fortuneDescriptions: { [key: string]: string } = {
      'excellent': '非常に高まる一日です。あなたの才能が輝き、周囲からの評価も高まるでしょう。',
      'good': '良好な一日です。安定感があり、計画通りに物事が進むでしょう。',
      'neutral': '平穏な一日です。特に大きな変化はなく、日常業務に適しています。',
      'poor': 'やや注意が必要な一日です。細部に気を配り、慎重に行動しましょう。',
      'bad': '困難が予想される一日です。重要な決断は先送りし、身を守ることを優先しましょう。'
    };

    const relationships: { [key: string]: { [key: string]: string } } = {
      'wood': {
        'wood': '同じ木の気同士で共鳴し、創造力が高まります。',
        'fire': '木は火を生み出し、情熱とエネルギーが増します。',
        'earth': '木は土を消耗させるため、やや慎重さが必要です。',
        'metal': '金は木を切るため、障害に直面する可能性があります。',
        'water': '水は木を育てるため、成長と発展が期待できます。'
      },
      'fire': {
        'wood': '木は火を強め、直観力と表現力が活性化します。',
        'fire': '同じ火の気同士で輝きが増し、情熱的な一日になります。',
        'earth': '火は土を生み出し、安定感と実現力が高まります。',
        'metal': '火は金を溶かすため、障害を克服できるでしょう。',
        'water': '水は火を消すため、エネルギーの保存が必要です。'
      },
      'earth': {
        'wood': '木は土からエネルギーを奪うため、体力管理が重要です。',
        'fire': '火は土を強化し、基盤が固まる日です。',
        'earth': '同じ土の気同士で安定感が増し、堅実な判断ができます。',
        'metal': '土は金を生み出し、価値を創造できる日です。',
        'water': '土は水を堰き止め、感情のコントロールが鍵となります。'
      },
      'metal': {
        'wood': '金は木を制御し、規律と秩序をもたらします。',
        'fire': '金は火に弱く、過度なストレスに注意が必要です。',
        'earth': '土は金を育み、物事が形になっていく日です。',
        'metal': '同じ金の気同士で精度が高まり、細部への配慮が効果的です。',
        'water': '金は水を生み出し、知恵と洞察力が増します。'
      },
      'water': {
        'wood': '水は木を育て、アイデアと成長を促進します。',
        'fire': '水は火を弱めるため、エネルギーの分散に気をつけましょう。',
        'earth': '水は土に吸収されるため、無理な拡大は控えめに。',
        'metal': '金は水を浄化し、クリアな思考と判断力をもたらします。',
        'water': '同じ水の気同士で流動性が高まり、柔軟な対応ができます。'
      }
    };

    return `今日は${elementDescriptions[dayElement]}が強く、${fortuneDescriptions[fortuneType]}${relationships[userElement][dayElement]}`;
  }

  /**
   * 個人目標へのアドバイスを生成
   */
  private getPersonalGoalAdvice(userElement: string, dayElement: string, fortuneType: string, goal?: string): string {
    if (!goal) {
      return '個人目標が設定されていません。目標を設定すると、より具体的なアドバイスが表示されます。';
    }

    const advices: { [key: string]: { [key: string]: string } } = {
      'excellent': {
        'wood': '今日は創造力が非常に高まる日です。新しいアイデアを形にするのに最適な時期です。',
        'fire': '情熱とエネルギーに満ちた一日です。思い切った行動で大きな進展が見込めます。',
        'earth': '安定感と実現力が高まる日です。具体的な計画立案と実行に最適です。',
        'metal': '明晰な思考と決断力が冴える日です。重要な判断や選択に適しています。',
        'water': '直感と柔軟性が高まる日です。複数の選択肢から最適な道を見つけられるでしょう。'
      },
      'good': {
        'wood': '成長と発展に適した日です。少しずつ前進することで着実な成果が期待できます。',
        'fire': '活力があり、前向きな一日です。モチベーションを維持しやすく、進捗が見込めます。',
        'earth': '安定した進歩が期待できる日です。基盤を固める作業に適しています。',
        'metal': '精度の高い作業に向いている日です。細部の調整や品質向上に努めましょう。',
        'water': '情報収集と分析に適した日です。様々な角度から目標を見直してみましょう。'
      },
      'neutral': {
        'wood': '地道な努力が実を結ぶ日です。無理せず着実に進めることが大切です。',
        'fire': 'バランスの取れた一日です。エネルギーを均等に配分して取り組みましょう。',
        'earth': '堅実さが求められる日です。基本に立ち返り、土台を固めましょう。',
        'metal': '整理整頓に適した日です。不要なものを取り除き、本質に集中しましょう。',
        'water': '内省と準備に適した日です。次のステップの計画を練り直してみましょう。'
      },
      'poor': {
        'wood': '成長の停滞を感じる日かもしれません。小さな一歩に価値を見出しましょう。',
        'fire': 'エネルギーがやや低下する日です。無理をせず、重要なタスクに集中しましょう。',
        'earth': '予期せぬ障害に直面するかもしれません。柔軟に計画を調整する姿勢が重要です。',
        'metal': '判断力がやや鈍る日です。重要な決断は延期し、情報収集に努めましょう。',
        'water': '感情の波を感じる日です。客観的な視点を保つよう心がけましょう。'
      },
      'bad': {
        'wood': '成長が妨げられると感じる日です。今は種を蒔く時期と考え、将来の準備をしましょう。',
        'fire': 'エネルギーが大きく低下する日です。休息を取り、体力の回復を優先しましょう。',
        'earth': '計画の遅延や変更が生じる可能性があります。柔軟性を持ち、適応することが重要です。',
        'metal': '判断力と集中力が低下する日です。重要な決断や精密な作業は避けましょう。',
        'water': '不安や混乱を感じる日かもしれません。基本に立ち返り、シンプルに考えましょう。'
      }
    };

    return `${goal}という目標に対して、${advices[fortuneType][userElement]}日々の小さな進歩を大切にし、焦らず着実に前進していきましょう。`;
  }

  /**
   * チーム目標へのアドバイスを生成
   */
  private getTeamGoalAdvice(userElement: string, dayElement: string, fortuneType: string, teamRole?: string): string {
    if (!teamRole) {
      return 'チームに所属していないか、役割が設定されていません。チームに参加し役割を設定すると、より具体的なアドバイスが表示されます。';
    }

    const roleAdvices: { [key: string]: string } = {
      'リーダー': 'チームをまとめる役割として、今日は',
      'マネージャー': 'チームを管理する立場として、今日は',
      'エンジニア': '技術的な専門家として、今日は',
      'デザイナー': 'クリエイティブな視点を持つあなたは、今日は',
      'コンサルタント': '専門的なアドバイスを提供する立場として、今日は',
      'アナリスト': 'データを分析する役割として、今日は',
      'マーケター': 'マーケティングの専門家として、今日は',
      'セールス': '営業担当として、今日は',
      'カスタマーサポート': '顧客対応の専門家として、今日は',
      'プロダクトマネージャー': '製品管理の立場から、今日は'
    };

    // ロールに応じたアドバイスの前文を選択（一致するキーがなければデフォルト）
    let rolePrefix = '任務遂行の一員として、今日は';
    for (const role in roleAdvices) {
      if (teamRole.includes(role)) {
        rolePrefix = roleAdvices[role];
        break;
      }
    }

    const teamAdvices: { [key: string]: { [key: string]: string } } = {
      'excellent': {
        'wood': 'チーム内でアイデアを積極的に共有し、創造的な解決策を提案するのに最適な日です。',
        'fire': 'チームのモチベーションを高め、情熱を共有することで大きな前進が期待できます。',
        'earth': 'チームの基盤を強化し、安定した進捗をもたらす調整役を担うと効果的です。',
        'metal': '精度の高い分析と明確な方向性を示すことで、チームに貢献できるでしょう。',
        'water': '柔軟な思考と適応力を活かし、チームの課題解決に大きく貢献できる日です。'
      },
      'good': {
        'wood': 'チームの成長を促す新しい視点を提供することで、良い影響を与えられるでしょう。',
        'fire': '前向きなエネルギーでチームを鼓舞し、活力をもたらす役割が期待されます。',
        'earth': 'チーム内の調和を保ち、安定した進行を支える役割が重要になります。',
        'metal': '効率と精度を重視した提案や調整がチームに価値をもたらすでしょう。',
        'water': '多様な意見をまとめ、チームの方向性を整理する役割が効果的です。'
      },
      'neutral': {
        'wood': 'チーム内での意見交換を通じて、新たな可能性を模索する日です。',
        'fire': 'バランスの取れた関わりで、チームの雰囲気を維持する役割が求められます。',
        'earth': '基本的なルーチンを確実にこなし、チームの安定を支えましょう。',
        'metal': 'プロセスの見直しや改善点の提案が、チームに貢献する方法です。',
        'water': '情報収集と共有に注力し、チームの知識ベースを強化しましょう。'
      },
      'poor': {
        'wood': 'チーム内での意見の相違に対して、柔軟な姿勢で対応することが重要です。',
        'fire': 'エネルギーを保存しながら、チームの核となる活動に焦点を当てましょう。',
        'earth': '予期せぬ変更があっても、チームの安定を保つための調整に努めましょう。',
        'metal': '細部に気を配りながらも、完璧主義に陥らないバランス感覚が重要です。',
        'water': 'チーム内の感情的な波に流されず、客観的な視点を提供しましょう。'
      },
      'bad': {
        'wood': '今日はチーム内の対立を避け、共通点を見つけることに注力しましょう。',
        'fire': 'チームのエネルギーが低下している時こそ、冷静さと忍耐が求められます。',
        'earth': '急な変更や混乱の中でも、チームの基盤を守る役割に徹しましょう。',
        'metal': '批判的な意見は控え、建設的なフィードバックを心がけましょう。',
        'water': 'チーム内の不安や混乱に対して、落ち着いた対応で安心感を提供しましょう。'
      }
    };

    // チームメンバーとの相性アドバイス
    const compatibilityMap: Record<string, Record<string, string>> = {
      'wood': {
        'fire': '火の気質を持つメンバーとの協力が特に効果的です。',
        'water': '水の気質を持つメンバーとのコラボレーションで創造性が高まります。'
      },
      'fire': {
        'wood': '木の気質を持つメンバーからエネルギーを得られるでしょう。',
        'earth': '土の気質を持つメンバーとの協力で安定した成果が期待できます。'
      },
      'earth': {
        'fire': '火の気質を持つメンバーのアイデアを形にする役割が適しています。',
        'metal': '金の気質を持つメンバーとの協力で細部まで完成度の高い成果が出せるでしょう。'
      },
      'metal': {
        'earth': '土の気質を持つメンバーの安定感と組み合わせると効果的です。',
        'water': '水の気質を持つメンバーの柔軟性と相互補完できます。'
      },
      'water': {
        'metal': '金の気質を持つメンバーの明晰さと組み合わさると良い結果が期待できます。',
        'wood': '木の気質を持つメンバーの成長を促進する関係性が築けるでしょう。'
      }
    };
    
    // ユーザーの属性と日柱の属性に基づいたアドバイスを取得
    const compatibilityAdvice = compatibilityMap[userElement]?.[dayElement] || '';

    return `${rolePrefix}${teamAdvices[fortuneType][userElement]} ${compatibilityAdvice}`;
  }

  /**
   * ラッキーアイテムを生成する
   * @param userElement ユーザーの五行属性
   * @param heavenlyStem 天干
   * @param earthlyBranch 地支
   * @returns ラッキーアイテム情報
   */
  private generateLuckyItems(
    userElement: string,
    heavenlyStem: string,
    earthlyBranch: string
  ): { color: string; item: string; drink: string } {
    // 相性が良い属性を取得
    const stemElement = this.getStemElement(heavenlyStem);
    let luckyElement = this.getLuckyElement(userElement, stemElement);

    // 属性に対応するラッキーアイテムを返す
    const luckyItems = this.getLuckyItemsByElement(luckyElement);
    return luckyItems;
  }

  /**
   * 属性に応じたラッキーアイテムを取得
   * @param element 五行属性
   * @returns ラッキーアイテム情報
   */
  private getLuckyItemsByElement(element: string): { color: string; item: string; drink: string } {
    const luckyItemsByElement: { [key: string]: { color: string; item: string; drink: string }[] } = {
      'wood': [
        { color: 'グリーン', item: '観葉植物', drink: '緑茶' },
        { color: 'ライトグリーン', item: '木製ペン', drink: 'ハーブティー' },
        { color: 'オリーブ', item: 'ノート', drink: '野菜ジュース' }
      ],
      'fire': [
        { color: 'レッド', item: 'キャンドル', drink: 'ルイボスティー' },
        { color: 'オレンジ', item: '赤いマグカップ', drink: '温かいコーヒー' },
        { color: 'ピンク', item: 'ライター', drink: 'トマトジュース' }
      ],
      'earth': [
        { color: 'イエロー', item: 'クリスタル', drink: 'ウーロン茶' },
        { color: 'ベージュ', item: '陶器のフィギュア', drink: 'ミルクティー' },
        { color: 'ブラウン', item: '写真立て', drink: 'ココア' }
      ],
      'metal': [
        { color: 'ホワイト', item: '腕時計', drink: '白ワイン' },
        { color: 'シルバー', item: 'コイン', drink: '牛乳' },
        { color: 'ゴールド', item: 'キーホルダー', drink: 'シャンパン' }
      ],
      'water': [
        { color: 'ブルー', item: '青いペン', drink: 'クリアな水' },
        { color: 'ブラック', item: 'ガラスの置物', drink: '炭酸水' },
        { color: 'ネイビー', item: 'ハンカチ', drink: 'コーヒー' }
      ]
    };

    // ランダムに選択
    const items = luckyItemsByElement[element];
    return items[Math.floor(Math.random() * items.length)];
  }

  /**
   * ユーザーと日柱の相性から、ラッキーな五行属性を決定
   * @param userElement ユーザーの五行属性
   * @param dayElement 日柱の五行属性
   * @returns ラッキーな五行属性
   */
  private getLuckyElement(userElement: string, dayElement: string): string {
    // 相生関係（userElementを生じさせる属性、またはuserElementが生じさせる属性）
    const generating: { [key: string]: string } = {
      'wood': 'water', // 木は水から生まれる
      'fire': 'wood',  // 火は木から生まれる
      'earth': 'fire', // 土は火から生まれる
      'metal': 'earth', // 金は土から生まれる
      'water': 'metal'  // 水は金から生まれる
    };

    const generated: { [key: string]: string } = {
      'water': 'wood', // 水は木を生む
      'wood': 'fire',  // 木は火を生む
      'fire': 'earth', // 火は土を生む
      'earth': 'metal', // 土は金を生む
      'metal': 'water'  // 金は水を生む
    };

    // 日柱属性とユーザー属性の関係に基づいてラッキー属性を決定
    if (dayElement === userElement) {
      // 同じ属性の場合、その属性を強化するもの（生じさせる属性）
      return generating[userElement];
    } else if (dayElement === generating[userElement]) {
      // 日柱がユーザーを生じさせる場合、ユーザーが生じさせる属性
      return generated[userElement];
    } else if (dayElement === generated[userElement]) {
      // 日柱がユーザーから生じる場合、ユーザーを生じさせる属性
      return generating[userElement];
    } else {
      // その他の場合、ユーザー属性と日柱属性の中間的な属性
      const elements = ['wood', 'fire', 'earth', 'metal', 'water'];
      const userIndex = elements.indexOf(userElement);
      const dayIndex = elements.indexOf(dayElement);
      // 中間または安定的な属性を返す
      return elements[(userIndex + dayIndex) % 5];
    }
  }

  /**
   * 天干の五行属性を取得
   * @param heavenlyStem 天干
   * @returns 五行属性
   */
  private getStemElement(heavenlyStem: string): string {
    const stemElements: { [key: string]: string } = {
      '甲': 'wood', '乙': 'wood',
      '丙': 'fire', '丁': 'fire',
      '戊': 'earth', '己': 'earth',
      '庚': 'metal', '辛': 'metal',
      '壬': 'water', '癸': 'water'
    };
    return stemElements[heavenlyStem] || 'earth'; // デフォルトは土
  }

  /**
   * 地支の五行属性を取得
   * @param earthlyBranch 地支
   * @returns 五行属性
   */
  private getBranchElement(earthlyBranch: string): string {
    const branchElements: { [key: string]: string } = {
      '子': 'water', '丑': 'earth',
      '寅': 'wood', '卯': 'wood',
      '辰': 'earth', '巳': 'fire',
      '午': 'fire', '未': 'earth',
      '申': 'metal', '酉': 'metal',
      '戌': 'earth', '亥': 'water'
    };
    return branchElements[earthlyBranch] || 'earth'; // デフォルトは土
  }

  /**
   * 五行属性間の相性を計算
   * @param element1 属性1
   * @param element2 属性2
   * @returns 相性スコア（0-5）
   */
  private calculateElementCompatibility(element1: string, element2: string): number {
    if (element1 === element2) {
      // 同じ属性同士は相性が良い
      return 5;
    }

    // 相生関係（生じさせる関係）
    const generatingRelations: [string, string][] = [
      ['water', 'wood'],  // 水は木を育てる
      ['wood', 'fire'],   // 木は火を燃やす
      ['fire', 'earth'],  // 火は土を作る
      ['earth', 'metal'], // 土は金を生み出す
      ['metal', 'water']  // 金は水を浄化する
    ];

    // 相克関係（抑制する関係）
    const restrictingRelations: [string, string][] = [
      ['wood', 'earth'],  // 木は土から養分を奪う
      ['earth', 'water'], // 土は水を堰き止める
      ['water', 'fire'],  // 水は火を消す
      ['fire', 'metal'],  // 火は金を溶かす
      ['metal', 'wood']   // 金は木を切る
    ];

    // 相生関係チェック
    for (const [gen, rec] of generatingRelations) {
      if ((element1 === gen && element2 === rec) || (element2 === gen && element1 === rec)) {
        return 4; // 相生関係は良い相性
      }
    }

    // 相克関係チェック
    for (const [res, sub] of restrictingRelations) {
      if (element1 === res && element2 === sub) {
        return 2; // element1がelement2を抑制する場合は中程度の相性
      }
      if (element2 === res && element1 === sub) {
        return 1; // element2がelement1を抑制する場合は低い相性
      }
    }

    // その他の関係（間接的な関係）
    return 3; // 中立的な相性
  }
}

// サービスのインスタンスをエクスポート
export const fortuneService = new FortuneService();
