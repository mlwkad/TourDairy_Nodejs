/**
 * 数据库连接配置文件
 * 用于连接MySQL数据库，提供连接池
 */
const mysql = require('mysql2/promise');

// 创建数据库连接池
const pool = mysql.createPool({
    host: 'travel-app-mysql.ns-bpj63jw3.svc',
    user: 'root',
    password: '5tgwjn6h',
    database: 'travel-app', // 数据库名称
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool; 