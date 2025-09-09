#!/usr/bin/env node

const mysql = require('mysql2/promise');

// 数据库配置
const config = {
  host: '45.221.115.62',
  port: 3306,
  user: 'root',
  password: 'mysql_DkX6wK',
};

const databaseName = '4QHfk4FyDQhrE56D';

async function createDatabase() {
  let connection;
  
  try {
    console.log('🔗 连接到MySQL服务器...');
    connection = await mysql.createConnection(config);
    
    console.log('✅ 连接成功');
    
    // 检查数据库是否存在
    const [databases] = await connection.execute('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === databaseName);
    
    if (dbExists) {
      console.log(`✅ 数据库 '${databaseName}' 已存在`);
    } else {
      console.log(`📝 创建数据库 '${databaseName}'...`);
      await connection.execute(`CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`✅ 数据库 '${databaseName}' 创建成功`);
    }
    
    // 切换到新数据库
    await connection.execute(`USE \`${databaseName}\``);
    
    // 检查是否有表
    const [tables] = await connection.execute('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('📋 数据库为空，需要运行迁移来创建表结构');
      console.log('💡 请运行: cd backend && npm run migration:run');
    } else {
      console.log(`📊 数据库包含 ${tables.length} 个表:`);
      tables.forEach(table => {
        console.log(`   - ${Object.values(table)[0]}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 建议: 检查MySQL服务器是否运行，以及主机地址和端口是否正确');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 建议: 检查用户名和密码是否正确');
    } else if (error.code === 'ENOTFOUND') {
      console.log('💡 建议: 检查主机地址是否正确，网络连接是否正常');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 运行脚本
createDatabase().catch(console.error);
