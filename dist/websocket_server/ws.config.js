"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = {
    server: {
        name: '1号服务器',
        host: 'http://127.0.0.1:8000',
        wsHost: 'ws://127.0.0.1:8000',
        port: 8000,
        connects: 100,
        logPath: `${__dirname}/../../log.text`,
        chatDir: `${__dirname}/../../chat`
    },
    https: {
        privateKeyPath: '/var/www/letsencrypt.sh/certs/privkey.pem',
        certificatePath: '/var/www/letsencrypt.sh/certs/fullchain.pem'
    },
    rsa: {
        publicKey: `${__dirname}/../../public.pem`,
        privateKey: `${__dirname}/../../private.pem`,
    },
    apiServer: {
        host: 'http://127.0.0.1:8080',
        notifyUri: 'http://127.0.0.1:8080/notify',
        apiKey: 'DEFAULT_WEBAPI_KEY',
        wsKey: 'DEFAULT_WS_KEY',
        keepTime: 1000,
    }
};
//# sourceMappingURL=ws.config.js.map