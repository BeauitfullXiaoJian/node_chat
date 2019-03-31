"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./websocket_server/server");
const ws_config_1 = require("./websocket_server/ws.config");
const api_config_1 = require("./webapi_server/api.config");
const server_2 = require("./webapi_server/server");
// websocket服务器
const server = new server_1.WSServer(ws_config_1.config);
server.run();
// webapi服务器
const webServer = new server_2.ApiServer(api_config_1.config);
webServer.run();
//# sourceMappingURL=index.js.map