/**
 * 主应用文件
 * 配置Express服务器和路由
 */
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const path = require('path')
const userRoutes = require('./routes/userRoutes')
const releaseRoutes = require('./routes/releaseRoutes')
const uploadRoutes = require('./routes/uploadRoutes')
const userModel = require('./models/userModel')
const releaseModel = require('./models/releaseModel')
const chatController = require('./controllers/chatController')
const config = require('./config/environment')

// 初始化 Express 应用
const app = express()
const PORT = config.port

// 创建WebSocket服务器
const http = require('http')
const WebSocket = require('ws')
const server = http.createServer(app)
// WebSocket服务的实例,表示整个 WebSocket 服务器,负责与客户端连接
const wss = new WebSocket.Server({ server })

// WebSocket连接处理
wss.on('connection', (ws) => {  // WebSocket 的实例,表示单个客户端与服务器的连接
    console.log('有ws客户端连接')
    // 添加心跳检测
    const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            // WebSocket.CONNECTING（值为 0）：连接正在建立
            // WebSocket.OPEN（值为 1）：连接已建立并可通信
            // WebSocket.CLOSING（值为 2）：连接正在关闭
            // WebSocket.CLOSED（值为 3）：连接已关闭或无法打开
            // ws.readyState (值为以上其一)
            ws.send(JSON.stringify({ type: 'ping' }))
        }
    }, 30000)
    // 处理接收到的消息
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message)
            if (data.type === 'chat') {
                console.log('处理聊天消息:', data.message);
                // 调用聊天控制器处理WebSocket消息
                await chatController.webSocketChat(data.message, ws)
            } else {
                ws.send(JSON.stringify({
                    type: 'error',
                    error: '未知的消息类型'
                }))
            }
        } catch (error) {
            ws.send(JSON.stringify({
                type: 'error',
                error: '消息处理失败: ' + error.message
            }))
        }
    })
    // 处理连接关闭
    ws.on('close', () => {
        console.log('ws服务器断开')
        clearInterval(heartbeat)
    })
    // 处理错误
    ws.on('error', (error) => {
        console.error('ws服务器错误:', error)
        clearInterval(heartbeat)
    })
    // 告知客户端连接成功
    // ws.send(JSON.stringify({
    //     type: 'chat',
    //     content: '已与ws服务器连接'
    // }))
})

// 中间件配置
app.use(cors(config.cors));  // 使用配置的CORS设置
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
}

// 启动服务器
const startServer = async () => {
    try {
        // 初始化数据库
        await initDatabase();

        // 启动HTTP服务
        server.listen(PORT, () => {
            console.log(`服务器运行在端口 ${PORT}`);
            console.log(`访问地址: ${config.baseUrl}`);
            console.log(`WebSocket地址: ${config.wsUrl}`);
        });
    } catch (error) {
        console.error('启动服务器失败:', error);
        process.exit(1);
    }
};

// 启动应用
startServer(); 