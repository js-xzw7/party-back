/**
 * Created by lintry on 17/7/18.
 * log4js 2.x 初始化定义
 */
"use strict";
const loggers = function () {
    const semver = require('semver'),
        _ = require('lodash'),
        log4js = require('log4js'),
        fs = require('fs-extra'),
        path = require('path'),
        config = require('./config'),
        config_path = config.path,
        project_name = config.system.project_name;

    const log_path = config_path.LOGS_PATH;
    fs.ensureDirSync(log_path);

    const pkg = require(path.resolve(process.cwd(), 'node_modules/log4js/package.json')),
        log4js_2_x = semver.gt(pkg.version, '2.0.0');

    const appenders = [
        {type: 'console'},
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

    if (log4js_2_x) {
        const _appenders = {},
            _categories = {};

        appenders.forEach(function (appender) {
            let name = appender.category || 'default';
            _appenders[name] = _.omit(appender, ['category', 'level']);
            _categories[name] = { appenders: [name, 'default'], level: appender.level || 'ALL'};
        });

        log4js.configure({
            appenders: _appenders,
            categories: _categories,
            replaceConsole: true,
            pm2: true
        });
    } else {
        log4js.configure({
            appenders: appenders
        });
    }

    const logger_export = {};
    appenders.forEach(function (appender) {
        let name = appender.category;
        if (name) {
            let logger = log4js.getLogger(name);
            logger_export[name] = logger;
            !log4js_2_x && logger.setLevel(appender.level || 'ALL');
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
