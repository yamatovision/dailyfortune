import { Request, Response } from 'express';
import { User, IUser } from '../models/User';
import { JwtService } from '../services/jwt.service';

/**
 * JWT認証コントローラー
 * JWT認証に関連するエンドポイントの処理を実装
 */
export class JwtAuthController {
  /**
   * ユーザー登録
   * @param req リクエスト
   * @param res レスポンス
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, displayName } = req.body;

      // 必須フィールドのバリデーション
      if (!email || !password || !displayName) {
        res.status(400).json({ message: 'メール、パスワード、表示名は必須です' });
        return;
      }

      // 既存ユーザーの確認
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(409).json({ message: 'このメールアドレスは既に登録されています' });
        return;
      }

      // 新規ユーザー作成
      const newUser = await User.create({
        email,
        password,
        displayName,
        role: 'User',
        plan: 'lite',
        isActive: true
      });

      // アクセストークンとリフレッシュトークンの生成
      const accessToken = JwtService.generateAccessToken(newUser);
      const refreshToken = JwtService.generateRefreshToken(newUser);

      // リフレッシュトークンをデータベースに保存
      newUser.refreshToken = refreshToken;
      newUser.lastLogin = new Date();
      await newUser.save();

      // レスポンスを返す
      res.status(201).json({
        message: 'ユーザー登録が完了しました',
        user: {
          id: newUser._id,
          email: newUser.email,
          displayName: newUser.displayName,
          role: newUser.role
        },
        tokens: {
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('ユーザー登録エラー:', error);
      res.status(500).json({ message: 'ユーザー登録中にエラーが発生しました' });
    }
  }

  /**
   * ログイン処理
   * @param req リクエスト
   * @param res レスポンス
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      console.log('ログインリクエスト:', { email });

      // バリデーション
      if (!email || !password) {
        console.log('バリデーションエラー: メールアドレスまたはパスワードがありません');
        res.status(400).json({ message: 'メールアドレスとパスワードは必須です' });
        return;
      }

      // ユーザー検索（パスワードを含める）
      const user = await User.findOne({ email }).select('+password');
      
      if (!user) {
        console.log('認証エラー: ユーザーが見つかりません -', email);
        res.status(401).json({ message: 'メールアドレスまたはパスワードが正しくありません' });
        return;
      }

      console.log('ユーザー検索結果:', { 
        id: user._id, 
        email: user.email,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0
      });

      // パスワード照合
      try {
        const isPasswordValid = await user.comparePassword(password);
        console.log('パスワード検証結果:', isPasswordValid);
        
        if (!isPasswordValid) {
          console.log('認証エラー: パスワードが一致しません');
          res.status(401).json({ message: 'メールアドレスまたはパスワードが正しくありません' });
          return;
        }
      } catch (pwError: any) {
        console.error('パスワード検証中にエラーが発生しました:', pwError);
        res.status(500).json({ message: 'パスワード検証中にエラーが発生しました', debug: process.env.NODE_ENV === 'development' ? pwError.message : undefined });
        return;
      }

      // アクセストークンとリフレッシュトークンの生成
      try {
        console.log('トークン生成中...');
        const accessToken = JwtService.generateAccessToken(user);
        const refreshToken = JwtService.generateRefreshToken(user);
        console.log('トークン生成完了');

        // リフレッシュトークンをデータベースに保存
        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save();
        console.log('ユーザー情報更新完了');

        // レスポンスを返す
        console.log('ログイン成功');
        res.status(200).json({
          message: 'ログインに成功しました',
          user: {
            id: user._id,
            email: user.email,
            displayName: user.displayName,
            role: user.role
          },
          tokens: {
            accessToken,
            refreshToken
          }
        });
      } catch (tokenError: any) {
        console.error('トークン生成中にエラーが発生しました:', tokenError);
        res.status(500).json({ message: 'トークン生成中にエラーが発生しました', debug: process.env.NODE_ENV === 'development' ? tokenError.message : undefined });
        return;
      }
    } catch (error: any) {
      console.error('ログインエラー:', error);
      res.status(500).json({ 
        message: 'ログイン中にエラーが発生しました',
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * トークンリフレッシュ処理
   * @param req リクエスト
   * @param res レスポンス
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ message: 'リフレッシュトークンが必要です' });
        return;
      }

      // リフレッシュトークンの検証
      const verification = JwtService.verifyRefreshToken(refreshToken);
      if (!verification.valid) {
        res.status(401).json({ message: '無効なリフレッシュトークンです' });
        return;
      }

      // リフレッシュトークンからユーザーIDを取得
      const userId = verification.payload?.sub;
      if (!userId) {
        res.status(401).json({ message: 'リフレッシュトークンからユーザーIDを取得できません' });
        return;
      }

      // データベースからユーザーとそのリフレッシュトークンを取得
      const user = await User.findById(userId).select('+refreshToken');
      if (!user || user.refreshToken !== refreshToken) {
        res.status(401).json({ message: 'リフレッシュトークンが一致しません' });
        return;
      }

      // トークンバージョンの確認
      if (user.tokenVersion !== verification.payload.tokenVersion) {
        res.status(401).json({ message: 'トークンバージョンが一致しません（セキュリティ上の理由で無効化されました）' });
        return;
      }

      // 新しいアクセストークンとリフレッシュトークンを生成
      const newAccessToken = JwtService.generateAccessToken(user);
      const newRefreshToken = JwtService.generateRefreshToken(user);

      // リフレッシュトークンをデータベースに保存
      user.refreshToken = newRefreshToken;
      await user.save();

      // レスポンスを返す
      res.status(200).json({
        message: 'トークンを更新しました',
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      console.error('トークンリフレッシュエラー:', error);
      res.status(500).json({ message: 'トークンの更新中にエラーが発生しました' });
    }
  }

  /**
   * ログアウト処理
   * @param req リクエスト
   * @param res レスポンス
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ message: 'リフレッシュトークンが必要です' });
        return;
      }

      // ユーザーIDを取得
      const userId = JwtService.getUserIdFromToken(refreshToken);
      if (userId) {
        // リフレッシュトークンを無効化
        await User.findByIdAndUpdate(userId, {
          $unset: { refreshToken: 1 },
          $inc: { tokenVersion: 1 } // トークンバージョンをインクリメントして古いトークンを無効化
        });
      }

      res.status(200).json({ message: 'ログアウトしました' });
    } catch (error) {
      console.error('ログアウトエラー:', error);
      res.status(500).json({ message: 'ログアウト中にエラーが発生しました' });
    }
  }

  /**
   * Firebase認証からJWT認証へのユーザー移行
   * @param req リクエスト
   * @param res レスポンス
   */
  static async migrateToJwt(req: Request, res: Response): Promise<void> {
    try {
      // このエンドポイントはFirebase認証によって保護されている必要がある
      const { user } = req as any;
      const { password, firebaseUid } = req.body;

      if (!user || !user.uid) {
        res.status(401).json({ message: '認証が必要です' });
        return;
      }

      if (!password) {
        res.status(400).json({ message: '新しいパスワードが必要です' });
        return;
      }

      // Firebase UIDからユーザーを検索
      const existingUser = await User.findOne({
        $or: [
          { _id: user.uid },
          { uid: user.uid }
        ]
      });

      if (!existingUser) {
        res.status(404).json({ message: 'ユーザーが見つかりません' });
        return;
      }

      // ユーザー情報を更新
      existingUser.password = password;
      existingUser.firebaseUid = firebaseUid || user.uid; // Firebase UIDを保存（移行期間中に使用）
      existingUser.tokenVersion = 0; // 初期トークンバージョン

      // JWTトークンを生成
      const accessToken = JwtService.generateAccessToken(existingUser);
      const refreshToken = JwtService.generateRefreshToken(existingUser);
      existingUser.refreshToken = refreshToken;

      // 変更を保存
      await existingUser.save();

      // レスポンスを返す
      res.status(200).json({
        message: 'JWT認証への移行が完了しました',
        user: {
          id: existingUser._id,
          email: existingUser.email,
          displayName: existingUser.displayName,
          role: existingUser.role
        },
        tokens: {
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('JWT認証移行エラー:', error);
      res.status(500).json({ message: 'JWT認証への移行中にエラーが発生しました' });
    }
  }
}