import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Icon, Paper } from '@mui/material';
import { ISajuProfile } from '@shared/index';
import sajuProfileService from '../../services/saju-profile.service';
import SajuElementBlocks from './SajuElementBlocks';
import ReactMarkdown from 'react-markdown';

interface SajuProfileCardProps {
  profile: ISajuProfile;
}

const SajuProfileCard: React.FC<SajuProfileCardProps> = ({ profile }) => {
  // 日付フォーマット関数は現在使用されていないため削除

  // const elementIcon = sajuProfileService.getElementIcon(profile.mainElement);
  const elementColor = sajuProfileService.getElementColor(profile.mainElement);
  const elementBg = sajuProfileService.getElementBackground(profile.mainElement);
  const elementJp = sajuProfileService.translateElementToJapanese(profile.mainElement);

  // 五行属性に応じたアイコンの設定
  const getElementIconName = (element: string): string => {
    switch(element) {
      case 'wood': return 'park';
      case 'fire': return 'local_fire_department';
      case 'earth': return 'landscape';
      case 'metal': return 'star';
      case 'water': return 'water_drop';
      default: return 'psychology';
    }
  };

  // 五行属性に応じたCSSカラー変数
  const getElementColorVar = (element: string): string => {
    return `var(--${element}-color, ${elementColor})`;
  };

  // 五行属性に応じた背景色のCSSカラー変数
  const getElementBgVar = (element: string): string => {
    return `var(--${element}-bg, ${elementBg})`;
  };

  // サーバーからのレスポンスデータ構造を確認して適切にマッピング
  console.group('🧩 SajuProfileCard - データマッピング');
  console.log('入力プロフィール:', profile);
  
  // mainElementとelementAttributeの両方をサポート
  const mainElement = profile.mainElement || 'earth';
  console.log('使用する主要属性:', mainElement);
  
  // 型を拡張して互換性を確保
  interface ExtendedPillar {
    heavenlyStem: string;
    earthlyBranch: string;
    heavenlyStemTenGod?: string;
    earthlyBranchTenGod?: string;
    hiddenStems?: string[];
  }

  interface ExtendedFourPillars {
    year: ExtendedPillar;
    month: ExtendedPillar;
    day: ExtendedPillar;
    hour: ExtendedPillar;
  }
  
  // fourPillarsのサポート
  let pillars: ExtendedFourPillars;
  if (profile.fourPillars) {
    console.log('fourPillarsを使用:', profile.fourPillars);
    // 既存データを拡張型にキャスト
    pillars = profile.fourPillars as unknown as ExtendedFourPillars;
  } else {
    console.warn('四柱データなし、デフォルト値を使用');
    pillars = {
      year: { heavenlyStem: '?', earthlyBranch: '?' },
      month: { heavenlyStem: '?', earthlyBranch: '?' },
      day: { heavenlyStem: '?', earthlyBranch: '?' },
      hour: { heavenlyStem: '?', earthlyBranch: '?' }
    };
  }
  
  // 時柱のデータの整合性チェック
  if (!pillars.hour) {
    console.warn('時柱データが存在しない、デフォルト値を使用');
    pillars.hour = { heavenlyStem: '?', earthlyBranch: '?' };
  }
  console.log('最終的に使用する四柱データ:', pillars);
  console.groupEnd();
  
  return (
    <Card elevation={3} sx={{ 
      mb: 3, 
      borderRadius: 3,
      background: 'white',
      boxShadow: '0 4px 20px rgba(156, 39, 176, 0.15)',
      overflow: 'hidden'
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box 
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: getElementBgVar(mainElement),
              color: getElementColorVar(mainElement),
              mr: 2
            }}
          >
            <Icon>{getElementIconName(mainElement)}</Icon>
          </Box>
          <Box>
            <Typography variant="h6">四柱推命プロフィール</Typography>
            <Typography variant="body2" color="text.secondary">
              {elementJp}命 • {pillars.day.heavenlyStem}
            </Typography>
          </Box>
        </Box>

        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2, 
            mb: 3, 
            backgroundColor: 'rgba(250, 245, 255, 0.5)',
            borderRadius: 2
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">基本属性:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {elementJp}({mainElement})
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">格局:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {profile.kakukyoku ? profile.kakukyoku.type : '計算中...'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">用神:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {profile.yojin ? profile.yojin.tenGod : '計算中...'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        <Typography 
          variant="h6" 
          sx={{ 
            fontSize: '1.1rem', 
            borderBottom: '1px solid', 
            borderColor: 'divider',
            pb: 1,
            mb: 2,
            color: 'primary.main'
          }}
        >
          四柱
        </Typography>
        
        {/* 新しいビジュアル表示（ブロック形式） */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            backgroundColor: 'rgba(250, 245, 255, 0.5)'
          }}
        >
          <SajuElementBlocks profile={profile} />
        </Paper>





        <Typography 
          variant="h6" 
          sx={{ 
            fontSize: '1.1rem', 
            borderBottom: '1px solid', 
            borderColor: 'divider',
            pb: 1,
            mb: 2,
            color: 'primary.main'
          }}
        >
          調和のコンパス
        </Typography>
        
        {/* 調和のコンパスを表示（careerAptitudeフィールドを利用） */}
        {profile.careerAptitude && (
          <Box>
            {/* テキストとして直接表示 - JSONパースの試みは行わない */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                backgroundColor: 'rgba(250, 245, 255, 0.5)'
              }}
            >
              {/* react-markdownを使ってマークダウンをレンダリング */}
              {profile.careerAptitude ? (
                <Box sx={{ '& h1, & h2, & h3, & h4, & h5, & h6': { 
                  fontFamily: 'inherit',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  mt: 2,
                  mb: 1,
                  color: 'primary.main'
                }, '& p': {
                  mt: 0,
                  mb: 1.5,
                  fontSize: '0.875rem',
                  lineHeight: 1.6
                } }}>
                  <ReactMarkdown>{profile.careerAptitude}</ReactMarkdown>
                </Box>
              ) : (
                <Typography variant="body2" paragraph>
                  {`${mainElement === 'metal' ? '金属の五行を持つあなたは、精密さと効率を重視する職業に適性があります。会計士、エンジニア、ITプロフェッショナル、品質管理、法律家などの職種で才能を発揮できるでしょう。計画性と完璧さを追求する仕事が向いています。' :
                   mainElement === 'wood' ? '木の五行を持つあなたは、創造性と成長を伴う職業に適性があります。教育者、プロジェクトマネージャー、環境関連、コンサルタント、起業家などの分野で活躍できるでしょう。長期的なビジョンを持ち、物事を育てる仕事が向いています。' :
                   mainElement === 'water' ? '水の五行を持つあなたは、知性と直感力を活かせる職業に適性があります。研究者、作家、心理学者、アナリスト、哲学者などの分野で才能を発揮できるでしょう。深い洞察と創造的思考を活かす仕事が向いています。' :
                   mainElement === 'fire' ? '火の五行を持つあなたは、情熱とエネルギーを活かせる職業に適性があります。営業、マーケティング、パフォーマー、デザイナー、広報など人前に立つ仕事や、リーダーシップを発揮できる役職が向いています。' :
                   mainElement === 'earth' ? '土の五行を持つあなたは、安定性と実用性を重視する職業に適性があります。不動産、人事、カウンセラー、医療従事者、対人サービス業などが向いています。人を支え、安定した環境を作る仕事で力を発揮するでしょう。' :
                   '五行のバランスを活かした職業選択が望ましいでしょう。あなたの強みを理解し、それを活かせる分野で専門性を高めることで、キャリアの充実と成功が期待できます。'}`}
                </Typography>
              )}
            </Paper>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SajuProfileCard;