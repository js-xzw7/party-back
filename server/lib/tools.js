'use strict'
let path = require('path'),
    fs = require('fs'),
    os = require('os'),
    querystring = require('querystring'),
    http = require('http'),
    logger = global.loggers.system;
class tools {
    constructor(data) {
        this.data = data;
    }

    //转换16进制数据
    toHex(number) {
        number = (parseInt(number)).toString(16);

        //保证数据为2位字节
        if (number.length === 1) {
            number = '000' + number;
        } else {
            number = '00' + number;
        }

        return number;
    }

    //获取当前环境ip
    getIp() {
        let interfaces = os.networkInterfaces();
        for (let devName in interfaces) {
            let iface = interfaces[devName];
            for (let i = 0; i < iface.length; i++) {
                let alias = iface[i];
                if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                    return alias.address
                };
            };
        };
    }

    //生成tts音频文件
    getTtsAudio(title, content) {
        let postData = querystring.stringify({
            "lan": "zh",    // zh表示中文
            "ie": "UTF-8",  // 字符编码
            "spd": 2,       // 表示朗读的语速，9代表最快，1是最慢（撩妹请用2，绕口令请用9）
            "text": title + content  // 这句话就是要转换为语音的，可以表白一下，XXX我爱你
        });

        let options = {
            "method": "GET",
            "hostname": "tts.baidu.com",
            "path": "/text2audio?" + postData
        };

        // 调用http模块的request方法请求百度接口
        let new_req =  http.request(options, function (res) {
            let chunks = [];

            res.on("data", function (chunk) {
                chunks.push(chunk);   // 获取到的音频文件数据暂存到chunks里面
            });

            res.on("end", function () {
                // 这里用到了Buffer模块，大概意思就是把获取到的语音文件流存入到body里面，body是一个Buffer
                var body = Buffer.concat(chunks);
                // 生成的mp3文件存储的路径，文件名叫做iloveu.mp3
                var filePath = path.resolve(__dirname, `../../public/audio/${title}.mp3`);

                // fs模块写文件    
                fs.writeFileSync(filePath, body);
            });
        });
        new_req.end();

        //获取当前运行环境ip
        let ip = this.getIp();
        return `http://${ip}:${config.system.bind_port}/audio/${title}.mp3`;
    }

    //删除文件
    deleteFile(filePath) {
        if(!filePath) return;
        let path_arr = filePath.split('/');
        let index = path_arr.length - 1;
        filePath = `public/${path_arr[index - 1]}/${path_arr[index]}`
        fs.unlinkSync(filePath);
        return '成功！';
    }
}

module.exports = tools;