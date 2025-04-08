import { initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Firebase Admin SDKの初期化
 */
const initializeFirebaseAdmin = (): App => {
  try {
    // 環境変数から設定情報を取得
    let serviceAccountJson;
    
    // 新しい環境変数形式チェック (個別のプロジェクトID、クライアントメール、プライベートキー)
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      console.log('Using individual Firebase environment variables');
      serviceAccountJson = {
        "type": "service_account",
        "project_id": process.env.FIREBASE_PROJECT_ID,
        "private_key_id": "auto-generated",
        "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        "client_email": process.env.FIREBASE_CLIENT_EMAIL
      };
      console.log('Successfully created service account from individual env vars');
    }
    // 古い環境変数形式 (JSONオブジェクト)
    else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        // 環境変数からJSONを解析（文字列またはBase64でエンコードされている可能性がある）
        console.log('FIREBASE_SERVICE_ACCOUNT env var exists - trying to parse');
        
        let jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT;
        
        // 可能性1: そのままJSONとして解析可能
        try {
          serviceAccountJson = JSON.parse(jsonStr);
          console.log('Successfully parsed FIREBASE_SERVICE_ACCOUNT as JSON');
        } catch (parseErr) {
          console.log('Failed to parse directly as JSON, trying Base64 decode');
          
          // 可能性2: Base64エンコードされている場合
          try {
            const decoded = Buffer.from(jsonStr, 'base64').toString();
            serviceAccountJson = JSON.parse(decoded);
            console.log('Successfully parsed FIREBASE_SERVICE_ACCOUNT as Base64-encoded JSON');
          } catch (base64Err) {
            console.error('Failed to parse as Base64:', base64Err);
            // フォールバック: デモ設定
            serviceAccountJson = {
              "type": "service_account",
              "project_id": "sys-76614112762438486420044584",
              "private_key_id": "demo",
              "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj\nMzEfYyjiWA4R4/M2bS1GB4t7NXp98C3SC6dVMvDuictGeurT8jNbvJZHtCSuYEvu\nNMoSfm76oqFvAp8Gy0iz5sxjZmSnXyCdPEovGhLa0VzMaQ8s+CLOyS56YyCFGeJZ\n-----END PRIVATE KEY-----\n",
              "client_email": "firebase-adminsdk-fbsvc@sys-76614112762438486420044584.iam.gserviceaccount.com"
            };
            console.warn('Using demo Firebase configuration after parsing failures');
          }
        }
      } catch (error) {
        console.error('Error processing FIREBASE_SERVICE_ACCOUNT:', error);
        // フォールバック: デモ設定
        serviceAccountJson = {
          "type": "service_account",
          "project_id": "sys-76614112762438486420044584",
          "private_key_id": "demo",
          "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj\nMzEfYyjiWA4R4/M2bS1GB4t7NXp98C3SC6dVMvDuictGeurT8jNbvJZHtCSuYEvu\nNMoSfm76oqFvAp8Gy0iz5sxjZmSnXyCdPEovGhLa0VzMaQ8s+CLOyS56YyCFGeJZ\n-----END PRIVATE KEY-----\n",
          "client_email": "firebase-adminsdk-fbsvc@sys-76614112762438486420044584.iam.gserviceaccount.com"
        };
        console.warn('Using demo Firebase configuration after error');
      }
    } else {
      // 設定された認証ファイルパスを使用
      try {
        // 環境変数で指定されたパスを優先
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, '../../firebase-service-account.json');
        
        // 認証ファイルがあれば使用
        if (fs.existsSync(serviceAccountPath)) {
          serviceAccountJson = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
          console.log(`Using service account file: ${serviceAccountPath}`);
        } else {
          // ファイルが見つからない場合はエラー
          throw new Error(`Firebase認証ファイルが見つかりません: ${serviceAccountPath}
⚠️注意: 環境変数 FIREBASE_SERVICE_ACCOUNT_PATH に有効なパスを設定してください。
テスト環境でも本番環境と同じ認証情報を使用する必要があります。`);
        }
      } catch (error) {
        console.error('Error accessing service account file:', error);
        // エラーを投げる
        throw new Error(`Firebase認証ファイルの読み込みに失敗しました。
⚠️注意: 環境変数 FIREBASE_SERVICE_ACCOUNT_PATH に有効なパスを設定し、
該当ファイルが存在することを確認してください。
テスト環境でも本番環境と同じ認証情報を使用する必要があります。`);
      }
    }

    // Firebaseアプリを初期化
    const databaseURL = process.env.FIREBASE_DATABASE_URL || `https://${serviceAccountJson.project_id}.firebaseio.com`;
    console.log(`Using database URL: ${databaseURL}`);
    
    const app = initializeApp({
      credential: cert(serviceAccountJson),
      databaseURL: databaseURL
    }, 'dailyfortune-admin');

    console.log('Firebase Admin initialized successfully');
    return app;
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
};

// Firebaseを初期化
export const firebaseAdmin = initializeFirebaseAdmin();

// Firebase認証を取得
export const auth = getAuth(firebaseAdmin);