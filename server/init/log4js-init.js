/**
 * Created by lintry on 16/4/15.
 */
"use strict";
const loggers = function(){
  const log4js = require('log4js'),
    fs = require('fs-extra'),
    path = require('path'),
    config = require('./config'),
    config_path = config.path,
    project_name = config.system.project_name;

  const log_path = config_path.LOGS_PATH;
  fs.ensureDirSync(log_path);

  const appenders = [
    { type: 'console' },
    {
      type: 'file',
      filename: path.resolve(log_path, `${project_name}.log`),
      maxLogSize: 20480000,
      backups: 30,
      category: 'project',
      level: 'WARN'
    },
    {
      type: 'file',
      filename: path.resolve(log_path, 'system.log'),
      maxLogSize: 20480000,
      backups: 30,
      category: 'system',
      level: 'ALL'
    },
    {
      type: 'file',
      filename: path.resolve(log_path, 'upload.log'),
      maxLogSize: 20480000,
      backups: 30,
      category: 'upload',
      level: 'ERROR'
    },
    {
      type: 'file',
      filename: path.resolve(log_path, 'pay.log'),
      maxLogSize: 20480000,
      backups: 30,
      category: 'pay',
      level: 'ALL'
    },
    {
      type: 'file',
      filename: path.resolve(log_path, 'wx.log'),
      maxLogSize: 20480000,
      backups: 30,
      category: 'wx',
      level: 'ALL'
    },
    {
      type: 'file',
      filename: path.resolve(log_path, 'cron.log'),
      maxLogSize: 20480000,
      backups: 30,
      category: 'cron',
      level: 'ALL'
    }
  ];

  log4js.configure({
    appenders: appenders
  });

  const logger_export = {};
  appenders.forEach(function(appender) {
    let name = appender.category;
    if (name) {
      let logger = log4js.getLogger(name);
      logger_export[name] = logger;
      logger.setLevel(appender.level || 'ALL');
      logger.trace('TRACE is enabled now!');
      logger.debug('DEBUG is enabled now!');
      logger.info('INFO is enabled now!');
      logger.warn('WARN is enabled now!');
      logger.error('ERROR is enabled now!');
      logger.fatal('FATAL is enabled now!');
    }
  });

  return logger_export;
}();

//绑定到全局变量
global.loggers = global.loggers || loggers;
module.exports = loggers;
