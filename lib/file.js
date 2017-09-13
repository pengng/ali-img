const crypto = require('crypto')
const OSS = require('ali-oss').Wrapper
const request = require('request')
const path = require('path')
const fs = require('fs')
const Img = require('./img')
const mime = require('mime')

class AliImg {
  constructor(options) {
    this.options = options
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
  getObject(objectName, callback) {
    this.preRequest('get', objectName).pipe(require('fs').createWriteStream(__dirname + '/1.png')).on('finish', callback)
  }
  putObject(fullpath, objectName, callback) {
    const mimeType = mime.getType(fullpath)
    const headers = {
      ['Content-Type']: mimeType
    }
    const putStream = this.preRequest('put', objectName, headers, callback).on('error', callback)
    fs.createReadStream(fullpath).on('error', callback).pipe(putStream)
  }
  putObjectFromUrl(url, objectName, callback) {
    this.getMimeForUrl(url, (err, mimeType) => {
      if (err) {
        return callback(err)
      }
      const headers = {
        ['Transfer-encoding']: 'chunked',
        ['Content-Type']: mimeType
      }
      const putStream = this.preRequest('put', objectName, headers, callback).on('error', callback)
      request(url).on('error', callback).pipe(putStream)
    })
  }
  toBuffer() {

  }
  stream() {

  }
  write() {

  }
  getMimeForFile(fullpath, callback) {
    callback(null, mime.getType(fullpath))
  }
  getMimeForUrl(url, callback) {
    request.head(url, (err, response) => {
      if (err) {
        return callback(err)
      }
      callback(null, this.getHeader(response.headers, 'content-type'))
    })
  }
  getHeader(obj, keyname) {
    const reg = new RegExp(keyname, 'i')
    for (let key in obj) {
      if (reg.test(key)) {
        return obj[key]
      }
    }
  }
  preRequest(method, objectName, headers, callback) {
    headers = headers || {}
    const keys = Object.keys(headers)
    if (keys.indexOf(Date) < 0) {
      headers.Date = this.getDate()
    }
    headers.Authorization = this.getAuthorization({
      method,
      headers,
      objectName
    })
    const options = {
      url: `${this.getHost()}/${objectName}`,
      method,
      headers
    }
    if (typeof callback === 'function') {
      return request(options, callback)
    } else {
      return request(options)
    }
  }
  getHost() {
    return 'http://' + [this.options.bucket, this.options.region, 'aliyuncs.com'].join('.')
  }
  getUrl() {
    return this.oss.signatureUrl(this.objectName, {
      expires: 3600,
      process: this.stringify()
    })
  }
  getAuthorization(options) {
    return `OSS ${this.options.accessKeyId}:${this.getSignature(options)}`
  }
  getSignature(options) {
    const method = options.method ? options.method.toUpperCase() : 'GET'
    const type = options.headers['Content-Type'] || options.type || ''
    const headers = options.headers ? this.canonicalizedOssHeaders(options.headers) : ''
    const md5str = options.body ? this.getMD5(options.body) : ''
    const datestr = this.getDate()
    const query = options.query || {}
    const objectName = options.objectName || '/'
    const resoure = this.canonicalizedResource(objectName, query)
    const str = [method, md5str, type, datestr, headers].join('\n') + resoure
    console.log('>>>>>>>')
    console.log(str)
    console.log('>>>>>>>>>>')
    return this.getHmac(str)
  }
  getExpires(seconds = 1800) {
    return parseInt(Date.now() / 1000 + seconds)
  }
  getMD5(text) {
    return crypto.createHash('md5').update(text).digest('base64')
  }
  getHmac(text) {
    return crypto.createHmac('sha1', Buffer.from(this.options.accessKeySecret)).update(text).digest('base64')
  }
  getDate() {
    const date = new Date()
    date.setSeconds(new Date().getSeconds() - 1)
    return date.toGMTString()
  }
  canonicalizedOssHeaders(obj) {
    const arr = []
    for (let key in obj) {
      if (/^x-oss-/i.test(key)) {
        arr.push(key.toLowerCase() + ':' + obj[key])
      }
    }
    if (arr.length === 0) {
      return ''
    }
    arr.sort()
    return arr.join('\n') + '\n'
  }
  canonicalizedResource(objectName, query) {
    const arr = []
    for (let key in query) {
      arr.push(key + '=' + query[key])
    }
    if (arr.length === 0) {
      return `/${this.options.bucket}/${objectName}`
    }
    arr.sort()
    return objectName + '?' + arr.join('&')
  }
}

AliImg.Img = Img

module.exports = AliImg