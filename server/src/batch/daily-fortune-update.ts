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
      // ユーザーのバッチ取得（より堅牢な方法）
      const users = await User.find({ isActive: true })
        .sort({ _id: 1 }) // IDでソートして一貫したページングを確保
        .skip(page * batchSize)
        .limit(batchSize);
      
      if (users.length === 0) break;
      
      // 各ユーザーの運勢を更新（並列処理）
      const processingPromises = users.map(async (user) => {
        try {
          // ユーザーオブジェクトから正しいIDを取得
          // TypeScript対応のためのnullチェックとキャスト
          if (!user._id) {
            console.error('ユーザーIDが見つかりません', user);
            return { success: false, userId: 'unknown', error: 'ユーザーIDが見つかりません' };
          }
          
          // User モデルでは _id が Firebase UID または MongoDB ObjectID を格納している可能性がある
          // 一貫した文字列形式に変換
          const userId = typeof user._id === 'object' && user._id !== null 
            ? String(user._id) 
            : user._id;
          
          console.log(`ユーザー ${userId} の運勢を処理します...`);
          
          // 個人運勢の生成
          await fortuneService.generateFortune(userId, new Date(targetDate), forceUpdate);
          
          // ユーザーが所属するチームがあれば、チームコンテキスト運勢も生成
          if (user.teamId) {
            const teamId = typeof user.teamId === 'object' && user.teamId !== null 
              ? String(user.teamId) 
              : user.teamId;
            
            // チームIDの有効性を検証
            if (!mongoose.Types.ObjectId.isValid(teamId)) {
              console.warn(`ユーザー ${userId} の無効なチームID: ${teamId}`);
              updateErrors.push({
                userId: `${userId}/${teamId}`,
                message: `無効なチームID: ${teamId}`,
                stack: undefined
              });
            } else {
              try {
                // チームごとのチームコンテキスト運勢を生成
                await fortuneService.generateTeamContextFortune(userId, teamId, new Date(targetDate), forceUpdate);
                console.log(`ユーザー ${userId} のチームコンテキスト運勢を生成しました (チームID: ${teamId})`);
              } catch (teamFortuneError) {
                console.error(`ユーザー ${userId} のチームコンテキスト運勢生成中にエラーが発生しました (チームID: ${teamId}):`, teamFortuneError);
                // チームコンテキスト運勢の生成エラーは個別に記録するが、個人運勢生成の成功カウントには影響させない
                updateErrors.push({
                  userId: `${userId}/${teamId}`,
                  message: `チームコンテキスト運勢生成エラー: ${teamFortuneError instanceof Error ? teamFortuneError.message : String(teamFortuneError)}`,
                  stack: teamFortuneError instanceof Error ? teamFortuneError.stack : undefined,
                  details: { teamId }
                });
              }
            }
          }
          
          return { success: true, userId };
        } catch (error) {
          // TypeScript対応のためのnullチェックとキャスト
          const userId = user._id ? String(user._id) : 'unknown';
          console.error(`ユーザー ${userId} の運勢生成中にエラーが発生しました:`, error);
          
          updateErrors.push({
            userId,
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
          
          return { success: false, userId, error };
        }
      });
      
      // すべての処理を待機
      const results = await Promise.all(processingPromises);
      
      // 結果を集計
      results.forEach(result => {
        if (result.success) {
          successCount++;
        } else {
          failedCount++;
        }
      });
      
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