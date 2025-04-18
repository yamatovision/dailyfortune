# 実装順序計画: エンティティ依存グラフに基づく実装アプローチ

## 1. エンティティ依存関係グラフ

以下は主要エンティティの依存関係を示したグラフです。実線の矢印はデータモデルの参照関係を、点線の矢印はビジネスロジック上の依存関係を示しています。

```
Organization <---- Subscription <---- Invoice
      ^
      |
      v
     User <------- SajuProfile
      ^
      |           /|\
      |            |
      v            |
     Team ------> TeamGoal
      |             ^
      |             |
      v             |
Compatibility       |
      |             |
      v             |
 DailyFortune <---・・
      ^
      |
      |
UserGoal・・・・・・・・・
      ^
      |
DayPillar
      |
      v
 ChatHistory
```

このグラフの重要なポイント：
- DailyFortuneは、単純なデータモデル参照関係だけでなく、実際の運勢生成ロジックにおいてTeamGoalとUserGoalのデータに依存しています（点線で表示）
- DailyFortuneの生成には、DayPillarの情報が必須です
- ChatHistoryは、DailyFortune、UserGoal、SajuProfileなどのデータをコンテキストとして使用します

## 2. 実装フェーズと優先順位

依存関係に基づく正確な実装順序は以下の通りです。

### フェーズ1: 基本エンティティとユーザー認証（既に実装済み）

1. **Organization モデル**
   - モデル、コントローラー、サービス 
   - 関連フロントエンドコンポーネント: SuperAdmin管理サイトの組織管理ページ

2. **User モデル & 認証システム**
   - モデル、コントローラー、サービス 
   - Firebase Auth 連携
   - 関連フロントエンドコンポーネント: ログインページ、ユーザー登録、プロフィール設定の基本部分

3. **Team モデル**
   - モデル、コントローラー、サービス
   - 関連フロントエンドコンポーネント: チームページの基本部分、チーム管理UI（Admin用）

### フェーズ2: 四柱推命プロフィールと日柱データ

4. **SajuProfile モデル**
   - モデル、コントローラー、サービス
   - SajuEngine連携によるプロフィール生成
   - 関連フロントエンドコンポーネント: プロフィール設定画面の四柱推命情報表示部分

5. **DayPillar モデル**
   - モデル、コントローラー、サービス
   - 毎日更新バッチジョブ
   - SajuEngine連携による日柱計算
   - 関連フロントエンドコンポーネント: なし（バックエンド処理のみ）

### フェーズ3: チームと目標機能の実装

6. **TeamGoal モデル**
   - モデル、コントローラー、サービス
   - 関連フロントエンドコンポーネント: チーム管理画面のチーム目標設定部分（Admin用）

7. **UserGoal モデル**
   - モデル、コントローラー、サービス
   - 関連フロントエンドコンポーネント: プロフィール設定画面の目標設定部分

8. **チーム管理フロントエンド**
   - チームメンバー管理
   - チーム目標管理
   - 権限設定UI

### フェーズ4: 運勢と相性機能

9. **DailyFortune モデル**
   - モデル、コントローラー、サービス
   - 運勢生成ロジック（SajuEngine、UserGoal、TeamGoalデータを統合）
   - 毎日3時の自動更新バッチジョブ
   - 関連フロントエンドコンポーネント: デイリー運勢表示ページ

10. **Compatibility モデル**
    - モデル、コントローラー、サービス
    - 相性計算ロジック
    - 関連フロントエンドコンポーネント: チームページの相性表示部分

### フェーズ5: AIチャット機能

11. **ChatHistory モデル**
    - モデル、コントローラー、サービス
    - Claude AI API連携
    - 複数コンテキスト対応（個人運勢/チームメンバー相性/チーム目標）
    - 関連フロントエンドコンポーネント: 統合AIチャットページ

### フェーズ6: サブスクリプションと管理機能

12. **Subscription & PricePlan モデル**
    - モデル、コントローラー、サービス
    - 決済サービス連携
    - 関連フロントエンドコンポーネント: サブスクリプション管理ページ

13. **Invoice モデル**
    - モデル、コントローラー、サービス
    - 請求書生成ロジック
    - 関連フロントエンドコンポーネント: 請求情報表示ページ

14. **UsageStatistics モデル**
    - モデル、コントローラー、サービス
    - 統計データ収集ロジック
    - 関連フロントエンドコンポーネント: 管理者ダッシュボード統計表示部分

15. **SystemSetting モデル**
    - モデル、コントローラー、サービス
    - 関連フロントエンドコンポーネント: システム設定ページ（SuperAdmin用）

16. **Alert & NotificationLog モデル**
    - モデル、コントローラー、サービス
    - アラート検出ロジック
    - 関連フロントエンドコンポーネント: 経営者ダッシュボードのアラート表示部分

### フェーズ7: バッチ処理と監査ログ

17. **BatchJobLog & AuditLog モデル**
    - モデル、コントローラー、サービス
    - バッチ処理の実装とスケジューリング
    - 関連フロントエンドコンポーネント: システム管理ページのジョブ履歴表示部分（SuperAdmin用）

18. **DailyFortuneUpdateLog モデル**
    - モデル、コントローラー、サービス
    - 運勢更新プロセスの監視とログ記録
    - 関連フロントエンドコンポーネント: 運勢更新ログ表示ページ（SuperAdmin用）

## 3. フロントエンド実装順序

フロントエンドの実装は、バックエンドの実装順序に合わせて以下の順序で進めるべきです：

1. **ログインページ**
   - [モックアップ](../mockups/login-page.html)
   - バックエンド連携: User認証API
   - 優先度: 最高

2. **プロフィール設定ページ - 四柱推命情報**
   - [モックアップ](../mockups/profile-settings.html)
   - バックエンド連携: SajuProfile API
   - 優先度: 高

3. **プロフィール設定ページ - 目標設定**
   - [モックアップ](../mockups/profile-settings.html)
   - バックエンド連携: UserGoal API
   - 優先度: 高

4. **チームページ - チーム管理**
   - [モックアップ](../mockups/team-page.html)
   - バックエンド連携: Team API, TeamGoal API
   - 優先度: 高

5. **デイリー運勢ページ**
   - [モックアップ](../mockups/daily-fortune.html)
   - バックエンド連携: DailyFortune API
   - 優先度: 高

6. **チームページ - 相性表示**
   - [モックアップ](../mockups/team-page.html)
   - バックエンド連携: Compatibility API
   - 優先度: 中

7. **統合AIチャットページ**
   - [モックアップ](../mockups/integrated-chat.html)
   - バックエンド連携: ChatHistory API
   - 優先度: 中

8. **経営者ダッシュボード**
   - バックエンド連携: Alert API, UsageStatistics API
   - 優先度: 中

9. **サブスクリプション管理ページ**
   - バックエンド連携: Subscription API, Invoice API
   - 優先度: 低

10. **SuperAdmin管理サイト**
    - バックエンド連携: 各種管理API
    - 優先度: 最低

## 4. バックエンド実装上の重要な依存関係

実装を進める上で特に注意すべき依存関係を以下に示します：

1. **DailyFortune生成におけるビジネスロジック依存関係**
   - DailyFortuneの生成には、**SajuProfile**、**DayPillar**、**UserGoal**、**TeamGoal**のデータが必要
   - 運勢生成は単なるデータモデル参照だけでなく、複数データソースを組み合わせたビジネスロジックに依存
   - したがって、UserGoalとTeamGoalの実装が先に必要

2. **ChatHistoryにおけるコンテキスト依存関係**
   - AIチャットの実装には、相談モードに応じたコンテキストデータの構築が必要
   - 個人運勢相談: DailyFortune, SajuProfile, UserGoal
   - チームメンバー相談: SajuProfile, Compatibility
   - チーム目標相談: TeamGoal, Team

3. **バッチジョブ間の依存関係**
   - DayPillar生成バッチ処理は、DailyFortune更新バッチ処理の前提条件
   - バッチ処理の実行順序: DayPillar生成 → DailyFortune更新

## 5. 並行開発可能な領域

実装効率を高めるため、以下のタスクは並行して開発可能です：

1. **SajuProfileとDayPillarの同時開発**
   - どちらもSajuEngineに依存しますが、互いに依存関係はない

2. **UserGoalとTeamGoalの同時開発**
   - 両者は独立したエンティティであり、同時に実装可能

3. **フロントエンドの基本コンポーネント開発**
   - バックエンドAPIの実装と並行して、UIコンポーネントの基本骨格を開発可能

4. **共通ユーティリティと基盤コード**
   - エラーハンドリング、認証処理、ログ機能などは他の開発と並行して実装可能

## 6. 優先度の最も高いタスク

1. **SajuEngine連携サービス**
   - 四柱推命計算は多くの機能の前提条件
   - 日柱計算、プロフィール作成、相性判定など多くの機能に影響

2. **DayPillar生成バッチ処理**
   - 日次の運勢生成の前提条件
   - システムの自動化部分であり、早期に安定稼働させる必要がある

3. **TeamGoal/UserGoal API**
   - 運勢生成に必要なデータを提供
   - ユーザーの主要な操作対象となるデータ

4. **DailyFortune生成ロジック**
   - システムの中核機能であり、他の機能との連携が多い
   - Claude AIとの連携が必要な部分

## 7. 改訂された実装フェーズの要約

上記の分析に基づく、依存関係を考慮した実装フェーズの要約：

1. SajuProfile API + DayPillar API → SajuProfile UI
2. TeamGoal API + UserGoal API → Team UI + Goal UI
3. DailyFortune API + Compatibility API → Fortune UI + Team相性表示
4. ChatHistory API → AI Chat UI
5. Subscription + Invoice → 管理機能UI
6. 監視・ログ機能 → 管理者UI

## 8. 結論

データモデルの参照関係だけでなく、ビジネスロジック上の依存関係を考慮した実装順序が重要です。特に、DailyFortuneの生成にはUserGoalとTeamGoalのデータが必要であることを考慮し、実装順序を決める必要があります。また、バッチ処理の依存関係や並行開発可能な領域を把握することで、効率的な開発計画を立てることが可能です。