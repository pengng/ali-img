const querystring = require('querystring')
const { AliImgError } = require('./error')

// 文字水印的最大字节数
const MAX_BYTE_SIZE = 64
// 接口支持的图片输出格式
const TYPE_LIST = ['jpg', 'png', 'webp', 'bmp', 'gif', 'tiff']
// 接口支持的字体列表
const FONTS_LIST = ['wqy-zenhei', 'wqy-microhei', 'fangzhengshusong', 'fangzhengkaiti', 'fangzhengheiti', 'fangzhengfangsong', 'droidsansfallback']
// 字体列表中文
const FONTS_LIST_CN = ['文泉驿正黑', '文泉微米黑', '方正书宋', '方正楷体', '方正黑体', '方正仿宋', 'DroidSansFallback']
// 接口支持的原点位置
const ORIGIN_LIST = ['nw', 'north', 'ne', 'west', 'center', 'east', 'sw', 'south', 'se']
// 可选的缩放模式
const RESIZE_MODE = ['lfit', 'mfit', 'fill', 'pad', 'fixed']

class Img {
    constructor (path) {
        this.data = {path, objectName: this.getObjectName()}
        this.child = [this.data]

        // 保存图片的处理参数，键为操作命令，如：resize, crop等
        // 值为命令对应的参数，类型为数字、对象、对象数组，对象类型用于保存复杂的参数表，对象数组用于保存多个水印操作
        this.query = {}

        // 保存设置的文字样式，当使用文字水印时，会将配置复制到query对象
        this.style = {}
    }

    /**
     * 调整图片尺寸大小
     * @param {Object} opt 配置对象
     */
    resize (opt) {
        if (typeof opt !== 'object') {
            throw new AliImgError('resize() opt 应为对象')
        }

        let param = {}
        // 下限和上限
        let lowerLimit = 1
        let upperLimit = 4096
        // 校验宽度值
        if (typeof opt.width === 'number') {
            // 超过边界，取边界值
            param.w = Math.max(Math.min(opt.width, upperLimit), lowerLimit)
        } else if (opt.width) {
            throw new AliImgError('resize() width 应为数字类型')
        }

        // 校验高度值
        if (typeof opt.height === 'number') {
            // 超过边界，取边界值
            param.h = Math.max(Math.min(opt.height, upperLimit), lowerLimit)
        } else if (opt.height) {
            throw new AliImgError('resize() height 应为数字类型')
        }

        // 校验最长边
        if (typeof opt.longest === 'number') {
            // 超过边界，取边界值
            param.l = Math.max(Math.min(opt.longest, upperLimit), lowerLimit)
        } else if (opt.longest) {
            throw new AliImgError('resize() longest 应为数字类型')
        }

        // 校验最短边
        if (typeof opt.shortest === 'number') {
            // 超过边界，取边界值
            param.s = Math.max(Math.min(opt.shortest, upperLimit), lowerLimit)
        } else if (opt.shortest) {
            throw new AliImgError('resize() shortest 应为数字类型')
        }

        // 校验 limit
        if (typeof opt.limit === 'number') {
            // 接口只支持 0 和 1
            param.limit = Number(Boolean(opt.limit))
        } else if (opt.limit) {
            throw new AliImgError('resize() limit 应为数字类型')
        }

        // 校验 mode
        if (RESIZE_MODE.includes(opt.mode)) {
            param.m = opt.mode
        } else if (opt.mode) {
            throw new AliImgError('resize() mode 值不支持')
        }

        // 校验 color
        if (typeof opt.color === 'string') {
            param.color = opt.color
        } else if (opt.color) {
            throw new AliImgError('resize() color 应为字符串')
        }

        // 校验 percent
        if (typeof opt.percent === 'number') {
            let lowerLimit = 1
            let upperLimit = 1000
            // 超过边界，则取边界值
            param.p = Math.max(Math.min(opt.percent, upperLimit), lowerLimit)
        } else if (opt.percent) {
            throw new AliImgError('resize() percent 应为数字类型')
        }

        this.query.resize = param
        return this
    }

    /**
     * 图片内切圆。如果图片的最终格式是 png、webp、 bmp 等支持透明通道的图片，那么图片非圆形区域的地方将会以透明填充。如果图片的最终格式是 jpg，那么非圆形区域是以白色进行填充。推荐保存成 png 格式。如果指定半径大于原图最大内切圆的半径，则圆的大小仍然是图片的最大内切圆。
     * @param {number} radius 从图片取出的圆形区域的半径，半径不能超过原图的最小边的一半。如果超过，则圆的大小仍然是原圆的最大内切圆。
     */
    circle (radius) {
        if (typeof radius !== 'number') {
            throw new AliImgError('circle() radius 应为数字类型')
        }

        this.query.circle = { r: radius }
        return this
    }

    /**
     * 裁剪图片,指定裁剪的起始点以及裁剪的宽高来决定裁剪的区域。如果指定的起始横纵坐标大于原图，将会返回错误。
     * 如果从起点开始指定的宽度和高度超过了原图，将会直接裁剪到原图结尾。
     * @param {number} x 指定裁剪起点横坐标（默认左上角为原点）
     * @param {number} y 指定裁剪起点纵坐标（默认左上角为原点）
     * @param {number} w 指定裁剪宽度
     * @param {number} h 指定裁剪高度
     * @param {string} origin 设置裁剪的原点位置，由九宫格的格式，一共有九个地方可以设置，每个位置位于每个九宫格的左上角
     */
    crop (x, y, w, h, origin) {
        let argsMap = ['x', 'y', 'width', 'height']
        for (let i = 0; i < 4; i++) {
            if (typeof arguments[i] !== 'number') {
                throw new AliImgError(`crop() ${argsMap[i]} 应为数字类型`)
            }
        }

        // 校验 origin 值是否支持，origin 也可以是 undefined
        let originOpts = ORIGIN_LIST.concat(undefined)
        if (!originOpts.includes(origin)) {
            throw new AliImgError('crop() origin 不支持该值')
        }

        // 超过边界，则取边界值
        let lowerLimit = 0
        w = Math.max(w, lowerLimit)
        h = Math.max(h, lowerLimit)
        x = Math.max(x, lowerLimit)
        y = Math.max(y, lowerLimit)

        let param = { x, y, w, h }
        if (origin) {
            param.g = origin
        }
        this.query.crop = param
        return this
    }

    /**
     * 索引切割（横向或纵向）。将图片分成 x 轴和 y 轴，按指定长度 (length) 切割，指定索引 (index)，取出指定的区域。
     * @param {Object} opt 配置对象
     */
    indexCrop (opt) {
        if (typeof opt !== 'object') {
            throw new AliImgError('indexCrop() opt 应为配置对象')
        }
        if (typeof opt.i !== 'number') {
            throw new AliImgError('indexCrop() 索引应为数字类型')
        }
        if (typeof opt.x !== 'number' && typeof opt.y !== 'number') {
            throw new AliImgError('indexCrop() x 或 y 应为数字类型')
        }

        let newOpt = {...opt}
        // 索引值的下限
        let lowerLimit = 0
        // 索引值超过下限，则取下限值
        newOpt.i = Math.max(newOpt.i, lowerLimit)
        // 索引值应为整数
        newOpt.i = parseInt(newOpt.i)
        // 键 indexcrop 应该全小写
        this.query.indexcrop = newOpt
        return this
    }

    /**
     * 圆角矩形裁剪。
     * 如果图片的最终格式是 png、webp、bmp 等支持透明通道的图片，那么图片非圆形区域的地方将会以透明填充。
     * 如果图片的最终格式是 jpg， 那么非圆形区域是以白色进行填充 。推荐保存成 png 格式。
     * 如果指定半径大于原图最大内切圆的半径，则圆角的大小仍然是图片的最大内切圆。
     * @param {number} radius 圆角的半径。半径最大不能超过原图的最小边的一半。
     */
    roundedCorners (radius) {
        if (typeof radius !== 'number') {
            throw new AliImgError('roundedCorners() radius 应为数字类型')
        }
        
        let lowerLimit = 1
        let upperLimit = 4096
        // 超过下限，则取下限值
        radius = Math.max(Math.min(radius, upperLimit), lowerLimit)

        this.query['rounded-corners'] = { r: radius }
        return this
    }
    
    /**
     * 自适应方向。某些手机拍摄出来的照片可能带有旋转参数（存放在照片exif信息里面）。可以设置是否对这些图片进行旋转。
     * 默认是设置自适应方向。进行自适应方向旋转，要求原图的宽度和高度必须小于 4096。
     * 如果原图没有旋转参数，加上auto-orient参数不会对图有影响。
     * @param {number} value 0：表示按原图默认方向，不进行自动旋转。1：先进行图片进行旋转，然后再进行缩略
     */
    autoOrient (value) {
        if (typeof value !== 'number') {
            throw new AliImgError('autoOrient() value 应为数字类型')
        }

        // 接口只支持值为 0 和 1
        value = Number(Boolean(value))
        this.query['auto-orient'] = value
        return this
    }

    /**
     * 图像旋转。重复调用，在原值上面叠加效果
     * @param {number} angle 旋转的角度。正值为顺时针旋转，负值为逆时针旋转
     */
    rotate (angle) {
        if (typeof angle !== 'number') {
            throw new AliImgError('rotate() angle 应为数字类型')
        }
        // 上次设置的值
        let origin = this.query.rotate || 0
        // 原接口不支持负值和大于360的值
        // 重复调用，在原值上面叠加效果
        this.query.rotate = ((origin + angle) % 360 + 360) % 360
        return this
    }

    /**
     * 图片模糊操作。重复调用，在原值上面叠加效果
     * @param {number} radius 模糊半径。值越大图片越模糊，取值[1, 50]。超出边界则取边界值
     * @param {number} standard 正态分布的标准差。值越大图片越模糊。取值[1, 50]。超出边界则取边界值
     */
    blur (radius, standard) {
        if (typeof radius !== 'number') {
            throw new AliImgError('blur() radius 应为数字类型')
        }
        if (typeof standard !== 'number') {
            throw new AliImgError('blur() standard 应为数字类型')
        }

        // 重复调用，在原值上面叠加效果
        radius += this.query.blur ? this.query.blur.r : 0
        standard += this.query.blur ? this.query.blur.s : 0

        // 上限和下限
        let lowerLimit = 1
        let upperLimit = 50
        // 传入值超过边界值时，取边界值
        radius = Math.max(Math.min(radius, upperLimit), lowerLimit)
        standard = Math.max(Math.min(standard, upperLimit), lowerLimit)

        this.query.blur = {r: radius, s: standard}
        return this
    }

    /**
     * 调节图片亮度。重复调用，在原值上面叠加效果
     * @param {number} brightness 亮度。0 表示原图亮度，小于 0 表示低于原图亮度，大于 0 表示高于原图亮度。取值[-100, 100]，超出边界则取边界值
     */
    bright(brightness) {
        if (typeof brightness !== 'number') {
            throw new AliImgError('bright() brightness 应为数字类型')
        }
        let origin = this.query.bright || 0
        // 重复调用，在原值上面叠加效果
        brightness += origin
        let lowerLimit = -100
        let upperLimit = 100
        // 传入值超过边界值时，取边界值
        brightness = Math.max(Math.min(brightness, upperLimit), lowerLimit)
        this.query.bright = brightness
        return this
    }

    /**
     * 调节图片对比度。重复调用，在原值上面叠加效果
     * @param {number} value 对比度。0 表示原图对比度，小于 0 表示低于原图对比度，大于 0 表示高于原图对比度。取值[-100, 100]，超出边界则取边界值
     */
    contrast (value) {
        if (typeof value !== 'number') {
            throw new AliImgError('contrast() value 应为数字类型')
        }

        let origin = this.query.contrast || 0
        // 重复调用，在原值上面叠加效果
        value += origin
        let lowerLimit = -100
        let upperLimit = 100
        // 传入值超过边界值时，取边界值
        value = Math.max(Math.min(value, upperLimit), lowerLimit)
        this.query.contrast = value
        return this
    }

    /**
     * 图片锐化操作，使图片变得清晰。重复调用，在原值上面叠加效果
     * @param {number} value 锐化值。参数越大，越清晰。取值[50, 399]，超出边界则取边界值。
     */
    sharpen (value) {
        if (typeof value !== 'number') {
            throw new AliImgError('sharpen() value 应为数字类型')
        }

        let origin = this.query.sharpen || 0
        // 重复调用，在原值上面叠加效果
        value += origin

        // 上限和下限
        let lowerLimit = 50
        let upperLimit = 399
        // 传入值超过边界值时，取边界值
        value = Math.max(Math.min(value, upperLimit), lowerLimit)
        this.query.sharpen = value
        return this
    }

    /**
     * 将图片转换成对应格式。 默认不填格式，是按原图格式返回。
     * @param {string} type 输出的图片格式
     */
    format (type) {
        if (!TYPE_LIST.includes(type)) {
            throw new AliImgError('format() 不支持该输出格式')
        }
        this.query.format = type
        return this
    }

    /**
     * 调节 jpg 格式图片的呈现方式
     * @param {number} type 0 表示保存成普通的 jpg 格式，1 表示保存成渐进显示的 jpg 格式
     */
    interlace (type) {
        if (typeof type !== 'number') {
            throw new AliImgError('interlace() type 应为数字类型')
        }
        // 接口只接受值为 0 和 1
        type = Number(Boolean(type))
        this.query.interlace = type
        return this
    }

    /**
     * 图片保存成 jpg 或 webp, 可以支持质量变换。重复调用，在原值上面叠加效果
     * @param {number} value 百分比，决定图片的相对质量，对原图按照 value% 进行质量压缩。如果原图质量是 100%，使用 90 会得到质量为 90％ 的图片；如果原图质量是 80%，使用 90 会得到质量72%的图片。只能在原图是 jpg 格式的图片上使用，才有相对压缩的概念。如果原图为 webp，那么相对质量就相当于绝对质量。传入值超过边界值时，取边界值
     */
    quality (value) {
        if (typeof value !== 'number') {
            throw new AliImgError('quality() value 应为数字类型')
        }

        let origin = this.query.quality ? this.query.quality.q : 100
        // 重复调用，在原值上面叠加效果
        value = parseInt(origin / 100 * value)

        // 上限和下限
        let lowerLimit = 1
        let upperLimit = 100
        // 传入值超过边界值时，取边界值
        value = Math.max(Math.min(value, upperLimit), lowerLimit)
        this.query.quality = { q: value }
        return this
    }

    /**
     * 图片保存成 jpg 或 webp, 可以支持质量变换。
     * @param {number} value 百分比，决定图片的绝对质量，把原图质量压到 value%，如果原图质量小于指定数字，则不压缩。如果原图质量是100%，使用”90”会得到质量90％的图片；如果原图质量是95%，使用“90”还会得到质量90%的图片；如果原图质量是80%，使用“90”不会压缩，返回质量80%的原图。只能在保存格式为jpg/webp效果上使用，其他格式无效果。 如果同时指定了相对和绝对，按绝对值来处理。传入值超过边界值时，取边界值
     */
    absQual (value) {
        if (typeof value !== 'number') {
            throw new AliImgError('absQual() value 应为数字类型')
        }

        // 上限和下限
        let lowerLimit = 1
        let upperLimit = 100
        // 传入值超过边界值时，取边界值
        value = Math.max(Math.min(value, upperLimit), lowerLimit)
        this.query.quality = { Q: value }
        return this
    }

    /**
     * 图片水印。水印操作可以在图片上设置另外一张图片或一段文字做为水印。可重复调用
     * @param {string|Img} content 字符串或Img实例
     * @param {Object} opt 配置对象
     */
    watermark (content, opt) {
        let param = {}
        opt = opt || {}

        if (typeof content === 'string') {
            if (Buffer.byteLength(content) > MAX_BYTE_SIZE) {
                throw new AliImgError(`watermark() content 文本最多支持${MAX_BYTE_SIZE}字节`)
            }
            param.text = this.toBase64(content)
        } else if (content instanceof Img) {
            this.addChild(content.child)
            param.image = this.toBase64(content.toString())
        } else {
            throw new AliImgError('watermark() content 应为字符串或 Img 实例')
        }
        if (typeof opt !== 'object') {
            throw new AliImgError('watermark() opt 应为对象')
        }

        // x 和 y 的下限和上限
        let lowerLimit = 0
        let upperLimit = 4096

        // x 可传入数字或不传，默认为10。超过边界，则取边界值
        if (typeof opt.x === 'number') {
            param.x = Math.max(Math.min(opt.x, upperLimit), lowerLimit)
        } else if (opt.x) {
            throw new AliImgError('watermark() x 应为数字类型')
        }

        // y 可传入数字或不传，默认为10。超过边界，则取边界值
        if (typeof opt.y === 'number') {
            param.y = Math.max(Math.min(opt.y, upperLimit), lowerLimit)
        } else if (opt.y) {
            throw new AliImgError('watermark() y 应为数字类型')
        }

        // 校验位置值
        if (ORIGIN_LIST.includes(opt.position)) {
            param.g = opt.position
        } else if (opt.position) {
            throw new AliImgError('watermark() position 值不支持')
        }

        // 校验透明度        
        if (typeof opt.transparency === 'number') {
            // 下限和上限
            let lowerLimit = 0
            let upperLimit = 100
            // 超过边界，则取边界值
            param.t = Math.max(Math.min(opt.transparency, upperLimit), lowerLimit)
        } else if (opt.transparency) {
            throw new AliImgError('watermark() transparency 应为数字类型')
        }

        // 校验中线偏移值     
        if (typeof opt.voffset === 'number') {
            // 下限和上限
            let lowerLimit = -1000
            let upperLimit = 1000
            // 超过边界，则取边界值
            param.voffset = Math.max(Math.min(opt.voffset, upperLimit), lowerLimit)
        } else if (opt.voffset) {
            throw new AliImgError('watermark() voffset 应为数字类型')
        }

        // 校验水印的铺满效果
        if (typeof opt.fill === 'number') {
            // 只支持值为 0 和 1
            param.fill = Number(Boolean(opt.fill))
        } else if (opt.fill) {
            throw new AliImgError('watermark() fill 应为数字类型')
        }

        // 将单独设置的文字效果复制到配置对象
        ['color', 'size', 'type', 'shadow', 'rotate'].forEach(key => {
            if (this.style[key]) {
                param[key] = this.style[key]
            }
        })

        this.query.watermark = this.query.watermark || []
        this.query.watermark.push(param)
        return this
    }

    /**
     * 设置文字填充颜色
     * @param {string} color 文字水印的颜色。6位16进制数 如：000000表示黑色。FFFFFF表示的是白色。默认值：黑色
     */
    fill (color) {
        if (typeof color !== 'string') {
            throw new AliImgError('fill() color 应为字符串')
        }
        // 允许字符串以井号开头
        if (color[0] === '#') {
            color = color.slice(1)
        }
        // 允许颜色值简写形式
        if (color.length === 3) {
            color = color.split('').map(char => char + char).join('')
        }
        if (!/[0-9A-F]{6}/i.test(color)) {
            throw new AliImgError('fill() color 应为6位16进制数')
        }
        this.style.color = color
        return this
    }

    /**
     * 设置文字字体
     * @param {string} name 文字水印的字体类型。默认值：文泉驿正黑。可输入参数对应的中文
     */
    font (name) {
        if (FONTS_LIST.includes(name)) {
            // 如果输入值为英文列表内的选项，则直接转 base64
            this.style.type = this.toBase64(name)
        } else if (FONTS_LIST_CN.includes(name)) {
            // 如果输入值为中文表内的选项，则先转换成英文表内的对应项，再转 base64
            const index = FONTS_LIST_CN.indexOf(name)
            this.style.type = this.toBase64(FONTS_LIST[index])
        } else {
            throw new AliImgError(`font() 不支持该字体 ${name}`)
        }
        return this
    }

    /**
     * 设置文字大小
     * @param {number} size 文字水印大小(px)。取值范围：(0，1000]，传入值超过边界值时，取边界值。默认值：40
     */
    fontSize (size) {
        if (typeof size !== 'number') {
            throw new AliImgError('fontSize() size 应为数字类型')
        }

        // 上限和下限
        let lowerLimit = 1
        let upperLimit = 1000
        // 传入值超过边界值时，取边界值
        size = Math.max(Math.min(size, upperLimit), lowerLimit)
        // 字体大小只支持整数
        size = parseInt(size)
        this.style.size = size
        return this
    }

    /**
     * 设置文字水印的阴影透明度
     * @param {number} transparency 文字阴影的透明度
     */
    textShadow(transparency) {
        if (typeof transparency !== 'number') {
            throw new AliImgError('textShadow() transparency 应为数字类型')
        }

        // 下限和上限
        let lowerLimit = 1
        let upperLimit = 100
        // 超过边界，则取边界值
        this.style.shadow = Math.max(Math.min(transparency, upperLimit), lowerLimit)
        return this
    }

    /**
     * 设置文字的旋转角度
     * @param {number} angle 文字的旋转角度
     */
    textRotate(angle) {
        if (typeof angle !== 'number') {
            throw new AliImgError('textRotate() angle 应为数字类型')
        }

        // 原接口不支持负值和大于360的值
        this.style.rotate = (angle % 360 + 360) % 360
        return this
    }

    // 将传入的字符串转成URL可用的BASE64字符串
    toBase64 (str) {
        return Buffer.from(str).toString('base64').replace(/[+/]/g, (match) => {
            return match == '+' ? '-' : '_'
        })
    }

    // 获取随机的临时OSS对象名
    getObjectName () {
        return 'temp/' + Date.now() + parseInt(Math.random() * 8999 + 1000) + '.jpg'
    }

    // 将图片的依赖资源放到列表
    addChild (arr) {
        this.child = this.child.concat(arr)
    }

    // 将对图片的操作命令序列化成URL请求参数
    stringify () {
        // 格式化键值对
        let fmt = function(key, value) {
            let param = ''
            if (typeof value === 'object') {
                param = querystring.stringify(value, ',', '_', {
                    encodeURIComponent: encodeURI
                })
            } else {
                param = value
            }
            return `image/${key},${param}`
        }

        return Object.keys(this.query).map((key) => {
            let value = this.query[key]
            if (Array.isArray(value)) {
                return value.map(fmt.bind(null, key)).join(',')
            } else {
                return fmt(key, value)
            }
        }).join(',')
    }

    toString () {
        return this.data.objectName + '?x-oss-process=' + this.stringify()
    }
}

Object.assign(Img, { TYPE_LIST, FONTS_LIST, FONTS_LIST_CN, ORIGIN_LIST, RESIZE_MODE })

module.exports = Img