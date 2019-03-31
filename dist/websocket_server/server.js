"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const until_1 = require("../until");
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const express_ws_1 = __importDefault(require("express-ws"));
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const v1_1 = __importDefault(require("uuid/v1"));
const request_1 = __importDefault(require("request"));
const readline_1 = __importDefault(require("readline"));
class WSServer {
    constructor(config) {
        this.config = config;
    }
    get serverSnapshot() {
        return {
            linkNums: this.connencts.length,
            maxNums: this.config.server.connects,
            connents: this.connencts.map(con => con.uid),
            percent: Math.round(this.connencts.length * 100 / this.config.server.connects)
        };
    }
    get uuid() {
        this._uuid || (this._uuid = v1_1.default());
        return this._uuid;
    }
    init() {
        this.app = express_1.default();
        this.app.use(body_parser_1.default.json());
        this.app.use(body_parser_1.default.urlencoded({ extended: true }));
        this.app.all('*', (req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With, ng-params-one, ng-params-two, ng-params-three');
            res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
            req.method == 'OPTIONS' ? res.send(200) : next();
        });
        this.app.use(express_1.default.static(__dirname + '/../../public'));
        this.connencts = [];
        this.config.rsa.publicKey = fs_1.default.readFileSync(this.config.rsa.publicKey).toString();
        this.config.rsa.privateKey = fs_1.default.readFileSync(this.config.rsa.privateKey).toString();
    }
    initHttps() {
        // const privateKey = fs.readFileSync(this.config.https.privateKeyPath);
        // const certificate = fs.readFileSync(this.config.https.certificatePath);
        // const credentials = { key: privateKey, cert: certificate };
        // this.http = http.createServer(credentials, this.app);
        this.http = http_1.default.createServer(this.app);
        this.http.listen(this.config.server.port);
    }
    initWebApi() {
        // 获取一个可用授权连接
        this.app.post('/request', (req, res) => {
            if (req.body) {
                const result = until_1.Until.checkSign(req.body, this.config.apiServer.wsKey);
                const params = until_1.Until.decodeParams(req.body.params);
                const data = {
                    result,
                    data: result && {
                        url: this.config.server.wsHost,
                        token: until_1.Until.getUidToken(params.uid, this.config.rsa.publicKey),
                        uid: params.uid
                    }
                };
                res.status(200).json(data);
            }
            else {
                res.status(200).json({
                    result: false,
                    data: 'empty-params'
                });
            }
        });
        // 推送消息到指定用户
        this.app.post('/message', (req, res) => {
            try {
                const result = until_1.Until.checkSign(req.body, this.config.apiServer.wsKey);
                if (result) {
                    const message = until_1.Until.decodeParams(req.body.params);
                    if (message.from && message.to && message.message) {
                        const result = this.sendMessageTo(message);
                        res.status(200).json({
                            result,
                            message: 'request success'
                        });
                    }
                    else {
                        this.saveLog('错误消息内容-message' + JSON.stringify(req.body));
                        res.status(200).json({
                            result: false,
                            message: 'message error'
                        });
                    }
                }
                else {
                }
            }
            catch (e) {
                this.saveLog('参数解析失败-message' + JSON.stringify(req.body));
                res.status(200).json({
                    result: false,
                    message: 'request error',
                    error: e
                });
            }
        });
    }
    initWs() {
        const server = express_ws_1.default(this.app, this.http);
        this.ws = server.getWss();
        this.app['ws']('/', (ws, req) => {
            this.ws.on('connection', (socket) => {
                // 当前连接客户端
                const userClient = { uid: socket.protocol, client: socket, token: req.query && req.query.token };
                // 连接校验
                if (this.linkCheck(userClient) === false) {
                    return;
                }
                // 把之前没有发出的消息发送回去
                this.sendSaveMessage(userClient);
                // 关掉之前的连接
                this.connencts.filter(con => con.uid === userClient.uid)
                    .forEach(con => {
                    con.client && con.client.close();
                });
                // 加入新连接
                this.connencts.push(userClient);
                // 在客户端关闭的时候清理
                userClient.client.on('close', () => {
                    const i = this.connencts.indexOf(userClient);
                    this.connencts.splice(i, 1);
                    // 从队列中清除垃圾连接
                    this.connencts = this.connencts.filter(con => con.uid !== userClient.uid && con.client.readyState === true);
                });
            });
        });
    }
    serviceNotify() {
        let tricking = false;
        setInterval(() => {
            if (tricking)
                return;
            tricking = true;
            const info = {
                uuid: this.uuid,
                name: this.config.server.name,
                wsKey: this.config.apiServer.wsKey,
                messageUri: this.config.server.host + '/message',
                infoUri: this.config.server.host + '/info',
                wsUri: this.config.server.wsHost,
                requestUri: this.config.server.host + '/request',
                snapShot: this.serverSnapshot
            };
            request_1.default.post({
                url: this.config.apiServer.notifyUri, form: until_1.Until.signParams(info, this.config.apiServer.apiKey)
            }, (error) => {
                tricking = false;
            });
        }, this.config.apiServer.keepTime);
    }
    linkCheck(userClient) {
        // 超过连接数，终止连接
        if (this.connencts.length > this.config.server.connects) {
            return false;
        }
        // 权限令牌校验
        return until_1.Until.checkUidToken(userClient.uid, userClient.token, this.config.rsa.privateKey);
    }
    sendMessageTo(msg) {
        let result = false;
        try {
            const con = this.connencts.find(con => {
                return con.uid === msg.to;
            });
            if (con && con.client && con.client.readyState === 1) {
                con.client.send(JSON.stringify(msg));
                result = true;
            }
        }
        catch (e) {
            this.saveLog(JSON.stringify(e));
        }
        result || this.saveMessage(msg);
        return result;
    }
    sendSaveMessage(userClient) {
        try {
            const path = `${__dirname}/../../chat/${userClient.uid}.text`;
            const stream = fs_1.default.createReadStream(path);
            stream.on('error', () => { });
            stream.on('open', () => {
                const reader = readline_1.default.createInterface({ input: stream });
                reader.on('line', str => {
                    userClient.client.send(str);
                });
                reader.on('close', () => {
                    fs_1.default.unlink(path, () => { });
                });
            });
        }
        catch (e) { }
    }
    saveMessage(msg) {
        fs_1.default.appendFile(`${this.config.server.chatDir}/${msg.to}.text`, JSON.stringify(msg) + '\n', () => { });
    }
    saveLog(log) {
        fs_1.default.appendFile(this.config.server.logPath, log + '\n', () => { });
    }
    run() {
        this.init();
        this.initWebApi();
        this.initHttps();
        this.initWs();
        this.serviceNotify();
    }
}
exports.WSServer = WSServer;
//# sourceMappingURL=server.js.map