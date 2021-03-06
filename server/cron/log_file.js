/**
 * Created by 王维琦 on 20/01/13.
 * 定时清空日志文件
 * 

 * 通配符定义
 * *  *  *  *  *  *
┬ ┬ ┬ ┬ ┬ ┬
│ │ │ │ │  |
│ │ │ │ │ └ day of week (0 - 7) (0 or 7 is Sun)
│ │ │ │ └───── month (1 - 12)
│ │ │ └────────── day of month (1 - 31)
│ │ └─────────────── hour (0 - 23)
│ └──────────────────── minute (0 - 59)

└───────────────────────── second (0 - 59, OPTIONAL)
 * 
 *
 */
"use strict";
const schedule = require('node-schedule'),
    fs = require("fs"),
    path = require("path");

module.exports = function (){
    schedule.scheduleJob('0 0 0 * * 0', function(){
        console.log(' 启动清空日志定时任务:' + new Date());
        let url = path.resolve(__dirname,'../../logs')
        //清空日志文件
        let files = fs.readdirSync(url);   //返回文件和子目录的数组md
        
        files.forEach(function(file,index){
            var curPath = path.join(url,file);
                
            if(fs.statSync(curPath).isFile()) { 
                fs.truncateSync(curPath, 0) //清空文件
            } 
                
        });

    }); 
}();

