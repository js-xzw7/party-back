"use strict";

/**
 * @module b/auth
 * @author 余金堂
 * @description
 *              1.登录系统
 *              2.注销
 *              3.获取个人信息
 */
module.exports = function ( dbo ) {

    //api公共模块
    const _ = require('lodash'),
        po = global.po,
        Result = require('kml-express-stage-lib').Result,
        logger = global.loggers.system,
        redisDb = require('../../init/redis-promisify');



    const authAction = new (require('../../modules/authAction'))('B', dbo);

    /**
     * 1. 登录系统
     *
     * @deprecated saas_back 平台提供方法优先
     * @param {Object} req - 请求参数
     * @param {string} req.userCode - 用户code
     * @param {string} req.userPassword - 密码为🔐的内容
     *
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     * @param {Object} res.content.plat - 平台
     * @param {Object} res.content.corp - 登录人所属公司
     * @param {Object} res.content.active_user - 个人信息
     * @param {Object} res.content.duty - 指责
     */
    this.sysloginPost = authAction.sysloginPost;

    /**
     * 2. 注销
     *
     * @deprecated saas_back 平台提供方法优先
     * @param {Object} req - 请求参数
     *
     * @param {Object} res - 返回参数
     * @param {object} res.content - 返回内容
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     */
    this.logoutGet = authAction.logoutGet;


    /**
     * 3.获取个人信息
     *
     * @deprecated saas_back 平台提供方法优先
     * @param {Object} req - 请求参数
     *
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     * @param {Object} res.content.plat - 平台
     * @param {Object} res.content.corp - 登录人所属公司
     * @param {Object} res.content.active_user -个人信息
     * @param {Object} res.content.duty - 指责
     * @param {Object} res.content.saas_host - 平台主页面
     */
    this.getUserInfoGet = async (req) => {
        try {
            let session = req.session,
                {active_user, plat, corp, duty} = session;

            const data = {
                active_user: active_user || {},
                plat: plat || {},
                corp: corp || {},
                duty: duty || {}
            };

            return Result.Ok('成功!', data);
        } catch (e) {
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    }
};