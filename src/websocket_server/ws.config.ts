export const config = {
    server: {
        name: '1号服务器',
        host: 'http://127.0.0.1:8000',
        wsHost: 'ws://192.168.1.109:8000',
        port: 8000,
        connects: 100, // 最大连接数量
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
        keepTime: 1000, // 通知发送间隔，确保apiServer为在线状态，一旦发现后将不在推送
    }
};

export interface WSConfig {
    server: {
        name: string,
        host: string,
        wsHost: string,
        port: number,
        connects: number,
        logPath: string,
        chatDir: string
    },
    https: {
        privateKeyPath: string,
        certificatePath: string
    },
    rsa: {
        publicKey: any,
        privateKey: any
    }
    apiServer: {
        host: string,
        notifyUri: string,
        apiKey: string,
        wsKey: string,
        keepTime: number,
    }
}

export interface ServerSnapshot {
    linkNums: number;
    maxNums: number;
    connents: string[];
    percent: number;
}

export interface WSServerInfo {
    uuid: string;
    name: string;
    wsKey: string;
    messageUri: string;
    infoUri: string;
    requestUri: string;
    wsUri: string;
    snapShot: ServerSnapshot;
}

export interface Message {
    from: string;
    to: string;
    sendTime: number;
    message: {
        type: string,
        content: string
    }
}

export interface UserClient {
    client: any;
    uid: string;
    token: string;
}