"use strict";

/**
 * @module b/meeting
 * @author 王维琦
 * @description
 *             文献相关操作
 */
module.exports = function (dbo) {

    //api公共模块
    const _ = require('lodash'),
        po = global.po,
        Result = require('kml-express-stage-lib').Result,
        logger = global.loggers.system,
        config = global.config,
        ENUM = config.ENUM,
        pinyin = require('pinyin'),
        crypto_utils = require('kml-crypto-utils'),
        tools = new (require('../../lib/tools'));


    /**
     * 01.更新文献
     *
     * @param {Object} req - 请求参数
     * @param {Object} req.meeting_id - 文献id（有：更新文献信息；无：新增文献信息）
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.updateMeetingPost = async (req) => {
        // b/meeting/updateMeeting   --post
        let myRes = {};
        try {
            let session = req.session,
                my_user_id = _.get(session, 'active_user.user_id'),
                my_dep_id = _.get(session, 'active_user.dep_id'),
                { updatedBy, createdBy } = req.default_params;

            //获取数据对象
            let params = req.body,
                { meeting_id,title } = params,
                msg = ``;

            if(!title){
                return Result.Error('缺少参数title!');
            };

            //获取audio音频文件
            /* let audio_url = await tools.getTtsAudio(params.title,params.content); */

            //加载数据模型
            let [TBMeeting,TBParams] = po.import(dbo, ['tb_meeting','tb_params']);

            //检测标题是否存在
            let exists_title = await TBMeeting.findOne({where:{title:title}});
            if(exists_title){
                return Result.Error('已存在此标题，请更新标题！');
            };

            //获取标题拼音词条
            title = title.replace(/[“”""''‘’：:。.，]+/g, "");
            let spell = pinyin(title, { style: pinyin.STYLE_NORMAL }).join(' ');

            //检测菜单是否存在
            let menu_info = await TBParams.findOne({where:{type:params.type,style:'C'}});

            if(!menu_info){
                return Result.Error('菜单不存在，请重新选择菜单！');
            };

            //定义事务
            myRes.t1 = await dbo.transaction();

            if (!meeting_id) {
                /* 新增文献 */
                //设置本类型文献排序,默认为最后一名，后期可完善手动排序功能
                let last_meeting = await TBMeeting.findOne({
                    where: {
                        type: params.type
                    },
                    order: [['sort', 'desc']]
                });

                let sort_num = last_meeting ? last_meeting.sort +1 : 1;//从1开始排序

                //创建文献id
                params.meeting_id = crypto_utils.UUID();
                await TBMeeting.create(_.merge({
                    status: menu_info.status,
                    sort: sort_num,
                    dep_id: my_dep_id,
                    spell/* ,audio_url */
                }, params, createdBy));

                msg += `新增文献成功！`;
            } else {
                /* 更新文献 */
                //判断文献是否存在
                let meeting_info = await TBMeeting.findByPk(meeting_id);

                if (!meeting_info) {
                    return Result.Error('文献不存在，更新失败！');
                }

                //如果图片更新，删除旧图片
                if(params.img_url && meeting_info.img_url !== params.img_url){
                    await tools.deleteFile(meeting_info.img_url);
                }

                //删除audio文件
                /* if(audio_url !== meeting_info.audio_url){
                    await tools.deleteFile(meeting_info.audio_url);
                } */
                
                //更新文献
                let new_meeting_info = _.merge(meeting_info, params,{spell,status: menu_info.status/* ,audio_url */}, updatedBy);
                await new_meeting_info.save({ transaction: myRes.t1 });

                msg += `更新文献成功！`;
            }

            myRes.t1 && myRes.t1.commit();
            return Result.Ok(msg, { meeting_id: params.meeting_id });

        } catch (e) {
            myRes.t1 && myRes.t1.rollback();
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    }

    /**
     * 02.禁用/启用文献
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    /* this.switchMeetingPost = async (req) => {
        // b/meeting/switchMeeting   --post
        let myRes = {};
        try {
            let session = req.session,
                my_user_id = _.get(session, 'active_user.user_id'),
                my_dep_id = _.get(session, 'active_user.dep_id'),
                { updatedBy, createdBy } = req.default_params; 

            //获取数据对象
            let params = req.body,
                { meeting_id,status } = params;

            //加载数据模型
            let [TBMeeting] = po.import(dbo, ['tb_meeting']);

            await TBMeeting.update({ status:status }, { where: { meeting_id } });
            return Result.Ok('更新成功！', { meeting_id });
        } catch (e) {
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    } */

    /**
     * 03.删除文献
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.deleteMeetingPost = async (req) => {
        // b/meeting/deleteMeeting   --post
        let myRes = {};
        try {

            //获取数据对象
            let params = req.body,
                { meeting_id } = params;

            //加载数据模型
            let [TBMeeting] = po.import(dbo, ['tb_meeting']);

            let meeting_info = await TBMeeting.findByPk(meeting_id);

            if(!meeting_info){
                return Result.Error('文件不存在！删除失败！');
            }

            //删除文件
            await TBMeeting.destroy({ where: { meeting_id }});

            //删除图片
            await tools.deleteFile(meeting_info.img_url)
            //删除视频
            if(meeting_info.note === `S`) 
                await tools.deleteFile(meeting_info.audio_url)

            return Result.Ok('删除成功！', { meeting_id });
        } catch (e) {
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    }

    /**
     * 更新文件拼音词条（测试用）
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.updateMettingSpellPost = async (req) => {
        // b/meeting/updateMettingSpelle  --post
        try {
            //加载模型
            let TBMeeting = po.import(dbo, 'tb_meeting');

            //查寻所有文件
            let meeting_list = await TBMeeting.findAll();

            meeting_list.forEach(m => {
                //获取名称拼音
                let name_spell = pinyin(m.title, { style: pinyin.STYLE_NORMAL }).join(' ');
                TBMeeting.update({ spell:name_spell},{
                    where:{meeting_id:m.meeting_id}
                })
            });

        } catch (e) {
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    }
};