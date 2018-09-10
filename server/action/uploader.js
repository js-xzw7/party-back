/**
 * 处理路由的文件上传action
 */
/* global global */
/* global process */
"use strict";

/**
 * 上传、下载文件
 * @param routerPath
 * @return {*}
 * @constructor
 */
function Uploader (routerPath) {
    routerPath = routerPath || '';

    const _ = require('lodash'),
        path = require('path'),
        fs = require('fs-extra'),
        Formidable = require('formidable'),
        gm = require('gm'),
        express = require('express'),
        mime = require('mime'),
        router = express.Router(),
        UPLOAD_OPTION = global.config.upload,
        moment = require('moment'),
        logger = global.loggers.upload,
        db = global.sequelize,
        po = global.po,
        crypto_utils = require('kml-crypto-utils'),
        Result = require('kml-express-stage-lib').Result;

    const
        DEST_DIR = path.resolve(UPLOAD_OPTION.root, routerPath),
        THUMB_WIDTH = 240,
        Default_Plat = 'saas';

    //自定义mime类型
    mime.define({'image/jpg': ['jpg']}, true); //修复微信上传的错误
    mime.define({'image/jpeg': ['jpg', 'jpeg', 'jpe']}, true); //调整常用的jpg后缀
    mime.define({'video/quicktime': ['mov', 'qt']}, true); //调整常用的quicktime视频后缀
    mime.define({'audio/mpeg': ["mp3","mpga","mp2","mp2a","m2a","m3a"]}, true); //调整常用的mp3音频后缀

    //定义上传文件的访问路径
    router.use(`/${routerPath}`, express.static(DEST_DIR));

    const [File] = po.import(db, ['file']);

    //定义上传文件输出结构
    const FILE_ATTRIBUTES = ['file_id', 'plat_id', 'name', 'type', 'content_type', 'name', 'size', 'file_path', 'orig_path', 'hash_value', 'url', 'thumbnail'];
    const FILE_GET_ATTRIBUTES = ['file_id', 'plat_id', 'name', 'type', 'content_type', 'name', 'size', 'hash_value', 'url', 'thumbnail'];
    const upload_root = path.resolve(UPLOAD_OPTION.root);

    fs.ensureDirSync(upload_root);
    fs.ensureDirSync(DEST_DIR);

    function upload (req, res, next) {
        const IMAGE_URL = (UPLOAD_OPTION.base_url || req.original_uri.base) + routerPath + '/';

        /**
         * 创建缩略图
         * @param gm_object gm对象,可以在此前对图片做好预处理
         * @param file_orig 原始处理图片文件
         * @param uploaded_file 上传文件结构
         */
        function create_thumb (gm_object, file_orig, uploaded_file) {
            let dest_thumb = uploaded_file.thumb_path, //缩略图
                dest_file = uploaded_file.file_path, //优化后的图片
                dest_orig = uploaded_file.orig_path; //原始图片
            gm_object.size(function (err, size) {
                if (err) {
                    logger.error(err, uploaded_file);
                    return;
                }
                this.write(dest_file, function (err) {
                    if (err) {
                        logger.error(err, uploaded_file);
                    } else {
                        let thumb_w = size.width > size.height ? size.height : size.width; //计算最小边作为缩略图
                        thumb_w = thumb_w > THUMB_WIDTH ? THUMB_WIDTH : thumb_w;
                        gm(dest_file).thumb(thumb_w, thumb_w, dest_thumb, 0, 'center', function (err) {
                            err ? logger.error(err, uploaded_file) : logger.debug('image saved to', uploaded_file);
                            //move file to dest_orig
                            fs.renameSync(file_orig.path, dest_orig);

                            //处理结果
                            File.create(uploaded_file)
                                .then(function (files) {
                                    logger.debug('file saved into db', files);
                                })

                            //输出结果
                            res.json(Result.Ok('success', {files: uploaded_file}));
                            return null;

                        });
                    }
                })
            });
        }

        /**
         * 非图片移动到目标文件夹
         * @param file_orig
         * @param uploaded_file
         * @return {null}
         */
        const rename = function (file_orig, uploaded_file) {
            let dest_orig = uploaded_file.file_path; //原始图片
            fs.renameSync(file_orig.path, dest_orig);
            //处理结果
            File.create(uploaded_file)
                .then(function (files) {
                    logger.debug('file saved into db', files);
                })
        };

        const upload_date = moment().format('YYYY/MM/DD');

        //根据年月日同步创建文件夹
        fs.ensureDirSync(path.resolve(DEST_DIR + '/' + upload_date));

        //上传文件
        let form = new Formidable.IncomingForm();
        form.encoding = 'utf-8';
        form.uploadDir = path.resolve(DEST_DIR + '/' + upload_date);
        form.hash = 'md5';
        form.multiples = true;
        form.keepExtensions = true;
        form.maxFieldsSize = 50 * (1 << 20); //max file size is 10M
        // 处理上传文件
        form.parse(req, function (err, fields, files) {
            let uploaded_files = [];
            if (files) {
                for (let key in files) {
                    if (files.hasOwnProperty(key)) {
                        let files_array = [].concat(files[key]);
                        files_array.forEach(file => {
                            if (file && file.size) {
                                if (file.type === 'image/jpg') {
                                    file.type = 'image/jpeg' //修复微信上传图片的错误
                                }
                                let file_ext = mime.getExtension(file.type);
                                if (!file_ext) {
                                    logger.error('上传文件格式错误', file.type);
                                    res.json(Result.Error('上传文件格式错误', file.type));
                                    return null;
                                }

                                const plat_id = req.session.active_user && req.session.active_user.plat_id
                                    ? req.session.active_user.plat_id : Default_Plat;

                                let regexp = /\.([\w]{3,})$/,
                                    salt = (~~(Math.random() * 1000000000)).toString(36),
                                    file_id = crypto_utils.UUID(),
                                    file_name = `${file_id}_${salt}.${file_ext}`,
                                    orig_file_name = `${file_id}_${salt}_o.${file_ext}`,
                                    dest_file = path.resolve(DEST_DIR + '/' + upload_date, file_name),
                                    dest_orig = path.resolve(DEST_DIR + '/' + upload_date, orig_file_name),
                                    dest_thumb = dest_file.replace(regexp, '_s.$1'),
                                    uploaded_file = {
                                        file_id: file_id,
                                        plat_id: plat_id,
                                        content_type: file.type,
                                        name: file.name,
                                        size: file.size,
                                        file_path: dest_file,
                                        thumb_path: dest_thumb,
                                        orig_path: dest_orig,
                                    hash_value: String(file.hash).toLowerCase(),
                                        url: IMAGE_URL + upload_date + '/' + file_name,
                                        params: fields,
                                        key: key,
                                        thumbnail: IMAGE_URL + upload_date + '/' + file_name.replace(regexp, '_s.$1')
                                    };

                                uploaded_files.push(uploaded_file);

                                switch (file.type) {
                                    case 'image/gif':
                                        create_thumb(gm(file.path + '[0]'), file, uploaded_file);
                                        break;
                                    case /^image\/(jpg|jpeg|png)$/.test(file.type) && file.type:
                                        create_thumb(gm(file.path).autoOrient(), file, uploaded_file);
                                        break;
                                    case /^application\/[\w-+.]+$/.test(file.type) && file.type:
                                        rename(file, uploaded_file);
                                        break;
                                    case /^video\/[\w-+.]+$/.test(file.type) && file.type:
                                        rename(file, uploaded_file);
                                        break;
                                    default:
                                        fs.unlinkSync(file.path);
                                        logger.error(`${file.name} is not jpg/png/gif but ${file.type}`);

                                        res.json(Result.Ok('success', {files: uploaded_files}));
                                        return null;
                                }
                            }
                        })
                    }
                }
            }

            //输出结果
            // todo 存储文件信息

            res.json(Result.Ok('success', {files: uploaded_files}));
            return null;

        })

    }


    function getFileByHash (hash) {
        //查询原有文件的hash值
        let hash_where = {hash_value: hash};
        return File.findOne({
            attributes: FILE_GET_ATTRIBUTES,
            where: hash_where,
            sort: [['create_date', 'desc']]
        })
    }

    function findByHash (req, res, next) {
        let hash = req.query.hash;
        //查询原有文件的hash值
        return getFileByHash(hash)
            .then(function (file_result) {
                return res.json(Result.Ok('success', file_result));
            })
    }

    let upload_regexp = /(.*)\/upload(\.do)?$/,
        hash_regexp = /(.*)\/hash(\.do)?$/;
    router.post(upload_regexp, upload);
    router.get(hash_regexp, findByHash);
    router.get(upload_regexp, function (req, res, next) {
        res.writeHead(200, {'content-type': 'text/html'});
        res.end(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
</head>
<body>
<article>
  <form action="" enctype="multipart/form-data" method="post">
    <input type="text" name="title" placeholder="图片简介" style="width: 100%;"><br>
    <input type="file" name="upload" multiple="multiple" style="width: 50%;">
    <input type="submit" value="上传" style="width: 30%;">
  </form>
</article>
</body>
</html>
`
        );
    });

    return router;
}

module.exports = Uploader;