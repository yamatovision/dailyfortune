/**
 * デイリー運勢更新バッチ処理
 * 
 * このスクリプトは毎日実行され、すべてのユーザーの運勢情報を生成します。
 * 通常はスケジューラーから実行されますが、管理者が手動で実行することも可能です。
 */

import mongoose from 'mongoose';
import { connectToDatabase } from '../config/database';
import { BatchJobLog } from '../models/BatchJobLog';
import { User } from '../models/User';
import { DailyFortuneUpdateLog } from '../models/DailyFortuneUpdateLog';
import { fortuneService } from '../services/fortune.service';

/**
 * 運勢更新処理のメイン関数
 * @param forceUpdate 強制更新フラグ（既に生成済みの運勢も上書き更新）
 * @param targetDate 対象日付（指定がなければ今日）
 * @param batchSize バッチサイズ（一度に処理するユーザー数）
 * @param adminUserId 管理者ユーザーID（手動実行時）
 * @returns 更新結果の情報
 */
export async function updateDailyFortunes(
  forceUpdate: boolean = false,
  targetDate: Date = new Date(),
  batchSize: number = 100,
  adminUserId: string = '000000000000000000000000' // システム管理者のデフォルトID
): Promise<{
  success: boolean;
  message: string;
  date: Date;
  totalUsers: number;
  successCount: number;
  failedCount: number;
  updateErrors?: Array<{ userId: string; message: string; stack?: string }>;
}> {
  console.log(`デイリー運勢更新バッチ処理を開始します: ${targetDate.toISOString().split('T')[0]}`);
  
  let batchLogId: string | null = null;
  let updateLogId: string | null = null;
  
  try {
    // データベース接続（既に接続されている場合はスキップ）
    if (mongoose.connection.readyState !== 1) {
      try {
        await connectToDatabase();
      } catch (error) {
        console.error('データベース接続エラー:', error);
        throw new Error(`データベース接続エラー: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // 日付の正規化（時刻部分をリセット）
    targetDate.setHours(0, 0, 0, 0);
    
    // バッチ実行ログの作成
    const batchJobLog = new BatchJobLog({
      jobType: 'daily_fortune_update',
      status: 'running',
      startTime: new Date(),
      params: { forceUpdate, targetDate: targetDate.toISOString(), batchSize }
    });
    await batchJobLog.save();
    batchLogId = String(batchJobLog._id);
    
    console.log(`バッチジョブログ作成: ${batchLogId}`);
    
    // 更新ログの作成
    const updateLog = new DailyFortuneUpdateLog({
      date: targetDate,
      status: 'running',
      startTime: new Date(),
      totalUsers: 0,
      successCount: 0,
      failedCount: 0,
      isAutomaticRetry: false,
      createdBy: adminUserId
    });
    await updateLog.save();
    updateLogId = String(updateLog._id);
    
    console.log(`運勢更新ログ作成: ${updateLogId}`);
    
    // アクティブなユーザー数のカウント
    const totalUsers = await User.countDocuments({ isActive: true });
    
    // 更新ログの更新
    await DailyFortuneUpdateLog.findByIdAndUpdate(updateLogId, {
      totalUsers
    });
    
    // 処理結果カウンター
    let successCount = 0;
    let failedCount = 0;
    let updateErrors: Array<{ userId: string; message: string; stack?: string }> = [];
    
    // バッチ処理（ページング）
    let processedUsers = 0;
    let page = 0;
    
    while (processedUsers < totalUsers) {
      // ユーザーのバッチ取得
      const users = await User.find({ isActive: true })
        .skip(page * batchSize)
        .limit(batchSize);
      
      if (users.length === 0) break;
      
      // 各ユーザーの運勢を更新
      for (const user of users) {
        try {
          // ユーザーオブジェクトから正しいIDを取得
          // TypeScript対応のためのnullチェックとキャスト
          if (!user._id) continue;
          
          // User モデルでは _id が Firebase UID または MongoDB ObjectID を格納している
          // user.toObject() でプレーンオブジェクトにして扱うことで型エラーを回避
          const userObj = user.toObject();
          const userId = String(user._id);
          
          await fortuneService.generateFortune(userId, new Date(targetDate));
          successCount++;
        } catch (error) {
          // TypeScript対応のためのnullチェックとキャスト
          const userId = user._id ? String(user._id) : 'unknown';
          console.error(`ユーザー ${userId} の運勢生成中にエラーが発生しました:`, error);
          failedCount++;
          updateErrors.push({
            userId,
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
        }
      }
      
      processedUsers += users.length;
      page++;
      
      // 進捗更新
      await DailyFortuneUpdateLog.findByIdAndUpdate(updateLogId, {
        successCount,
        failedCount,
        updateErrors: updateErrors.length > 0 ? updateErrors : undefined
      });
      
      await BatchJobLog.findByIdAndUpdate(batchLogId, {
        totalItems: totalUsers,
        processedItems: processedUsers,
        errorItems: failedCount
      });
      
      console.log(`進捗: ${processedUsers}/${totalUsers} ユーザー処理完了（成功: ${successCount}, 失敗: ${failedCount}）`);
    }
    
    // 更新ログの最終更新
    const endTime = new Date();
    const status = failedCount > 0 ? 'completed_with_errors' : 'completed';
    
    await DailyFortuneUpdateLog.findByIdAndUpdate(updateLogId, {
      status: failedCount > 0 ? 'failed' : 'completed',
      endTime,
      successCount,
      failedCount,
      updateErrors: updateErrors.length > 0 ? updateErrors : undefined
    });
    
    // バッチ実行ログの更新
    const result = {
      success: failedCount === 0,
      message: `運勢更新バッチ処理が完了しました。更新ユーザー数: ${successCount}, 失敗: ${failedCount}`,
      date: targetDate,
      totalUsers,
      successCount,
      failedCount,
      updateErrors: updateErrors.length > 0 ? updateErrors : undefined
    };
    
    if (batchLogId) {
      await BatchJobLog.findByIdAndUpdate(batchLogId, {
        status,
        endTime,
        totalItems: totalUsers,
        processedItems: successCount + failedCount,
        errorItems: failedCount,
        result
      });
    }
    
    console.log(result.message);
    return result;
    
  } catch (error) {
    console.error('運勢更新バッチ処理でエラーが発生しました:', error);
    
    // バッチログと更新ログの更新（エラー状態）
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    if (batchLogId) {
      await BatchJobLog.findByIdAndUpdate(batchLogId, {
        status: 'failed',
        endTime: new Date(),
        result: {
          success: false,
          message: `運勢更新バッチ処理が失敗しました: ${errorMessage}`,
          error: errorStack
        }
      });
    }
    
    if (updateLogId) {
      await DailyFortuneUpdateLog.findByIdAndUpdate(updateLogId, {
        status: 'failed',
        endTime: new Date(),
        updateErrors: [{
          userId: 'system',
          message: errorMessage,
          stack: errorStack
        }]
      });
    }
    
    return {
      success: false,
      message: `運勢更新バッチ処理が失敗しました: ${errorMessage}`,
      date: targetDate,
      totalUsers: 0,
      successCount: 0,
      failedCount: 1
    };
  } finally {
    // スタンドアロン実行時はデータベース接続を閉じる
    if (require.main === module) {
      await mongoose.disconnect();
      console.log('データベース接続を閉じました');
    }
  }
}

/**
 * スクリプトが直接実行された場合の処理
 */
if (require.main === module) {
  // コマンドライン引数からパラメータを取得
  const forceUpdate = process.argv.includes('--force');
  const dateArg = process.argv.find(arg => arg.startsWith('--date='));
  const targetDate = dateArg ? new Date(dateArg.replace('--date=', '')) : new Date();
  const batchSize = parseInt(process.argv.find(arg => arg.startsWith('--batch='))?.replace('--batch=', '') || '100', 10);
  
  updateDailyFortunes(forceUpdate, targetDate, batchSize)
    .then(result => {
      console.log('実行結果:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('予期しないエラーが発生しました:', error);
      process.exit(1);
    });
}