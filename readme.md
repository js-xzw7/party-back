
### server目录文件定义
+ action 身份拦截（弃用）
+ entities 定义模型数据文件
+ init 程序运行初始化
    + config 参数配置
    + entities-init 定义加载数据模型方法及模型之间关联关系
    + express-init 进一步封装express框架
    + log4js-init log日志输出
    + redis-promisify 连接redis
    + sequlize-init  创建seqlize实体，并加载数据模型
    + udp-socket-init udp协议通讯
    + websocket-ws websocket通讯
+ lib 通用方法
    + mw 自动登录（弃用）
    + api-sdk 调用api服务的客户端
    + tools 工具包
+ routers 路由解析
    + b：后台管理接口文件
    + c：客户端展示接口文件
    + m: 通用工具类接口文件
+ server.js 启动服务
