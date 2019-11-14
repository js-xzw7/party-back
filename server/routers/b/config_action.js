'use strict'

/**
 * @module b/config
 * @author 王维琦
 * @description
 *  部门相关操作
 */
module.exports = function (dbo) {
    //api公共模块
    const _ = require('lodash'),
        po = global.po,
        Result = require('kml-express-stage-lib').Result,
        logger = global.loggers.system,
        config = global.config,
        ENUM = config.ENUM,
        crypto_utils = require('kml-crypto-utils');

    /**
     * 01.配置客户端显示模块
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.showMenuPost = async function (req) {
        //b/config/showMenu  --post
        try {
            let session = req.session,
                my_user_id = _.get(session, 'active_user.user_id'),
                my_dep_id = _.get(session, 'active_user.dep_id'),
                { updatedBy, createdBy } = req.default_params;

            //获取参数
            let params = req.body,
                { ip, type } = params,
                msg = ``;

            //加载模型
            let [TBCfig,TBParams] = po.import(dbo, ['tb_client_config','tb_params']);

            let config_info = await TBCfig.findOne({ where: { ip } });

            if (config_info) {
                //修改配置
                //配置状态根据菜单状态走
                let param_info = await TBParams.findOne({where:{type}});
                if(!param_info){
                    return Result.Error('type参数无效！');
                }
                params.status = param_info.status;
                config_info = _.merge(config_info,params, updatedBy);
                await config_info.save();

                msg += `${ip}-更新成功！`;
            } else {
                //添加配置
                let cfg_id = crypto_utils.UUID();
                await TBCfig.create(_.merge({
                    cfg_id,
                    status: ENUM.TYPE.ENABLE,
                    dep_id: my_dep_id,
                    ip, type
                }, updatedBy, createdBy));

                msg += `${ip}-配置成功！`;
            }

            return Result.Ok(msg);
        } catch (error) {
            logger.error('失败！', error);
            return Result.Error('失败', error.message);
        }
    }

    /**
     * 02.查看全部已配置客户端
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.findAllCfigGet = async function (req) {
        //b/config/findAllCfig  --get
        try {
            let session = req.session,
                my_user_id = _.get(session, 'active_user.user_id'),
                my_dep_id = _.get(session, 'active_user.dep_id'),
                { updatedBy, createdBy } = req.default_params;

            //加载模型
            let TBCfig = po.import(dbo, 'tb_client_config');

            let cfig_list = await TBCfig.findAll({
                attributes: {
                    exclude: ENUM.DEFAULT_PARAMS_ARRAY
                },
                order:[['optr_date','desc']]
            });

            return Result.Ok('成功！', cfig_list);
        } catch (error) {
            logger.error('失败！', error);
            return Result.Error('失败', error.message);
        }
    }

    /**
     * 03.根据ip查询客户端配置
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.findByIpCfigGet = async function (req) {
        //b/config/findByIpCfig  --get
        try {
            let session = req.session,
                my_user_id = _.get(session, 'active_user.user_id'),
                my_dep_id = _.get(session, 'active_user.dep_id');

            //获取参数
            let params = req.query,
                { ip } = params;

            //加载模型
            let TBCfig = po.import(dbo, 'tb_client_config');

            let cfig_info = await TBCfig.findOne({
                attributes: {
                    exclude: ENUM.DEFAULT_PARAMS_ARRAY
                },
                where: { ip: ip }
            })

            return Result.Ok('成功！', cfig_info);
        } catch (error) {
            logger.error('失败！', error);
            return Result.Error('失败', error.message);
        }
    }

    /**
     * 04.删除客户端配置
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.deleteCfigPost = async function (req) {
        //b/config/deleteCfig  --post
        try {
            let session = req.session,
                my_user_id = _.get(session, 'active_user.user_id'),
                my_dep_id = _.get(session, 'active_user.dep_id');

            //获取参数
            let params = req.body,
                { ip } = params;

            //加载模型
            let TBCfig = po.import(dbo, 'tb_client_config');

            await TBCfig.destroy({where:{ip}});

            return Result.Ok('成功！', ip);
        } catch (error) {
            logger.error('失败！', error);
            return Result.Error('失败', error.message);
        }
    }

    /**
     * 05.配置映射
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.addMapPost = async function (req) {
        //b/config/addMap  --post
        try {
            let session = req.session,
                my_user_id = _.get(session, 'active_user.user_id'),
                my_dep_id = _.get(session, 'active_user.dep_id'),
                { updatedBy, createdBy } = req.default_params;

            //获取参数
            let params = req.body,
                { udp_ip, udp_port, ws_ip, ws_port } = params;

            //加载模型
            let TBMap = po.import(dbo, 'tb_address_map');

            let map_id = crypto_utils.UUID();
            await TBMap.create(_.merge({
                map_id,
                status: ENUM.TYPE.ENABLE,
                dep_id: my_dep_id,
                udp_ip, ws_ip,
                udp_port: udp_port || '3003',
                ws_port: ws_port || '8002'
            }));

            return Result.Ok('成功！');
        } catch (error) {
            logger.error('失败！', error);
            return Result.Error('失败', error.message);
        }
    }

    /**
     * 06.查询全部映射
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.findAllMapGet = async function (req) {
        //b/config/findAllMap  --get
        try {
            let session = req.session,
                my_user_id = _.get(session, 'active_user.user_id'),
                my_dep_id = _.get(session, 'active_user.dep_id'),
                { updatedBy, createdBy } = req.default_params;

            //加载模型
            let TBMap = po.import(dbo, 'tb_address_map');

            let map_list = await TBMap.findAll({
                attributes: {
                    exclude: ENUM.DEFAULT_PARAMS_ARRAY
                }
            }, {
                where: {
                    status: ENUM.TYPE.ENABLE
                }
            });

            return Result.Ok('成功！', map_list);
        } catch (error) {
            logger.error('失败！', error);
            return Result.Error('失败', error.message);
        }
    }

    /**
     * 06.根据ip地址查询映射
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.findByIpMapGet = async function (req) {
        //b/config/ffindByIpMap  --get
        try {
            let session = req.session,
                my_user_id = _.get(session, 'active_user.user_id'),
                my_dep_id = _.get(session, 'active_user.dep_id');

            //获取参数
            let params = req.query,
                { type, ip } = params;

            //判断根据哪种ip类型查询映射
            let whereObj = type === 'ws' ? { ws_ip: ip, status: ENUM.TYPE.ENABLE } : { udp_ip: ip, status: ENUM.TYPE.ENABLE }
            //加载模型
            let TBMap = po.import(dbo, 'tb_address_map');

            let map_info = await TBMap.findOne({
                attributes: {
                    exclude: ENUM.DEFAULT_PARAMS_ARRAY
                },
                where: whereObj
            });

            return Result.Ok('成功！', map_info);
        } catch (error) {
            logger.error('失败！', error);
            return Result.Error('失败', error.message);
        }
    }
}