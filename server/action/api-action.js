/**
 * 处理接口api的action路由
 */
/* global global */
/* global process */
"use strict";
function ApiAction(routerPath) {
  routerPath = routerPath || '';

  const _ = require('lodash'),
    express = require('express'),
    router = express.Router(),
    mock_sim = require('kml-express-stage-mw').mockSim,
    authorizer = require('kml-express-stage-mw').authorizer,
    rawXML = require('kml-express-stage-mw').rawXML,
    execApi = require('kml-express-stage-mw').execApi;

  const fn_request = function (req, res, next) {
    return execApi(routerPath, req, res, next);
  };

  //session中记录ip
  router.use(function (req, res, next) {
    req.session.clientIp = req.clientIp;
    next && next();
  });

  //api解析
  const mw_api = require('kml-express-stage-mw').restfulApi({routerPath: routerPath});
  const API_REGEXP = mw_api.regexp;
  router.use(mw_api.mw);
  //mock数据解析
  router.use(mock_sim());
  //验证身份
  router.use(authorizer());
  //解析xml
  router.use(rawXML());


  //等于各种方法的绑定，注意需要直接使用router[method]，express内部绑定时需要用到this
  ['get', 'post', 'put', 'delete'].forEach(method => {
    router[method] && router[method](API_REGEXP, fn_request);
  });


  return router;
}

module.exports = ApiAction;
