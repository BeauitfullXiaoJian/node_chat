"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const until_1 = require("../until");
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const request_1 = __importDefault(require("request"));
class ApiServer {
    constructor(config) {
        this.config = config;
    }
    get uids() {
        const connencts = new Array();
        this.wsServices.map(ws => ws.snapShot.connents).forEach(cons => connencts.push(...cons));
        return connencts;
    }
    findUidWS(uid) {
        return this.wsServices.find(ws => ws.snapShot.connents.indexOf(uid) >= 0);
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
        this.wsServices = [];
    }
    initHttps() {
        // const privateKey = fs.readFileSync(this.config.https.privateKeyPath);
        // const certificate = fs.readFileSync(this.config.https.certificatePath);
        // const credentials = { key: privateKey, cert: certificate };
        // this.http = http.createServer(credentials, this.app);
        this.http = http_1.default.createServer(this.app);
        this.http.listen(this.config.server.port);
    }
    /**
     * 对webapi开放的接口
     */
    initWebApi() {
        // 接收服务通知消息，用于服务发现
        this.app.post('/notify', (req, res) => {
            if (req.body) {
                const result = until_1.Until.checkSign(req.body, this.config.server.apiKey);
                result && this.updateWsServer(JSON.parse(Buffer.from(req.body.params, 'base64').toString()));
            }
            return res.send('success');
        });
        // 获取服务器信息
        this.app.get('/info', (req, res) => {
            this.serverSnapshot = {
                wsServers: this.wsServices,
                connects: this.uids
            };
            return res.status(200).json({
                result: true,
                data: this.serverSnapshot
            });
        });
        // 获取一个可用的websocket连接
        this.app.get('/request', (req, res) => {
            this.getWsLink(0, 'x84321dfds', (data) => {
                return res.status(200).json(data);
            });
        });
        // 发送消息给指定目标
        this.app.post('/message', (req, res) => {
            const message = req.body.message;
            if (until_1.Until.isMessageObject(message)) {
                message.sendTime = new Date().getTime();
                const ws = this.findUidWS(message.to);
                if (ws) {
                    this.sendApiRequestToWS(ws, ws.messageUri, message).on('complete', (resp) => {
                        res.status(200).json(JSON.parse(resp.body));
                    }).on('error', () => {
                        console.log('服务器通信异常');
                        this.saveMessage(message);
                        res.status(200).json({ result: false, message: 'server error' });
                    });
                }
                else {
                    this.saveMessage(message);
                    res.status(200).json({ result: false, message: 'not online' });
                }
            }
            else {
                res.status(200).json({ result: false, message: 'message type error' });
            }
        });
    }
    sendApiRequestToWS(ws, url, params) {
        params = until_1.Until.signParams(params, ws.wsKey);
        return request_1.default.post({ url, form: params }, (error, res, body) => { });
    }
    saveMessage(msg) {
        fs_1.default.appendFile(`${this.config.server.chatDir}/${msg.to}.text`, JSON.stringify(msg) + '\n', () => { });
    }
    saveLog(log) {
        fs_1.default.appendFile(this.config.server.logPath, log + '\n', () => { });
    }
    updateWsServer(wsInfo) {
        const index = this.wsServices.findIndex(ws => ws.uuid === wsInfo.uuid);
        ~index ? this.wsServices[index] = wsInfo : this.wsServices.push(wsInfo);
    }
    getOrderWsServers() {
        this.wsServices = this.wsServices.sort((a, b) => a.snapShot.percent - b.snapShot.percent);
        return this.wsServices.map(ws => ws.requestUri);
    }
    getWsLink(i, uid, callback) {
        if (this.wsServices.length === i) {
            callback({ result: false, message: 'no avaliable server' });
        }
        else {
            const ws = this.wsServices[i];
            this.sendApiRequestToWS(ws, ws.requestUri, { uid })
                .on('complete', (res) => {
                callback(JSON.parse(res.body));
            })
                .on('error', () => {
                console.log('服务器通信异常');
                this.getWsLink(++i, uid, callback);
            });
        }
    }
    run() {
        this.init();
        this.initWebApi();
        this.initHttps();
    }
}
exports.ApiServer = ApiServer;
//# sourceMappingURL=server.js.map