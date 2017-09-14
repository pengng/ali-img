const fs = require('fs')
const crypto = require('crypto')
const path = require('path')
const request = require('request')
const mime = require('mime')
const Img = require('./img')
const async = require('async')

class AliImg {
  constructor(options) {
    this.options = options
    return this.createImg.bind(this)
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
  createImg(path) {
    const img = new Img(path)
    img.client = this
    img.toBuffer = this.toBuffer
    img.stream = this.stream
    img.write = this.write
    img.putObjects = this.putObjects
    return img
  }
  toBuffer(callback) {
    const buffers = []
    this.putObjects(err => {
      if (err) {
        return callback(err)
      }
      this.client.preRequest('get', this.toString()).on('data', buffers.push).on('error', callback).on('finish', callback.bind(null, null, buffers))
    })
  }
  stream() {
    const that = this
    const stream = this.client.preRequest('get', this.toString())
    stream.oldPipe = stream.pipe
    stream.pipe = function (writeStream) {
      this.on('startpipe', () => {
        this.oldPipe(writeStream)
      })
      that.putObjects(err => {
        if (err) {
          return stream.emit('error', err)
        }
        stream.emit('startpipe')
      })
    }
    return stream
  }
  write(fullpath, callback) {
    const stream = fs.createWriteStream(fullpath).on('finish', callback.bind(null, null)).on('error', callback)
    this.putObjects(err => {
      if (err) {
        return callback(err)
      }
      this.client.preRequest('get', this.toString()).pipe(stream)
    })
  }
  putObjects(callback) {
    async.each(this.child, (item, next) => {
      if (/https?:\/\//i.test(item.path)) {
        this.client.putObjectFromUrl(item.path, item.objectName, next)
      } else {
        this.client.putObject(item.path, item.objectName, next)
      }
    }, callback)
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
      url: this.getUrl(objectName),
      method,
      headers
    }
    if (typeof callback === 'function') {
      return request(options, callback)
    } else {
      return request(options)
    }
  }
  getUrl(objectName) {
    return 'http://' + [this.options.bucket, this.options.region, 'aliyuncs.com'].join('.') + '/' + objectName
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