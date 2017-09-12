const crypto = require('crypto')
const OSS = require('ali-oss').Wrapper
const request = require('request')
const path = require('path')
const fs = require('fs')
const Img = require('./img')

class AliImg {
  constructor(options) {
    this.oss = new OSS(options)
    // return this.createImage.bind(this)
  }
  runStyle(styleName) {
    var args = Array.prototype.slice.call(arguments, 1)
    return styles[styleName].apply(this, args)
  }
  putFromUrl(url, urlPath) {
    if (~url.indexOf('https:') || ~url.indexOf('wx.qlogo.cn')) {
      
      const filename = path.join(__dirname, Date.now() + '' + parseInt(Math.random() * 10000) + '.jpg') 
      const stream = fs.createWriteStream(filename)

      return new Promise((resolve, reject) => {

        stream.on('finish', () => {

          this.oss
            .put(urlPath, filename)
            .then(() => {

              fs.unlink(filename, resolve)
            })
            .catch(reject)
        })

        request(url)
          .on('error', reject)
          .pipe(stream)
        
      })

    } else {

      return this.putStream(urlPath, request(url))
    }

  }
  createImage(path) {
    const img = new Img(path)
    img.getUrl = this.getUrl
    img.oss = this.oss
    return img
  }
  getUrl() {
    return this.oss.signatureUrl(this.objectName, {
      expires: 3600,
      process: this.stringify()
    })
  }
  static extend(styleName, func) {
    styles[styleName] = func
  }
  getSignature(options) {
    method = options.method.toUpperCase()
    const type = options.type || ''
    const headers = options.headers ? this.canonicalizedOssHeaders(headers) : ''
    const md5str = options.body ? this.getMD5(options.body) : ''
    const datestr = new Date().toGMTString()
    const query = options.query || {}
    const objectName = options.objectName || '/'
    const resoure = this.canonicalizedResource(objectName, query)
    const str = [method, md5str, type, datestr, headers].join('\n') + resoure
    return this.getHmac(str)
  }
  getExpires(seconds = 1800) {
    return parseInt(Date.now() / 1000 + seconds)
  }
  getMD5(text) {
    return crypto.createHash('md5').update(text).digest('base64')
  }
  getHmac(text) {
    return crypto.createHmac('sha1', this.accessKeyId).update(text).digest('base64')
  }
  canonicalizedOssHeaders(obj) {
    const arr = []
    for (let key in obj) {
      if (/^x-oss-/i.test(key)) {
        arr.push(key.toLowerCase() + ':' + obj[key])
      }
    }
    arr.sort()
    return arr.join('\n') + '\n'
  }
  canonicalizedResource(objectName, query) {
    const arr = []
    for (let key in query) {
      arr.push(key + '=' + query[key])
    }
    arr.sort()
    return objectName + '?' + query.join('&')
  }
}

AliImg.Img = Img

module.exports = AliImg