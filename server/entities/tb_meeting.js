"use strict";
/**
 * 04.文献
 */
module.exports = function(sequelize, DataTypes) {
  const
    AbstractPO = require('kml-po-abstract'),
    _ = require('lodash');

  let option = AbstractPO.BaseOption({
    tableName: 'tb_meeting'
  });

  let entity = _.merge({
    "meeting_id": {
        "type": DataTypes.STRING(40),
        "comment": "文献id",
        "field": "meeting_id",
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
    "type": {
        "type": DataTypes.INTEGER,
        "comment": "所属类型",
        "field": "type"
    },
    "dep_id": {
        "type": DataTypes.STRING(40),
        "comment": "所属部门",
        "field": "dep_id"
    },
    "title": {
        "type": DataTypes.STRING(100),
        "comment": "标题",
        "field": "title"
    },
    "content": {
        "type": DataTypes.TEXT,
        "comment": "内容",
        "field": "content"
    },
    "img_url": {
        "type": DataTypes.STRING(100),
        "comment": "图片",
        "field": "img_url"
    },
    "audio_url": {
        "type": DataTypes.STRING(100),
        "comment": "视频",
        "field": "audio_url"
    },
    "spell": {
        "type": DataTypes.STRING(100),
        "comment": "词条拼音",
        "field": "spell"
    },
    "sort": {
        "type": DataTypes.INTEGER,
        "comment": "排序",
        "field": "sort"
    }
});

  return sequelize.define('tb_meeting', entity, option);
};
