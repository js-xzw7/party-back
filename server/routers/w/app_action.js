/**
 * 微信小程序服务
 * Created by lintry on 2018/1/18.
 */

module.exports = function (dbo) {
    const _ = require('lodash'),
        Promise = require('bluebird'),
        url_utils = require('url'),
        config = global.config,
        Result = require('kml-express-stage-lib').Result,
        logger = global.loggers.system,
        weapp_cfg = config.weapp,
        redis = require('../../init/redis-promisify'),
        crypto_utils = require('kml-crypto-utils')
    ;

    const WeAppAction = require('kml-weapp-lib').WeAppAction;
    const WxTokenStore = require('kml-weapp-mw').WxTokenStore;

    /**
     * 根据header获取对应wxapi，并初始化WeAppAction模块
     * @param req
     * @return {*}
     */
    function getWeAppAction (req) {
        let we_app = req.header('we-app')
        return new WeAppAction({
            redis,
            weapp_cfg: _.merge({}, weapp_cfg, {wx_app: we_app}), //使用客户端传入的wx_app，默认使用配置中定义
            logger
        })
    }

    /**
     * 根据header获取对应wxapi
     * @param req
     */
    function getWXApi (req) {
        let we_app = req.header('we-app')
        return require('kml-wxapi')(_.merge({}, weapp_cfg, {wx_app: we_app})) //使用客户端传入的wx_app，默认使用配置中定义
    }

    /**
     * 检查token是否有效
     * @param req
     * @param res
     * @return {*}
     */
    this.checkGet = function (req, res) {
        return getWeAppAction(req).check(req.app_token)
    };


    /**
     * 登录凭证code换取session_key
     * @param req
     * @param res
     */
    this.loginPost = async function (req, res) {
        return getWeAppAction(req).login(req.app_token, req.body);
    };


    /**
     * 分享
     * @param req
     * @param res
     * 每次分享都会记录下openid分享什么内容到哪个组，以分享票据作为唯一键值
     */
    this.sharePost = async function (req, res) {
        let {appid, session_key, openid, version} = req.app_token || {};
        let {shareId, shareData, encryptedData, iv} = req.body;
        shareId = shareId || 'unknown' + crypto_utils.UUID();
        let share_info = {
            shareId, openid, appid, version, shareData
        }

        //解析用户信息密文
        let content
        try {
            content = await getWeAppAction(req).decrypt(appid, session_key, encryptedData, iv)
        } catch (e) {
            return Result.Error('用户信息错误')
        }

        //获取群组id
        share_info.openGId = content.openGId;

        //存储分享内容
        let ticket_store = new WxTokenStore(shareId + '@' + share_info.openGId, {
            redis,
            prefix: weapp_cfg.share_prefix,
            ttl: weapp_cfg.share_ttl
        });
        return ticket_store.saveToken(share_info)
            .then(function (result) {
                return Result.Ok('ticket', {shareId})
            })
    }

    /**
     * 步数统计
     * @param req
     * @return {Promise<*>}
     */
    this.weRunDataPost = async function (req) {
        let {appid, session_key, openid, unionid, version} = req.app_token || {};
        let {shareId, shareData, encryptedData, iv} = req.body;

        //解析用户信息密文
        let content
        try {
            content = await getWeAppAction(req).decrypt(appid, session_key, encryptedData, iv)
        } catch (e) {
            return Result.Error('用户信息错误')
        }

        const [WxStep] = po.import(dbo, ['donate_wxstep']);

        let stepList = [];
        if (content && content.stepInfoList) {
            stepList = content.stepInfoList.map(info => {
                return {
                    id: crypto_utils.MD5(openid + info.timestamp),
                    openid, unionid,
                    run_date: info.timestamp,
                    step: info.step,
                    appid
                }
            })
        }

        // 存储数据库
        stepList.forEach(step => {
            WxStep.saveById(step)
        });

        //存储分享内容
        let rundata_store = new WxTokenStore(openid, {
            redis,
            prefix: weapp_cfg.werun_prefix,
            ttl: weapp_cfg.werun_ttl
        });
        return rundata_store.saveToken(content)
            .then(function (result) {
                return Result.Ok('success', content)
            })
    }

    /**
     * 解析分享信息
     * @param req
     * @param res
     * @return {Result}
     */
    this.getShareInfoPost = async function (req, res) {
        let {token, appid, session_key, openid, version, nickName, avatarUrl, gender, city, province, country, language} = req.app_token || {}, {shareId, encryptedData, iv} = req.body;

        if (!session_key) {
            res.status(401);
            return Result.Error('token not found');
        }
        // console.log('share info ===>', {token, encryptedData, iv, shareId, appid, session_key})

        //解析用户信息密文
        let content
        try {
            content = await getWeAppAction(req).decrypt(appid, session_key, encryptedData, iv)
        } catch (e) {
            return Result.Error('用户信息错误')
        }

        let openGId = content.openGId;

        if (!shareId) {
            return Result.Ok('shareInfo', {openGId})
        }

        //获取分享内容
        let ticket_store = new WxTokenStore(shareId + '@' + openGId, {
            redis,
            prefix: weapp_cfg.share_prefix,
            ttl: weapp_cfg.share_ttl
        });
        return ticket_store.getToken()
            .then(function (shared) {
                shared = shared || {};
                //获取围观者
                let lookers = shared.lookers;
                try {
                    lookers = JSON.parse(lookers)
                } catch (e) {
                    lookers = {}
                }
                //记录当前围观者
                lookers[openid] = {openid, nickName, avatarUrl, gender, city, province, country, language, version};
                shared.lookers = lookers;
                //保存分享内容
                return ticket_store.saveToken(shared)
                    .then(function (shared) {
                        logger.info('围观分享：', openid, '@', openGId)
                        let {lookers} = shared || {}
                        if (typeof lookers === 'string') {
                            lookers = JSON.parse(lookers)
                        }
                        return Result.Ok('shareInfo', {lookers, openGId});
                    })
            })
    }

    /**
     * 支付准备
     * @param req
     * @return {*}
     */
    this.prepayPost = function (req) {
        let {appid, session_key, openid, version} = req.app_token || {};
        if (!openid) {
            //没有openid需要先去授权
            return new Result(Result.ERROR, '请先登录');
        }

        const wxapi = getWXApi(req);
        const order_id = crypto_utils.UUID(), pay_receipt_id = crypto_utils.UUID(), pay_bill_id = crypto_utils.UUID(),
            product_id = '1234';
        let order_to_pay = {
            device_info: 'WeApp', //自定义参数，可以为终端设备号(门店号或收银设备ID)，PC网页或公众号内支付可以传"WEB"
            body: `赞赏`, //商品简单描述
            attach: JSON.stringify({order_id: order_id, id: pay_bill_id}), //附加数据，在查询API和支付通知中原样返回，可作为自定义参数使用
            out_trade_no: pay_receipt_id, //商户系统内部订单号，要求32个字符内、且在同一个商户号下唯一；重新发起一笔支付要使用原订单号，避免重复支付
            total_fee: 1, //订单总金额，单位为分
            spbill_create_ip: req.clientIp, //APP和网页支付提交用户端ip，Native支付填调用微信支付API的机器IP
            product_id: product_id, //trade_type=NATIVE时（即扫码支付），此参数必传。此参数为二维码中包含的商品ID，商户自行定义
            openid: openid, //trade_type=JSAPI时（即公众号支付），此参数必传
            trade_type: 'JSAPI' //取值如下：JSAPI--公众号支付、NATIVE--原生扫码支付、APP--app支付
        };

        return wxapi.getBrandWCPayRequestParams(order_to_pay)
            .then(function (result) {
                if (result.ret === 'OK') {
                    let content = result.content;
                    content.order_id = order_id;
                    content.pay_bill_id = pay_bill_id;
                }
                return result;
            });
    };
}