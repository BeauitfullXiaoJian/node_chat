import { WSServerInfo } from '../websocket_server/ws.config';

export const config = {
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
        keepTime: 1000, // ws服务器信息轮询间隔，
    }
};

export interface ApiConfig {
    server: {
        name: string,
        port: number,
        logPath: string,
        apiKey: string,
        chatDir: string
    },
    https: {
        privateKeyPath: string,
        certificatePath: string
    },
    wsServer: {
        keepTime: number
    }
}

export interface ApiServerSnapshot {
    wsServers: WSServerInfo[]
    connects: string[]
}