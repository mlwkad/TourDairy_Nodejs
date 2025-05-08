/**
 * 主应用文件
 * 配置Express服务器和路由
 */
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');




const http = require('http');
const WebSocket = require('ws');




const userRoutes = require('./routes/userRoutes');
const releaseRoutes = require('./routes/releaseRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const userModel = require('./models/userModel');
const releaseModel = require('./models/releaseModel');
const chatController = require('./controllers/chatController');

// 初始化 Express 应用
const app = express();
const PORT = process.env.PORT || 3000;





const server = http.createServer(app);

// 创建WebSocket服务器
const wss = new WebSocket.Server({ server });

// WebSocket连接处理
wss.on('connection', (ws) => {
    console.log('WebSocket客户端已连接');

    // 添加心跳检测
    const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
        }
    }, 30000);

    // 处理接收到的消息
    ws.on('message', async (message) => {
        console.log('收到WebSocket消息:', message.toString());
        try {
            const data = JSON.parse(message);
            console.log('解析后的消息数据:', data);

            if (data.type === 'chat') {
                console.log('处理聊天消息:', data.message);
                // 调用聊天控制器处理WebSocket消息
                await chatController.handleWebSocketChat(data.message, ws);
            } else {
                console.log('未知的消息类型:', data.type);
                ws.send(JSON.stringify({
                    type: 'error',
                    error: '未知的消息类型'
                }));
            }
        } catch (error) {
            console.error('WebSocket消息处理错误:', error);
            console.error('原始消息内容:', message.toString());
            ws.send(JSON.stringify({
                type: 'error',
                error: '消息处理失败: ' + error.message
            }));
        }
    });

    // 处理连接关闭
    ws.on('close', () => {
        console.log('WebSocket客户端已断开连接');
        clearInterval(heartbeat);
    });

    // 处理错误
    ws.on('error', (error) => {
        console.error('WebSocket错误:', error);
        clearInterval(heartbeat);
    });

    // 发送连接成功消息
    ws.send(JSON.stringify({
        type: 'chat',
        content: '服务器连接成功'
    }));
});





// 中间件配置
app.use(cors());  // 跨域处理
app.use(bodyParser.json());  // 解析json请求体
app.use(bodyParser.urlencoded({ extended: true }));  // 解析urlencoded请求体

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
        server.listen(PORT, () => {
            console.log(`服务器运行在端口 ${PORT}`);
            console.log(`访问地址: http://localhost:${PORT}`);
            console.log(`WebSocket地址: ws://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('启动服务器失败:', error);
        process.exit(1);
    }
};

// 启动应用
startServer(); 