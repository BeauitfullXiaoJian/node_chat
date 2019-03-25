export const config = {
    server: {
        name: '接口服务器',
        port: 8080,
        logPath: '日志保存路径'
    },
    https: {
        privateKeyPath: '/var/www/letsencrypt.sh/certs/privkey.pem',
        certificatePath: '/var/www/letsencrypt.sh/certs/fullchain.pem'
    },
    wsServer: {
        keepTime: 1000, // ws服务器信息轮询间隔，
    }
};