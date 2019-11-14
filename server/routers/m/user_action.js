"use strict";

/**
 * @module c/user
 * @author 王维琦
 * @description
 *             用户相关信息
 */
module.exports = function ( dbo ) {

    //api公共模块
    const _ = require('lodash'),
        po = global.po,
        Result = require('kml-express-stage-lib').Result,
        logger = global.loggers.system,
        config = global.config,
        ENUM = config.ENUM,
        crypto_utils = require('kml-crypto-utils');


    /**
     * 01.更新用户信息
     *
     * @param {Object} req - 请求参数
     * @param {Object} req.user_id - 用户id；（有：更新用户信息，无：新增待审核用户信息）
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.updateUserPost = async (req) => {
       // c/user/login   --post
        try {
                let session = req.session,
                my_user_id = _.get(session, 'active_user.user_id'),
                my_plat_id = _.get(session, 'plat.plat_id'),
                my_corp_id = _.get(session, 'corp.corp_id'),
                {updatedBy, createdBy} = req.default_params;

            //获取数据对象
            let params = req.body,
                msg = '';
                
            //加载数据模型
            let User = po.import(dbo,'tb_user');

            if(!params.user_id){
                //创建用户id
                params.user_id = crypto_utils.UUID();
                //创建未审核用户
                let user_info = await User.create(_.merge({
                    status:ENUM.USER.STATUS.APPLY
                    },params,createdBy));

                msg += '用户注册成功！'
            }else{
                //检查用户是否有效
                let user_info = await User.findById(params.user_id);

                if(!user_info){
                    return Result.Error('用户不存在，更新失败！');
                };

                //更新用户信息
                user_info = _.merge(user_info,params,updatedBy);
                await user_info.save();

                msg += '用户信息更新成功！'
            }

            return Result.Ok(msg,{user_id});

        } catch (e) {
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    }

};