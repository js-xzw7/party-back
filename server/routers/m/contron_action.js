"use strict";

/**
 * @module m/contron
 * @author 王维琦
 * @description
 * 语音识别分发处理
 */
module.exports = function (dbo) {

    //api公共模块
    const _ = require('lodash'),
        po = global.po,
        Result = require('kml-express-stage-lib').Result,
        logger = global.loggers.system,
        config = global.config,
        ENUM = config.ENUM,
        exec = require('child_process').exec,
        cmc = new (require('./cmc_action')),
        udpServer = global.udpServer;

    /**
     * 01.处理语音识别的语句，进行相应业务逻辑
     */
    this.disposePost = async (msg) => {
        try {
            
            //加载模型
            let [TBMeeting,TBParams] = po.import(dbo,['tb_meeting','tb_params']);

            //判断是否为命令词条
            let params_info = await TBParams.findOne({
                where:{
                    style:'M',
                    spell:msg
                }
            });

            if(params_info){
                let result = Result.Ok('成功!',params_info);
                //命令词条返回命令类型，以便前端处理
                result.code = params_info.type;
                return {"type":4,"res":result};
            }

            //判断是否为文件词条
            let meeting_info = await TBMeeting.findOne({
                where:{spell:msg}
            });

            if(!meeting_info){
                return{"type":3,"res":Result.Error('没有相关文件！')};
            };

            let result = Result.Ok('成功!',meeting_info);
            /* result.code = 1; */
            return {"type":3,"res":result};
           
        } catch (e) {
            logger.error('失败!', e);
            return ;
        }
    }

    /**
     * 02.获取菜单名称
     */
    this.findMenuNameGet = async (type) => {
        try {
            //加载模型
            let TBParmas = po.import(dbo,'tb_params');

            let menu_info = await TBParmas.findOne({
                attributes:['name','type','note'],
                where:{
                    style:'C',
                    type:type
                    /* status: ENUM.TYPE.ENABLE */
                }
            })

            return menu_info ? menu_info.dataValues : {};
        } catch (e) {
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    }

    /**
     *03. 获取命令参数词条列表
     */
    this.findCmdSpellGet = async (req) => {
        try {
            //加载模型
            let TBParmas = po.import(dbo,'tb_params');

            let cmd_list = await TBParmas.findAll({
                attributes:['spell'],
                where:{
                    style:'M',
                    status: ENUM.TYPE.ENABLE
                }
            })

            let result = [];
            cmd_list.map(c =>{
                result.push(c.spell);
            });

            return result;
        } catch (e) {
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    }

    /**
     *04. 执行命令
     */
    this.soundSwitchGet = async (req) => {
        try {
            let params = req.query,
                {type} = params;

            if(type === '1'){
                //开启音响设备
                let openBuffer = await cmc.openSound();
                udpServer.send(openBuffer, 6003, '255.255.255.255');

                //定时发送心跳数据
                let heartBeatBuffer = await cmc.heartBeat();
                global.timer = setInterval(function(){
                    udpServer.send(heartBeatBuffer, 6003, '255.255.255.255')
                }, 100);

                //发送指令
                exec(ENUM.CMD.SOUND_OPEN,(error, stdout, stderr) => {
                    if (error) {
                        logger.warn(`音响关闭: ${error}`);
                      return;
                    }
                });
            }else{

                //停止发送心跳包
                clearInterval(global.timer);
                
                //关闭音响设备
                let colseBuffer = await cmc.closeSound();
                udpServer.send(colseBuffer, 6003, '255.255.255.255')

                //发送指令
                exec(ENUM.CMD.SOUND_COLSE,(error, stdout, stderr) => {
                    if (error) {
                        logger.warn(`关闭音响执行的错误: ${error}`);
                      return;
                    }
                });
            }
        
        } catch (e) {
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    }

};