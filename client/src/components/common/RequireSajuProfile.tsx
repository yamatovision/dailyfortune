import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import SajuProfileModal from '../profile/SajuProfileModal';
import { useNavigate } from 'react-router-dom';

interface RequireSajuProfileProps {
  children: React.ReactNode;
}

/**
 * 四柱推命プロフィールが必要なページをラップするコンポーネント
 * プロフィールが存在しない場合、入力モーダルを表示します
 */
const RequireSajuProfile: React.FC<RequireSajuProfileProps> = ({ children }) => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // プロフィールが存在するかを判定する関数
  const hasSajuProfile = () => {
    if (!userProfile) return false;
    
    // 四柱推命情報が存在するかを確認
    const hasFourPillars = userProfile.fourPillars && 
      Object.keys(userProfile.fourPillars).length > 0 &&
      userProfile.fourPillars.day?.heavenlyStem;
    
    // 必要な基本情報が存在するかを確認
    const hasBasicInfo = 
      userProfile.birthDate && 
      userProfile.birthTime && 
      userProfile.birthPlace && 
      userProfile.gender;
    
    // 四柱推命の属性情報が存在するか確認
    const hasElementInfo = userProfile.elementAttribute && userProfile.elementAttribute.length > 0;
    
    return hasFourPillars && hasBasicInfo && hasElementInfo;
  };
  
  useEffect(() => {
    // ユーザープロフィールのロード完了後に四柱推命情報をチェック
    if (userProfile) {
      if (!hasSajuProfile()) {
        console.log('四柱推命プロフィールが見つかりません。入力モーダルを表示します。');
        setShowProfileModal(true);
      }
    }
  }, [userProfile]);
  
  const handleProfileComplete = () => {
    console.log('四柱推命プロフィールが正常に登録されました。');
    setShowProfileModal(false);
    
    // 現在のURLをリロードして最新データを表示
    window.location.reload();
  };
  
  const handleModalClose = () => {
    console.log('ユーザーが四柱推命プロフィール入力をスキップしました。');
    setShowProfileModal(false);
    
    // プロフィール入力がスキップされた場合はプロフィールページにリダイレクト
    navigate('/profile');
  };
  
  return (
    <>
      {children}
      
      <SajuProfileModal 
        open={showProfileModal} 
        onClose={handleModalClose}
        onComplete={handleProfileComplete} 
      />
    </>
  );
};

export default RequireSajuProfile;