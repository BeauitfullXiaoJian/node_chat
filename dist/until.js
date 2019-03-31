"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
exports.Until = {
    signParams(params, signKey) {
        const hash = crypto_1.default.createHash('md5');
        const baseStr = Buffer.from(JSON.stringify(params)).toString('base64');
        hash.update(baseStr + signKey);
        return {
            params: baseStr,
            sign: hash.digest('hex')
        };
    },
    checkSign(params, signKey) {
        const hash = crypto_1.default.createHash('md5');
        hash.update(params.params + signKey);
        return hash.digest('hex') === params.sign;
    },
    decodeParams(params) {
        return JSON.parse(Buffer.from(params, 'base64').toString());
    },
    getUidToken(uid, publicKey) {
        const timeStamp = new Date().getTime();
        const tokenStr = Buffer.from(JSON.stringify({
            uid,
            timeStamp
        }));
        return crypto_1.default.publicEncrypt(publicKey, tokenStr).toString('hex'); //createSign('RSA-SHA256');
    },
    checkUidToken(uid, uidToken, privateKey) {
        try {
            const decodeData = crypto_1.default.privateDecrypt(privateKey, Buffer.from(uidToken, 'hex')).toString();
            const now = new Date().getTime();
            let obj = JSON.parse(decodeData) || {};
            obj = Object.assign({ uid: 0, timestamp: 0 }, obj);
            // 5分钟内有效
            return obj.uid === uid && (now - obj.timeStamp) < 5 * 60 * 1000;
        }
        catch (e) {
            return false;
        }
    },
    isMessageObject(params) {
        return params && params.from && params.to && (!!params.message);
    }
};
//# sourceMappingURL=until.js.map