/**
 * Sequelize初始化
 */
"use strict";
global.sequelize = global.sequelize = function () {
    const Sequelize = require('sequelize'),
        path = require('path'),
        logger = require('./log4js-init').system;

    const config = require('./config'), config_sequelize = config.sequelize;

    //custom method defined here
    config_sequelize.options.define = {
        classMethods: {
            /**
             * 根据主键查找并保存
             * @param entityRequest
             * @param options
             * @returns {Promise.<T>}
             */
            saveById: function (entityRequest, options) {
                let Entity = this;
                entityRequest = entityRequest || {};

                //根据主键查找是否存在
                let primaryKey = Entity.primaryKeyAttribute;
                return Entity.findByPk(entityRequest[primaryKey])
                    .then(function (entity) {
                        if (entity) { //to update
                            return entity.update(entityRequest, options);
                        } else { //to create
                            return Entity.create(entityRequest, options);
                        }
                    })
                    .catch(function (e) {
                        logger.error('Class saveById', e);
                        throw e;
                    });
            }
        },
        instanceMethods: {
            /**
             * 根据主键查找并保存
             * @param options
             * @returns {Promise.<T>}
             */
            saveById: function (options) {
                let entityRequest = this.toJSON();
                let Entity = this.Model;
                if (!Entity) {
                    throw new Error('wrong method caller');
                }
                //根据主键查找是否存在
                let primaryKey = Entity.primaryKeyAttribute;
                return Entity.findByPk(entityRequest[primaryKey])
                    .then(function (entity) {
                        if (entity) { //to update
                            return entity.update(entityRequest, options);
                        } else { //to create
                            return Entity.create(entityRequest, options);
                        }
                    })
                    .catch(function (e) {
                        logger.error('saveById', e);
                        throw e;
                    });
            }
        }
    };
    const sequelize = new Sequelize(config_sequelize.database, config_sequelize.username, config_sequelize.password, config_sequelize.options);

    //加载表
    const entitis_init = require('./entities-init');
    global.po = entitis_init(sequelize);

    if (config_sequelize.syncDB) {
        //同步表结构db
        logger.info('sync db');
        sequelize.sync().then(function () {
            logger.info('db init finished!');
        });
    } else {
        logger.info('db init finished!');
    }

    return sequelize;
}();

module.exports = global.sequelize;
