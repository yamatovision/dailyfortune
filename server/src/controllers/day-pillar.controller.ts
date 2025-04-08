import { Request, Response } from 'express';
import { AuthRequest, UserRole } from '../middleware/auth.middleware';
import { SajuEngineService } from '../services/saju-engine.service';
import { handleError, ValidationError, AuthenticationError } from '../utils';

/**
 * 現在の日柱情報を取得するコントローラー
 */
export const getTodayDayPillar = async (req: Request, res: Response) => {
  try {
    const sajuEngineService = new SajuEngineService();
    const dayPillar = sajuEngineService.getCurrentDayPillar();
    
    return res.status(200).json(dayPillar);
  } catch (error) {
    return handleError(error, res);
  }
};

/**
 * 特定の日付の日柱情報を取得するコントローラー
 */
export const getDayPillarByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    
    if (!date) {
      throw new ValidationError('日付は必須です');
    }
    
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new ValidationError('無効な日付フォーマットです');
    }
    
    const sajuEngineService = new SajuEngineService();
    const dayPillar = sajuEngineService.getDayPillarByDate(parsedDate);
    
    return res.status(200).json(dayPillar);
  } catch (error) {
    return handleError(error, res);
  }
};

/**
 * 日付範囲の日柱情報を取得するコントローラー
 * 管理者用機能
 */
export const getDayPillarRange = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('認証されていません');
    }
    
    // 管理者権限チェック
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ValidationError('管理者権限が必要です');
    }
    
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      throw new ValidationError('開始日と終了日は必須です');
    }
    
    const parsedStartDate = new Date(startDate as string);
    const parsedEndDate = new Date(endDate as string);
    
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      throw new ValidationError('無効な日付フォーマットです');
    }
    
    // 日付範囲のチェック
    if (parsedEndDate < parsedStartDate) {
      throw new ValidationError('終了日は開始日より後である必要があります');
    }
    
    // 範囲が広すぎないかチェック（例：最大30日まで）
    const dayDifference = Math.ceil((parsedEndDate.getTime() - parsedStartDate.getTime()) / (1000 * 60 * 60 * 24));
    if (dayDifference > 30) {
      throw new ValidationError('日付範囲は最大30日までです');
    }
    
    const sajuEngineService = new SajuEngineService();
    
    // 指定された日付範囲の日柱情報を取得
    const dayPillars = [];
    let currentDate = new Date(parsedStartDate);
    
    while (currentDate <= parsedEndDate) {
      dayPillars.push(sajuEngineService.getDayPillarByDate(new Date(currentDate)));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return res.status(200).json({
      count: dayPillars.length,
      dayPillars
    });
  } catch (error) {
    return handleError(error, res);
  }
};