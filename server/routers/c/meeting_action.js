"use strict";

/**
 * @module c/meeting
 * @author 王维琦
 * @description
 * 测试文献查询（前端http查看文献信息使用）
 */
module.exports = function ( dbo ) {

    //api公共模块
    const _ = require('lodash'),
        po = global.po,
        Result = require('kml-express-stage-lib').Result,
       /*  Result = new (require('../w/result_action')), */
        logger = global.loggers.system,
        config = global.config,
        ENUM = config.ENUM;

    /**
     * 01.模糊查询文献
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.fuzzySearchGet = async (req) => {
       // t/meeting/fuzzySearch   --get
        try {

            //获取数据对象
            let params = req.query,
                {name} = params;

            if(!name){
                return Result.Error('缺少参数name');
            };
                
            //加载数据模型
            let Meeting = po.import(dbo,'tb_meeting');
            
            let meeting_info = await Meeting.findAll({
                attributes:{
                    exclude: ENUM.DEFAULT_PARAMS_ARRAY
                },
                where:{
                    title:{
                        [dbo.Op.like]:`%${name}%`
                    },
                    status:ENUM.TYPE.ENABLE
                }
            });

            if(!meeting_info){
                return Result.Error('没有查到相关数据!');
            };
           
           let result = Result.Ok('ok',meeting_info);
            
           result.code = '5';
           return result;
        } catch (e) {
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    }

    /**
     * 02.根据文献类型查询文件列表
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.findByTypeGet = async (req) => {
        // t/meeting/findByType   --get
        try {
            let {type} = req.query;
            //加载数据模型
            let Meeting = po.import(dbo,'tb_meeting');

            let meeting_list = await Meeting.findAll({
                where:{ 
                    type:type
                },
                order:[['sort','asc']]
            });
 
            if(!meeting_list.length){
                return Result.Error('没有查到相关数据!');
            };
            
            let result = Result.Ok('成功',meeting_list);;
            result.code = '0';
            return result;
        } catch (e) {
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    }

    /**
     * 03.根据文献id查询文献
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.findByIdGet = async (req) => {
        // t/meeting/findById  --get
        try {
            let {meeting_id} = req.query;
            //验证参数
            if(!meeting_id){
                return Result.Error('缺少参数meeting_id!');
            }
                
            //加载数据模型
            let TBMeeting = po.import(dbo,'tb_meeting');

            //根据id查询文献内容
            let meeting_info = await TBMeeting.findById(meeting_id);

            if(!meeting_info){
                return Result.Error('无效文献id!');
            }

            let result = Result.Ok('成功',meeting_info.dataValues);
            result.code = '0';
            return result;
        } catch (e) {
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    }

    /**
     * 04.查询所有文献
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.findAllGet = async (req) => {
        // t/meeting/findAll --get
        try {
                
            //加载数据模型
            let TBMeeting = po.import(dbo,'tb_meeting');

            //根据查询文献内容
            let meeting_arr = await TBMeeting.findAll({
                /* attributes:{
                    exclude:ENUM.DEFAULT_PARAMS_ARRAY
                } */
                where:{
                    status:ENUM.TYPE.ENABLE
                }
            });

            if(meeting_arr.length <= 0){
                return Result.Error('暂无数据!');
            }

            let rest= Result.Ok('成功',meeting_arr);
            rest.code = '0'
            return rest;
        } catch (e) {
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    }
};