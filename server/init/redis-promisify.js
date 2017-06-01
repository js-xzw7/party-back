/**
 * Created by lintry on 2016/12/21.
 */
"use strict";

const Promise = require('bluebird'),
  redis = require('redis'),
  config = require('./config'),
  cfg_redis = config.redis,
  client = redis.createClient({
    host: cfg_redis.host,
    port: cfg_redis.port,
    password: cfg_redis.pass,
    db: cfg_redis.db,
    prefix: config.system.project_name + ':',
    socket_keepalive: true,
    retry_unfulfilled_commands: true
  });
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

module.exports = client;