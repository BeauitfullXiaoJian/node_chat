import crypto from 'crypto'
import { Message } from './websocket_server/ws.config';
export const Until = {
    signParams(params: Object, signKey: string): any {
        const hash = crypto.createHash('md5');
        const baseStr = Buffer.from(JSON.stringify(params)).toString('base64');
        hash.update(baseStr + signKey);
        return {
            params: baseStr,
            sign: hash.digest('hex')
        };
    },
    checkSign(params: { params: string, sign: string }, signKey: string): boolean {
        const hash = crypto.createHash('md5');
        hash.update(params.params + signKey);
        return hash.digest('hex') === params.sign;
    },
    decodeParams(params: string): any {
        return JSON.parse(
            Buffer.from(params, 'base64').toString()
        );
    },
    getUidToken(uid: string, publicKey: string): string {
        const timeStamp = new Date().getTime();
        const tokenStr = Buffer.from(JSON.stringify({
            uid,
            timeStamp
        }));
        return crypto.publicEncrypt(publicKey, tokenStr).toString('hex'); //createSign('RSA-SHA256');
    },
    checkUidToken(uid: string, uidToken: string, privateKey: string) {
        try {
            const decodeData = crypto.privateDecrypt(privateKey, Buffer.from(uidToken, 'hex')).toString();
            const now = new Date().getTime();
            let obj = JSON.parse(decodeData) || {};
            obj = Object.assign({ uid: 0, timeStamp: 0 }, obj);
            console.log(obj.uid, uid, now, obj.timeStamp);
            console.log(obj.uid === uid && (now - obj.timeStamp) < 5 * 60 * 1000);
            // 5分钟内有效
            return obj.uid === uid && (now - obj.timeStamp) < 5 * 60 * 1000;
        } catch (e) {
            return false;
        }
    },
    isMessageObject(params: Message): boolean {
        return params && params.from && params.to && (!!params.message);
    }
};