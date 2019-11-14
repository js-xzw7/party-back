"use strict";

/**
 * @module b/test
 * @author 王维琦
 * @description
 *             测试爬虫
 */
module.exports = function ( dbo ) {

    //api公共模块
    const _ = require('lodash'),
        po = global.po,
        Result = require('kml-express-stage-lib').Result,
        logger = global.loggers.system,
        redisDb = require('../../init/redis-promisify'),
        superagent= require('superagent'),
        cheerio = require('cheerio');


    /**
     * 请求百度新闻
     *
     * @param {Object} req - 请求参数
     *
     * @param {Object} res - 返回参数
     * @param {string} res.ret - 返回状态 [OK、ERROR]
     * @param {string} res.msg - 返回消息
     * @param {object} res.content - 返回内容
     */
    this.hotNewGet = async (req) => {
        try {
            let session = req.session;
            let hotNews = [];
            let localNews = [];

            superagent.get('http://news.baidu.com/').end((err, res) => {
                if (err) {
                    // 如果访问失败或者出错，会这行这里
                    console.log(`热点新闻抓取失败 - ${err}`)
                } else {
                    // 访问成功，请求http://news.baidu.com/页面所返回的数据会包含在res
                    // 抓取热点新闻数据
                    hotNews = this.getHotNews(res)
                }
            });
                return Result.Ok('成功!');
        } catch (e) {
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    }


    //爬取百度新闻

    this.getHotNews = async (req) => {
        try {
            let session = req.session;
            let hotNews = [];
            // 访问成功，请求http://news.baidu.com/页面所返回的数据会包含在res.text中。

            /* 使用cheerio模块的cherrio.load()方法，将HTMLdocument作为参数传入函数
               以后就可以使用类似jQuery的$(selectior)的方式来获取页面元素
             */
            let $ = cheerio.load(res.text);

            // 找到目标数据所在的页面元素，获取数据
            $('div#pane-news ul li a').each((idx, ele) => {
                // cherrio中$('selector').each()用来遍历所有匹配到的DOM元素
                // 参数idx是当前遍历的元素的索引，ele就是当前便利的DOM元素
                let news = {
                    title: $(ele).text(),        // 获取新闻标题
                    href: $(ele).attr('href')    // 获取新闻网页链接
                };
                hotNews.push(news)              // 存入最终结果数组
            });
            console.log(hotNews)
            return hotNews
        } catch (e) {
            logger.error('失败!', e);
            return Result.Error('失败!', e.message);
        }
    }

};