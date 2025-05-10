/**
 * 配置文件
 * 提供应用程序的基本配置
 */

// 基本配置
const config = {
    // 应用配置
    name: '旅游信息分享平台',
    port: process.env.PORT || 3000,
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiration: '24h',

    // URL配置
    baseUrl: 'https://vkxvigkepssq.sealosbja.site',
    wsUrl: 'wss://vkxvigkepssq.sealosbja.site',

    // CORS配置
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
    },

    // 日志级别
    logLevel: 'info'
};

// 导出配置
module.exports = config; 