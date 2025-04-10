import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Icon, Paper } from '@mui/material';
import { ISajuProfile } from '@shared/index';
import sajuProfileService from '../../services/saju-profile.service';

interface SajuProfileCardProps {
  profile: ISajuProfile;
}

const SajuProfileCard: React.FC<SajuProfileCardProps> = ({ profile }) => {
  const formatDate = (date: Date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  };

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
              <Typography variant="subtitle2" color="text.secondary">日主:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {pillars.day.heavenlyStem}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">更新日:</Typography>
              <Typography variant="body2">
                {formatDate(new Date(profile.updatedAt))}
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
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                height: '100%', 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <Typography 
                variant="subtitle2" 
                color="primary" 
                align="center" 
                sx={{ 
                  borderBottom: '1px solid', 
                  borderColor: 'primary.light', 
                  pb: 1,
                  mb: 1
                }}
              >
                年柱
              </Typography>
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>天干:</strong> {pillars.year.heavenlyStem}
                                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>地支:</strong> {pillars.year.earthlyBranch}
                                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                height: '100%', 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <Typography 
                variant="subtitle2" 
                color="primary" 
                align="center" 
                sx={{ 
                  borderBottom: '1px solid', 
                  borderColor: 'primary.light', 
                  pb: 1,
                  mb: 1
                }}
              >
                月柱
              </Typography>
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>天干:</strong> {pillars.month.heavenlyStem}
                  {pillars.month.heavenlyStemTenGod && <span style={{fontSize: '0.85em', color: 'gray'}}> ({pillars.month.heavenlyStemTenGod})</span>}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>地支:</strong> {pillars.month.earthlyBranch}
                  {pillars.month.earthlyBranchTenGod && <span style={{fontSize: '0.85em', color: 'gray'}}> ({pillars.month.earthlyBranchTenGod})</span>}
                </Typography>
                {pillars.month.hiddenStems && pillars.month.hiddenStems.length > 0 && (
                  <Typography variant="body2" sx={{ fontSize: '0.85em', color: 'gray' }}>
                    <strong>蔵干:</strong> {pillars.month.hiddenStems.join(', ')}
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                height: '100%', 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                bgcolor: 'rgba(156, 39, 176, 0.05)'
              }}
            >
              <Typography 
                variant="subtitle2" 
                color="primary" 
                align="center" 
                sx={{ 
                  borderBottom: '1px solid', 
                  borderColor: 'primary.main', 
                  pb: 1,
                  mb: 1,
                  fontWeight: 'bold'
                }}
              >
                日柱
              </Typography>
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 'medium' }}>
                  <strong>天干:</strong> {pillars.day.heavenlyStem}
                  {pillars.day.heavenlyStemTenGod && <span style={{fontSize: '0.85em', color: 'gray'}}> (日主)</span>}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 'medium' }}>
                  <strong>地支:</strong> {pillars.day.earthlyBranch}
                  {pillars.day.earthlyBranchTenGod && <span style={{fontSize: '0.85em', color: 'gray'}}> ({pillars.day.earthlyBranchTenGod})</span>}
                </Typography>
                {pillars.day.hiddenStems && pillars.day.hiddenStems.length > 0 && (
                  <Typography variant="body2" sx={{ fontSize: '0.85em', color: 'gray', fontWeight: 'medium' }}>
                    <strong>蔵干:</strong> {pillars.day.hiddenStems.join(', ')}
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                height: '100%', 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <Typography 
                variant="subtitle2" 
                color="primary" 
                align="center" 
                sx={{ 
                  borderBottom: '1px solid', 
                  borderColor: 'primary.light', 
                  pb: 1,
                  mb: 1
                }}
              >
                時柱
              </Typography>
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>天干:</strong> {pillars.hour.heavenlyStem}
                  {pillars.hour.heavenlyStemTenGod && <span style={{fontSize: '0.85em', color: 'gray'}}> ({pillars.hour.heavenlyStemTenGod})</span>}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>地支:</strong> {pillars.hour.earthlyBranch}
                  {pillars.hour.earthlyBranchTenGod && <span style={{fontSize: '0.85em', color: 'gray'}}> ({pillars.hour.earthlyBranchTenGod})</span>}
                </Typography>
                {pillars.hour.hiddenStems && pillars.hour.hiddenStems.length > 0 && (
                  <Typography variant="body2" sx={{ fontSize: '0.85em', color: 'gray' }}>
                    <strong>蔵干:</strong> {pillars.hour.hiddenStems.join(', ')}
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>

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
          性格特性
        </Typography>
        
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 3, 
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            backgroundColor: 'rgba(250, 245, 255, 0.5)'
          }}
        >
          <Typography variant="body2" paragraph>
            {profile.personalityDescription || 
              `あなたの主要な五行属性は「${sajuProfileService.translateElementToJapanese(mainElement)}」です。
              ${mainElement === 'metal' ? '金属の属性を持つあなたは、効率的で分析力に優れた性格です。規律正しく、高い基準を持ち、目標達成への計画性があります。正義感が強く、細部にこだわる傾向があります。' :
               mainElement === 'wood' ? '木の属性を持つあなたは、成長志向で適応力の高い性格です。創造性と自己主張が強く、計画性があり、新しいアイデアに積極的です。理想主義的な面もあります。' :
               mainElement === 'water' ? '水の属性を持つあなたは、知的好奇心が強く深い洞察力を持ちます。柔軟性があり、直感的で創造的、人の感情を敏感に察知します。流れに身を任せる柔軟さも持ち合わせています。' :
               mainElement === 'fire' ? '火の属性を持つあなたは、情熱的でエネルギッシュ、社交的な性格です。明るく楽観的で、人々を鼓舞する力があります。表現力が豊かで、感情の起伏が活発です。' :
               mainElement === 'earth' ? '土の属性を持つあなたは、安定性と信頼性を重視し、実用的で堅実な判断力を持ちます。忍耐強く責任感があり、人間関係を大切にします。地に足のついた考え方をします。' :
               '五行のバランスがとれた性格で、状況に応じて柔軟に対応できる適応力があります。'}`}
          </Typography>
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
          仕事とキャリア
        </Typography>
        
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
          <Typography variant="body2" paragraph>
            {profile.careerAptitude || 
              `${mainElement === 'metal' ? '金属の五行を持つあなたは、精密さと効率を重視する職業に適性があります。会計士、エンジニア、ITプロフェッショナル、品質管理、法律家などの職種で才能を発揮できるでしょう。計画性と完璧さを追求する仕事が向いています。' :
               mainElement === 'wood' ? '木の五行を持つあなたは、創造性と成長を伴う職業に適性があります。教育者、プロジェクトマネージャー、環境関連、コンサルタント、起業家などの分野で活躍できるでしょう。長期的なビジョンを持ち、物事を育てる仕事が向いています。' :
               mainElement === 'water' ? '水の五行を持つあなたは、知性と直感力を活かせる職業に適性があります。研究者、作家、心理学者、アナリスト、哲学者などの分野で才能を発揮できるでしょう。深い洞察と創造的思考を活かす仕事が向いています。' :
               mainElement === 'fire' ? '火の五行を持つあなたは、情熱とエネルギーを活かせる職業に適性があります。営業、マーケティング、パフォーマー、デザイナー、広報など人前に立つ仕事や、リーダーシップを発揮できる役職が向いています。' :
               mainElement === 'earth' ? '土の五行を持つあなたは、安定性と実用性を重視する職業に適性があります。不動産、人事、カウンセラー、医療従事者、対人サービス業などが向いています。人を支え、安定した環境を作る仕事で力を発揮するでしょう。' :
               '五行のバランスを活かした職業選択が望ましいでしょう。あなたの強みを理解し、それを活かせる分野で専門性を高めることで、キャリアの充実と成功が期待できます。'}`}
          </Typography>
        </Paper>
      </CardContent>
    </Card>
  );
};

export default SajuProfileCard;