/**
 * B端后台管理身份验证
 * Created by lintry on 2018/06/29.
 */
"use strict";
module.exports = function () {
    const Result = require('kml-express-stage-lib').Result,
        AuthAction = require('../../modules/authAction'),
        db = global.sequelize,
        logger = global.loggers.system;

    return function (req, res, next) {
        let apiParams = req.apiParams;
        if (!apiParams) {
            return next();
        }
        let user = req.session.active_user;
        let action = apiParams.action;
        let routerPath = apiParams.routerPath;
        const method = apiParams.method;
        let needVerify = need_verify(action, routerPath, method);
        const userType = (user && user.user_type) ? user.user_type.toUpperCase() : '';
        const urlType = routerPath.toUpperCase();

        if (!needVerify || (userType === urlType) || userType === 'P' || urlType === 'U') {
            next && next();
        } else {
            if (!user) {
                let authAction = new AuthAction(userType);
                return authAction.quickPass(req, res, db)
                    .then(function (result) {
                        if ('OK' !== result.ret) { //登录不成功
                            res.json(result);
                        } else {
                            const tempUserType = (result.content && result.content.user.user_type)
                                ? result.content.user.user_type.toUpperCase()
                                : '';

                            if (tempUserType === urlType || tempUserType === 'P') {
                                return next && next();
                            }
                            logger.error(`{error: '用户身份不匹配', tempUserType: ${tempUserType},urlType: ${urlType} `);
                            return res.status(401).json(new Result(Result.ERROR, '禁止访问', '用户身份不匹配'));
                        }
                    })
                    .catch(err => {
                        logger.error('error', err);
                        res.status(401).json(new Result(Result.ERROR, '登录失败', '', err.message));
                    });
            }
            return res.status(401).json(new Result(Result.ERROR, '禁止访问', '用户身份不匹配'));
        }
    }
};

/**
 * 验证用户操作是否需要验证权限
 * @param action
 * @param routerPath
 * @param method
 */
function need_verify (action, routerPath, method) {
    routerPath = routerPath.toLowerCase();
    let needVerify = true;

    if (/^[tuo]$/.test(routerPath)) { //u、t、o的公共模块直接通过
        needVerify = false;
    } else if (action === 'auth') { //登录模块直接通过
        needVerify = false;
    }
    return needVerify;
}

