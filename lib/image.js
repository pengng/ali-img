const querystring = require('querystring')
class AliImage {
  constructor(objectName) {
    this.objectName = objectName
    this.query = []
    this.style = {}
  }
  resize(width, height, options) {
    const query = {
      limit: 0
    }
    if (typeof width === 'number') {
      query.w = width
    }
    if (typeof height === 'number') {
      query.h = height
    }
    if (options === '!') {
      query.m = 'fixed'
    }
    this.query.push(['resize', query])
    return this
  }
  circle(radius) {
    const query = {}
    if (typeof radius === 'number') {
      query.r = radius
    }
    this.query.push(['circle', query])
    return this
  }
  crop() {

  }
  rotate() {

  }
  format(format) {
    const types = ['jpg', 'png', 'webp', 'bmp', 'gif']
    if (!~types.indexOf(format)) {
      throw new TypeError('format() There is no such format')
    }
    const query = {
      format: format
    }
    this.query.push(['format', query])
    return this
  }
  watermark(x, y, image, options) {
    if (!(image instanceof AliImage)) {
      throw new TypeError('watermark() first argument must be a Image instance')
    }
    const query = {
      image: this.toBase64(image.toString())
    }
    if (typeof x === 'number') {
      query.x = x
    }
    if (typeof y === 'number') {
      query.y = y
    }
    if (typeof options === 'object' && typeof options.position === 'string') {
      query.g = options.position
    }
    this.query.push(['watermark', query])
    return this
  }
  drawText(x, y, text, options) {
    if (typeof text !== 'string') {
      throw new TypeError('drawText() text must be a string')
    }
    const query = {
      text: this.toBase64(text)
    }
    if (query.text.length > 64) {
      throw new RangeError('drawText() text too many')
    }
    if (typeof x === 'number') {
      query.x = x
    }
    if (typeof y === 'number') {
      query.y = y
    }
    if (typeof options === 'object' && typeof options.position === 'string') {
      query.g = options.position
    }
    if (this.style.color) {
      query.color = this.style.color
    }
    if (this.style.size) {
      query.size = this.style.size
    }
    if (this.style.type) {
      query.type = this.style.type
    }
    this.query.push(['watermark', query])
    return this
  }
  fill(color) {
    if (typeof color !== 'string') {
      throw new TypeError('fill() argument must be a string')
    }
    if (!/[0-9A-F]{6}/i.test(color)) {
      throw new TypeError('fill() argument must be 6 hexadecimal numbers')
    }
    this.style.color = color
    return this
  }
  font(name) {
    const types = ['wqy-zenhei', 'wqy-microhei', 'fangzhengshusong', 'fangzhengkaiti', 'fangzhengheiti', 'fangzhengfangsong', 'droidsansfallback']
    const types_cn = ['文泉驿正黑', '文泉微米黑', '方正书宋', '方正楷体', '方正黑体', '方正仿宋', 'DroidSansFallback']
    if (~types.indexOf(name)) {
      this.style.type = this.toBase64(name)
    } else if (~types_cn.indexOf(name)) {
      const index = types_cn.indexOf(name)
      this.style.type = this.toBase64(types[index])
    } else {
      throw new TypeError('font() There is no such font')
    }
    return this
  }
  fontSize(size) {
    if (typeof size !== 'number') {
      throw new TypeError('fontSize() argument must be a number')
    } else if (!(size > 0 && size < 1000)) {
      throw new RangeError('fontSize() Size range is exceeded')
    }
    this.style.size = size
    return this
  }
  toBase64(str) {
    return Buffer.from(str).toString('base64').replace(/[+/]/g, (match) => {
      return match == '+' ? '-' : '_'
    })
  }
  info() {

  }
  write(localPath) {
    
  }
  stream() {

  }
  toBuffer() {

  }
  stringify() {
    return this.query.map(query => {
      const param = 'image/' + query[0] + ',' + querystring.stringify(query[1], ',', '_', {
        encodeURIComponent: encodeURI
      })
      return param
    }).join(',').replace('format_', '')
  }
  toString() {
    return `${this.objectName}?x-oss-process=${this.stringify()}`
  }
}

module.exports = AliImage