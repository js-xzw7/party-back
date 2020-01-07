'use strict'
let path = require('path'),
    fs = require('fs'),
    os = require('os'),
    querystring = require('querystring'),
    http = require('http');
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

    //获取广播地址
    getBroadcast() {
        let interfaces = os.networkInterfaces();
        for (let devName in interfaces) {
            let iface = interfaces[devName];
            for (let i = 0; i < iface.length; i++) {
                let alias = iface[i];
                if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                    return calculateBroadcast(alias)
                };

                //无网络下返回127.0.0.1;
                if(alias.address == '127.0.0.1') return alias.address;
            };
        };

        //计算广播地址
        function calculateBroadcast(addr) {
            let mask = [];
            let addrNum = [];
            let stub = [255, 255, 255, 255];
            let addrPart = [];
            let addrPartNot = [];

            let n = addr.netmask.split('.');
            mask[0] = Number(n[0])
            mask[1] = Number(n[1])
            mask[2] = Number(n[2])
            mask[3] = Number(n[3])

            let d = addr.address.split('.');
            addrNum[0] = Number(d[0])
            addrNum[1] = Number(d[1])
            addrNum[2] = Number(d[2])
            addrNum[3] = Number(d[3])

            addrPart[0] = addrNum[0] & mask[0];
            addrPart[1] = addrNum[1] & mask[1];
            addrPart[2] = addrNum[2] & mask[2];
            addrPart[3] = addrNum[3] & mask[3];

            stub[0] &= ~mask[0];
            stub[1] &= ~mask[1];
            stub[2] &= ~mask[2];
            stub[3] &= ~mask[3];

            addrPart[0] |= stub[0];
            addrPart[1] |= stub[1];
            addrPart[2] |= stub[2];
            addrPart[3] |= stub[3];

            /* addr.broadcast = `${addrPart[0]}.${addrPart[1]}.${addrPart[2]}.${addrPart[3]}`; */
            return `${addrPart[0]}.${addrPart[1]}.${addrPart[2]}.${addrPart[3]}`
        }


    }

    //生成tts音频文件
    getTtsAudio(title, content) {
        let postData = querystring.stringify({
            "lan": "zh",    // zh表示中文
            "ie": "UTF-8",  // 字符编码
            "spd": 2,       // 表示朗读的语速，9代表最快，1是最慢
            "text": title + content  // 这句话就是要转换为语音的
        });

        let options = {
            "method": "GET",
            "hostname": "tts.baidu.com",
            "path": "/text2audio?" + postData
        };

        // 调用http模块的request方法请求百度接口
        let new_req = http.request(options, function (res) {
            let chunks = [];

            res.on("data", function (chunk) {
                chunks.push(chunk);   // 获取到的音频文件数据暂存到chunks里面
            });

            res.on("end", function () {
                // 这里用到了Buffer模块，大概意思就是把获取到的语音文件流存入到body里面，body是一个Buffer
                var body = Buffer.concat(chunks);
                // 生成的mp3文件存储的路径
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
        if (!filePath) return;
        let path_arr = filePath.split('/');
        let index = path_arr.length - 1;
        filePath = `public/${path_arr[index - 1]}/${path_arr[index]}`
        fs.unlinkSync(filePath);
        return '成功！';
    }

    //ip地址转换为16进制
    ipToInt(ip) {
        //IP地址验证
        let REG = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;

        let result = REG.exec(ip);
        if (!result) return -1;
        let str = ``;

        for(let i = 1; i< result.length; i++){
            let number =  (parseInt(result[i])).toString(16);
            if(number.length == 1) number = `0`+ number;
            str += number;
        }

        return str
        /* return (parseInt(result[1]) << 24
            | parseInt(result[2]) << 16
            | parseInt(result[3]) << 8
            | parseInt(result[4])) >>> 0; */
    }

   
}

module.exports = tools;