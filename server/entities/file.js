"use strict";
/**
 * 文件表
 */
module.exports = function (sequelize, DataTypes) {
  const
    AbstractPO = require('kml-po-abstract'),
    _ = require('lodash');

  let option = AbstractPO.BaseOption({
    tableName: 'tb_mf_file'
  });

  let entity = _.merge({
    "file_id": {
      "type": DataTypes.STRING(40),
      "comment": "文件id",
      "field": "file_id",
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
    "type": {
      "type": DataTypes.STRING(20),
      "comment": "文件分类",
      "field": "type"
    },
    "content_type": {
      "type": DataTypes.STRING(20),
      "comment": "文件类型",
      "field": "content_type"
    },
    "name": {
      "type": DataTypes.STRING(200),
      "comment": "文件名",
      "field": "name"
    },
    "hash_value": {
      "type": DataTypes.STRING(40),
      "comment": "hash值",
      "field": "hash_value"
    },
    "size": {
      "type": DataTypes.BIGINT,
      "comment": "文件大小",
      "field": "size"
    },
    "file_path": {
      "type": DataTypes.STRING(1024),
      "comment": "文件地址",
      "field": "file_path"
    },
    "thumb_path": {
      "type": DataTypes.STRING(1024),
      "comment": "缩略图文件地址",
      "field": "thumb_path"
    },
    "orig_path": {
      "type": DataTypes.STRING(1024),
      "comment": "文件原始地址",
      "field": "orig_path"
    },
    "url": {
      "type": DataTypes.STRING(1024),
      "comment": "云端查看地址",
      "field": "url"
    },
    "thumbnail": {
      "type": DataTypes.STRING(1024),
      "comment": "缩略图文件云端地址",
      "field": "thumbnail"
    },
    "upload_time": {
      "type": DataTypes.BIGINT,
      "comment": "上传时间",
      "field": "upload_time"
    }
  });

  return sequelize.define('file', entity, option);
};
