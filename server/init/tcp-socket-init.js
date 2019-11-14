/**
 * 建立socket
 */
"use strict";
module.exports =  function () {

    let net = require('net'),
        logger = require('./log4js-init').system,
        contron = new (require('../routers/c/contron_action'))(global.sequelize);

    //建立tcp服务器
    let server = net.createServer();

    //监听客户端连接
    server.on('connection', (socket) =>{
        logger.info('socket connection:'+socket.localAddress + ':' + socket.localPort);
        
        //接收数据
        socket.on('data',async (data) =>{
            logger.info('传输数据为'+data);

            //处理接收数据，返回相应内容
            let result_set = await contron.disposePost(data.toString());
            
            if(typeof result_set  === 'object'){
                result_set = JSON.stringify(result_set);
            };
            
            socket.write(result_set)
        });
        
        //数据传输错误
        socket.on('error',(error) =>{
            logger.info('socket error:' + error);
            socket.end();
        });

        //客户端关闭
        socket.on('close',()=>{
            logger.info('client closed!');
        });
    });

    //监听端口
    server.listen(3001,'localhost');

    //服务器错误事件
    server.on("error",(exception) =>{
        console.log("server error:" + exception);
    });

}();

