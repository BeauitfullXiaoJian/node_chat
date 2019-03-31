"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = {
    server: {
        name: '接口服务器',
        port: 8080,
        logPath: `${__dirname}/../../api_log.text`,
        apiKey: 'DEFAULT_WEBAPI_KEY',
        chatDir: `${__dirname}/../../chat`
    },
    https: {
        privateKeyPath: '/var/www/letsencrypt.sh/certs/privkey.pem',
        certificatePath: '/var/www/letsencrypt.sh/certs/fullchain.pem'
    },
    wsServer: {
        keepTime: 1000,
    }
};
//# sourceMappingURL=api.config.js.map