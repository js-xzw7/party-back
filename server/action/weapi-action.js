/**
 * 处理微信小程序接口api的action路由
 */
/* global global */
/* global process */
"use strict";

function WeApiAction (routerPath) {
    routerPath = routerPath || '';

    const _ = require('lodash'),
        express = require('express'),
        router = express.Router(),
        config = global.config,
        mock_sim = require('kml-express-stage-mw').mockSim,
        authorizer = require('kml-express-stage-mw').authorizer,
        rawXML = require('kml-express-stage-mw').rawXML,
        execApi = require('kml-express-stage-mw').execApi,
        default_params = require('../lib/mw/default_params'),
        weapp_param_mw = require('../lib/mw/weapp-params');

    const fn_request = function (req, res, next) {
        return execApi(routerPath, req, res, next);
    };

    //session中记录ip
    router.use(function (req, res, next) {
        req.session.clientIp = req.clientIp;
        next && next();
    });

    //微信小程序访问token解析
    const token_parser = require('kml-weapp-mw').TokenParser({
        redis: require('../init/redis-promisify'),
        strict_mode: config.weapp.strict_mode
    });
    router.use(token_parser.mw);

    //处理微信小程序的参数
    router.use(weapp_param_mw());

    //api解析
    const mw_api = require('kml-express-stage-mw').restfulApi({routerPath: routerPath});
    const mw_oauth = require('kml-wxapi/lib/mw/oauth')({
        api_regexp: ['/t/wx/index'],
        wechat: config.wechat,
        server_id: config.system.project_name,
        wx_state: config.system.project_name
    });
    const API_REGEXP = mw_api.regexp;
    router.use(mw_api.mw);
    //解析用户微信授权
    router.use(mw_oauth.mw);
    //mock数据解析
    router.use(mock_sim());
    //验证身份
    router.use(authorizer());
    //添加default_params
    router.use(default_params());
    //解析xml
    router.use(rawXML());


    //等于各种方法的绑定，注意需要直接使用router[method]，express内部绑定时需要用到this
    ['get', 'post', 'put', 'delete'].forEach(method => {
        router[method] && router[method](API_REGEXP, fn_request);
    });


    return router;
}

module.exports = WeApiAction;
