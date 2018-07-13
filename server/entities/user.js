"use strict";
/**
 * 用户
 */
module.exports = function (sequelize, DataTypes) {
  const
    AbstractPO = require('kml-po-abstract'),
    _ = require('lodash');

  let option = AbstractPO.BaseOption({
    tableName: 'tb_mf_user'
  });

  let entity = _.merge({
    "user_id": {
      "type": DataTypes.STRING(40),
      "comment": "用户id",
      "field": "user_id",
      "allowNull": false,
      "primaryKey": true
    }
  }, AbstractPO.DefaultEntity(sequelize, DataTypes), {
    "plat_id": {
      "type": DataTypes.STRING(40),
      "comment": "平台ID",
      "field": "plat_id",
      "allowNull": false
    },
    "user_name": {
      "type": DataTypes.STRING(40),
      "comment": "姓名",
      "field": "user_name"
    },
    "user_avatar": {
      "type": DataTypes.STRING(200),
      "comment": "头像",
      "field": "user_avatar"
    },
    "user_code": {
      "type": DataTypes.STRING(40),
      "comment": "登录账号",
      "field": "user_code"
    },
    "user_password": {
      "type": DataTypes.STRING(200),
      "comment": "登录密码",
      "field": "user_password"
    },
    "user_type": {
      "type": DataTypes.STRING(10),
      "comment": "用户类型",
      "field": "user_type",
      "allowNull": false
    },
    "user_role": {
      "type": DataTypes.STRING(10),
      "comment": "用户角色",
      "field": "user_role"
    },
    "job_position": {
      "type": DataTypes.STRING(10),
      "comment": "职务",
      "field": "job_position"
    },
    "phone_number": {
      "type": DataTypes.STRING(40),
      "comment": "手机",
      "field": "phone_number"
    },
    "email": {
      "type": DataTypes.STRING(100),
      "comment": "邮件",
      "field": "email"
    },
    "gender": {
      "type": DataTypes.STRING(10),
      "comment": "性别",
      "field": "gender"
    },
    "status": {
      "type": DataTypes.STRING(10),
      "comment": "状态",
      "field": "status",
      "allowNull": false
    },
    "openid": {
      "type": DataTypes.STRING(40),
      "comment": "微信openid",
      "field": "openid"
    },
    "nickname": {
      "type": DataTypes.STRING(100),
      "comment": "昵称",
      "field": "nickname"
    },
    "id_card": {
      "type": DataTypes.STRING(40),
      "comment": "身份证",
      "field": "id_card"
    },
    "note": {
      "type": DataTypes.STRING(1000),
      "comment": "备注",
      "field": "note"
    },
    "vip": {
      "type": DataTypes.STRING(40),
      "comment": "用户等级",
      "field": "vip"
    },
    "unionid": {
      "type": DataTypes.STRING(40),
      "comment": "微信unionid",
      "field": "unionid"
    },
    "account_id": {
      "type": DataTypes.STRING(40),
      "comment": "APP服务账户",
      "field": "account_id"
    }
  });

  return sequelize.define('user', entity, option);
};
