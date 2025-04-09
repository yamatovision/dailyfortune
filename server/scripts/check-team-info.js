/**
 * チーム情報確認スクリプト
 */
const mongoose = require('mongoose');
const path = require('path');

// 環境変数のロード
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// データベース接続
const databaseUri = process.env.DATABASE_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';
console.log('Connecting to MongoDB...');

mongoose.connect(databaseUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB successfully'))
.catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

// チームスキーマ
const TeamSchema = new mongoose.Schema({}, { strict: false });
const Team = mongoose.model('Team', TeamSchema, 'teams');

// チーム情報を取得して表示する関数
const displayTeamInfo = async () => {
  try {
    // チーム一覧を取得
    const teams = await Team.find();
    
    console.log(`Total teams in database: ${teams.length}`);
    
    // 各チームの情報を表示
    teams.forEach((team, index) => {
      console.log(`\nTeam ${index + 1}:`);
      console.log(`  ID: ${team._id}`);
      console.log(`  Name: ${team.name}`);
      console.log(`  Admin ID: ${team.adminId}`);
      console.log(`  Description: ${team.description || 'None'}`);
      console.log(`  Fields: ${Object.keys(team.toObject()).join(', ')}`);
    });
    
  } catch (error) {
    console.error('Error retrieving team information:', error);
  } finally {
    // データベース接続を閉じる
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

// 実行
displayTeamInfo();