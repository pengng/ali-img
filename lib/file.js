const fs = require('fs')
const crypto = require('crypto')
const Transform = require('stream').Transform
const path = require('path')
const querystring = require('querystring')
const urlParser = require('url')
const http = require('http')
const https = require('https')
const mime = require('mime')
const Img = require('./img')
const error = require('./error')
const AliImgError = error.AliImgError
const HTTPError = error.HTTPError

class AliImg {

  constructor (options) {
    this.options = options
    return this.createImg.bind(this)
  }

  putObject (fullpath, objectName, callback) {
    const mimeType = mime.getType(fullpath)
    const headers = {
      'Content-Type': mimeType
    }
    const buffers = []
    const onEnd = function (statusCode) {
      if (statusCode) {
        return callback(new HTTPError(statusCode, Buffer.concat(buffers).toString()))
      }
      callback()
    }
    const onResponse = function (res) {
      if (!(res.statusCode >= 200 && res.statusCode < 300)) {
        res.on('data', buffers.push.bind(buffers)).on('end', onEnd.bind(this, res.statusCode))
      } else {
        res.on('end', onEnd.bind(this)).resume()
      }
    }
    fs.createReadStream(fullpath).on('error', callback).pipe(
      this.preRequest('put', objectName, headers).on('error', callback).on('response', onResponse.bind(this))
    )
  }

  putObjectFromUrl (url, objectName, callback) {
    const options = {
      url: url,
      headers: {
        Accept: 'image/jpg,image/png,image/webp,image/gif,image/bmp,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36(KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36'
      }
    }
    const buffers = []
    const onEnd = function (statusCode) {
      if (statusCode) {
        return callback(new HTTPError(statusCode, Buffer.concat(buffers).toString()))
      }
      callback()
    }
    const onResponse2 = function (res) {
      if (!(res.statusCode >= 200 && res.statusCode < 300)) {
        res.on('data', buffers.push.bind(this)).on('end', onEnd.bind(this, res.statusCode))
      } else {
        res.on('end', onEnd.bind(this)).resume()
      }
    }
    const onResponse = function (res) {
      res.pipe(
        this.preRequest('put', objectName, res.headers).on('error', callback).on('response', onResponse2.bind(this))
      )
    }
    this.request(options).on('error', callback).on('response', onResponse.bind(this)).end()
  }

  createImg (path) {
    const img = new Img(path)
    img.client = this
    img.toBuffer = this.toBuffer
    img.stream = this.stream
    img.save = this.save
    img.write = this.write
    img.putObjects = this.putObjects
    return img
  }

  save (objectName, callback) {
    const headers = {
      'Transfer-Encoding': 'chunked',
      'Content-Type': 'image/jpg'
    }
    const buffers = []
    const onEnd = function (statusCode) {
      if (statusCode) {
        return callback(new HTTPError(statusCode, Buffer.concat(buffers).toString()))
      } else {
        callback(null, this.client.getUrl(objectName))
      }
    }
    const onResponse = function (res) {
      if (!(res.statusCode >= 200 && res.statusCode < 300)) {
        res.on('data', buffers.push.bind(buffers)).on('end', onEnd.bind(this, res.statusCode))
      } else {
        res.on('end', onEnd.bind(this)).resume()
      }
    }
    this.stream().pipe(
      this.client.preRequest('put', objectName, headers).on('error', callback).on('response', onResponse.bind(this))
    )
  }

  toBuffer (callback) {
    const buffers = []
    const onEnd = function (res) {
      const statusCode = res.statusCode
      const buf = Buffer.concat(buffers)
      if (!(statusCode >= 200 && statusCode < 300)) {
        return callback(new HTTPError(statusCode, buf.toString()))
      }
      callback(null, buf)
    }
    const onResponse = function (res) {
      res.on('data', buffers.push.bind(buffers)).on('end', onEnd.bind(this, res))
    }
    const putObjectsCallback = function (err) {
      if (err) {
        return callback(err)
      }
      this.client.preRequest('get', this.toString()).on('error', callback).on('response', onResponse.bind(this))
    }
    this.putObjects(putObjectsCallback.bind(this))
  }

  stream () {
    const stream = new Transform({
      transform(chunk, encoding, callback) {
        this.push(chunk)
        callback()
      }
    })
    const onResponse = function (res) {
      res.pipe(stream)
    }
    const putObjectsCallback = function (err) {
      if (err) {
        return stream.emit('error', err)
      }
      this.client.preRequest('get', this.toString()).on('error', stream.emit.bind('error')).on('response', onResponse)
    }
    this.putObjects(putObjectsCallback.bind(this))
    return stream
  }

  write (fullpath, callback) {
    const buffers = []
    const onEnd = function (statusCode) {
      if (statusCode) {
        return callback(new HTTPError(statusCode, Buffer.concat(buffers).toString()))
      }
      callback(null, fullpath)
    }
    const onResponse = function (res) {
      if (!(res.statusCode >= 200 && res.statusCode < 300)) {
        res.on('data', buffers.push.bind(buffers)).on('end', onEnd.bind(this, res.statusCode))
      } else {
        res.pipe(fs.createWriteStream(fullpath).on('finish', onEnd.bind(this)))
      }
    }
    const putObjectsCallback = function (err) {
      if (err) {
        return callback(err)
      }
      this.client.preRequest('get', this.toString()).on('error', callback).on('response', onResponse.bind(this))
    }
    this.putObjects(putObjectsCallback.bind(this))
  }

  each (collection, iteration, callback) {
    const len = collection.length
    let count = 0
    let isCalled = false
    const result = []
    const next = function (index, err) {
      if (err && !isCalled) {
        isCalled = true
        return callback(err)
      }
      const args = Array.prototype.slice.call(arguments, 2)
      result[index] = args
      count++
      if (count === len) {
        callback(null, result)
      }
    }
    for (let i = 0; i < len; i++) {
      iteration(collection[i], next.bind(this, i))
    }
  }

  putObjects (callback) {
    const iteration = function (item, next) {
      if (/https?:\/\//i.test(item.path)) {
        this.client.putObjectFromUrl(item.path, item.objectName, next)
      } else {
        this.client.putObject(item.path, item.objectName, next)
      }
    }
    this.client.each(this.child, iteration.bind(this), callback)
  }

  getHeader (obj, keyname) {
    const reg = new RegExp(keyname, 'i')
    for (let key in obj) {
      if (reg.test(key)) {
        return obj[key]
      }
    }
  }

  preRequest (method, objectName, headers) {
    method = method ? method.toUpperCase() : 'GET'
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
    return this.request(options)
  }

  request (options) {
    if (typeof options === 'string') {
      options = { url: options }
    }
    const newOptions = urlParser.parse(options.url)
    newOptions.method = options.method ? options.method.toUpperCase() : 'GET'
    newOptions.headers = options.headers || {}
    const agent = newOptions.protocol === 'https:' ? https : http
    let body = ''
    if (typeof options.body === 'string') {
      body = options.body
    } else if (typeof options.body === 'object') {
      if (options.json) {
        body = JSON.stringify(options.body)
      } else if (options.form) {
        body = querystring.stringify(options.body)
      }
    }
    const req = agent.request(newOptions)
    if (body || newOptions.method === 'GET') {
      req.end(body)
    }
    return req
  }

  getUrl (objectName) {
    return 'http://' + [this.options.bucket, this.options.region, 'aliyuncs.com'].join('.') + '/' + objectName
  }

  getAuthorization (options) {
    return 'OSS ' + this.options.accessKeyId + ':' + this.getSignature(options)
  }

  getSignature (options) {
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
  
  getMD5 (text) {
    return crypto.createHash('md5').update(text).digest('base64')
  }

  getHmac (text) {
    return crypto.createHmac('sha1', Buffer.from(this.options.accessKeySecret)).update(text).digest('base64')
  }

  getDate () {
    return new Date().toUTCString()
  }

  canonicalizedOssHeaders (obj) {
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

  canonicalizedResource (objectName, query) {
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