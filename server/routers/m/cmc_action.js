"use strict";

/**
 * @module m/cmc
 * @author 王维琦
 * @description
 * 自定义协议处理
 */
let tools = new (require('../../lib/tools')),
    ENUM = global.config.ENUM;
class cmc {
    constructor() {
        this.PHead = '5A5A';
        this.PTai = 'BFBF';
    }

    //01.推送词条更新
    spellList(data) {
        //处理命令类型 0001 为16进制数
        let comType = '0001';

        //获取词条数
        let c_count = tools.toHex(data.length);

        //协议头部 = 固定值+命令类型+词条总条数
        let new_head = this.PHead + comType + c_count;

        //获取词条字符
        let content = data.join('');
        //词条内容长度 = 词条字符长度 + ( 词条id+词条长度 )所占字节长度
        let content_length = content.length + data.length * 4;
        //buffer长度 = 协议头部所占字节长度 + 词条内容长度 + 协议尾部所占字节长度
        let buffer_length = new_head.length / 2 + content_length + this.PTai.length / 2;

        //创建buffer对象
        let buffer = new Buffer.alloc(buffer_length);

        //写入协议头
        buffer.write(new_head, 0, new_head.length / 2, 'hex');

        //处理数据
        let content_offset = 0;//记录偏移数量
        /* data.forEach((d,index) => { */
        for (let i = 0; i < data.length; i++) {

            let d = data[i];

            //处理词条id为16进制数据
            let c_id = tools.toHex(i);

            //处理词条内容长度为16进制数据
            let c_length = tools.toHex(d.length);

            //词条头部信息 = 词条id + 词条长度
            let c_head = c_id + c_length;

            if (content_offset === 0) {
                //初始偏移数量
                content_offset = new_head.length / 2;
            };

            //写入词条头部信息
            buffer.write(c_head, content_offset, c_head.length / 2, 'hex');

            //写入词条内容
            buffer.write(d, content_offset + c_head.length / 2, d.length, 'utf8');

            //记录下次内容偏移数量
            content_offset = content_offset + c_head.length / 2 + d.length;

        };

        //写入协议尾
        buffer.write(this.PTai, buffer.length - this.PTai.length / 2, this.PTai.length / 2, 'hex');
        return buffer;
    };

    //03.通知已收到识别词条消息
    receiveSpell(id) {
        //处理命令类型 0003
        let comType = '0003';

        return Buffer.from(this.PHead + comType + id + this.PTai, 'hex');
    };
}

module.exports = cmc