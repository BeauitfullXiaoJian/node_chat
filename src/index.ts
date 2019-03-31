import { WSServer } from "./websocket_server/server";
import { config as wsConfig } from "./websocket_server/ws.config";
import { config as apiConfig } from "./webapi_server/api.config";
import { ApiServer } from "./webapi_server/server";

// websocket服务器
const server = new WSServer(wsConfig);
server.run();


// webapi服务器
const webServer = new ApiServer(apiConfig);
webServer.run();