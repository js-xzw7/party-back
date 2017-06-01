/**
 * Created by lintry on 2017/4/27.
 */
"use strict";
/**
 * 定义实体类的关联关系
 * @return {boolean}
 */
module.exports = function (sequelize) {
    const logger = global.loggers.system;
    const AbstractPO = require('kml-po-abstract');

    const po = new AbstractPO('../entities', __dirname);

    const print_entities = function (po) {
        po.forEach((entity) => {
            logger.info(`loading [${entity}]`);
        });
    };

    //加载所有的实体
    print_entities(po.import(sequelize));

    /**
     * 创建关联关系
     */
    po.buildAssociations = function () {
        //定义实体间的关联关系
    };

    return po;
};
