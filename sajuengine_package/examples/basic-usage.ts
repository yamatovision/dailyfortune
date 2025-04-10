// 基本的な使用例
import { SajuEngine } from '../src';

// 四柱推命エンジンの初期化
const sajuEngine = new SajuEngine();

// 生年月日と時間から四柱推命情報を計算
const birthDate = new Date(1990, 0, 15); // 1990年1月15日
const birthHour = 13; // 13時 (午後1時)
const gender = 'M'; // 'M'=男性, 'F'=女性
const location = 'Tokyo'; // 位置情報（都市名または経度・緯度）

// 四柱推命情報を計算
const result = sajuEngine.calculate(birthDate, birthHour, gender, location);

// 結果を表示
console.log('====== 四柱推命計算結果 ======');
console.log('生年月日時:', birthDate.toLocaleString(), birthHour + '時');

// 四柱（年月日時の天干地支）
console.log('\n【四柱】');
console.log('年柱:', `${result.fourPillars.yearPillar.stem}${result.fourPillars.yearPillar.branch}`);
console.log('月柱:', `${result.fourPillars.monthPillar.stem}${result.fourPillars.monthPillar.branch}`);
console.log('日柱:', `${result.fourPillars.dayPillar.stem}${result.fourPillars.dayPillar.branch}`);
console.log('時柱:', `${result.fourPillars.hourPillar.stem}${result.fourPillars.hourPillar.branch}`);

// 十神関係
console.log('\n【十神関係】');
console.log('年柱天干:', result.tenGods.year);
console.log('月柱天干:', result.tenGods.month);
console.log('日柱天干:', result.tenGods.day); // 本命
console.log('時柱天干:', result.tenGods.hour);

// 地支の十神関係
console.log('\n【地支の十神関係】');
console.log('年柱地支:', result.fourPillars.yearPillar.branchTenGod);
console.log('月柱地支:', result.fourPillars.monthPillar.branchTenGod);
console.log('日柱地支:', result.fourPillars.dayPillar.branchTenGod);
console.log('時柱地支:', result.fourPillars.hourPillar.branchTenGod);

// 五行プロファイル
console.log('\n【五行プロファイル】');
console.log('主要属性:', result.elementProfile.mainElement);
console.log('副次属性:', result.elementProfile.secondaryElement);
console.log('陰陽:', result.elementProfile.yinYang);

// 十二運星
console.log('\n【十二運星】');
console.log('年柱:', result.twelveFortunes?.year);
console.log('月柱:', result.twelveFortunes?.month);
console.log('日柱:', result.twelveFortunes?.day);
console.log('時柱:', result.twelveFortunes?.hour);

// 十二神殺
console.log('\n【十二神殺】');
console.log('年柱:', result.twelveSpiritKillers?.year || '無し');
console.log('月柱:', result.twelveSpiritKillers?.month || '無し');
console.log('日柱:', result.twelveSpiritKillers?.day || '無し');
console.log('時柱:', result.twelveSpiritKillers?.hour || '無し');

// 現在の四柱推命情報も取得
console.log('\n====== 現在の四柱推命情報 ======');
const currentSaju = sajuEngine.getCurrentSaju();
console.log(`現在の四柱: ${currentSaju.fourPillars.yearPillar.stem}${currentSaju.fourPillars.yearPillar.branch} ${currentSaju.fourPillars.monthPillar.stem}${currentSaju.fourPillars.monthPillar.branch} ${currentSaju.fourPillars.dayPillar.stem}${currentSaju.fourPillars.dayPillar.branch} ${currentSaju.fourPillars.hourPillar.stem}${currentSaju.fourPillars.hourPillar.branch}`);