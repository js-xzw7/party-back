"use strict";
/**
 * 02.用户
 */
module.exports = function(sequelize, DataTypes) {
  const
    AbstractPO = require('kml-po-abstract'),
    _ = require('lodash');

  let option = AbstractPO.BaseOption({
    tableName: 'tb_user'
  });

  let entity = _.merge({
    "user_id": {
        "type": DataTypes.STRING(40),
        "comment": "用户ID",
        "field": "user_id",
        "allowNull": false,
        "primaryKey": true
    }
}, AbstractPO.DefaultEntity(sequelize, DataTypes), {
    "status": {
        "type": DataTypes.STRING(20),
        "comment": "状态 -- 状态: 数据行是否可用的状态，一般为APPLY=申请，ENABLE=有效，DISABLE=无效。",
        "field": "status"
    },
    "note": {
        "type": DataTypes.TEXT,
        "comment": "备注 -- 备注: 数据行的一般描述",
        "field": "note"
    },
    "ctrl_status": {
        "type": DataTypes.JSONB,
        "comment": "控制状态 -- 控制状态: 用于灵活控制业务",
        "field": "ctrl_status"
    },
    "user_name": {
        "type": DataTypes.STRING(100),
        "comment": "姓名",
        "field": "user_name"
    },
    "age": {
        "type": DataTypes.STRING(20),
        "comment": "年龄",
        "field": "age"
    },
    "sex": {
        "type": DataTypes.STRING(20),
        "comment": "性别",
        "field": "sex"
    },
    "nation": {
        "type": DataTypes.STRING(40),
        "comment": "民族",
        "field": "nation"
    },
    "address": {
        "type": DataTypes.STRING(100),
        "comment": "地址",
        "field": "address"
    },
    "phone": {
        "type": DataTypes.STRING(40),
        "comment": "手机号码",
        "field": "phone"
    },
    "email": {
        "type": DataTypes.STRING(40),
        "comment": "邮箱",
        "field": "email"
    },
    "avatar": {
        "type": DataTypes.STRING(100),
        "comment": "头像",
        "field": "avatar"
    },
    "id_number": {
        "type": DataTypes.STRING(40),
        "comment": "身份证号",
        "field": "id_number"
    },
    "dep_id": {
        "type": DataTypes.STRING(100),
        "comment": "部门",
        "field": "dep_id"
    },
    "role": {
        "type": DataTypes.STRING(20),
        "comment": "角色",
        "field": "role"
    },
    "degree": {
        "type": DataTypes.STRING(40),
        "comment": "学历",
        "field": "degree"
    },
    "join_time": {
        "type": DataTypes.DATE,
        "comment": "入党时间",
        "field": "join_time"
    },
    "face_info": {
        "type": DataTypes.JSONB,
        "comment": "人脸信息",
        "field": "face_info"
    },
    "login_code": {
        "type": DataTypes.STRING(40),
        "comment": "登录账号",
        "field": "login_code"
    },
    "login_password": {
        "type": DataTypes.STRING(40),
        "comment": "登录密码",
        "field": "login_password"
    }
});

  return sequelize.define('tb_user', entity, option);
};
