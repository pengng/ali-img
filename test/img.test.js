const assert = require('assert')
const fs = require('fs')

const config = require('./oss.config')
let { filePath } = config
const AliImg = require('../index')
const img = new AliImg(config)

describe('单元测试', function () {
    it('测试 img()', function () {
        return img(fs.createReadStream(filePath)).write(__dirname + '/test_input_readable.png')
    })
    it('测试 resize()', function () {
        return img(filePath).resize({ width: 200 }).write(__dirname + '/test_resize_200.png')
    })
    it('测试 circle()', function () {
        return img(filePath).circle(200).write(__dirname + '/test_circle_200.png')
    })
    it('测试 crop()', function () {
        return img(filePath).crop(0, 0, 200, 200).write(__dirname + '/test_crop_200x200.png')
    })
    it('测试 indexCrop()', function () {
        return img(filePath).indexCrop({y: 100, i: 3}).write(__dirname + '/test_indexcrop_100.png')
    })
    it('测试 roundedCorners()', function () {
        return img(filePath).roundedCorners(200).write(__dirname + '/test_roundedCorners_50.jpg')
    })
    it('测试 autoOrient()', function () {
        return img(filePath).autoOrient(1).write(__dirname + '/test_autoOrient_1.png')
    })
    it('测试 rotate()', function () {
        return img(filePath).rotate(90).write(__dirname + '/test_rotate_90.png')
    })
    it('测试 blur()', function () {
        return img(filePath).blur(20, 10).write(__dirname + '/test_blur_20_10.png')
    })
    it('测试 bright()', function () {
        return img(filePath).bright(20).write(__dirname + '/test_bright_20.png')
    })
    it('测试 contrast()', function () {
        return img(filePath).contrast(20).write(__dirname + '/test_contrast_20.png')
    })
    it('测试 sharpen()', function () {
        return img(filePath).sharpen(20).write(__dirname + '/test_sharpen_20.png')
    })
    it('测试 format()', function () {
        return img(filePath).format('jpg').write(__dirname + '/test_format.jpg')
    })
    it('测试 interlace()', function () {
        return img(filePath).interlace(1).format('jpg').write(__dirname + '/test_interlace_1.jpg')
    })
    it('测试 quality()', function () {
        return img(filePath).format('jpg').quality(30).write(__dirname + '/test_quality_30.jpg')
    })
    it('测试 absQual()', function () {
        return img(filePath).format('jpg').absQual(30).write(__dirname + '/test_absqual_30.jpg')
    })
    it('测试 watermark()', function () {
        return img(filePath).watermark('Hello world').write(__dirname + '/test_watermark_text.png')
    })
    it('测试 watermark()', function () {
        return img(filePath).watermark(img(filePath).resize({width: 200}).format('jpg')).format('jpg').write(__dirname + '/test_watermark_image.jpg')
    })
    it('测试 fill()', function () {
        return img(filePath).fill('ff0000').watermark('Hello world').write(__dirname + '/test_fill_ff0000.png')
    })
    it('测试 font()', function () {
        return img(filePath).font('fangzhengkaiti').watermark('你好').write(__dirname + '/test_font_fangzhengkaiti.png')
    })
    it('测试 fontSize()', function () {
        return img(filePath).fontSize(100).watermark('Hello world').write(__dirname + '/test_fontSize_100.png')
    })
    it('测试 textShadow()', function () {
        return img(filePath).textShadow(50).watermark('Hello world').write(__dirname + '/test_textShadow_50.png')
    })
    it('测试 textRotate()', function () {
        return img(filePath).textRotate(90).watermark('Hello world').write(__dirname + '/test_textRotate_90.png')
    })
    it('测试 save()', function () {
        return img(filePath).save('test_save.png')
    })
    it('测试 stream()', function (done) {
        let writable = fs.createWriteStream(__dirname + '/test_stream.png')
        writable.on('error', assert.ifError).on('finish', done)
        let readable = img(filePath).stream()
        readable.on('error', assert.ifError)
        readable.pipe(writable)
    })
    it('测试 toBuffer()', function () {
        return img(filePath).toBuffer()
    })
})