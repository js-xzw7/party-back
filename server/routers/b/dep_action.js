'use strict'

/**
 * @module b/dep
 * @author 王维琦
 * @description
 *  部门相关操作（弃用）
 */
module.exports = function(dbo){
    //api公共模块
    const _ = require('lodash'),
        po = global.po,
        Result = require('kml-express-stage-lib').Result,
        logger = global.loggers.system,
        config = global.config,
        ENUM = config.ENUM,
        crypto_utils = require('kml-crypto-utils'),
        admin = new (require('./admin_action'));
    
    /**
     * 01.创建部门
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.addDepPost = async function(req) {
        //b/dep/addDep  --post
        try {
            let session = req.session,
                {updatedBy, createdBy} = req.default_params;

            //获取参数
            let params = req.body,
                {dep_name} = params;

            //加载模型
            let TBDep = po.import(dbo,'tb_dep');

            let dep_info = await TBDep.findOne({where:{dep_name}});

            if(dep_info){
                return Result.Error('部门已存在！');
            };

            //创建部门
            let dep_id = crypto_utils.UUID();
            await TBDep.create(_.merge({dep_id,dep_name,status:ENUM.TYPE.ENABLE},createdBy,updatedBy));

            return Result.Ok('成功！',{dep_id});
        } catch (error) {
            logger.error('失败！',error);
            return Result.Error('失败',error.message);
        }
    }
}