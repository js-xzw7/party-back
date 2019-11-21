"use strict";

const configure = function () {
    const path = require('path'),
        fs = require('fs-extra'),
        chalk = require('chalk'),
        customize = require('kml-customize'),
        PROJECT_NAME = 'party_back';
        
    let BASE_URL = `http://localhost:8001/${PROJECT_NAME}/`;
    let host = '127.0.0.1';
   /*  let host = '111.231.106.247'; */
    let port = '5432';
    let database = 'party';
    let username = 'postgres';
    let password = 'ok';

    let redisHost = 'localhost';
    let redisPort = 6379;
    let redisDB = 0;
    let redisPass = '';

    const root = process.cwd(),
        server_path = 'server', //后端主目录
        init_path = 'init', //后端初始化目录
        lib_path = 'lib', //后端自定义库
        modules_path = 'modules', //后端模块定义
        routers_path = 'routers', //后端路由定义
        entities_path = 'entities', //实体类定义
        public_path = 'public', //静态资源目录
        logs_path = 'logs', //日志目录
        views_path = 'views', //前端视图输出
        mock_path = 'mock' //mock数据目录
    ;

    let config = {
        //sequelize数据库连接定义
        sequelize: {
            database: database,
            username: username,
            password: password,
            options: {
                timezone: '+08:00', //保证时区正确
                host: host,
                port: port,
                dialect: 'postgres',
                //storage: 'path/to/database.sqlite', //SQLite only
                pool: {
                    max: 5,
                    min: 0,
                    idle: 10000
                }
            },
            syncDB: false
        },
        redis: {
            host: redisHost,
            port: redisPort,
            db: redisDB,
            pass: redisPass
        },

        //系统目录定义
        system: {
            bind_port: 8001, //绑定端口
            base_url: BASE_URL, //主URL
            project_name: PROJECT_NAME, //项目名
            additional: '_action', //路由后缀
            mock_file: '.js', //对应url请求时获取mock数据类型的文件后缀
            mock_mode: process.env.MOCK_MODE || false, //mock模式, auto=自动|true|false
            real_mode: /^product|real$/.test(process.env.NODE_ENV) //连接真实生产环境
        },

        //系统路径
        path: {
            ROUTERS_PATH: path.resolve(root, server_path, routers_path), //后端路由定义
            ENTITIES_PATH: path.resolve(root, server_path, entities_path), //实体类定义
            INIT_PATH: path.resolve(root, server_path, init_path), //后端初始化目录,固定
            LIB_PATH: path.resolve(root, server_path, lib_path), //后端自定义库,固定
            MODULES_PATH: path.resolve(root, server_path, modules_path), //后端模块定义
            MOCK_PATH: path.resolve(root, mock_path), ///mock数据目录
            PUBLIC_PATH: path.resolve(root, public_path), //静态资源目录
            VIEWS_PATH: path.resolve(root, views_path), //前端视图输出
            LOGS_PATH: path.resolve(root, logs_path) //日志目录
        },

        /* //文件上传目录定义
        upload: {
            root: `/opt/${PROJECT_NAME}-img/`,
            base_url: null,
            appimg: 'appimg/',
            qrimg: 'qrimg/',
            wximg: 'wximg/'
        }, */

        //微信定义
        wechat: {
            api_host: 'http://localhost:3800',
            wx_app: 'itomix',
            api_token: '',
            authorizer_appid: ''
        },

        //微信小程序
        weapp: {
            api_host: 'http://localhost:3800',
            api_token: '',
            authorizer_appid: '',
            watermark_ttl: 7200, //敏感数据有效期(s)
            token_prefix: 'WXID', //token前缀
            token_ttl: 36000, //token有效期(s)
            share_prefix: 'WXSHARE', //分享前缀
            share_ttl: 3600 * 48, //分享有效期(s)
            strict_mode: true
        },

        //内部应用接口验证定义
        app_config: {
            api_token: ''
        },

        //枚举参数
        ENUM: {
            USER:{
                //成员状态
                STATUS:{
                    APPLY:'APPLY',//已注册
                    ENABLE:'ENABLE',//已审核
                    DISABLE:'DISABLE'//已注销
                }
            },
            TYPE: {
                APPLY: 'APPLY',
                ENABLE: 'ENABLE',
                FAIL: 'FAIL',
                IGNORE: 'IGNORE',
                DISABLE: 'DISABLE',
                ZEIO: 0,
                ONE: 1,
                USE: 'USE',
                USER: 'USER',
                AUTO: 'AUTO',
                DEFAULT: 'DEFAULT'
            },
            STATE: {
                SUCCESS: 'SUCCESS',
                OK: 'OK',
                ERROR: 'ERROR'
            },
            PLATTYPE: {
                P: 'P',
                B: 'B'
            },
            LIMIT: 20,
            OFFSET: 0,
            DEFAULT_LIMIT: 999,
            DEFAULT_PARAMS_ARRAY: ['create_id', 'create_name', 'create_code', 'create_date',
                'optr_id', 'optr_name', 'optr_code', 'optr_date'],
            STATUS_ARRAY: ['APPLY', 'ENABLE', 'DISABLE', 'Y', 'N', 'PUBLIC', 'PRIVATE'],
            RESTRICT:{
                STMT_MAX: 50 //参数声明，最大上限
            },
            DEFAULT_PORT:{
                UDP_PORT:3002,//udp端口
                WS_PORT:8002,//websoket端口
                BRC_PROT:6001//广播端口
            },
            FILE_PARAMS:{
                FILE_PATH:'/images/',//图片存放目录
                AUDIO_PATH:'/audio',//音频存放目录
                FILE_IMG:'DEFAULT_FILE.png',//默认文件封面
                USER_IMG:'DEFAULT_AVATAR.png'//默认用户头像
                
            }
        },

        // 微信跳转页
        mpurl_map: {
            index: 'index.html'
        },

        /* // 缓存设定
        cache: {
            ttl: {
                PIN_TIMEOUT: 300, // 5分钟的验证码超时时间
                AGAIN_PIN: 240, // 4分钟再次发送验证码
                EXPRESS_TTL: 86400, // 1 day
                SESSION_TTL: 86400 // 1 day
            }
        }, */
    };

    //创建目录
    let config_path = config.path;
    for (let p in config_path) {
        if (config_path.hasOwnProperty(p)) {
            let path = config_path[p];
            fs.ensureDir(path, function (err, added_root) {
                if (err) {
                    return console.error(chalk.red('create folder error'), chalk.red(JSON.stringify(err, null, 4)));
                }
                added_root && console.log(chalk.green(path + ' is created'));
            });
        }
    }
    return customize(config);
}();

//绑定到全局变量
global.config = global.config = configure;
module.exports = configure;
