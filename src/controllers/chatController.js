const WebSocket = require('ws')
const CryptoJS = require('crypto-js')

// 讯飞API配置
// const XUNFEI_API_URL = 'https://spark-api-open.xf-yun.com/v1/chat/completions' // HTTP API URL
const XUNFEI_WS_URL = 'wss://spark-api.xf-yun.com/v3.5/chat' // WebSocket API URL
// const API_PASSWORD = 'ShpsjHBxeqSsFfTcDJGk:oUuYyhMCunBDegUnKqrS'  //lite模型
const API_PASSWORD = 'aTshaQawqHQfFnyEYJpM:HDtHRUGpERoilPpbhrON'  //MAX模型

// 过滤特殊字符的函数
const filterSpecialCharacters = (text) => {
    if (!text) return '';
    // 过滤掉特殊字符如*#等，可以根据需要添加更多字符
    return text.replace(/[*#~`@$%^&()=+{}\[\]|\\<>]/g, '');
}

// 解析API_PASSWORD为appid、apikey和apisecret
const extractCredentials = (apiPassword) => {
    const [apiKey, apiSecret] = apiPassword.split(':')
    return {
        appId: '33b36048',  // 讯飞星火应用的APP_ID
        apiKey,
        apiSecret
    }
}

const credentials = extractCredentials(API_PASSWORD)

const chatController = {
    // 新的WebSocket处理方法
    webSocketChat: async (message, clientWs) => {
        try {
            // 1. 生成鉴权URL
            const currentDate = new Date().toGMTString();
            const signatureOrigin = `host: spark-api.xf-yun.com\ndate: ${currentDate}\nGET /v3.5/chat HTTP/1.1`
            const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, credentials.apiSecret)
            const signature = CryptoJS.enc.Base64.stringify(signatureSha)
            const authorizationOrigin = `api_key="${credentials.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
            const authorization = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(authorizationOrigin))
            // 2. 构建鉴权URL
            const wssUrl = `${XUNFEI_WS_URL}?authorization=${authorization}&date=${encodeURI(currentDate)}&host=spark-api.xf-yun.com`
            // 3. 连接讯飞WebSocket API
            const xfWs = new WebSocket(wssUrl)
            let isConnected = false
            // 4. WebSocket连接打开
            xfWs.on('open', () => {
                isConnected = true
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
                }
                // 6. 发送请求
                xfWs.send(JSON.stringify(requestData))
            })

            // 7. 接收消息
            xfWs.on('message', (data) => {
                try {
                    const response = JSON.parse(data.toString())
                    // 8. 处理错误响应
                    if (response.header.code !== 0) {
                        clientWs.send(JSON.stringify({  // 告知客户端
                            type: 'error',
                            error: `错误码: ${response.header.code}, 信息: ${response.header.message}`
                        }))
                        xfWs.close()
                        return
                    }
                    // 9. 提取内容
                    if (response.payload && response.payload.choices) {
                        if (response.payload.choices.text) {
                            // Handle array or object response format
                            let content = '';
                            if (Array.isArray(response.payload.choices.text)) {
                                content = response.payload.choices.text[0]?.content || '';
                            } else if (typeof response.payload.choices.text === 'object') {
                                content = response.payload.choices.text.content || '';
                            } else {
                                content = String(response.payload.choices.text);
                            }

                            clientWs.send(JSON.stringify({
                                type: 'chat',
                                content: filterSpecialCharacters(content)
                            }))
                        }

                        // 处理在线搜索内容
                        if (response.payload.choices.plugin_output &&
                            response.payload.choices.plugin_output.web_search &&
                            response.payload.choices.plugin_output.web_search.output) {
                            const onlineInfo = response.payload.choices.plugin_output.web_search.output;
                            clientWs.send(JSON.stringify({
                                type: 'chat',
                                onlineInfo: filterSpecialCharacters(onlineInfo)
                            }));
                        }
                    }
                    // 10. 处理对话结束
                    if (response.header.status === 2) {
                        clientWs.send(JSON.stringify({ type: 'done' }))
                        xfWs.close()
                    }
                } catch (e) {
                    console.log('处理响应消息失败:', e);
                }
            });
            // 11. 处理WebSocket错误
            xfWs.on('error', (error) => {
                clientWs.send(JSON.stringify({
                    type: 'error',
                    error: `与AI服务连接出错:${error}`
                }))
                if (isConnected) xfWs.close()
            })
            // 12. 处理WebSocket关闭
            xfWs.on('close', () => clientWs.send(JSON.stringify({ type: 'end' })))
            // 13. 客户端WebSocket关闭,就关闭讯飞ws连接
            clientWs.on('close', () => { if (xfWs.readyState === WebSocket.OPEN) xfWs.close() })
        } catch (error) {
            clientWs.send(JSON.stringify({
                type: 'error',
                error: '服务器内部错误: ' + (error.message || '未知错误')
            }))
        }
    }
}

module.exports = chatController