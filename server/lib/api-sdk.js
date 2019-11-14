/**
 * 调用api服务的客户端
 * Created by lintry on 2016/11/8.
 */
"use strict";

const _ = require('lodash'),
  Promise = require('bluebird'),
  axios = require('axios');

/**
 * 根据http请求方法生成执行函数
 * @param method
 * @returns {Function}
 */
function verbFunc(method) {
  method = method || 'get';

  return function (url, data, options) {
    options = options || {};
    var config = _.extend({}, options, {
      url: url,
      method: method
    });

    if (/post|put|patch/i.test(method)) {
      config.data = data; //通过form数据存放
    } else {
      config.params = data; //存放在querystring
    }

    return new Promise(function (resolve, reject) {
      if (!url) {
        return reject('target url can not be null!');
      }
      axios.request(config)
        .then(function (res) {
          var result = res.data;
          if (res.status != '200') { //判断接口返回状态
            result.status  = res.status;
            return reject(result);
          }
          resolve(result);
        })
        .catch(function (e) {
          var res = e.response || {};
          reject({message: e.message, status: res.status, statusText: res.statusText, data: res.data});
        });
    });
  };
}

module.exports = {
  get: verbFunc('get'),
  head: verbFunc('head'),
  post: verbFunc('post'),
  put: verbFunc('put'),
  patch: verbFunc('patch'),
  'delete': verbFunc('delete')
};
