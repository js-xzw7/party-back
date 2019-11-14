/**
 * ws 建立websocket
 */
"use strict";

global.wsObj = {}; //存放ws连接
let WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ port: 8002 }),
    logger = require('./log4js-init').system,
    meeting = new (require('../routers/c/meeting_action'))(global.sequelize),
    contron = new (require('../routers/m/contron_action'))(global.sequelize),
    cfig = new (require('../routers/b/config_action'))(global.sequelize),
    cmc = new (require('../routers/m/cmc_action'));

wss.on('connection', function (ws) {

    //以websockt中的ip地址为键，保存ws连接对象
    let ip = ws._socket.remoteAddress.split(":").pop();
    logger.info(`${ip}连接websocket成功！`);
    global.wsObj[ip] = ws;

    //接收消息
    ws.on('message', async function (message) {

        message = JSON.parse(message);
        logger.info(`${ip}获取websocket数据:${message.type}`);

        /**
         * message.type:
         * 0：初始化页面数据
         * 1：更新词条
         * 2：心跳检测
         * 3：返回识别词条相应文件内容
         * 4：返回识别词条指令（上一页、下一页等）
         * 5：错误提示
        */

        //处理前端接收的消息
        switch (message.type) {

            case 0:
                /* 客户端初始化参数 */
                //获取当前客户端显示菜单配置
                let req = { "query": { "ip": ip } };
                let client_cfig = await cfig.findByIpCfigGet(req);

                if (!client_cfig.content) {
                    logger.error(`${ip}未配置显示菜单！`);
                    ws.send(`{"type":5,"res":"${ip}未配置显示菜单,请联系管理员!"}`);
                    return;
                }  

                if(client_cfig.content.status === 'DISABLE'){
                    logger.error(`${ip}显示菜单被禁用！`);
                    ws.send(`{"type":5,"res":"${ip}显示菜单被禁用，请联系管理员!"}`);
                    return;
                }

                //获取菜单下的文件列表
                req = { "query": { "type": client_cfig.content.type } };
                let meeting_list = await meeting.findByTypeGet(req);

                //获取菜单名称
                let menu_info = await contron.findMenuNameGet(client_cfig.content.type);

                meeting_list.code = 0;
                meeting_list.menu = menu_info.name;
                meeting_list.menu_type = menu_info.type;
                ws.send(`{"type":0,"res":${JSON.stringify(meeting_list)}}`);
                break;

            case 1:
                /* 更新词条 */
                
                //获取命令词条
                let cmd_spell = await contron.findCmdSpellGet();

                let spell_list = cmd_spell.concat(message.res);
                console.log(spell_list);

                //获取当前ws对应的udp传输ip 及端口
                let req1 = { "query": { "ip": ip, "type": "ws" } };
                let map_info = await cfig.findByIpMapGet(req1);

                //获取buff
                let buf = await cmc.spellList(spell_list);

                /* console.log(buf.toString('hex')); */

                global.udpServer.send(buf, parseInt(map_info.content.udp_port), map_info.content.udp_ip)
                break;

            case 2:
                /* 心跳检测 */
                ws.send(JSON.stringify(message));
                break;
        }
    })

    //关闭连接
    ws.on('close', function (message) {
        logger.info(`websoket关闭:${message}`);
    });
})







