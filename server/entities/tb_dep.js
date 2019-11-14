"use strict";
/**
 * 03.部门表
 */
module.exports = function(sequelize, DataTypes) {
  const
    AbstractPO = require('kml-po-abstract'),
    _ = require('lodash');

  let option = AbstractPO.BaseOption({
    tableName: 'tb_dep'
  });

  let entity = _.merge({
    "dep_id": {
        "type": DataTypes.STRING(40),
        "comment": "部门id",
        "field": "dep_id",
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
    "dep_name": {
        "type": DataTypes.STRING(100),
        "comment": "部门名称",
        "field": "dep_name"
    }
});

  return sequelize.define('tb_dep', entity, option);
};
