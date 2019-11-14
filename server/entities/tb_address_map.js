"use strict";
/**
 * 01.address映射表
 */
module.exports = function(sequelize, DataTypes) {
  const
    AbstractPO = require('kml-po-abstract'),
    _ = require('lodash');

  let option = AbstractPO.BaseOption({
    tableName: 'tb_address_map'
  });

  let entity = _.merge({
    "map_id": {
        "type": DataTypes.STRING(40),
        "comment": "id",
        "field": "map_id",
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
    "udp_ip": {
        "type": DataTypes.STRING(100),
        "comment": "udp_ip",
        "field": "udp_ip"
    },
    "udp_port": {
        "type": DataTypes.STRING(100),
        "comment": "udp_port",
        "field": "udp_port"
    },
    "ws_ip": {
        "type": DataTypes.STRING(100),
        "comment": "ws_ip",
        "field": "ws_ip"
    },
    "ws_port": {
        "type": DataTypes.STRING(100),
        "comment": "ws_port",
        "field": "ws_port"
    }
});

  return sequelize.define('tb_address_map', entity, option);
};
