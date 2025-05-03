/**
 * 主应用文件
 * 配置Express服务器和路由
 */
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const userRoutes = require('./routes/userRoutes');
const releaseRoutes = require('./routes/releaseRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const userModel = require('./models/userModel');
const releaseModel = require('./models/releaseModel');

// 初始化 Express 应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 路由配置
app.use('/api', userRoutes);
app.use('/api', releaseRoutes);
app.use('/api', uploadRoutes);

// 首页路由
app.get('/', (req, res) => {
    res.send('旅游信息分享平台API服务器');
});

// 初始化数据库表
const initDatabase = async () => {
    try {
        // 先初始化用户表
        await userModel.initTable();

        // 再初始化发布内容表 (因为有外键依赖)
        await releaseModel.initTable();

        console.log('数据库初始化完成');
    } catch (error) {
        console.error('数据库初始化失败:', error);
        process.exit(1);
    }
};

// 启动服务器
const startServer = async () => {
    try {
        // 初始化数据库
        await initDatabase();

        // 启动HTTP服务
        app.listen(PORT, () => {
            console.log(`服务器运行在端口 ${PORT}`);
            console.log(`访问地址: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('启动服务器失败:', error);
        process.exit(1);
    }
};

// 启动应用
startServer(); 