/**
 * 韓国式四柱推命計算の共通型定義
 */

/**
 * 天干（十干）
 */
export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];

/**
 * 地支（十二支）
 */
export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

/**
 * 干支の60組合せ
 */
export const STEM_BRANCHES = [
  "甲子", "乙丑", "丙寅", "丁卯", "戊辰", "己巳", "庚午", "辛未", "壬申", "癸酉",
  "甲戌", "乙亥", "丙子", "丁丑", "戊寅", "己卯", "庚辰", "辛巳", "壬午", "癸未",
  "甲申", "乙酉", "丙戌", "丁亥", "戊子", "己丑", "庚寅", "辛卯", "壬辰", "癸巳",
  "甲午", "乙未", "丙申", "丁酉", "戊戌", "己亥", "庚子", "辛丑", "壬寅", "癸卯",
  "甲辰", "乙巳", "丙午", "丁未", "戊申", "己酉", "庚戌", "辛亥", "壬子", "癸丑",
  "甲寅", "乙卯", "丙辰", "丁巳", "戊午", "己未", "庚申", "辛酉", "壬戌", "癸亥"
];

/**
 * 十二運星
 */
export const TWELVE_FORTUNES = [
  "長生", "沐浴", "冠帯", "臨官", "帝旺", "衰", 
  "病", "死", "墓", "絶", "胎", "養"
];

/**
 * 十二神殺
 */
export const TWELVE_SPIRIT_KILLERS = [
  "年殺", "月殺", "日殺", "劫殺", "望神殺", "天殺", 
  "地殺", "六害殺", "長生殺", "反安殺", "火開殺", "逆馬殺"
];

/**
 * 隠された天干の十神関係情報
 */
export interface HiddenStemTenGod {
  stem: string; // 蔵干
  tenGod: string; // 十神関係
}

/**
 * 四柱の柱
 */
export interface Pillar {
  stem: string; // 天干
  branch: string; // 地支
  fullStemBranch: string; // 天干地支の組み合わせ
  hiddenStems?: string[]; // 蔵干（地支に内包される天干）
  fortune?: string; // 十二運星
  spiritKiller?: string; // 十二神殺
  branchTenGod?: string; // 地支の十神関係
  hiddenStemsTenGods?: HiddenStemTenGod[]; // 蔵干の十神関係情報
}

/**
 * 四柱情報
 */
export interface FourPillars {
  yearPillar: Pillar; // 年柱
  monthPillar: Pillar; // 月柱
  dayPillar: Pillar; // 日柱
  hourPillar: Pillar; // 時柱
}

/**
 * 性別の型
 */
export type Gender = 'M' | 'F';

/**
 * 十神関係の型
 */
export type TenGodRelation = string;

/**
 * 計算オプション
 */
export interface SajuOptions {
  gender?: Gender; // 性別（M=男性, F=女性）
  location?: string | { // 場所（都市名または座標）
    longitude: number; // 経度
    latitude: number; // 緯度
  };
  useLocalTime?: boolean; // 地方時を使用するか
  useKoreanMethod?: boolean; // 韓国式計算法を使用するか
  sampleDate?: Date; // サンプルデータの日付（テスト用）
  useDST?: boolean; // 夏時間を考慮するか（デフォルトはtrue）
  useLunarMonth?: boolean; // 旧暦月を使用するか
  useSolarTerms?: boolean; // 節気を使用するか
  ignoreSpecialCases?: boolean; // 特殊ケースを無視するか
}

/**
 * 旧暦日付情報
 */
export interface LunarDate {
  lunarYear: number; // 旧暦年
  lunarMonth: number; // 旧暦月
  lunarDay: number; // 旧暦日
  isLeapMonth: boolean; // 閏月かどうか
  stemBranch?: string; // 日の干支
}

/**
 * 旧暦と干支のカレンダーデータ
 */
export interface CalendarDay {
  solarDate: string; // 新暦日付（YYYY-MM-DD）
  lunarDate: string; // 旧暦日付（例: 3/4）
  stemBranch: string; // 干支（例: 庚子）
  lunarMonth: number; // 旧暦月
  lunarDay: number; // 旧暦日
  isLeapMonth: boolean; // 閏月かどうか
  solarTerm?: string; // 節気（該当する場合のみ）
}