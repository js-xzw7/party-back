/**
 * 文件描述：
 * 开发者：yujintang
 * 开发者备注：
 * 审阅者：
 * 优化建议：
 * 开发时间: 2017/11/27
 */
"use strict";

const _ = require('lodash');
module.exports = function () {
    return function (req, res, next) {
        let user = _.get(req, 'session.active_user', {});

        let {user_id, user_code, user_name} = user;
        req.default_params = {
            createdBy: {
                create_id: user_id,
                create_code: user_code,
                create_name: user_name,
            },
            updatedBy: {
                optr_id: user_id,
                optr_code: user_code,
                optr_name: user_name,
            }
        };
        next && next();
    };
};