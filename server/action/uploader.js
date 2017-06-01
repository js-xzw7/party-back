/**
 * 处理路由的文件上传action
 */
/* global global */
/* global process */
"use strict";
function Uploader(routerPath) {
    routerPath = routerPath || '';

    const _ = require('lodash'),
        path = require('path'),
        po = global.po,
        fs = require('fs-extra'),
        Formidable = require('formidable'),
        gm = require('gm'),
        express = require('express'),
        router = express.Router(),
        UPLOAD_OPTION = global.config.upload,
        logger = global.loggers.upload,
        db = global.sequelize,
        crypto_utils = require('kml-crypto-utils'),
        Result = require('kml-express-stage-lib').Result;

    const
        DEST_DIR = path.resolve(UPLOAD_OPTION.root, routerPath),
        IMAGE_URL = (UPLOAD_OPTION.base_url || '/') + routerPath + '/',
        THUMB_WIDTH = 240;

    //定义上传文件的访问路径
    router.use(`/${routerPath}`, express.static(DEST_DIR));

    const FileInfo = po.import(db, 'file_info');

    const upload_root = path.resolve(UPLOAD_OPTION.root);
    fs.ensureDirSync(upload_root);
    fs.ensureDirSync(DEST_DIR);

    function fn_request(req, res, next) {
        /**
         * 创建缩略图
         * @param gm_object gm对象,可以在此前对图片做好预处理
         * @param file_orig 原始处理图片文件
         * @param uploaded_file 上传文件结构
         */
        function create_thumb(gm_object, file_orig, uploaded_file) {
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
                            fs.rename(file_orig.path, dest_orig);
                        });
                    }
                })
            });
        };

        // parse a file upload
        let form = new Formidable.IncomingForm();
        form.encoding = 'utf-8';
        form.uploadDir = DEST_DIR;
        form.hash = 'md5';
        form.keepExtensions = true;
        form.maxFieldsSize = 10 * (1 << 20); //max file size is 10M
        // 处理上传文件
        form.parse(req, function (err, fields, files) {
            let uploaded_files = [];
            if (files) {
                for (let key in files) {
                    if (files.hasOwnProperty(key)) {
                        let file = files[key];
                        if (file && file.size) {
                            let file_ext = file.type.replace('image/', ''), orig_ext = file_ext;
                            switch (file.type) {
                                case 'image/gif':
                                    file_ext = 'gif';
                                    break;
                                case 'image/jpeg':
                                    file_ext = 'jpg';
                                    break;
                                case 'image/png':
                                    file_ext = 'png';
                                    break;
                                default:
                                    res.json(new Result(Result.ERROR, '上传文件格式错误'));
                                    return null;
                            }

                            let regexp = /\.([\w]{3,})$/,
                                salt = (~~(Math.random() * 1000000000)).toString(36),
                                file_id = crypto_utils.UUID(),
                                file_name = `${file_id}_${salt}.${file_ext}`,
                                orig_file_name = `${file_id}_${salt}_o.${orig_ext}`,
                                dest_file = path.resolve(DEST_DIR, file_name),
                                dest_orig = path.resolve(DEST_DIR, orig_file_name),
                                dest_thumb = dest_file.replace(regexp, '_s.$1'),
                                uploaded_file = {
                                    id: file_id,
                                    content_type: file.type,
                                    name: file.name,
                                    size: file.size,
                                    file_path: dest_file,
                                    thumb_path: dest_thumb,
                                    orig_path: dest_orig,
                                    hash: file.hash,
                                    url: IMAGE_URL + file_name,
                                    params: fields,
                                    key: key,
                                    thumbnail: IMAGE_URL + file_name.replace(regexp, '_s.$1')
                                };

                            switch (file.type) {
                                case 'image/gif':
                                    create_thumb(gm(file.path + '[0]'), file, uploaded_file);
                                    break;
                                case 'image/jpeg':
                                case 'image/png':
                                    create_thumb(gm(file.path).autoOrient(), file, uploaded_file);
                                    break;
                                default:
                                    fs.unlinkSync(file.path);
                                    logger.error(`${file.name} is not jpg/png/gif but ${file.type}`);
                                    break;
                            }

                            uploaded_files.push(uploaded_file);
                        }
                    }
                }
            }

            //处理结果
            if (uploaded_files.length) {
                FileInfo.bulkCreate(uploaded_files)
                    .then(function (files) {
                        logger.debug('file saved into db', files);
                    })
            }

            //输出结果
            res.json(new Result(Result.OK, undefined, undefined, {files: uploaded_files}));
            next && next();
            return null;
        });
    };

    let upload_regexp = /(.*)\/upload(\.do)?$/;
    router.post(upload_regexp, fn_request);
    router.get(upload_regexp, function (req, res, next) {
        res.writeHead(200, {'content-type': 'text/html'});
        res.end('\
  <article>\
  <form action="" enctype="multipart/form-data" method="post">\
    <input type="text" name="title" placeholder="图片简介" style="width: 100%;"><br>\
    <input type="file" name="upload" multiple="multiple" style="width: 50%;">\
    <input type="submit" value="上传" style="width: 30%;">\
  </form>\
  </article>'
        );

        next && next();
    });

    return router;
}

module.exports = Uploader;