/**
 * 建立updServer
 */
"use strict";
module.exports = function () {

    let dgram = require('dgram'),
        logger = require('./log4js-init').system,
        ENUM = global.config.ENUM,
        contron = new (require('../routers/m/contron_action'))(global.sequelize),
        cfig = new (require('../routers/b/config_action'))(global.sequelize),
        cmc = new (require('../routers/m/cmc_action')),
        tools = new(require('../lib/tools'));

    //建立udp服务器
    let server = dgram.createSocket('udp4');

    server.on('listening', () => {
        let address_info = server.address();
        logger.info('udp server listening on ' + address_info.address + ':' + address_info.port);
    });

    server.on('message', async (message, remote) => {
        //获取当前请求对象的ip、端口
        let ip = remote.address,
            port = remote.port;

        //解析传递参数为hex字符
        message = message.toString('hex')
        logger.info('upd获取数据：'+message)

        //判断命令类型(我也不知道为啥，下位机发16进制1，我接收到0100，直接生硬截取前两位处理好了)
        let commdType = parseInt(message.substring(4, 6), 16);
        switch (commdType) {
            case 1:
                //初始化，寻找服务器
                let mac = message.substring(8, message.length -4);

                //判断mac是否已经记录
                let mac_req = {"query":{"udp_mac":mac}}
                let mac_map = await cfig.findByMacMapGet(mac_req);

                if(!mac_map.content){
                    //如果不存在，保存mac地址
                    let add_req = {"body":{"udp_mac":mac}}
                    await cfig.updateMapPost(add_req)
                }

                //服务器回复
                let buf = await cmc.initReply(mac);
                console.log(buf.toString('hex'));
                let broadcast_ip = await tools.getBroadcast();
                server.send(buf,ENUM.DEFAULT_PORT.BRC_PROT,broadcast_ip)
                break;
            case 4:
                //词条更新回复
                console.log('词条更新回复！');
                break;
            case 5:
                //识别到语音词条
                logger.info(`${ip}识别拼音词条:`);

                //截取词条id
                let id = message.substring(12, 16);
                //识别到词条回复
                let revertBuffer = cmc.receiveSpell(id);
                server.send(revertBuffer, port, ip);

                //截取词条内容
                let str = message.substring(20, message.length - 4);
                //转换字符串
                let spell = new Buffer(str, 'hex').toString('utf8');
                console.log(spell);
                //处理识别文字
                let data = await contron.disposePost(spell);

                //如果没有找到相应文字通知该客户端更新数据
                if (data.res.ret !== 'OK') {
                    logger.error(`没有匹配到“${spell}”字符！`);
                    return;
                }

                //根据请求ip查询对应的ws_ip
                let req = { "query": { "ip": ip, "type": "udp" } };
                let map_info = await cfig.findByIpMapGet(req);

                if (!map_info) {
                    logger.error(`udp:${ip}未配置ws映射关系！`);
                    return;
                }
                //判断本ip是否已建立websocket连接
                if (!global.wsObj[map_info.content.ws_ip]) {
                    logger.error(`${map_info.content.ws_ip}未建立websoket连接，发送数据失败！`);
                    return;
                }

                /* data = JSON.stringify(data); */
                global.wsObj[map_info.content.ws_ip].send(JSON.stringify(data));
                break;
        }
    })

    server.on('error', (err) => {
        logger.info(`upd server error:\n${err.stack}`)
    })

    server.bind(ENUM.DEFAULT_PORT.UDP_PORT);
    global.udpServer = server;
}();

