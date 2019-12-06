"use strict";

/**
 * @module c/params
 * @author 王维琦
 * @description
 * 前端http查看参数使用
 */
module.exports = function (dbo) {

    //api公共模块
    const _ = require('lodash'),
        po = global.po,
        Result = require('kml-express-stage-lib').Result,
        logger = global.loggers.system,
        config = global.config,
        ENUM = config.ENUM;


    /**
     * 01.获取参数拼音列表（暂时未用）
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
            let TBParams = po.import(dbo, 'tb_params');

            let params_list = await TBParams.findAll({
                attributes: ['spell']
            });

            if (params_list.length <= 0) {
                return Result.Error('暂无参数数据！');
            };

            //处理返回数据结构
            let result_list = [];
            params_list.map(p => {
                result_list.push(p.spell);
            });

            return Result.Ok('成功！', result_list);

        } catch (e) {
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    }

    /**
     * 02.查看参数表使用（暂时未用）
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
            let TBParams = po.import(dbo, 'tb_params');

            let params_list = await TBParams.findAll({
                attributes: {
                    exclude: ENUM.DEFAULT_PARAMS_ARRAY
                }
            });

            if (params_list.length <= 0) {
                return Result.Error('暂无参数数据！');
            };

            return Result.Ok('成功！', params_list);

        } catch (e) {
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    }

    /**
     * 03.查看全部菜单
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
                { type, note } = params;

            //加载模型
            let TBParams = po.import(dbo, 'tb_params');

            let where_query = { style: 'C' }


            if (!type) {
                /**
                 * 如果type存在，查询所有菜单（包含禁用菜单）
                 * 不存在，查询所有启用菜单
                 * */
                where_query.status = ENUM.TYPE.ENABLE;
            }

            if (note) {
                /**
                 * 如果note存在，且note = W 查询文件类型菜单
                 * note = S 查询视频类型菜单
                 * */
                where_query.note = note;
            }

            let params_list = await TBParams.findAll({
                attributes: ['param_id', 'status','note', 'name', 'type', 'style', 'spell'],
                where: where_query,
                order: [['type', 'asc']]
            });

            if (params_list.length <= 0) {
                return Result.Error('暂无菜单数据！');
            };

            return Result.Ok('成功！', params_list);

        } catch (e) {
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    }

    /**
     * 04.模糊查询菜单
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.fuzzySearchGet = async (req) => {
        // c/params/fuzzySearch  --get
        try {
            //获取数据对象
            let params = req.query,
                {name} = params;
                
            //加载模型
            let TBParams = po.import(dbo, 'tb_params');

            let params_list = await TBParams.findAll({
                attributes: ['param_id', 'status','note', 'name', 'type', 'style', 'spell'],
                where:{
                    name:{
                        [dbo.Op.like]:`%${name}%`
                    }
                }
            });

            if (params_list.length <= 0) {
                return Result.Error('暂无菜单数据！');
            };

            return Result.Ok('成功！', params_list);

        } catch (e) {
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    }

};