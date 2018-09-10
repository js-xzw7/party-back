/**
 * 微信小程序接口传递业务身份
 * Created by lintry on 2018/4/25.
 */

module.exports = function () {
    return function (req, res, next) {
        const ENUM = global.config.ENUM

        let plat_id = req.header(ENUM.SHOP.we_plat_id_key) || ENUM.SHOP.plat_id; // 当前小程序的商户
        req.app_identity = {plat_id};

        next();
    }
}