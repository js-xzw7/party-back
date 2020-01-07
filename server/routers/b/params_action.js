"use strict";

/**
 * @module b/params
 * @author 王维琦
 * @description
 *             系统参数维护
 */
module.exports = function (dbo) {

    //api公共模块
    const _ = require('lodash'),
        po = global.po,
        Result = require('kml-express-stage-lib').Result,
        logger = global.loggers.system,
        config = global.config,
        ENUM = config.ENUM,
        crypto_utils = require('kml-crypto-utils'),
        pinyin = require('pinyin');

    /**
     * 03.添加菜单参数
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.updateMenuPost = async (req) => {
        // b/params/updateMenu  --post
        let myRes = {};
        try {
            let session = req.session,
                { updatedBy, createdBy } = req.default_params;

            //获取数据对象
            let params = req.body,
                { param_id, name, style, note } = params,
                msg = ``;

            if (!name) {
                return Result.Error('缺少参数name!');
            }

            //获取名称拼音
            let name_spell = pinyin(name, { style: pinyin.STYLE_NORMAL }).join(' ');

            //加载数据模型
            let TBParams = po.import(dbo, 'tb_params');

            if (!param_id) {
                //校验参数是否正确
                let name_exist = await TBParams.findOne({
                    where: {
                        name: name,
                        style: style
                    }
                });

                if (name_exist) {
                    return Result.Error('菜单已存在，请重新定义！');
                }

                let last_param = await TBParams.findOne({
                    where: {
                        style: style
                    },
                    order: [['type', 'desc']]
                });

                let type = last_param.type + 1;

                //添加参数
                param_id = crypto_utils.UUID();
                await TBParams.create({
                    param_id: param_id,
                    note: note,
                    status: ENUM.TYPE.ENABLE,
                    spell: name_spell,
                    name, type, style: style
                });

                msg += `添加成功！`;
            } else {
                //更新菜单名称
                await TBParams.update(_.merge({
                    name: name,
                    spell: name_spell
                }), {
                    where: { param_id }
                });

                msg += `更新成功！`;
            }

            return Result.Ok(msg, { param_id });

        } catch (e) {
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    }

    /**
     * 04.启动/禁用菜单
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.switchMenuPost = async (req) => {
        // b/params/switchMenu --get
        let myRes = {};
        try {

            //获取数据对象
            let params = req.body,
                { param_id, status } = params;

            //加载数据模型
            let [TBParams, TBMeeting, TBCfig] = po.import(dbo, ['tb_params', 'tb_meeting', 'tb_client_config']);

            let param_info = await TBParams.findByPk(param_id);

            if (!param_info) {
                return Result.Error('菜单不存在！');
            }

            // 定义事务
            myRes.t1 = await dbo.transaction();
            const queryOptions = { transaction: myRes.t1 };

            //处理菜单
            param_info.status = status;
            await param_info.save(queryOptions);

            //处理文件
            await TBMeeting.update({ status: status }, {
                where: {
                    type: param_info.type
                },
                queryOptions
            });

            //处理客户端配置
            await TBCfig.update({ status: status }, {
                where: {
                    type: param_info.type
                },
                queryOptions
            })

            myRes.t1 && myRes.t1.commit();
            return Result.Ok('成功！', param_id)
        } catch (e) {
            myRes.t1 && myRes.t1.rollback();
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    }

    /**
     * 05.删除菜单
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.deleteMenuPost = async (req) => {
        // b/params/deleteMenu --get
        let myRes = {};
        try {

            //获取数据对象
            let params = req.body,
                { param_id } = params;

            //加载数据模型
            let [TBParams, TBMeeting, TBCfig] = po.import(dbo, ['tb_params', 'tb_meeting', 'tb_client_config']);

            let param_info = await TBParams.findByPk(param_id);

            if (!param_info) {
                return Result.Error('菜单不存在！');
            }

            // 定义事务
            myRes.t1 = await dbo.transaction();
            const queryOptions = { transaction: myRes.t1 };

            //删除菜单
            await TBParams.destroy({
                where: { param_id },
                queryOptions
            });

            //删除文件
            await TBMeeting.destroy({
                where: {
                    type: param_info.type
                },
                queryOptions
            });

            //删除客户端配置
            await TBCfig.destroy({
                where: {
                    type: param_info.type
                },
                queryOptions
            })

            myRes.t1 && myRes.t1.commit();
            return Result.Ok('删除成功！')
        } catch (e) {
            myRes.t1 && myRes.t1.rollback();
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    }

    /**
     * 06.修改图片/视频路径
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.updateUrlGet = async (req) => {
        // b/params/updateUrl --get
        try {
            //获取数据对象
            let params = req.query,
                { ip } = params;

            //ip正则
            let pattern = /((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})(\.((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})){3}/g;

            if(!pattern.test(ip)) return Result.Error('请输入合法ip！');

            //加载数据模型
            let [TBMeeting] = po.import(dbo, ['tb_meeting']);

            //查询所有文章及视频

            let meeting_list = await TBMeeting.findAll();

            for (let i = 0; i < meeting_list.length; i++){
                let meeting = meeting_list[i],
                    {img_url,audio_url} = meeting.dataValues;

                
                let newImgUrl = img_url && img_url.replace(pattern,ip);
                let newAudioUrl = audio_url && audio_url.replace(pattern,ip);

                //更新
                meeting.img_url = newImgUrl;
                meeting.audio_url = newAudioUrl;
                await meeting.save();
            }
            
            return Result.Ok('更新成功！')
        } catch (e) {
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    }
};