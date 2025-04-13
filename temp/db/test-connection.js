const mongoose = require('mongoose');

// MongoDB接続文字列
const uri = "mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune?retryWrites=true&w=majority&appName=MotherPrompt-Cluster";

async function main() {
  try {
    console.log('MongoDB に接続しています...');
    await mongoose.connect(uri);
    console.log('MongoDB に接続しました');

    // データベース一覧を取得
    const admin = mongoose.connection.db.admin();
    const databases = await admin.listDatabases();
    console.log('データベース一覧:');
    console.log(databases.databases.map(db => db.name));

    // dailyfortuneデータベースのコレクション一覧を取得
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\ndailyfortuneデータベースのコレクション:');
    if (collections.length === 0) {
      console.log('コレクションが存在しません（データベースは空です）');
    } else {
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    }

    // 任意のサンプルデータを取得
    if (collections.length > 0) {
      const sampleCollection = collections[0].name;
      const sampleData = await mongoose.connection.db.collection(sampleCollection).find({}).limit(2).toArray();
      console.log(`\n${sampleCollection}のサンプルデータ（最大2件）:`);
      console.log(JSON.stringify(sampleData, null, 2));
    }

  } catch (error) {
    console.error('MongoDB 接続エラー:', error);
  } finally {
    // 接続を閉じる
    await mongoose.connection.close();
    console.log('MongoDB 接続を閉じました');
  }
}

main();