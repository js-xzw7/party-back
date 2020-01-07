"use strict";

/**
 * @module m/common
 * @author 王维琦
 * @description
 * 公共类
 */
module.exports = function (dbo) {

    //api公共模块
    const _ = require('lodash'),
        os = require('os'),
        po = global.po,
        Result = require('kml-express-stage-lib').Result,
        logger = global.loggers.system,
        config = global.config,
        ENUM = config.ENUM,
        tools = new (require('../../lib/tools')),
        Meeting = new (require('../b/meeting_action'))(dbo),
        Params = new (require('../b/params_action'))(dbo),
        Cfg = new (require('../b/config_action'))(dbo);
        
       /*  http = require('http'),
        querystring = require('querystring'),    // 处理请求参数的querystring模块
        fs = require('fs'),     // fs模块，用来保存语音文件
        path = require('path');
 */

    /**
     * 01.批量删除
     */
    this.removeListPost = async (req) => {
        try {
            let params = req.body,
                { type, removeList } = params;

            /* removeList = JSON.parse(removeList); */

            if (!_.isArray(removeList)) {
                return Result.Error('参数removeList 不是数组！');
            };
            
            //判断删除类型
            switch (type) {
                case 'W':
                    //删除文件
                    /* removeList.map(r => {
                        req.body = { meeting_id: r }
                        Meeting.deleteMeetingPost(req);
                    }) */
                    for(let i = 0; i< removeList.length;i++){
                        req.body = { meeting_id: removeList[i] }
                        await Meeting.deleteMeetingPost(req);
                    }
                    break;
                case 'C':
                    //删除菜单
                    /* removeList.map(r => {
                        req.body = { param_id: r }
                        Params.deleteMenuPost(req);
                    }) */
                    for(let i = 0; i< removeList.length;i++){
                        req.body = { param_id: removeList[i] }
                        await Params.deleteMenuPost(req);
                    }
                    break;
                case 'P':
                    //删除配置
                    /* removeList.map(r => {
                        req.body = { ip: r }
                        Cfg.deleteCfigPost(req);
                    }) */
                    for(let i = 0; i< removeList.length;i++){
                        req.body = { ip: removeList[i] }
                        await Cfg.deleteCfigPost(req);
                    }
                    break;
            }

            return Result.Ok('删除成功！');
        } catch (e) {
            logger.error('失败!', e);
            return;
        }
    }

    /**
     * 02.获取默认图片url（废弃）
     */
    this.getDefaultImg = async (req) => {
        try {
            let params = req.body,
                { type } = params;
            let ip = await tools.getIp();
            let img_name;
            switch(type){
                case 'W':
                    //获取文件默认封面
                    img_name = 'DEFAULT_AVATAR.png'
                    break;
                case 'U':
                    //获取用户默认头像
                    img_name = 'DEFAULT_AVATAR.png'
                    break;
            }
            
        } catch (error) {
            logger.error('失败!', error);
            return Result.Error('失败', error.message);
        }
    }

    /**
     * 生成tts音频文件（废弃）
     */
    this.getTtsAudioPost = async (req) => {
        try {
            let params = req.body,
                { title, content } = params;
            let res = await tools.getTtsAudio( title, content);

            return Result.Ok('成功！',{audio_url:res})
        } catch (e) {
            logger.error('失败!', e);
            return;
        }
    }

    /**
     * 删除文件
     */
    this.deleteFilePost = async (req) => {
        try {
            let params = req.body,
                { filePath } = params;
            let ss = await tools.deleteFile(filePath);
            
            return Result.Ok('成功！');
        } catch (error) {
            logger.error('失败!', error);
            return Result.Error('失败', error.message);
        }
    }



    
};