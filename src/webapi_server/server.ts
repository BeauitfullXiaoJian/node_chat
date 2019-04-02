import { ApiConfig, ApiServerSnapshot } from './api.config';
import { Until } from '../until';
import { WSServerInfo, Message } from '../websocket_server/ws.config';
import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import fs from 'fs';
import request from 'request';

export class ApiServer {

    private app: express.Express;
    private http: any;
    private serverSnapshot: ApiServerSnapshot;
    private wsServices: WSServerInfo[];
    private get uids(): string[] {
        const connencts = new Array<string>();
        this.wsServices.map(ws => ws.snapShot.connents).forEach(cons => connencts.push(...cons));
        return connencts;
    }

    constructor(private config: ApiConfig) { }

    findUidWS(uid: string) {
        return this.wsServices.find(ws => ws.snapShot.connents.indexOf(uid) >= 0);
    }

    init() {
        this.app = express();
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.all('*', (req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With, ng-params-one, ng-params-two, ng-params-three');
            res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
            req.method == 'OPTIONS' ? res.sendStatus(200) : next();
        });
        this.app.use(express.static(__dirname + '/../../public'));
        this.wsServices = [];
    }

    initHttps() {
        // const privateKey = fs.readFileSync(this.config.https.privateKeyPath);
        // const certificate = fs.readFileSync(this.config.https.certificatePath);
        // const credentials = { key: privateKey, cert: certificate };
        // this.http = http.createServer(credentials, this.app);
        this.http = http.createServer(this.app);
        this.http.listen(this.config.server.port)
    }

    /**
     * 对webapi开放的接口
     */
    initWebApi() {

        // 接收服务通知消息，用于服务发现
        this.app.post('/notify', (req, res) => {
            if (req.body) {
                const result = Until.checkSign(req.body, this.config.server.apiKey);
                result && this.updateWsServer(JSON.parse(
                    Buffer.from(req.body.params, 'base64').toString()
                ));
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
            })
        });

        // 获取一个可用的websocket连接
        this.app.get('/request', (req, res) => {
            this.getWsLink(0, req.query.uid, (data) => {
                return res.status(200).json(data);
            });
        });

        // 发送消息给指定目标
        this.app.post('/message', (req, res) => {
            const message: Message = req.body.message;
            if (Until.isMessageObject(message)) {
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
                } else {
                    this.saveMessage(message);
                    res.status(200).json({ result: false, message: 'not online' });
                }
            } else {
                res.status(200).json({ result: false, message: 'message type error' });
            }
        });

    }

    sendApiRequestToWS(ws: WSServerInfo, url: string, params: any): request.Request {
        params = Until.signParams(params, ws.wsKey);
        return request.post({ url, form: params }, (error, res, body) => { });
    }

    saveMessage(msg: Message) {
        fs.appendFile(`${this.config.server.chatDir}/${msg.to}.text`, JSON.stringify(msg) + '\n', () => { });
    }

    saveLog(log: string) {
        fs.appendFile(this.config.server.logPath, log + '\n', () => { });
    }

    updateWsServer(wsInfo: WSServerInfo) {
        const index = this.wsServices.findIndex(ws => ws.uuid === wsInfo.uuid);
        ~index ? this.wsServices[index] = wsInfo : this.wsServices.push(wsInfo);
    }

    getOrderWsServers() {
        this.wsServices = this.wsServices.sort((a, b) => a.snapShot.percent - b.snapShot.percent);
        return this.wsServices.map(ws => ws.requestUri);
    }

    getWsLink(i: number, uid: string, callback: (data: any) => void) {
        if (this.wsServices.length === i) {
            callback({ result: false, message: 'no avaliable server' });
        } else {
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