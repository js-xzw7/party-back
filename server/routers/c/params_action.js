"use strict";

/**
 * @module c/params
 * @author 王维琦
 * @description
 * 前端http查看参数使用
 */
module.exports = function ( dbo ) {

    //api公共模块
    const _ = require('lodash'),
        po = global.po,
        Result = require('kml-express-stage-lib').Result,
        logger = global.loggers.system,
        config = global.config,
        ENUM = config.ENUM,
        crypto_utils = require('kml-crypto-utils');


    /**
     * 01.获取参数拼音列表
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.findAllSpellGet = async (req) => {
        // c/params/findAllSpell  --get
        try {

            //加载模型
            let TBParams = po.import(dbo,'tb_params');

            let params_list = await TBParams.findAll({
                attributes:['spell']
            });

            if(params_list.length <= 0){
                return Result.Error('暂无参数数据！');
            };

            //处理返回数据结构
            let result_list = [];
            params_list.map(p =>{
                result_list.push(p.spell);
            });

            return Result.Ok('成功！',result_list);

        } catch (e) {
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    } 

    /**
     * 02.查看参数表使用
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.findAllParamsPost = async (req) => {
        // c/params/findAllSpell  --post
        try {

            //加载模型
            let TBParams = po.import(dbo,'tb_params');

            let params_list = await TBParams.findAll({
                attributes:{
                    exclude: ENUM.DEFAULT_PARAMS_ARRAY
                }
            });

            if(params_list.length <= 0){
                return Result.Error('暂无参数数据！');
            };

            return Result.Ok('成功！',params_list);

        } catch (e) {
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    }
    
    /**
     * 03.查看菜单
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.findMenuGet = async (req) => {
        // c/params/findMenu  --get
        try {

            let params = req.query,
                {type} = params;
        
            //加载模型
            let TBParams = po.import(dbo,'tb_params');

            let where_query = { style:'C'}
            
            /**
             * 如果type存在，查询所有菜单（包含禁用菜单）
             * 不存在，查询所有启用菜单
             * */ 
            if(!type){
                where_query.status = ENUM.TYPE.ENABLE;
            }

            let params_list = await TBParams.findAll({
                attributes:['param_id','status','name','type','style','spell'],
                where:where_query,
                order:[['type','asc']]
            });

            if(params_list.length <= 0){
                return Result.Error('暂无菜单数据！');
            };

            return Result.Ok('成功！',params_list);

        } catch (e) {
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    } 
};