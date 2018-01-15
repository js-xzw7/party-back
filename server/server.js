"use strict";
const start_time = Date.now();
const config = require('./init/config'),
    ApiAction = require('./action/api-action'),
    Uploader = require('./action/uploader');

// 定义参数
const BIND_PORT = config.system.bind_port;

// 定义log4js 包含业务日志和系统日志
const logger = require('./init/log4js-init').system;

// 定义db
// logger.info('init db');
// require('./init/sequelize-init');


// 定义express初始化
logger.info('init express');
const app = new (require('./init/express-init'))();


//加载二级目录使用actions下的模块处理
const routers_path = require('kml-express-stage-lib').routers_path;
let list = routers_path.list();

list.forEach(function (router_path) {
    let pattern = `/${router_path}`;
    app.use(pattern, new ApiAction(router_path));
});

// 定义文件上传
app.use('/', new Uploader('appimg'));

//启动服务
const server = app.listen(BIND_PORT, function () {
    let os = require('os');
    let ifaces = os.networkInterfaces();
    let localhost = ['localhost'];
    Object.keys(ifaces).forEach(function (ifname) {
        let alias = 0;

        ifaces[ifname].forEach(function (iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }

            if (alias >= 1) {
                // this single interface has multiple ipv4 addresses
                localhost.push(iface.address);
            } else {
                // this interface has only one ipv4 adress
                localhost.push(iface.address);
            }
            ++alias;
        });
    });

    let server_address = server.address();
    let port = server_address.port;
    logger.info('Server is listening at: ', localhost.map(function (ip) {
        return `http://${ip}:${port}`;
    }).join('\n'));
    logger.info((ms => `Server startup in ${ms} ms`)(Date.now() - start_time));
});

//bind exception event to log
process.on('uncaughtException', function (e) {
    logger.error('uncaughtException from process', e);
    if (e.code === 'EADDRINUSE') {
        logger.error(`服务端口${BIND_PORT}被占用!`);
        process.exit(BIND_PORT);
    }
});

process.on('unhandledRejection', (e) => {
    logger.warn('unhandledRejection from process', e);
});

process.on('rejectionHandled', (e) => {
    logger.warn('rejectionHandled from process', e);
});
