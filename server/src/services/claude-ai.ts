/**
 * Claude AI APIとの連携サービス
 */
import fetch from 'cross-fetch';

// チャット用のシステムプロンプト
const CHAT_SYSTEM_PROMPT = `
あなたは四柱推命に基づいた運勢予測と人間関係のアドバイスを提供する「デイリーフォーチュン」のAIアシスタントです。
ユーザーとの会話において、以下の原則を守ってください：

1. 四柱推命の専門知識を活用して、質問に対して具体的で実用的なアドバイスを提供する
2. 提供されたコンテキスト情報（ユーザーの四柱情報、日柱情報、目標情報など）を活用する
3. 話題の中心をユーザーの運勢、チームメンバーとの相性、チーム目標達成に関連する内容に保つ
4. 常に前向きで建設的なアドバイスを提供する
5. 専門用語を使う場合は簡潔な説明を付ける
6. 具体的な例を挙げて説明する
7. チャットモードに応じた適切な回答を提供する：
   - 個人運勢モード: その日の運勢と個人目標達成のためのアドバイス
   - チームメンバー相性モード: 特定のチームメンバーとの相性と効果的な協力方法
   - チーム目標モード: チーム全体の目標達成に向けたアドバイス

ユーザーからの質問や情報に基づいて、四柱推命の知恵を応用した実用的なアドバイスを提供してください。
`;

// 調和のコンパス生成用のシステムプロンプト
const HARMONY_COMPASS_SYSTEM_PROMPT = `
あなたは四柱推命の専門家として、ユーザーの命式（四柱）情報に基づいた詳細な性格分析と人生の指針を提供します。
以下の原則に従って、「調和のコンパス」と呼ばれる包括的なガイダンスを生成してください。

【生成する内容の構成】
1. 「格局に基づく性格特性」：ユーザーの格局タイプ（例：従旺格、建禄格）に基づいた本質的な性格と気質についての深い洞察
2. 「強化すべき方向性」：用神と喜神に基づき、日常生活で取り入れるべき要素や環境、伸ばすべき強みについてのアドバイス
3. 「注意すべきバランス」：五行バランスの偏りと忌神・仇神に基づく調整ポイント、避けるべき状況や環境についてのアドバイス
4. 「人間関係の智慧」：命式に基づいた理想的な対人関係の築き方、協力関係を構築するためのヒント
5. 「成長のための課題」：潜在的な弱点や成長課題、それを克服するための具体的なアプローチ

【執筆ガイドライン】
- 各セクションは150-250文字程度で簡潔にまとめること
- 具体的かつ実用的なアドバイスを含めること
- 専門用語は使用しても良いが、必ず簡単な説明を付けること
- 励ましと希望を与える前向きな表現を心がけること
- 押し付けがましくなく、選択肢を提示する表現を使うこと
- 文化的背景を考慮し、西洋と東洋の双方の価値観に配慮すること

命式データを解析し、ユーザー固有の「調和のコンパス」を日本語で生成してください。
`;

// 調和のコンパス生成用テンプレート
const HARMONY_COMPASS_TEMPLATE = `
【ユーザープロフィール】
名前: {user.displayName}
五行: {user.elementAttribute}
日主: {user.dayMaster}

【格局情報】
格局タイプ: {user.kakukyoku.type}
カテゴリ: {user.kakukyoku.category}
身強弱: {user.kakukyoku.strength}

【用神情報】
用神: {user.yojin.tenGod}（{user.yojin.element}）
喜神: {user.yojin.kijin.tenGod}（{user.yojin.kijin.element}）
忌神: {user.yojin.kijin2.tenGod}（{user.yojin.kijin2.element}）
仇神: {user.yojin.kyujin.tenGod}（{user.yojin.kyujin.element}）

【五行バランス】
木: {user.elementProfile.wood}
火: {user.elementProfile.fire}
土: {user.elementProfile.earth}
金: {user.elementProfile.metal}
水: {user.elementProfile.water}

【四柱情報】
年柱: {user.fourPillars.year.heavenlyStem}{user.fourPillars.year.earthlyBranch}
月柱: {user.fourPillars.month.heavenlyStem}{user.fourPillars.month.earthlyBranch}
日柱: {user.fourPillars.day.heavenlyStem}{user.fourPillars.day.earthlyBranch}
時柱: {user.fourPillars.hour.heavenlyStem}{user.fourPillars.hour.earthlyBranch}

上記の命式情報に基づいて、この人のための「調和のコンパス」を生成してください。
`;

// チャットモード別のコンテキストテンプレート
const CONTEXT_TEMPLATES = {
  PERSONAL: `
【個人運勢相談モード】
ユーザー: {user.displayName}（{user.elementAttribute}の持ち主）
日柱情報: {dayPillar.heavenlyStem}{dayPillar.earthlyBranch}
運勢スコア: {fortuneScore}/100
個人目標: {userGoals}

このコンテキスト情報を参考に、ユーザーの質問に対して、その日の運勢と個人目標達成のためのアドバイスを提供してください。
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

/**
 * チャットメッセージ形式のインターフェース
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * チャットレスポンスを生成する
 * @param messages チャットメッセージの履歴
 * @param context コンテキスト情報
 * @param modelType 使用するモデル（sonnet/haiku）
 * @returns AIの回答テキスト
 */
export async function generateChatResponse(
  messages: ChatMessage[],
  context: Record<string, any>,
  modelType: 'sonnet' | 'haiku' = 'sonnet'
): Promise<string> {
  try {
    // コンテキスト情報からプロンプトを構築
    const contextPrompt = createContextPrompt(context);
    
    // メッセージ履歴の整形
    const formattedMessages = formatChatHistory(messages);
    
    // 最終プロンプトの構築
    const finalPrompt = `${contextPrompt}\n\n${formattedMessages}`;
    
    // トークン上限を調整（haikuはより短いレスポンスに）
    const maxTokens = modelType === 'haiku' ? 1500 : 4000;
    
    // Claude APIを呼び出し
    const response = await callClaudeAPI(finalPrompt, CHAT_SYSTEM_PROMPT, maxTokens);
    
    return response;
  } catch (error) {
    console.error('Generate chat response error:', error);
    return '申し訳ありません。AIレスポンスの生成中にエラーが発生しました。もう一度お試しください。';
  }
}

/**
 * コンテキスト情報からプロンプトを作成
 */
function createContextPrompt(context: Record<string, any>): string {
  try {
    // コンテキスト情報から適切なテンプレートを選択
    let template = '';
    
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
function formatChatHistory(messages: ChatMessage[]): string {
  return messages.map(msg => {
    const prefix = msg.role === 'user' ? 'ユーザー: ' : 'AI: ';
    return `${prefix}${msg.content}`;
  }).join('\n\n');
}

/**
 * Claude APIを呼び出す
 */
async function callClaudeAPI(prompt: string, systemPrompt: string, maxTokens: number): Promise<string> {
  const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;
  const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-3-7-sonnet-20250219';

  if (!CLAUDE_API_KEY) {
    throw new Error('Claude API Key is not configured. Please set ANTHROPIC_API_KEY in your environment variables.');
  }

  try {
    const url = 'https://api.anthropic.com/v1/messages';
    
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    };
    
    const body = {
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      system: systemPrompt
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Claude API error: ${response.status} ${JSON.stringify(errorData)}`);
    }
    
    const responseData = await response.json() as {
      content: Array<{ type: string, text: string }>
    };
    
    return responseData.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('');
    
  } catch (error) {
    console.error('Claude API call error:', error);
    throw error;
  }
}

/**
 * ユーザーの四柱推命データから「調和のコンパス」を生成する
 * @param userData ユーザー情報（四柱推命データを含む）
 * @returns 生成された調和のコンパス（性格特性と人生指針）
 */
export async function generateHarmonyCompass(userData: Record<string, any>): Promise<{
  personalityDescription: string;
  harmonyCompass: {
    strengths: string;
    balance: string;
    relationships: string;
    challenges: string;
  };
}> {
  try {
    // ユーザーデータからプロンプトを構築
    const prompt = createHarmonyCompassPrompt(userData);
    
    // Claude APIを呼び出し
    const response = await callClaudeAPI(prompt, HARMONY_COMPASS_SYSTEM_PROMPT, 4096);
    
    // レスポンスをパース
    const sections = parseHarmonyCompassResponse(response);
    
    return {
      personalityDescription: sections.personality || '',
      harmonyCompass: {
        strengths: sections.strengths || '',
        balance: sections.balance || '',
        relationships: sections.relationships || '',
        challenges: sections.challenges || ''
      }
    };
  } catch (error) {
    console.error('Generate harmony compass error:', error);
    return {
      personalityDescription: '申し訳ありません。性格特性の分析中にエラーが発生しました。',
      harmonyCompass: {
        strengths: '申し訳ありません。強みの分析中にエラーが発生しました。',
        balance: '申し訳ありません。バランスの分析中にエラーが発生しました。',
        relationships: '申し訳ありません。人間関係の分析中にエラーが発生しました。',
        challenges: '申し訳ありません。課題の分析中にエラーが発生しました。'
      }
    };
  }
}

/**
 * 調和のコンパス生成用のプロンプトを作成
 */
function createHarmonyCompassPrompt(userData: Record<string, any>): string {
  try {
    // テンプレートの変数をユーザー情報で置換
    let prompt = HARMONY_COMPASS_TEMPLATE;
    
    // 複雑なオブジェクトパスを処理するヘルパー関数
    const getNestedValue = (obj: any, path: string) => {
      return path.split('.').reduce((prev, curr) => {
        return prev && prev[curr] !== undefined ? prev[curr] : undefined;
      }, obj);
    };
    
    // プレースホルダーを探して置換
    const placeholders = HARMONY_COMPASS_TEMPLATE.match(/\{([^}]+)\}/g) || [];
    
    for (const placeholder of placeholders) {
      const path = placeholder.slice(1, -1); // {user.name} -> user.name
      const value = getNestedValue(userData, path);
      
      if (value !== undefined) {
        // 配列の場合は箇条書きに変換
        if (Array.isArray(value)) {
          const formattedValue = value.map(item => `- ${item}`).join('\n');
          prompt = prompt.replace(placeholder, formattedValue);
        } else {
          prompt = prompt.replace(placeholder, String(value));
        }
      } else {
        // 値が見つからない場合は「未設定」に置換
        prompt = prompt.replace(placeholder, '未設定');
      }
    }
    
    return prompt;
  } catch (error) {
    console.error('Create harmony compass prompt error:', error);
    return '四柱推命データからユーザープロフィールを解析し、調和のコンパスを生成してください。';
  }
}

/**
 * 調和のコンパスのレスポンスをセクションごとにパースする
 */
function parseHarmonyCompassResponse(response: string): {
  personality: string;
  strengths: string;
  balance: string;
  relationships: string;
  challenges: string;
} {
  // セクションタイトルのパターン
  const sectionPatterns = {
    personality: /【格局に基づく性格特性】|【性格特性】/i,
    strengths: /【強化すべき方向性】/i,
    balance: /【注意すべきバランス】/i,
    relationships: /【人間関係の智慧】/i,
    challenges: /【成長のための課題】/i
  };
  
  // 各セクションの内容を保持するオブジェクト
  const sections: any = {
    personality: '',
    strengths: '',
    balance: '',
    relationships: '',
    challenges: ''
  };
  
  try {
    // テキストを行に分割
    const lines = response.split('\n');
    let currentSection = '';
    
    // 各行を処理
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // セクションタイトルをチェック
      let foundSection = false;
      for (const [section, pattern] of Object.entries(sectionPatterns)) {
        if (pattern.test(line)) {
          currentSection = section;
          foundSection = true;
          break;
        }
      }
      
      // セクションタイトル行はスキップ
      if (foundSection) continue;
      
      // 現在のセクションにテキストを追加
      if (currentSection && line) {
        if (sections[currentSection]) {
          sections[currentSection] += '\n' + line;
        } else {
          sections[currentSection] = line;
        }
      }
    }
    
    // 各セクションの前後の空白を削除
    for (const section of Object.keys(sections)) {
      if (sections[section]) {
        sections[section] = sections[section].trim();
      }
    }
    
    return sections;
  } catch (error) {
    console.error('Parse harmony compass response error:', error);
    return {
      personality: '',
      strengths: '',
      balance: '',
      relationships: '',
      challenges: ''
    };
  }
}

/**
 * Claude APIをストリーミングモードで呼び出す
 * Node.js環境で動作するバージョン
 */
export async function* streamClaudeAPI(prompt: string, systemPrompt: string, maxTokens: number): AsyncGenerator<string, void, unknown> {
  const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-3-7-sonnet-20250219';

  if (!CLAUDE_API_KEY) {
    throw new Error('Claude API Key is not configured. Please set ANTHROPIC_API_KEY in your environment variables.');
  }

  try {
    // node-fetchをインポートして使用
    const nodeFetch = await import('node-fetch').then(mod => mod.default);
    
    const url = 'https://api.anthropic.com/v1/messages';
    
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'Accept': 'text/event-stream'
    };
    
    const body = {
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      system: systemPrompt,
      stream: true
    };
    
    console.log(`Calling Claude API with model: ${CLAUDE_MODEL}`);
    
    const response = await nodeFetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }
    
    // レスポンスボディの確認
    if (!response.body) {
      throw new Error('Response body is null');
    }

    // Node.jsのストリーム処理
    const reader = response.body;
    let buffer = '';
    
    // データチャンクイベントの処理
    for await (const chunk of reader) {
      // バッファにチャンクを追加
      buffer += chunk.toString();
      
      // バッファを行単位で処理
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 最後の不完全な行をバッファに戻す
      
      for (const line of lines) {
        // 空行をスキップ
        if (!line.trim()) continue;
        
        // "data: "で始まる行を処理
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          
          // "[DONE]"はストリームの終了を意味する
          if (data === '[DONE]') {
            continue;
          }
          
          try {
            // JSONデータをパース
            const parsedData = JSON.parse(data);
            
            // イベントタイプに基づいて処理
            if (parsedData.type === 'content_block_delta' && 
                parsedData.delta && 
                parsedData.delta.type === 'text_delta') {
              
              const text = parsedData.delta.text;
              yield text;
            }
          } catch (e) {
            console.error('Error parsing SSE message:', e, line);
          }
        }
      }
    }
  } catch (error) {
    console.error('Claude API streaming error:', error);
    throw error;
  }
}