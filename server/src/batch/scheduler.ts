/**
 * バッチ処理スケジューラー
 * 
 * 定期的に実行する必要があるバッチジョブのスケジュール管理を行います。
 * node-cronを使用して、特定の時間にジョブを実行します。
 */

// @ts-ignore ここではnode-cronの型定義が不要
const cron = require('node-cron');
import { BatchJobLog } from '../models/BatchJobLog';
import { generateDayPillars } from './day-pillar-generator';
import { updateDailyFortunes } from './daily-fortune-update';

// スケジュール設定のインターフェース
interface ScheduleConfig {
  expression: string;  // cron式
  jobName: string;     // ジョブ名
  enabled: boolean;    // 有効/無効状態
  job: () => Promise<any>;  // 実行するジョブ関数
  retryCount: number;  // リトライ回数
  retryDelay: number;  // リトライ間隔（ミリ秒）
}

const schedules: ScheduleConfig[] = [
  {
    // 毎日午前0時に実行
    expression: '0 0 * * *',
    jobName: 'day-pillar-generator',
    enabled: true,
    job: async () => {
      console.log('日柱生成バッチ処理を開始します...');
      
      try {
        // 30日分の日柱を生成
        const result = await generateDayPillars(30);
        console.log('日柱生成バッチ処理が完了しました:', result);
        return result;
      } catch (error) {
        console.error('日柱生成バッチ処理でエラーが発生しました:', error);
        throw error;
      }
    },
    retryCount: 3,
    retryDelay: 5 * 60 * 1000  // 5分
  },
  {
    // 毎日午前1時に実行（日柱生成の後に実行するため）
    expression: '0 1 * * *',
    jobName: 'daily-fortune-update',
    enabled: true,
    job: async () => {
      console.log('運勢更新バッチ処理を開始します...');
      
      try {
        // バッチサイズ100で全ユーザーの運勢を更新
        const result = await updateDailyFortunes(false, new Date(), 100);
        console.log('運勢更新バッチ処理が完了しました:', result);
        return result;
      } catch (error) {
        console.error('運勢更新バッチ処理でエラーが発生しました:', error);
        throw error;
      }
    },
    retryCount: 3,
    retryDelay: 10 * 60 * 1000  // 10分
  }
  // 他のバッチジョブ設定を追加可能
];

/**
 * すべてのスケジュールジョブを開始
 */
export function startScheduler() {
  console.log('バッチ処理スケジューラーを開始します...');
  
  schedules.forEach(schedule => {
    if (schedule.enabled) {
      cron.schedule(schedule.expression, async () => {
        console.log(`スケジュールジョブ "${schedule.jobName}" を実行します...`);
        
        // ジョブ実行ログの記録
        const jobLog = new BatchJobLog({
          jobType: schedule.jobName,
          status: 'scheduled',
          startTime: new Date(),
          scheduledBy: 'scheduler'
        });
        await jobLog.save();
        
        // ジョブ実行（リトライ機能付き）
        let attempt = 0;
        let success = false;
        let lastError: any;
        
        while (attempt <= schedule.retryCount && !success) {
          try {
            if (attempt > 0) {
              console.log(`ジョブ "${schedule.jobName}" のリトライを行います (${attempt}/${schedule.retryCount})...`);
              // リトライ間隔を待機
              await new Promise(resolve => setTimeout(resolve, schedule.retryDelay));
            }
            
            const result = await schedule.job();
            success = true;
            
            // ジョブ実行ログの更新（成功）
            await BatchJobLog.findByIdAndUpdate(jobLog._id, {
              status: 'completed',
              endTime: new Date(),
              result
            });
            
            console.log(`ジョブ "${schedule.jobName}" が正常に完了しました。`);
            
          } catch (error) {
            lastError = error;
            attempt++;
            
            console.error(`ジョブ "${schedule.jobName}" の実行に失敗しました (${attempt}/${schedule.retryCount + 1}):`, error);
            
            // 最大リトライ回数に達した場合
            if (attempt > schedule.retryCount) {
              // ジョブ実行ログの更新（失敗）
              await BatchJobLog.findByIdAndUpdate(jobLog._id, {
                status: 'failed',
                endTime: new Date(),
                result: {
                  error: error instanceof Error ? error.message : String(error),
                  stack: error instanceof Error ? error.stack : undefined,
                  attempts: attempt
                }
              });
              
              console.error(`ジョブ "${schedule.jobName}" は最大リトライ回数に達しました。実行を中止します。`);
            }
          }
        }
      });
      
      console.log(`ジョブ "${schedule.jobName}" をスケジュール設定しました: ${schedule.expression}`);
    } else {
      console.log(`ジョブ "${schedule.jobName}" は無効化されています。`);
    }
  });
  
  console.log('バッチ処理スケジューラーの設定が完了しました。');
}

/**
 * スケジューラーを停止
 */
export function stopScheduler() {
  console.log('バッチ処理スケジューラーを停止します...');
  // node-cronの全タスクを停止
  cron.getTasks().forEach((task: any) => task.stop());
  console.log('バッチ処理スケジューラーを停止しました。');
}

// スクリプトが直接実行された場合は、スケジューラーを開始
if (require.main === module) {
  const { connectDatabase } = require('../config/database');
  
  connectDatabase()
    .then(() => {
      console.log('データベースに接続しました。スケジューラーを開始します...');
      startScheduler();
    })
    .catch((error: any) => {
      console.error('データベース接続エラー:', error);
      process.exit(1);
    });
}