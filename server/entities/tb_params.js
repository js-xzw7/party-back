"use strict";
/**
 * 01.参数表
 */
module.exports = function(sequelize, DataTypes) {
  const
    AbstractPO = require('kml-po-abstract'),
    _ = require('lodash');

  let option = AbstractPO.BaseOption({
    tableName: 'tb_params'
  });

  let entity = _.merge({
    "param_id": {
        "type": DataTypes.STRING(40),
        "comment": "参数id",
        "field": "param_id",
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
    "name": {
        "type": DataTypes.STRING(100),
        "comment": "参数名",
        "field": "name"
    },
    "type": {
        "type": DataTypes.INTEGER,
        "comment": "所属类型",
        "field": "type"
    },
    "style": {
        "type": DataTypes.STRING(100),
        "comment": "参数组类型",
        "field": "style"
    },
    "spell": {
        "type": DataTypes.STRING(100),
        "comment": "名称拼音",
        "field": "spell"
    },
    "dep_id": {
        "type": DataTypes.STRING(40),
        "comment": "所属部门",
        "field": "dep_id"
    }
});

  return sequelize.define('tb_params', entity, option);
};
