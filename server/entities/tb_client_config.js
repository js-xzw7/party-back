"use strict";
/**
 * 01.客户端配置
 */
module.exports = function(sequelize, DataTypes) {
  const
    AbstractPO = require('kml-po-abstract'),
    _ = require('lodash');

  let option = AbstractPO.BaseOption({
    tableName: 'tb_client_config'
  });

  let entity = _.merge({
    "cfg_id": {
        "type": DataTypes.STRING(40),
        "comment": "id",
        "field": "cfg_id",
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
    "dep_id": {
        "type": DataTypes.STRING(40),
        "comment": "所属部门",
        "field": "dep_id"
    },
    "ip": {
        "type": DataTypes.STRING(100),
        "comment": "客户端ip",
        "field": "ip"
    },
    "type": {
        "type": DataTypes.INTEGER,
        "comment": "菜单类型",
        "field": "type"
    }
});

  return sequelize.define('tb_client_config', entity, option);
};
