const axios = require('axios');
const WebSocket = require('ws');
const CryptoJS = require('crypto-js');

// 讯飞API配置
// const XUNFEI_API_URL = 'https://spark-api-open.xf-yun.com/v1/chat/completions'; // HTTP API URL
const XUNFEI_WS_URL = 'wss://spark-api.xf-yun.com/v3.5/chat'; // WebSocket API URL
// const API_PASSWORD = 'ShpsjHBxeqSsFfTcDJGk:oUuYyhMCunBDegUnKqrS';  //lite模型
const API_PASSWORD = 'aTshaQawqHQfFnyEYJpM:HDtHRUGpERoilPpbhrON';  //MAX模型

// 解析API_PASSWORD为appid、apikey和apisecret
const extractCredentials = (apiPassword) => {
    const [apiKey, apiSecret] = apiPassword.split(':');
    return {
        appId: '33b36048',  // 讯飞星火应用的APP_ID
        apiKey,
        apiSecret
    };
};

const credentials = extractCredentials(API_PASSWORD);

const chatController = {
    // 新的WebSocket处理方法
    handleWebSocketChat: async (message, clientWs) => {
        console.log('开始处理WebSocket聊天消息:', message);
        try {
            // 1. 生成鉴权URL
            const currentDate = new Date().toGMTString();
            const signatureOrigin = `host: spark-api.xf-yun.com\ndate: ${currentDate}\nGET /v3.5/chat HTTP/1.1`;
            const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, credentials.apiSecret);
            const signature = CryptoJS.enc.Base64.stringify(signatureSha);
            const authorizationOrigin = `api_key="${credentials.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
            const authorization = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(authorizationOrigin));

            // 2. 构建鉴权URL
            const wssUrl = `${XUNFEI_WS_URL}?authorization=${authorization}&date=${encodeURI(currentDate)}&host=spark-api.xf-yun.com`;
            console.log("正在连接到讯飞WebSocket API...");

            // 3. 连接讯飞WebSocket API
            const xfWs = new WebSocket(wssUrl);
            let totalTokens = 0;
            let isConnected = false;

            // 4. 处理WebSocket连接打开事件
            xfWs.on('open', () => {
                isConnected = true;
                console.log('已成功连接到讯飞WebSocket API');

                // 5. 构建请求数据
                const requestData = {
                    header: {
                        app_id: credentials.appId,
                        uid: "12345"
                    },
                    parameter: {
                        chat: {
                            domain: "generalv3.5",
                            temperature: 0.5,
                            max_tokens: 4096
                        }
                    },
                    payload: {
                        message: {
                            text: [
                                { "role": "user", "content": message }
                            ]
                        }
                    }
                };

                console.log('发送请求到讯飞API:', JSON.stringify(requestData));
                // 6. 发送请求
                xfWs.send(JSON.stringify(requestData));
            });

            // 7. 处理WebSocket消息
            xfWs.on('message', (data) => {
                try {
                    console.log('收到讯飞API响应:', data.toString());
                    const response = JSON.parse(data.toString());

                    // 8. 处理响应
                    if (response.header.code !== 0) {
                        console.error(`讯飞API错误: 代码=${response.header.code}, 消息=${response.header.message}`);
                        clientWs.send(JSON.stringify({
                            type: 'error',
                            error: `错误码: ${response.header.code}, 信息: ${response.header.message}`
                        }));
                        xfWs.close();
                        return;
                    }

                    // 9. 提取内容
                    if (response.payload.choices.text) {
                        const content = response.payload.choices.text[0].content || '';
                        console.log('发送内容给客户端:', content);

                        if (response.payload.usage && response.payload.usage.text) {
                            totalTokens = response.payload.usage.text.total_tokens || 0;
                        }

                        clientWs.send(JSON.stringify({
                            type: 'chat',
                            content
                        }));
                    }

                    // 处理在线搜索内容
                    if (response.payload.choices.plugin_output &&
                        response.payload.choices.plugin_output.web_search &&
                        response.payload.choices.plugin_output.web_search.output) {

                        const onlineInfo = response.payload.choices.plugin_output.web_search.output;
                        console.log('发送在线搜索信息给客户端:', onlineInfo);

                        clientWs.send(JSON.stringify({
                            type: 'chat',
                            onlineInfo
                        }));
                    }

                    // 10. 处理对话结束
                    if (response.header.status === 2) {
                        console.log('对话结束，发送完成消息');
                        clientWs.send(JSON.stringify({
                            type: 'done',
                            totalTokens
                        }));

                        xfWs.close();
                        console.log(`WebSocket聊天完成，消耗总token数: ${totalTokens}`);
                    }
                } catch (e) {
                    console.error('处理响应消息失败:', e);
                }
            });

            // 11. 处理WebSocket错误
            xfWs.on('error', (error) => {
                console.error('讯飞WebSocket API错误:', error);
                clientWs.send(JSON.stringify({
                    type: 'error',
                    error: '与AI服务连接出错'
                }));

                if (isConnected) {
                    xfWs.close();
                }
            });

            // 12. 处理WebSocket关闭
            xfWs.on('close', () => {
                console.log('讯飞WebSocket API连接关闭');
                clientWs.send(JSON.stringify({
                    type: 'end'
                }));
            });

            // 13. 监听客户端WebSocket关闭
            clientWs.on('close', () => {
                console.log('客户端WebSocket已关闭，关闭与讯飞的连接');
                if (xfWs.readyState === WebSocket.OPEN) {
                    xfWs.close();
                }
            });

        } catch (error) {
            console.error('WebSocket聊天处理错误:', error);
            clientWs.send(JSON.stringify({
                type: 'error',
                error: '服务器内部错误: ' + (error.message || '未知错误')
            }));
        }
    }
};

module.exports = chatController;