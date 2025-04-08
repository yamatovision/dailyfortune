# SajuEngine - 韓国式四柱推命計算エンジン

高精度な韓国式四柱推命（八字）の計算を行うTypeScriptライブラリです。生年月日時から四柱（年柱・月柱・日柱・時柱）と十神関係を計算し、運勢分析に必要なデータを提供します。

## 機能

- 四柱（年柱・月柱・日柱・時柱）の天干地支を計算
- 日主（日柱天干）に対する十神関係を計算
- 地支の十神関係を高精度に計算（改良アルゴリズム搭載）
- 蔵干（地支に内包される天干）とその十神関係を計算
- 十二運星（十二運）を計算
- 十二神殺（十二神煞）を計算
- 立春に基づいた正確な計算
- 地方時調整機能
- 特殊ケース処理による精度向上

## インストール

```bash
npm install saju-engine
```

## 使用方法

```typescript
import { SajuEngine } from 'saju-engine';

// 四柱推命エンジンの初期化
const sajuEngine = new SajuEngine();

// 生年月日と時間から四柱推命情報を計算
const birthDate = new Date(1990, 0, 15); // 1990年1月15日
const birthHour = 13; // 13時 (午後1時)
const gender = 'M'; // 'M'=男性, 'F'=女性
const location = 'Tokyo'; // 位置情報（都市名または経度・緯度）

const result = sajuEngine.calculate(birthDate, birthHour, gender, location);

// 結果を表示
console.log('四柱:', result.fourPillars);
console.log('十神関係:', result.tenGods);
console.log('五行プロファイル:', result.elementProfile);
console.log('十二運星:', result.twelveFortunes);
console.log('十二神殺:', result.twelveSpiritKillers);
```

## 計算結果の解釈

SajuEngineの計算結果は、以下の情報を含みます：

- `fourPillars`: 年柱・月柱・日柱・時柱の情報（天干・地支・十神関係など）
- `lunarDate`: 旧暦日付（農暦）
- `tenGods`: 日主（日柱天干）から見た十神関係
- `elementProfile`: 五行プロファイル（主要属性・副次属性・陰陽）
- `twelveFortunes`: 十二運星（十二運）
- `twelveSpiritKillers`: 十二神殺（十二神煞）
- `hiddenStems`: 蔵干（地支に内包される天干）

## 高度な使用方法

```typescript
// オプションを指定して初期化
const options = {
  useLocalTime: true, // 地方時調整を有効化（デフォルト）
  koreanStandard: true // 韓国標準方式を使用
};
const sajuEngine = new SajuEngine(options);

// 現在時刻の四柱推命情報を取得
const currentSaju = sajuEngine.getCurrentSaju();

// オプションを更新
sajuEngine.updateOptions({ useLocalTime: false });
```

## 依存ライブラリ

- `lunar-javascript`: 旧暦変換と天干地支計算のために使用

## ライセンス

MIT