const fs = require('fs')
const crypto = require('crypto')
const Transform = require('stream').Transform
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
  putObject(fullpath, objectName, callback) {
    const mimeType = mime.getType(fullpath)
    const headers = {
      ['Content-Type']: mimeType
    }
    const putStream = this.preRequest('put', objectName, headers, (err, response, body) => {
      if (err) {
        return callback(err)
      }
      if (!(response.statusCode >= 200 && response.statusCode <= 400)) {
        return callback(new Error(body))
      }
      callback()
    })
    fs.createReadStream(fullpath).on('error', callback).pipe(putStream)
  }
  putObjectFromUrl(url, objectName, callback) {
    this.getMimeForUrl(url, (err, mimeType) => {
      if (err) {
        return callback(err)
      }
      const onResponse = function (res) {
        const putStream = this.preRequest('put', objectName, res.headers, (err, response, body) => {
          if (err) {
            return callback(err)
          }
          if (!(response.statusCode >= 200 && response.statusCode <= 400)) {
            return callback(new Error(body))
          }
          callback()
        })
        res.pipe(putStream)
      }
      require('http').get(url, onResponse.bind(this)).on('error', callback)
    })
  }
  createImg(path) {
    const img = new Img(path)
    img.client = this
    img.toBuffer = this.toBuffer
    img.stream = this.stream
    img.save = this.save
    img.write = this.write
    img.putObjects = this.putObjects
    return img
  }
  save(objectName, callback) {
    const headers = {
      ['Transfer-Encoding']: 'chunked',
      ['Content-Type']: 'image/jpg'
    }
    const putStream = this.client.preRequest('put', objectName, headers, (err, response, body) => {
      if (err) {
        return callback(err)
      }
      if (!(response.statusCode >= 200 && response.statusCode <= 400)) {
        return callback(new Error(body))
      }
      callback()
    })
    this.stream().pipe(putStream)
  }
  toBuffer(callback) {
    const buffers = []
    this.putObjects(err => {
      if (err) {
        return callback(err)
      }
      let statusCode = 0
      this.client.preRequest('get', this.toString())
        .on('error', callback)
        .on('response', res => {
          statusCode = res.statusCode
        })
        .on('data', buffers.push.bind(buffers))
        .on('end', () => {
          const buf = Buffer.concat(buffers)
          if (!(statusCode >= 200 && statusCode <= 400)) {
            return callback(new Error(buf.toString()))
          }
          callback(null, buf)
        })
    })
  }
  stream() {
    const stream = new Transform({
      transform(chunk, encoding, callback) {
        this.push(chunk)
        callback()
      }
    })
    this.putObjects(err => {
      if (err) {
        return stream.emit('error', err)
      }
      this.client.preRequest('get', this.toString()).pipe(stream)
    })
    return stream
  }
  write(fullpath, callback) {
    this.putObjects(err => {
      if (err) {
        return callback(err)
      }
      this.client.preRequest('get', this.toString(), null, (err, response, body) => {
        if (err) {
          return callback(err)
        }
        if (!(response.statusCode >= 200 && response.statusCode <= 400)) {
          return callback(new Error(body))
        }
      }).pipe(
        fs.createWriteStream(fullpath).on('error', callback).on('finish', callback.bind(null, null))
      )
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
    request(url).on('error', callback).on('response', res => {
      callback(null, this.getHeader(res.headers, 'content-type'))
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
    const type = this.getHeader(options.headers, 'content-type') || options.type || ''
    const headers = options.headers ? this.canonicalizedOssHeaders(options.headers) : ''
    const md5str = this.getHeader(options.headers, 'content-md5') || (options.body ? this.getMD5(options.body) : '')
    const datestr = this.getDate()
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
    return crypto.createHmac('sha1', Buffer.from(this.options.accessKeySecret)).update(text).digest('base64')
  }
  getDate() {
    const date = new Date()
    // 签名错误可能是时间问题
    date.setSeconds(new Date().getSeconds())
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

module.exports = AliImg