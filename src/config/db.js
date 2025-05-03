/**
 * 数据库连接配置文件
 * 用于连接MySQL数据库，提供连接池
 */
const mysql = require('mysql2/promise');

// 创建数据库连接池
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',      // 根据实际情况修改
    password: 'qweee',      // 根据实际情况修改
    database: 'travel_app', // 数据库名称
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool; 