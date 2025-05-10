/** 指令:node src/initDB.js
 * 用于重置并初始化数据库(删除表后重新创建,带测试数据)
 */
const mysql = require('mysql2/promise');

// 创建不指定数据库的连接池
const rootPool = mysql.createPool({
    host: 'travel-app-mysql.ns-bpj63jw3.svc',
    user: 'root',
    password: '5tgwjn6h',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const pool = require('./config/db');
const userModel = require('./models/userModel');
const releaseModel = require('./models/releaseModel');

const initializeDatabase = async () => {
    try {
        console.log('开始初始化数据库...');

        // 先创建数据库（如果不存在）
        console.log('创建数据库...');
        await rootPool.query('CREATE DATABASE IF NOT EXISTS `travel-app`');
        console.log('数据库创建成功或已存在');

        // 删除现有表（如果存在）- 先删除有外键依赖的表
        console.log('删除现有表...');
        await pool.query('DROP TABLE IF EXISTS releases');
        await pool.query('DROP TABLE IF EXISTS users');

        // 初始化表
        console.log('创建用户表...');
        await userModel.initTable();

        console.log('创建发布内容表...');
        await releaseModel.initTable();

        console.log('数据库初始化完成！');
        process.exit(0);
    } catch (error) {
        console.error('数据库初始化失败:', error);
        process.exit(1);
    }
};

// 执行初始化
initializeDatabase(); 