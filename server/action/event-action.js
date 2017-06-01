/**
 * 处理接口微信事件的action路由
 */
/* global global */
/* global process */
"use strict";
function EventAction(routerPath) {
  routerPath = routerPath || '';

  const _ = require('lodash'),
    express = require('express'),
    router = express.Router(),
    mock_sim = require('kml-express-stage-mw').mockSim,
    rawXML = require('kml-express-stage-mw').rawXML,
    execApi = require('kml-express-stage-mw').execApi;


  let fn_request = function (req, res, next) {
    return execApi(routerPath, req, res, next);
  };

  //session中记录ip
  router.use(function (req, res, next) {
    req.session.clientIp = req.clientIp;
    next && next();
  });

  //解析xml
  router.use(rawXML());
  //api解析
  const mw_api = require('kml-express-stage-mw').restfulApi({routerPath: routerPath});
  const API_REGEXP = mw_api.regexp;
  router.use(mw_api.mw);
  router.use(mw_api.event); //解析事件,验证身份
  //mock数据解析
  router.use(mock_sim());

  //等于各种方法的绑定，注意需要直接使用router[method]，express内部绑定时需要用到this
  ['get', 'post', 'put', 'delete'].forEach(method => {
    router[method] && router[method](API_REGEXP, fn_request);
  });


  return router;
}

module.exports = EventAction;
