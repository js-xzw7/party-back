'use strict'

/**
 * @module b/admin
 * @author 王维琦
 * @description
 *  管理员相关操作
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
     * 01.添加管理员
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.addAdminPost = async function (req) {
        //b/admin/addAdmin  --post
        try {
            let session = req.session,
                { updatedBy, createdBy } = req.default_params;

            //获取参数
            let params = req.body,
                { user_id, login_code, login_password, dep_id, avatar } = params,
                msg = ``;

            //加载模型
            let TBUser = po.import(dbo, 'tb_user');

            if (!user_id) {
                //新增管理员
                let admin_info = await TBUser.findOne({ where: { login_code } });
                if (admin_info) {
                    return Result.Error('用户名已存在！');
                };

                let user_id = crypto_utils.UUID();
                await TBUser.create(_.merge({
                    user_id, dep_id, avatar,
                    role: 'A',//管理员
                    status: ENUM.TYPE.ENABLE,
                    login_code: login_code,
                    login_password: crypto_utils.MD5(login_password + '@' + login_code)
                }));

                msg += `新增成功！`
            }else{
                //更新管理员信息
                await TBUser.update(params,{
                    where:{user_id}
                })
                msg += `更新成功`
            }

            return Result.Ok(msg, { login_code });
        } catch (error) {
            logger.error('失败！', error);
            return Result.Error('失败', error.message);
        }
    }

    /**
     * 02.管理员登录
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.loginAdminPost = async function (req) {
        //b/admin/loginAdmin  --post
        try {
            let session = req.session,
                { updatedBy, createdBy } = req.default_params;

            //获取参数
            let params = req.body,
                { login_code, login_password } = params;

            //加载模型
            let TBUser = po.import(dbo, 'tb_user');

            //md5 加密
            login_password = crypto_utils.MD5(login_password + '@' + login_code);

            let admin_info = await TBUser.findOne({
                where: {
                    login_code,
                    login_password,
                    role: 'A'
                }
            });

            if (!admin_info) {
                return Result.Error('用户名或密码错误！');
            }

            if (admin_info.status !== ENUM.TYPE.ENABLE) {
                return Result.Error('无效管理员！');
            }

            admin_info.login_password = void 0;
            //登录信息保存在session中
            req.session.active_user = admin_info.dataValues;
            return Result.Ok('登录成功！', admin_info);
        } catch (error) {
            logger.error('失败！', error);
            return Result.Error('失败', error.message);
        }
    }

    /**
     * 03.管理员信息
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.adminInfoGet = async function (req) {
        //b/admin/adminInfo  --get
        try {
            let session = req.session,
                active_user = session.active_user,
                { updatedBy, createdBy } = req.default_params;

            //获取参数
            let params = req.query,
                { user_id } = params;

            user_id = user_id || active_user && active_user.user_id 

            //加载模型
            let TBUser = po.import(dbo, 'tb_user');

            let user_info = await TBUser.findById(user_id)

            if(!user_info) return Result.Error('用户不存在')

            return Result.Ok('成功！', user_info);
        } catch (error) {
            logger.error('失败！', error);
            return Result.Error('失败', error.message);
        }
    }

    /**
     * 更改密码（未做安全验证，慎用）
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.updatePwdPost = async function (req) {
        //b/admin/updatePwd  --post
        try {
            let session = req.session,
                { updatedBy, createdBy } = req.default_params;

            //获取参数
            let params = req.body,
                { login_code, login_password } = params;

            //加载模型
            let TBUser = po.import(dbo, 'tb_user');

            let admin_info = await TBUser.findOne({ where: { login_code } });

            if (!admin_info) {
                return Result.Error('管理员不存在！');
            };

            //md5 加密
            login_password = crypto_utils.MD5(login_password + '@' + login_code);

            admin_info.login_password = login_password;
            await admin_info.save()

            return Result.Ok('更新成功！', { login_code });
        } catch (error) {
            logger.error('失败！', error);
            return Result.Error('失败', error.message);
        }
    }
}