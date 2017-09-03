const querystring = require('querystring')
class AliImage {
  constructor(objectName) {
    this.objectName = objectName
    this.query = []
    this.style = {}
  }
  resize(width, height, options) {
    options = options || {}
    const query = {
      limit: options.limit === 1 ? 1 : 0
    }
    if (typeof width === 'number') {
      query.w = width
    }
    if (typeof height === 'number') {
      query.h = height
    }
    this.copyAttrIfExists({
      source: options,
      target: query,
      fields: ['color']
    })
    if (typeof options.mode === 'string') {
      query.m = options.mode
    }
    if (typeof options.percent === 'number') {
      delete query.w
      delete query.h
      query.p = options.percent
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
  crop(x, y, width, height, origin) {
    for (let i = 0; i < 4; i++) {
      if (typeof arguments[i] !== 'number') {
        throw new TypeError('crop() please check the params')
      }
    }
    const query = {
      x: x,
      y: y,
      w: width,
      h: height
    }
    if (typeof origin === 'string') {
      query.origin = origin
    }
    this.query.push(['crop', query])
    return this
  }
  indexCrop(x, y, index) {
    const query = {
      x: x,
      y: y,
      i: index
    }
    if (x && y) {
      delete query.y
    }
    this.query.push('indexcrop', query)
    return this
  }
  roundedCorners(radius) {
    if (typeof r !== 'number') {
      throw new TypeError('roundedCorners() radius must be a number')
    }
    const query = {
      r: radius
    }
    this.query.push(['rounded-corners', query])
    return this
  }
  autoOrient(value) {
    const validValue = [0, 1]
    if (!~validValue.indexOf(value)) {
      throw new TypeError('autoOrient() The parameter is not valid')
    }
    const query = {
      value: value
    }
    this.query.push(['auto-orient', query])
    return this
  }
  rotate(angle) {
    const isValid = typeof angle === 'number' && angle <= 360 && angle >= 0
    if (!isValid) {
      throw new TypeError('rotate() The parameter requirement is a number between 0 and 360')
    }
    const query = {
      value: angle
    }
    this.query.push(['rotate', query])
    return this
  }
  blur(radius, standard) {
    const isValid = typeof radius === 'number' 
        && radius >= 1 && radius <= 50 && typeof standard === 'number' 
        && standard >= 1 && standard <= 50

    if (!isValid) {
      throw new TypeError('blur() The parameter requirement is a number between 1 and 50')
    }
    const query = {
      r: radius,
      s: standard
    }
    this.query.push(['blur', query])
    return this
  }
  bright(value) {
    const isValid = typeof value === 'number' && value >= -100 && value <= 100
    if (!isValid) {
      throw new TypeError('bright() The parameter requirement is a number between -100 and 100')
    }
    const query = {
      value
    }
    this.query.push(['bright', query])
    return this
  }
  contrast(value) {
    const isValid = typeof value === 'number' && value >= -100 && value <= 100
    if (!isValid) {
      throw new TypeError('contrast() The parameter requirement is a number between -100 and 100')
    }
    const query = { value }
    this.query.push(['contrast', query])
    return this
  }
  sharpen(value) {
    const isValid = typeof value === 'number' && value >= 50 && value <= 399
    if (!isValid) {
      throw new TypeError('sharpen() The parameter requirement is a number between 50 and 399')
    }
    const query = { value }
    this.query.push(['sharpen', query])
    return this
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
  interlace(value) {
    const validValue = [0,1]
    if (!~validValue.indexOf(value)) {
      throw new TypeError('interlace() The parameter is not valid')
    }
    const query = { value }
    this.query.push(['interlace', query])
    return this
  }
  quality(value) {
    const isValid = typeof value === 'number' && value >= 1 && value <= 100
    if (!isValid) {
      throw new TypeError('quality() The parameter requirement is a number between 1 and 100')
    }
    const query = {
      q: value
    }
    this.query.push(['quality', query])
    return this
  }
  absoluteQuality(value) {
    const isValid = typeof value === 'number' && value >= 1 && value <= 100
    if (!isValid) {
      throw new TypeError('absoluteQuality() The parameter requirement is a number between 1 and 100')
    }
    const query = {
      Q: value
    }
    this.query.push(['quality', query])
    return this
  }
  watermark(x, y, image, options) {
    if (!(image instanceof AliImage)) {
      throw new TypeError('watermark() first argument must be a Image instance')
    }
    options = options || {}
    const query = {
      image: this.toBase64(image.toString())
    }
    if (typeof x === 'number') {
      query.x = x
    }
    if (typeof y === 'number') {
      query.y = y
    }
    if (typeof options.position === 'string') {
      query.g = options.position
    }
    if (typeof options.transparency === 'number') {
      query.t = transparency
    }
    if (typeof options.voffset === 'number') {
      query.voffset = options.voffset
    }
    this.query.push(['watermark', query])
    return this
  }
  drawText(x, y, text, options) {
    if (typeof text !== 'string') {
      throw new TypeError('drawText() text must be a string')
    }
    options = options || {}
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
    if (typeof options.position === 'string') {
      query.g = options.position
    }
    if (typeof options.transparency === 'number') {
      query.t = options.transparency
    }
    if (typeof options.voffset === 'number') {
      query.voffset = options.voffset
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
    this.copyAttrIfExists({
      source: options,
      target: query,
      fields: ['shadow', 'rotate', 'fill']
    })
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
  copyAttrIfExists(options) {
    const { target, source, fields } = options
    fields.forEach(key => {
      const value = source[key]
      if (value !== undefined && value !== null) {
        target[key] = value
      }
    })
  }
}

module.exports = AliImage