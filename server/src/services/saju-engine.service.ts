import { SajuEngine, SajuResult } from '../../../sajuengine_package/src';
import { DateTimeProcessor } from '../../../sajuengine_package/src/DateTimeProcessor';
import { ValidationError } from '../utils';

// 地理座標インターフェース（SajuProfile削除に伴いローカル定義）
interface IGeoCoordinates {
  longitude: number; // 経度（東経プラス、西経マイナス）
  latitude: number;  // 緯度（北緯プラス、南緯マイナス）
}

/**
 * 四柱推命エンジンサービス
 * sajuengine_packageと連携して四柱推命計算を行うサービス
 */
export class SajuEngineService {
  private sajuEngine: SajuEngine;
  private dateTimeProcessor: DateTimeProcessor;

  constructor() {
    this.sajuEngine = new SajuEngine();
    this.dateTimeProcessor = new DateTimeProcessor({ useLocalTime: true });
  }
  
  /**
   * 利用可能な出生地（都市）のリストを取得
   * @returns 都市名のリスト
   */
  getAvailableCities(): string[] {
    return this.dateTimeProcessor.getAvailableCities();
  }
  
  /**
   * 都市名から座標情報を取得（柔軟なマッチング）
   * @param cityName 都市名
   * @returns 座標情報（見つからない場合はundefined）
   */
  getCityCoordinates(cityName: string): IGeoCoordinates | undefined {
    if (!cityName) return undefined;
    
    // 完全一致で検索
    const exactCoordinates = this.dateTimeProcessor.getCityCoordinates(cityName);
    if (exactCoordinates) {
      return {
        longitude: exactCoordinates.longitude,
        latitude: exactCoordinates.latitude
      };
    }
    
    // 都市名から都道府県サフィックスを削除（例: 東京都→東京、大阪府→大阪）
    const simplifiedName = cityName
      .replace(/[都道府県市区町村]$/, '')  // 末尾の行政区分を削除
      .replace(/\s+/g, '');                // 空白を削除
    
    // 簡略化した名前で再検索
    if (simplifiedName !== cityName) {
      const simplifiedCoordinates = this.dateTimeProcessor.getCityCoordinates(simplifiedName);
      if (simplifiedCoordinates) {
        return {
          longitude: simplifiedCoordinates.longitude,
          latitude: simplifiedCoordinates.latitude
        };
      }
    }
    
    // 部分一致検索（「大阪市内」→「大阪」など）
    const availableCities = this.dateTimeProcessor.getAvailableCities();
    for (const city of availableCities) {
      if (cityName.includes(city) || city.includes(simplifiedName)) {
        const partialCoordinates = this.dateTimeProcessor.getCityCoordinates(city);
        if (partialCoordinates) {
          return {
            longitude: partialCoordinates.longitude,
            latitude: partialCoordinates.latitude
          };
        }
      }
    }
    
    return undefined;
  }
  
  /**
   * 座標情報から地方時オフセットを計算
   * @param coordinates 座標情報
   * @returns 地方時オフセット（分単位）
   */
  calculateLocalTimeOffset(coordinates: IGeoCoordinates): number {
    return this.dateTimeProcessor.getLocalTimeAdjustmentMinutes(coordinates);
  }

  /**
   * 生年月日時から四柱推命プロフィールを計算
   * @param birthDate 生年月日
   * @param birthHour 出生時間（時）
   * @param birthMinute 出生時間（分）
   * @param gender 性別 'M'=男性, 'F'=女性
   * @param location 出生地
   * @param coordinates 出生地の座標（オプション）
   * @returns 四柱推命計算結果
   */
  calculateSajuProfile(
    birthDate: Date, 
    birthHour: number, 
    birthMinute: number, 
    gender: string, 
    location: string,
    coordinates?: IGeoCoordinates
  ) {
    // 入力検証
    if (!birthDate) {
      throw new ValidationError('生年月日は必須です');
    }
    
    if (birthHour < 0 || birthHour > 23) {
      throw new ValidationError('出生時間（時）は0-23の範囲で指定してください');
    }
    
    if (birthMinute < 0 || birthMinute > 59) {
      throw new ValidationError('出生時間（分）は0-59の範囲で指定してください');
    }
    
    if (!['M', 'F'].includes(gender)) {
      throw new ValidationError('性別は"M"（男性）または"F"（女性）で指定してください');
    }
    
    if (!location) {
      throw new ValidationError('出生地は必須です');
    }
    
    // 時間計算（分も考慮）
    const hourWithMinutes = birthHour + (birthMinute / 60);
    
    // 座標情報の取得
    let birthplaceCoordinates = coordinates;
    if (!birthplaceCoordinates) {
      // 都市名から座標を取得
      birthplaceCoordinates = this.getCityCoordinates(location);
    }
    
    // 地方時調整の処理
    let adjustedBirthDate = new Date(birthDate);
    let adjustedHourWithMinutes = hourWithMinutes;
    
    if (birthplaceCoordinates) {
      // 地方時オフセットを計算
      const localTimeOffset = this.calculateLocalTimeOffset(birthplaceCoordinates);
      
      if (localTimeOffset !== 0) {
        // 地方時調整済みの時間を計算
        const processedDateTime = this.dateTimeProcessor.processDateTime(
          adjustedBirthDate,
          hourWithMinutes,
          birthplaceCoordinates
        );
        
        // 調整済み日時を使用
        const { year, month, day, hour, minute } = processedDateTime.adjustedDate;
        adjustedBirthDate = new Date(year, month - 1, day);
        adjustedHourWithMinutes = hour + minute / 60;
        
        console.log(`地方時調整: ${location} の時差は ${localTimeOffset} 分です。`);
        console.log(`元の日時: ${birthDate.toISOString()} ${hourWithMinutes}`);
        console.log(`調整後の日時: ${adjustedBirthDate.toISOString()} ${adjustedHourWithMinutes}`);
      }
    }
    
    // sajuengine_packageを使用して四柱推命計算
    try {
      // gender を 'M' | 'F' に型キャスト（SajuEngineの型定義に合わせる）
      // 地方時調整済みの日時を使用
      const result = this.sajuEngine.calculate(adjustedBirthDate, adjustedHourWithMinutes, gender as 'M' | 'F', location);
      
      // 型の互換性を確保するための処理（SajuResultの型定義に合わせる）
      if (result.lunarDate === null) {
        result.lunarDate = undefined;
      }
      
      // 地方時調整情報を結果に追加
      if (birthplaceCoordinates) {
        (result as any).birthplaceCoordinates = birthplaceCoordinates;
        (result as any).localTimeOffset = this.calculateLocalTimeOffset(birthplaceCoordinates);
      }
      
      return result as SajuResult;
    } catch (error) {
      if (error instanceof Error) {
        throw new ValidationError(`四柱推命計算エラー: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 現在の日柱情報を取得
   * @returns 現在の四柱推命情報
   */
  getCurrentDayPillar() {
    // 現在の日柱情報を取得
    try {
      const currentSaju = this.sajuEngine.getCurrentSaju();
      return {
        date: new Date(),
        dayPillar: currentSaju.fourPillars.dayPillar,
        heavenlyStem: currentSaju.fourPillars.dayPillar.stem,
        earthlyBranch: currentSaju.fourPillars.dayPillar.branch,
        energyDescription: this.generateEnergyDescription(
          currentSaju.fourPillars.dayPillar.stem,
          currentSaju.fourPillars.dayPillar.branch
        )
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new ValidationError(`日柱取得エラー: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 指定された日付の日柱情報を取得
   * @param date 日付
   * @returns 指定日の四柱推命情報
   */
  getDayPillarByDate(date: Date) {
    try {
      if (!date) {
        throw new ValidationError('日付は必須です');
      }
      
      // SajuEngineに対して指定された日付の正午で計算
      // 時間は固定で12時（正午）とし、日柱情報のみを取得
      const noon = new Date(date);
      noon.setHours(12, 0, 0, 0);
      
      // 特定日のSaju情報を計算（性別はM、場所は東京を仮定）
      // 日柱の算出には性別と場所は関係ないため、任意の値で問題ない
      const result = this.sajuEngine.calculate(noon, 12, 'M', 'Tokyo, Japan');
      
      // 計算結果から日柱情報のみを抽出
      return {
        date: date,
        dayPillar: result.fourPillars.dayPillar,
        heavenlyStem: result.fourPillars.dayPillar.stem,
        earthlyBranch: result.fourPillars.dayPillar.branch,
        hiddenStems: result.fourPillars.dayPillar.hiddenStems || [],
        energyDescription: this.generateEnergyDescription(
          result.fourPillars.dayPillar.stem,
          result.fourPillars.dayPillar.branch
        )
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new ValidationError(`日柱取得エラー: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 五行属性を取得（メイン属性）
   * @param result 四柱推命計算結果
   * @returns 五行属性（wood, fire, earth, metal, water）
   */
  getMainElement(result: any): string {
    if (!result || !result.elementProfile) {
      return 'earth'; // デフォルト値
    }
    
    // mainElementが存在しない場合の対処
    if (!result.elementProfile.mainElement) {
      // データの存在確認と適切なデフォルト値の設定
      if (result.elementProfile.wood && 
          result.elementProfile.fire && 
          result.elementProfile.earth && 
          result.elementProfile.metal && 
          result.elementProfile.water) {
        // 最大の要素を見つける
        const elements = [
          { name: 'wood', value: result.elementProfile.wood },
          { name: 'fire', value: result.elementProfile.fire },
          { name: 'earth', value: result.elementProfile.earth },
          { name: 'metal', value: result.elementProfile.metal },
          { name: 'water', value: result.elementProfile.water }
        ];
        
        const maxElement = elements.reduce((prev, current) => 
          (prev.value > current.value) ? prev : current
        );
        
        return maxElement.name;
      }
      
      return 'earth'; // デフォルト値
    }
    
    // 五行属性のマッピング
    const elementMapping: { [key: string]: string } = {
      '木': 'wood',
      '火': 'fire',
      '土': 'earth',
      '金': 'metal',
      '水': 'water',
      // 英語表記の場合もマッピング
      'wood': 'wood',
      'fire': 'fire',
      'earth': 'earth',
      'metal': 'metal',
      'water': 'water'
    };
    
    const mainElement = result.elementProfile.mainElement;
    return elementMapping[mainElement] || 'earth'; // デフォルト値として'earth'を使用
  }

  /**
   * サブ属性（二次的影響がある五行）を取得
   * @param result 四柱推命計算結果
   * @returns 五行属性（wood, fire, earth, metal, water）
   */
  getSecondaryElement(result: any): string | undefined {
    if (!result || !result.elementProfile) {
      return undefined;
    }
    
    // secondaryElementが存在する場合
    if (result.elementProfile.secondaryElement) {
      // 五行属性のマッピング
      const elementMapping: { [key: string]: string } = {
        '木': 'wood',
        '火': 'fire',
        '土': 'earth',
        '金': 'metal',
        '水': 'water',
        // 英語表記の場合もマッピング
        'wood': 'wood',
        'fire': 'fire',
        'earth': 'earth',
        'metal': 'metal',
        'water': 'water'
      };
      
      return elementMapping[result.elementProfile.secondaryElement];
    }
    
    // 数値データから計算する場合
    if (result.elementProfile.wood !== undefined && 
        result.elementProfile.fire !== undefined && 
        result.elementProfile.earth !== undefined && 
        result.elementProfile.metal !== undefined && 
        result.elementProfile.water !== undefined) {
      
      // メイン属性を取得して除外
      const mainElement = this.getMainElement(result);
      
      // メイン以外の要素で最大のものを見つける
      const elements = [
        { name: 'wood', value: result.elementProfile.wood },
        { name: 'fire', value: result.elementProfile.fire },
        { name: 'earth', value: result.elementProfile.earth },
        { name: 'metal', value: result.elementProfile.metal },
        { name: 'water', value: result.elementProfile.water }
      ].filter(el => el.name !== mainElement);
      
      if (elements.length > 0) {
        const secondaryElement = elements.reduce((prev, current) => 
          (prev.value > current.value) ? prev : current
        );
        
        // 値が十分大きい場合のみセカンダリ要素として返す
        if (secondaryElement.value > 0) {
          return secondaryElement.name;
        }
      }
    }
    
    return undefined;
  }

  /**
   * 天干地支の組み合わせからエネルギー説明を生成
   * @param heavenlyStem 天干
   * @param earthlyBranch 地支
   * @returns エネルギー説明文
   */
  private generateEnergyDescription(heavenlyStem: string, earthlyBranch: string): string {
    // 天干地支の組み合わせに基づいたエネルギー説明
    // 実際のプロジェクトでは、より詳細なデータベースやロジックが必要
    const stemDescriptions: { [key: string]: string } = {
      '甲': '積極的で活発なエネルギー。新たな始まりや成長を促します。',
      '乙': '柔軟で順応性のあるエネルギー。協調性と調和を重視します。',
      '丙': '明るく情熱的なエネルギー。創造性と自己表現を高めます。',
      '丁': '優しく思いやりのあるエネルギー。人間関係や感情面での洞察力があります。',
      '戊': '安定した信頼性のあるエネルギー。土台となる力と実用性を重視します。',
      '己': '受容的で内省的なエネルギー。知恵と内なる調和をもたらします。',
      '庚': '断固とした決断力のあるエネルギー。正義と規律を重んじます。',
      '辛': '洗練された美的センスのあるエネルギー。詳細への注意と分析力があります。',
      '壬': '流動的で柔軟なエネルギー。知性と適応力に優れています。',
      '癸': '神秘的で直感的なエネルギー。内面の知恵と癒しの力を持ちます。'
    };
    
    const branchDescriptions: { [key: string]: string } = {
      '子': '新たな始まりと可能性の時。静かな力と潜在的なエネルギーが高まります。',
      '丑': '忍耐と堅実さの時。困難に立ち向かう強さと安定性をもたらします。',
      '寅': '活力と大胆さの時。勇気ある行動と新しい挑戦を促します。',
      '卯': '成長と発展の時。調和と平和をもたらし、人間関係が円滑になります。',
      '辰': '変化と変容の時。予期せぬ出来事と新たな機会が訪れます。',
      '巳': '明晰さと洞察力の時。知性と戦略的思考が高まります。',
      '午': 'エネルギーが最も高まる時。情熱と活力に満ちた行動が促されます。',
      '未': '思いやりと協力の時。調和と共感が重要になります。',
      '申': '革新と変革の時。創造性と適応力が試されます。',
      '酉': '収穫と評価の時。成果を整理し、次へのステップを考える時期です。',
      '戌': '忠誠と献身の時。責任感と誠実さが重要になります。',
      '亥': '内省と準備の時。次のサイクルに向けた英知を育みます。'
    };
    
    const stemDesc = stemDescriptions[heavenlyStem] || '調和のとれたエネルギー。';
    const branchDesc = branchDescriptions[earthlyBranch] || '変化と安定のバランスをもたらします。';
    
    return `${stemDesc} ${branchDesc} ${heavenlyStem}${earthlyBranch}の日は、${this.getCombinedEnergy(heavenlyStem, earthlyBranch)}`;
  }

  /**
   * 天干地支の組み合わせからエネルギー特性を取得
   * @param stem 天干
   * @param branch 地支
   * @returns 組み合わせのエネルギー特性
   */
  private getCombinedEnergy(stem: string, branch: string): string {
    // 天干と地支の組み合わせに基づいたエネルギー特性
    // 実際の実装では、より複雑な相性判断ロジックが必要
    
    // 天干の五行
    const stemElements: { [key: string]: string } = {
      '甲': '木',
      '乙': '木',
      '丙': '火',
      '丁': '火',
      '戊': '土',
      '己': '土',
      '庚': '金',
      '辛': '金',
      '壬': '水',
      '癸': '水'
    };
    
    // 地支の五行
    const branchElements: { [key: string]: string } = {
      '子': '水',
      '丑': '土',
      '寅': '木',
      '卯': '木',
      '辰': '土',
      '巳': '火',
      '午': '火',
      '未': '土',
      '申': '金',
      '酉': '金',
      '戌': '土',
      '亥': '水'
    };
    
    const stemElement = stemElements[stem] || '土';
    const branchElement = branchElements[branch] || '土';
    
    // 五行の相生関係
    if (
      (stemElement === '木' && branchElement === '火') ||
      (stemElement === '火' && branchElement === '土') ||
      (stemElement === '土' && branchElement === '金') ||
      (stemElement === '金' && branchElement === '水') ||
      (stemElement === '水' && branchElement === '木')
    ) {
      return 'エネルギーが相生（相互に生かし合う）関係にあり、調和と成長をもたらします。';
    }
    
    // 五行の相克関係
    if (
      (stemElement === '木' && branchElement === '土') ||
      (stemElement === '土' && branchElement === '水') ||
      (stemElement === '水' && branchElement === '火') ||
      (stemElement === '火' && branchElement === '金') ||
      (stemElement === '金' && branchElement === '木')
    ) {
      return 'エネルギーが相克（抑制し合う）関係にあり、変化と挑戦をもたらします。';
    }
    
    // 同じ五行
    if (stemElement === branchElement) {
      return 'エネルギーが同系統で強化され、その五行の特性が際立ちます。';
    }
    
    // その他の組み合わせ
    return 'バランスのとれた多様なエネルギーが流れています。';
  }
}