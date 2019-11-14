"use strict";

/**
 * @module b/upload
 * @author 王维琦
 * @description
 * 上传操作
 */
module.exports = function (dbo) {

    //api公共模块
    const _ = require('lodash'),
        po = global.po,
        Result = require('kml-express-stage-lib').Result,
        logger = global.loggers.system,
        config = global.config,
        ENUM = config.ENUM,
        moment = require('moment'),
        path = require('path'),
        fs = require('fs'),
        multiparty = require('multiparty'),
        tools = new(require('../../lib/tools'));

    /**
     * 01.上传图片
     *
     * @param {Object} req - 请求参数
     * @param {Object} req.meeting_id - 文献id（有：更新文献信息；无：新增文献信息）
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.uploadImagesPost = async (req, res) => {
        let myRes = {};
        try {

            //获取当前时间
            let time = moment().format('YYYYMMDDhhmmss');
            let pathDir = path.resolve(__dirname, '../../../public') ;
            let pathUrl = `/images/${time}` + req.files[0].originalname
            // 通过fs模块将上传的文件写入进去images文件夹
            let readbuffer = fs.readFileSync(req.files[0].path);
            fs.writeFileSync( `${pathDir}${pathUrl}`, readbuffer);

            //获取的当前环境ip
            let IPAdress = await tools.getIp();
            let img_url = `http://${IPAdress}:${config.system.bind_port}${pathUrl}`

            return Result.Ok('上传成功！',{img_url});
        } catch (e) {
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    }

    /**
     * 02.上传图片
     *
     * @param {Object} req - 请求参数
     * @param {Object} req.meeting_id - 文献id（有：更新文献信息；无：新增文献信息）
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.uploadImages02Post = async (req, res) => {
        let myRes = {};
        try {

            /* //生成multiparty对象，并配置上传目标路径
            let form = new multiparty.Form({ uploadDir: path.resolve(__dirname, '../../../public/images/') });
            
            
            //上传成功
            form.parse(req, function (err, fields, files) {

                if (err) {
                    return err;
                } else {

                    //获取上传文件的路径
                    let inputFile = files.file[0];
                    let uploadedPath = inputFile.path;

                    //获取当前时间
                    let time = moment().format('YYYYMMDDhhmmss');
                    let dstPath = path.resolve(__dirname, `../../../public/images/${time}` + inputFile.originalFilename);

                    //更新文件名称
                    fs.rename(uploadedPath, dstPath, (err) => {
                        if (err) {
                            logger.err(`image rename error:${err}`);
                            return;
                        } else {
                            logger.info(`image rename ok!`);

                            //获取当前运行环境ip
                            let interfaces = os.networkInterfaces();
                            let IPAdress = ``;
                            for (let devName in interfaces) {
                                let iface = interfaces[devName];
                                for (let i = 0; i < iface.length; i++) {
                                    let alias = iface[i];
                                    if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                                        IPAdress = alias.address
                                    };
                                };
                            };
                            logger.info(`http://${IPAdress}:${config.system.bind_port}/images/${time}${inputFile.originalFilename}`);
                        
                            return Result.Ok('成功！', { url: `http://${IPAdress}:${config.system.bind_port}/images/${time}${inputFile.originalFilename}` });
                        };
                    });
                };
            }); */

        } catch (e) {
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    }
};