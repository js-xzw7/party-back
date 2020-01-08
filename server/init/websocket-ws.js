/**
 * ws 建立websocket
 */
"use strict";

global.wsObj = {}; //存放ws连接
const WebSocketServer = require('ws').Server,
    _ = require('lodash'),
    ENUM = global.config.ENUM,
    wss = new WebSocketServer({ port: global.config.ENUM.DEFAULT_PORT.WS_PORT }),
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
         * 6: 未完成初始化，返回初始化页面
         * 7: 下位机重启，重新获取词条请求
         * 8：人脸识别(1:已识别到人脸 0：未识别到人脸)
        */

        //处理前端接收的消息
        switch (message.type) {

            case 0:
                /* 客户端初始化参数 */
                //获取当前客户端显示菜单配置
                let req = { "query": { "ip": ip } };
                let client_cfig = await cfig.findByIpCfigGet(req);

                if (!client_cfig.content) {
                    logger.error(`${ip}未配置主题！`);
                    /* ws.send(`{"type":5,"res":"${ip}未配置显示菜单,请联系管理员!"}`); */
                    ws.send(`{"type":6,"res":"${ip}未配置主题，请设置!"}`);
                    return;
                }  

                if(client_cfig.content.status === ENUM.TYPE.DISABLE){
                    logger.error(`${ip}主题禁用！`);
                    ws.send(`{"type":6,"res":"主题被禁用，请重新设置!"}`);
                    return;
                }

                //获取菜单下的文件列表
                req = { "query": { "type": client_cfig.content.type } };
                let meeting_list = await meeting.findByTypeGet(req);

                //获取菜单名称
                let menu_info = await contron.findMenuNameGet(client_cfig.content.type);

                //处理返回格式
                meeting_list = _.merge(meeting_list,{/* code:0, */menu:menu_info.name,menu_type:menu_info.type,note:menu_info.note})
                ws.send(`{"type":0,"res":${JSON.stringify(meeting_list)}}`);
                break;

            case 1:
                /* 更新词条 */
                
                //获取命令词条
                let cmd_spell = await contron.findCmdSpellGet();

                let spell_list = cmd_spell.concat(message.res);
               /*  console.log(spell_list); */

                //获取当前ws对应的udp传输ip 及端口
                let new_req = { "query": { "ip": ip, "type": "ws" } };
                let map_info = await cfig.findByIpMapGet(new_req);

                if(!map_info.content){
                    logger.error(`${ip}未配置映射关系`)
                    ws.send(`{"type":6,"res":"未进行初始化!"}`);
                    return;
                }

                //获取buff
                let buf = await cmc.spellList(spell_list);

                /* console.log(buf.toString('hex')); */

                global.udpServer.send(buf, parseInt(ENUM.DEFAULT_PORT.BRC_PROT), map_info.content.udp_ip)
                break;

            case 2:
                /* 心跳检测 */
                ws.send(JSON.stringify(message));
                break;
        }
    })

    //监听错误
    ws.on('error', function (error) {
        logger.info(`${ip}socket错误：`+error);
    });

    //关闭连接
    ws.on('close', function (message) {
        logger.info(`${ip}websoket关闭:${message}`);
    });
})







