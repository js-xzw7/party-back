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
            logger.info(`loading [${entity.name}]`);
        });
    };

    //加载所有的实体
    print_entities(po.import(sequelize));


    // todo 定义实体间的弱关联关系 {constraints: false}，或者在include时定义{association}

    return po;
};
