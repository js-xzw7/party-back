/**
 * Created by lintry on 2017-5-8.
 */

"use strict";

module.exports = function (user_type, dbo) {
    if (user_type === void 0) {
        throw new Error('请明确指定登录平台');
    }

    //api公共模块
    const _ = require('lodash'),
        Promise = require('bluebird'),
        po = global.po,
        Result = require('kml-express-stage-lib').Result,
        logger = global.loggers.system,
        ENUM = global.config.ENUM,
        cache_config = config.cache,
        crypto_utils = require('kml-crypto-utils'),
        redisDb = require('../init/redis-promisify');

    const ExpressPassport = require('kml-common-module').ExpressPassport,
        express_passport = new ExpressPassport({
            server_id: global.config.system.project_name,
            ttl: cache_config.EXPRESS_TTL,
            redis_client: redisDb
        });


    /**
     * 登录系统
     * @param req
     * @param res
     * @param db
     * @return {*}
     * 仅供调试用
     */
    this.sysloginPost = async function (req, res, db) {
        const params = req.body;

        if (!params || !params.userCode || !params.userPassword) return Result.Error('参数错误');

        const sendData = {
            userCode: params.userCode,
            userPassword: params.userPassword+'@'+params.userCode
        };

        try {
            const
                User = po.import(db, 'user'),

                userWhereObj = {
                    user_code: sendData.userCode,
                    status: ENUM.TYPE.ENABLE
                };

            const
                userInfoArray = _.difference(Object.keys(User.fieldRawAttributesMap), ENUM.DEFAULT_PARAMS_ARRAY);

            const userInfo = await User.findOne({where: userWhereObj, attributes: userInfoArray});
            if (!userInfo) return Result.Error('账号或密码错误');

            // 检查密码编码后是否与数据库存储的编码一致
            let matched = crypto_utils.hashMatch('md5', sendData.userPassword, userInfo.user_password);
            if (!matched) {
                return Result.Error('账号或密码错误');
            }

            sendData.platId = userInfo.plat_id;
            sendData.userType = userInfo.user_type;

            const data = {
                user: userInfo.toJSON()
            };

            //屏蔽用户密码输出
            data.user.user_password = void 0;

            return express_passport.create(req, res, data).then((express_data) => {
                return Result.Ok('登录成功', data);
            });

        } catch(err) {
            logger.error('error', err);
            return Result.Error('登录失败');
        }
    };


    /**
     * 注销
     * @param req
     * @param res
     */
    this.logoutGet = async function (req, res) {
        const active_user = req.session.active_user;
        await express_passport.destroy(req, res);

        if (!active_user) {
            req.session.destroy();
            return Result.Ok('注销成功');
        }
        req.session.destroy();

        const key = `${active_user.user_id}@${active_user.plat_id}`;
        return redisDb
            .DELAsync(key)
            .then(() => {
                return Result.Ok('注销成功');
            })
            .catch(err => {
                logger.error(`${req.baseUrl}${req.url} => `, err);
                return Result.Error('注销成功');
            });
    };

    /**
     * 快速登录 不分平台直接登录
     * @param req
     * @param res
     * @returns {Promise.<T>}
     */
    this.quickPass = function (req, res, db) {
        return express_passport.validate(req, res)
            .then(async function (express_data) {
                if (express_data) {
                    const
                        User = po.import(db, 'user'),

                        userWhereObj = {
                            user_id: express_data.user_id
                        };

                    const
                        userInfoArray = _.difference(Object.keys(User.fieldRawAttributesMap), ENUM.DEFAULT_PARAMS_ARRAY);

                    const userInfo = await User.findOne({where: userWhereObj, attributes: userInfoArray});
                    if (!userInfo) return Result.Error('登录信息已失效, 请重新登录!');

                    const data = {
                        user: userInfo.toJSON()
                    };

                    //屏蔽用户密码输出
                    data.user.user_password = void 0;

                    return express_passport.refresh(req, res, data).then(() => {
                        return Result.Ok('登录成功', data);
                    });

                } else {
                    res.status(401);
                    return Result.Error('登录信息已失效, 请重新登录!');
                }
            });
    };

};
