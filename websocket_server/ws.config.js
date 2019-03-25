export const config = {
    server: {
        name: '1号服务器',
        port: 8000,
        connects: 100, // 最大连接数量
        logPath: '日志保存路径'
    },
    https: {
        privateKeyPath: '/var/www/letsencrypt.sh/certs/privkey.pem',
        certificatePath: '/var/www/letsencrypt.sh/certs/fullchain.pem'
    },
    apiServer: {
        host: 'http://127.0.0.1:8080',
        apiKey: 'API服务器通信钥匙',
        wsKey: '本服务器通信钥匙',
        keepTime: 1000, // 通知发送间隔，确保apiServer为在线状态，一旦发现后将不在推送
    }
};