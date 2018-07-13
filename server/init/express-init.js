/**
 * express初始化
 */
"use strict";
module.exports = function() {
  let _ = require('lodash'),
    shell = require('shelljs'),
    express = require('express'),
    session = require('express-session'),
    app = express(),
    cookieParser = require('cookie-parser'),
    requestIp = require('request-ip'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    original_url_mw = require('kml-original-url-mw'),
    config = require('./config'),
    config_path = config.path,
    logger = require('./log4js-init').system;

  // 定义express body 中间件
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  // app.use(bodyParser.raw({type: 'application/xml'}));
  app.use(methodOverride());
  app.use(requestIp.mw());

  // 加载用于解析 cookie 的中间件
  app.use(cookieParser());

  // 解析原始请求url
  app.use(original_url_mw());

  const cfg_redis = config.redis;
  if (cfg_redis && cfg_redis.host) {
    let rs = shell.exec(`ping -c 3 -t 5 ${cfg_redis.host}`), sessionMiddleware;

    let session_cfg = {
      name: config.system.project_name + '.sid',
      secret: 'my_secret_treasure',
      resave: true,
      saveUninitialized: false,
      proxy: true
    };

    if (rs.code === 0 ) {
      // 使用redis存储session
      let RedisStore = require('connect-redis')(session);

      sessionMiddleware = session(_.merge({
        store: new RedisStore({
          host: cfg_redis.host,
          port: cfg_redis.port,
          pass: cfg_redis.pass,
          ttl: config.cache.ttl.SESSION_TTL,
          db: cfg_redis.db,
          retry_unfulfilled_commands: true
        })
      }, session_cfg));
    } else {
      logger.warn(`${cfg_redis.host} can not be connected, we will use default session instead!`);
      sessionMiddleware = session(session_cfg);
    }

    app.use(function (req, res, next) {
      let tries = 3;

      function lookupSession(error) {
        if (error) {
          return next(error);
        }

        tries--;
        if (req.session !== undefined) {
          return next();
        }

        if (tries < 0) {
          return next(new Error('Oops! @_@'));
        }
        sessionMiddleware(req, res, lookupSession);
      }

      lookupSession();
    })
  }

  // 指定一个虚拟路径static挂载静态资源
  app.use('/', express.static(config_path.PUBLIC_PATH));

  return app;
};