'use strict'

/**
 * @module b/config
 * @author 王维琦
 * @description
 *  配置操作
 */
module.exports = function (dbo) {
    //api公共模块
    const _ = require('lodash'),
        po = global.po,
        Result = require('kml-express-stage-lib').Result,
        logger = global.loggers.system,
        config = global.config,
        ENUM = config.ENUM,
        crypto_utils = require('kml-crypto-utils'),
        tools = new (require('../../lib/tools'))/* ,
        cmc = new (require('../m/cmc_action')) */;

    /**
     * 01.配置客户端显示模块
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.showMenuPost = async function (req) {
        //b/config/showMenu  --post
        try {

            //获取参数
            let params = req.body,
                { ip, type, img_url } = params,
                msg = ``;

            //加载模型
            let [TBCfig, TBParams] = po.import(dbo, ['tb_client_config', 'tb_params']);

            let config_info = await TBCfig.findOne({ where: { ip } });

            if (config_info) {
                //修改配置
                //配置状态根据菜单状态走
                let param_info = await TBParams.findOne({ where: { type } });
                if (!param_info) {
                    return Result.Error('type参数无效！');
                }
                params.status = param_info.status;
                config_info = _.merge(config_info, params);
                await config_info.save();

                msg += `${ip}-更新成功！`;
            } else {
                //添加配置
                let cfg_id = crypto_utils.UUID();
                await TBCfig.create(_.merge({
                    cfg_id, ip, type, img_url,
                    status: ENUM.TYPE.ENABLE
                }));

                msg += `${ip}-配置成功！`;
            }

            return Result.Ok(msg);
        } catch (error) {
            logger.error('失败！', error);
            return Result.Error('失败', error.message);
        }
    }

    /**
     * 02.查看全部已配置客户端（现改为单个）
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.findAllCfigGet = async function (req) {
        //b/config/findAllCfig  --get
        try {
            let ws_ip = await tools.getIp();
            //查询当前请求ip的客户端配置
            let sql = `
                SELECT C.cfg_id,C.status,C.TYPE,C.ip,P.note,M.udp_ip,
	                ( CASE WHEN M.udp_mac NOTNULL THEN M.udp_mac ELSE '暂无配置' END ) mac
                FROM tb_client_config C 
                    INNER JOIN tb_address_map M 
                    ON C.ip = M.ws_ip
                    LEFT JOIN tb_params P
                    ON C.type = P.type 
                    where m.ws_ip = :ws_ip
                ORDER BY C.optr_date DESC`

            let cfig_list = await dbo.query(sql, {
                replacements: {ws_ip},
                type: dbo.QueryTypes.SELECT,
            })

            return Result.Ok('成功！', cfig_list);
        } catch (error) {
            logger.error('失败！', error);
            return Result.Error('失败', error.message);
        }
    }

    /**
     * 03.根据ip查询客户端配置
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.findByIpCfigGet = async function (req) {
        //b/config/findByIpCfig  --get
        try {

            //获取参数
            let params = req.query,
                { ip } = params;

            //加载模型
            let TBCfig = po.import(dbo, 'tb_client_config');

            let cfig_info = await TBCfig.findOne({
                attributes: {
                    exclude: ENUM.DEFAULT_PARAMS_ARRAY
                },
                where: { ip: ip }
            })

            return Result.Ok('成功！', cfig_info);
        } catch (error) {
            logger.error('失败！', error);
            return Result.Error('失败', error.message);
        }
    }

    /**
     * 04.删除客户端配置(暂未使用)
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.deleteCfigPost = async function (req) {
        //b/config/deleteCfig  --post
        try {

            //获取参数
            let params = req.body,
                { ip } = params;

            //加载模型
            let TBCfig = po.import(dbo, 'tb_client_config');

            await TBCfig.destroy({ where: { ip } });

            return Result.Ok('成功！', ip);
        } catch (error) {
            logger.error('失败！', error);
            return Result.Error('失败', error.message);
        }
    }

    /**
     * 05.配置映射
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.updateMapPost = async function (req) {
        //b/config/update  --post
        try {

            //获取参数
            let params = req.body,
                { udp_mac, udp_ip, ws_ip } = params;

                //设置默认语音识别模块ip
                udp_ip = udp_ip || ENUM.VOICE_IP;

            if (!udp_mac) {
                return Result.Error('缺少参数udp_mac!');
            };

            //加载模型
            let TBMap = po.import(dbo, 'tb_address_map');

            //查询udp_mac是否已保存
            let map_info = await TBMap.findOne({ where: { udp_mac } });

            if (!map_info) {
                //删除所有映射，因部署为cs架构，所以要确保只存在一条映射记录
                await TBMap.destroy({where: {}});
                //新增映射
                let sql = `
                    insert into tb_address_map (map_id,create_date,optr_date,status,udp_mac,udp_ip) values (:map_id,now(),now(),:status,:udp_mac,:udp_ip)
                `
                await dbo.query(sql,{
                    replacements: {
                        map_id:udp_mac,
                        status:ENUM.TYPE.APPLY,
                        udp_mac:udp_mac,
                        udp_ip:udp_ip
                    },
                    type: dbo.QueryTypes.SELECT,
                });
            } else {
                //修改映射
                if (!udp_ip || !ws_ip) {
                    return Result.Error('请完善参数，更新失败！');
                }
                
                //清除ip原映射记录
                /* await TBMap.update({ws_ip:null},{where:{ws_ip}}) */

                //更新映射
                map_info = _.merge(map_info,{udp_ip:udp_ip,ws_ip:ws_ip,status:ENUM.TYPE.ENABLE});
                await map_info.save();
            }

            return Result.Ok('成功！');
        } catch (error) {
            logger.error('失败！', error);
            return Result.Error('失败', error.message);
        }
    }

    /**
     * 06.查询全部映射
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.findAllMapGet = async function (req) {
        //b/config/findAllMap  --get
        try {

            //加载模型
            let TBMap = po.import(dbo, 'tb_address_map');

            let map_list = await TBMap.findAll({
                attributes: [
                    "map_id", "status", "note", "ctrl_status", "dep_id",
                     "udp_mac", "udp_ip", "udp_port", "ws_mac", "ws_ip", "ws_port"
                ]}, {
                where: {
                    status: {
                        [dbo.Op.not]: ENUM.TYPE.DISABLE
                    }
                }
            });

            return Result.Ok('成功！', map_list);
        } catch (error) {
            logger.error('失败！', error);
            return Result.Error('失败', error.message);
        }
    }

    /**
     * 06.根据ip地址查询映射
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.findByIpMapGet = async function (req) {
        //b/config/ffindByIpMap  --get
        try {

            //获取参数
            let params = req.query,
                { type, ip } = params;

            //判断根据哪种ip类型查询映射
            let whereObj = type === 'ws' ? { ws_ip: ip, status: ENUM.TYPE.ENABLE } : { udp_ip: ip, status: ENUM.TYPE.ENABLE }
            //加载模型
            let TBMap = po.import(dbo, 'tb_address_map');

            let map_info = await TBMap.findOne({
                attributes: ["map_id", "status", "udp_mac", "udp_ip", "udp_port", "ws_mac", "ws_ip", "ws_port"],
                where: whereObj
            });

            return Result.Ok('成功！', map_info);
        } catch (error) {
            logger.error('失败！', error);
            return Result.Error('失败', error.message);
        }
    }

    /**
     * 07.根据mac地址查询映射
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.findByMacMapGet = async function (req) {
        //b/config/findByMacMap  --get
        try {

            //获取参数
            let params = req.query,
                { udp_mac } = params;

            //加载模型
            let TBMap = po.import(dbo, 'tb_address_map');

            let map_info = await TBMap.findOne({
                attributes:[
                    "map_id", "status", "note", "ctrl_status", "dep_id", "udp_mac", 
                    "udp_ip", "udp_port", "ws_mac", "ws_ip", "ws_port"
                ],
                where: { udp_mac }
            });

            return Result.Ok('成功！', map_info);
        } catch (error) {
            logger.error('失败！', error);
            return Result.Error('失败', error.message);
        }
    }

    /**
     * 08.查询所有mac地址
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.findAllMacGet = async function (req) {
        //b/config/findAllMac  --get
        try {

            //加载模型
            let TBMap = po.import(dbo, 'tb_address_map');

            let mac_list = await TBMap.findAll({
                attributes: ['map_id', 'status', 'udp_mac'],
                where: {
                    status: {
                        [dbo.Op.not]: ENUM.TYPE.DISABLE
                    }
                },
                order: [['status', 'asc']]
            })

            return Result.Ok('成功！', mac_list);
        } catch (error) {
            logger.error('失败！', error);
            return Result.Error('失败', error.message);
        }
    }

    /**
     * 09.客户端初始化
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.clientInitPost = async function (req) {
        //b/config/clientInit  --Post
        let myRes = {};
        try {
            let params = req.body,
                { udp_mac, udp_ip, menu, ws_ip } = params;

            //设置默认语音识别模块ip
            udp_ip = udp_ip || ENUM.VOICE_IP;

            //设置默认客户端ip
            ws_ip = ws_ip || await tools.getIp();

            if (!udp_mac || !udp_ip || !menu) {
                return Result.Error('请完善参数！');
            };

            let update_sql = `
                update tb_address_map set udp_ip = :udp_ip,
                    ws_ip = :ws_ip,status = 'ENABLE' 
                where udp_mac = :udp_mac
            `
            await dbo.query(update_sql,{
                replacements: {
                    udp_ip,ws_ip,udp_mac
                },
                type: dbo.QueryTypes.SELECT,
            });
            
            //更新客户端显示菜单
            req.body.ip = ws_ip;
            req.body.type = menu;
            let show_menu = await this.showMenuPost(req);

            if (show_menu && show_menu.ret !== 'OK') {
                return show_menu
            } 
           
           /*  //广播通知下位机修改ip
            let buf = await cmc.initReply(udp_mac, udp_ip);
            //获得广播地址
            let broadcast_ip = await tools.getBroadcast();
            global.udpServer.send(buf, ENUM.DEFAULT_PORT.BRC_PROT, broadcast_ip) */

            return Result.Ok('成功！');
        } catch (error) {
            logger.error('失败！', error);
            return Result.Error('失败', error.message);
        }
    }

    /**
     * 10.获取子网地址（弃用）
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.getSubnetGet = async function (req) {
        //b/config/getSubnet  --get
        try {

            let old_subnet = await tools.getBroadcast();

            let index = old_subnet.lastIndexOf('.')

            let subnet = old_subnet.substring(0, index);
            return Result.Ok('成功！', { subnet });
        } catch (error) {
            logger.error('失败！', error);
            return Result.Error('失败', error.message);
        }
    }

    /**
     * 11.查询客户端配置
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.findClientConfigGet = async function (req) {
        //b/config/findClientConfig  --get
        try {
            //获取客户端ip
            let ip = req.clientIp;

             //加载模型
             let [TBMap,TBCfig] = po.import(dbo, ['tb_address_map','tb_client_config']);
 
             //查询映射关系
             let map_info = await TBMap.findOne({
                 attributes:['udp_mac','udp_ip'],
                 where:{ws_ip:ip,status:ENUM.TYPE.ENABLE}
             })
 
             //查询客户端显示菜单
             let menu_info = await TBCfig.findOne({
                 attributes:['type','img_url'],
                 where:{ip:ip,status:ENUM.TYPE.ENABLE}
             })

            let data = map_info && menu_info ? _.merge(map_info, menu_info) : {};
            return Result.Ok('成功！', data);
        } catch (error) {
            logger.error('失败！', error);
            return Result.Error('失败', error.message);
        }
    }

    /**
     * 12.客户端配置页面所需参数
     *
     * @param {Object} req - 请求参数
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.findClientparamsGet = async function (req) {
        //b/config/findClientparams  --get
        try {
            //获取客户端ip
            let ip = req.clientIp;

            //加载模型
            let TBParams = po.import(dbo, 'tb_params');

            //查询所有mac地址
            let mac_list = await this.findAllMacGet();

            //查询所有的主题
            let theme_list = await TBParams.findAll({
                attributes: ['param_id', 'status','note', 'name', 'type', 'style', 'spell'],
                where: {style: 'C',status:ENUM.TYPE.ENABLE},
                order: [['type', 'asc']]
            });
            
            //获取广播地址
            let broadcast = await tools.getBroadcast()

            //查看客户端配置
            let clientConfig = await this.findClientConfigGet(req)

            return Result.Ok('成功！',{mac_list:mac_list.content,theme_list,broadcast,clientConfig:clientConfig.content})
        } catch (error) {
            logger.error('失败！', error);
            return Result.Error('失败', error.message);
        }
    }
}