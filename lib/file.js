const fs = require('fs')
const crypto = require('crypto')
const urlParser = require('url')
const http = require('http')
const https = require('https')
const { Transform, Readable } = require('stream')
const fileType = require('file-type')

const Img = require('./img')
const { getVal, compose } = require('./util')
const { HTTPError } = require('./error')

// 请求网络图片时使用的代理信息
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36(KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36'
// 请求网络图片时使用的期望资源类型
const ACCEPT = 'image/jpg,image/png,image/webp,image/gif,image/bmp,*/*;q=0.8'

class AliImg {

    constructor (options) {
        this.options = options
        return this.createImg.bind(this)
    }

    /**
     * 将本地文件上传到OSS
     * @param {string} fullpath 本地文件路径
     * @param {string} objectName 上传到OSS的对象名
     */
    putObject (fullpath, objectName) {
        return this.putObjectFromStream(fs.createReadStream(fullpath), objectName)
    }

    /**
     * 将图片数据流上传到OSS
     * @param {Readable} readable 源图片的数据流
     * @param {string} objectName 上传到OSS的对象名
     */
    putObjectFromStream(readable, objectName) {
        return new Promise((resolve, reject) => {
            let writable = null
            readable.on('error', reject).on('data', (chunk) => {
                if (!writable) {
                    // 根据数据的头部判断文件的媒体类型
                    let headers = {'Content-Type': fileType(chunk).mime}
                    // 建立上传连接
                    writable = this.putObj(objectName, headers)
                    writable.on('error', reject).on('response', compose(resolve, reject))
                }
                // 将图片数据写入上传连接
                writable.write(chunk)
            }).on('end', function () {
                writable.end()
            })
        })
    }

    /**
     * 将网络图片上传到阿里云OSS
     * @param {string} url 图片链接
     * @param {string} objectName 上传的阿里云位置
     */
    putObjectFromUrl (url, objectName) {

        let opt = urlParser.parse(url)
        // 部分网络服务需要有浏览器的代理信息才正常返回图片数据
        opt.headers = { Accept: ACCEPT, 'User-Agent': USER_AGENT }

        // 根据协议选择代理
        let agent = opt.protocol === 'https:' ? https : http

        return new Promise((resolve, reject) => {
            agent.get(opt).on('error', reject).on('response', (res) => {
                let { statusCode } = res
                // 如果遇到图片的重定向请求，则使用新的链接处理
                if (statusCode === 301 || statusCode === 302 || statusCode === 307) {
                    let key = 'Location'
                    // 获取新的链接
                    let url = getVal(res.headers, key)
                    // 递归处理图片上传
                    this.putObjectFromUrl(url, objectName).then(resolve).catch(reject)
                } else if (statusCode < 200 || statusCode >= 300) {
                    // 如果请求图片出错，则抛出错误
                    let buf = []
                    res.on('data', Array.prototype.push.bind(buf)).on('end', function () {
                        // 请求图片出错的主体数据
                        let body = Buffer.concat(buf).toString()
                        reject(new HTTPError(statusCode, body))
                    })
                } else {
                    // 使用图片的响应头部，打开OSS的上传连接
                    let writable = this.putObj(objectName, res.headers)
                    writable.on('error', reject).on('response', compose(resolve, reject))
                    // 将图片的主体数据写入到上传连接
                    res.pipe(writable)
                }
            })
        })
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

    /**
     * 将处理后的图片数据保存到OSS
     * @param {string} objectName OSS对象名
     */
    save (objectName) {
        return new Promise((resolve, reject) => {
            // 获取处理后的图片数据
            let readable = this.stream()
            readable.on('error', reject).on('headers', headers => {
                // 打开OSS的上传连接
                let writable = this.client.putObj(objectName, headers)
                // 获取图片的OSS链接
                let url = this.client.getUrl(objectName)
                writable.on('error', reject).on('response', compose(resolve.bind(null, url), reject))
                // 将处理后的图片数据写入上传连接
                readable.pipe(writable)
            })
        })
    }

    /**
     * 返回处理后图片的二进制数据
     */
    toBuffer () {
        return new Promise((resolve, reject) => {
            let buf = []
            this.stream().on('error', reject).on('data', Array.prototype.push.bind(buf)).on('end', function() {
                // 图片的二进制数据
                let data = Buffer.concat(buf)
                resolve(data)
            })
        })
    }

    /**
     * 返回可读流，包含处理后的图片数据
     */
    stream () {
        // 转换流不转换数据，仅用于传送数据
        const transform = new Transform({
            transform(chunk, encoding, callback) {
                this.push(chunk)
                callback()
            }
        })

        // 上传图片依赖的资源
        this.putObjects().then(() => {
            // 处理图片
            let readable = this.client.getObj(this.toString())
    
            // 如果HTTP请求出错，在返回的流对象上触发错误事件
            // 将获取到的图片数据写入到流对象上
            readable.on('error', transform.emit.bind(transform, 'error')).on('headers', transform.emit.bind(transform, 'headers'))
            readable.pipe(transform)
        // 如果依赖资源上传时出错，在返回的流对象上触发错误事件
        }).catch(transform.emit.bind(transform, 'error'))

        return transform
    }

    /**
     * 将处理好的图片写入本地文件
     * @param {string} fullpath 本地文件路径
     */
    write (fullpath) {
        return new Promise((resolve, reject) => {
            // 通过流将数据写入本地文件
            let writable = fs.createWriteStream(fullpath)
            // 当写入时发生错误，将promise置为rejected
            writable.on('error', reject).on('finish', resolve)
            this.stream().on('error', reject).pipe(writable)
        })
    }

    /**
     * 并行上传图片的全部依赖资源
     */
    putObjects () {
        let list = this.child.map((item) => {
            if (item.path instanceof Readable) {
                return this.client.putObjectFromStream(item.path, item.objectName)
            } else if (/https?:\/\//i.test(item.path)) {
                return this.client.putObjectFromUrl(item.path, item.objectName)
            } else {
                return this.client.putObject(item.path, item.objectName)
            }
        })

        return Promise.all(list)
    }

    /**
     * 获取一个OSS对象，返回一个可读流
     * @param {string} objectName OSS对象名
     */
    getObj(objectName) {
        let method = 'GET'
        // 获取日期首部
        let headers = { Date: this.getDate() }
        // 获取授权首部
        headers.Authorization = this.getAuthorization({method,headers,objectName})
        // 获取OSS对象的链接
        let url = this.getUrl(objectName)
        let opt = urlParser.parse(url)
        Object.assign(opt, { headers })
        // 根据协议选择代理
        let agent = opt.protocol === 'https:' ? https : http
        // 转换流不做数据转换，仅用于传送数据
        let transform = new Transform({
            transform(chunk, encoding, cb) {
                this.push(chunk)
                cb()
            }
        })
        // 请求OSS对象出错时，在流对象上抛出错误
        agent.get(opt).on('error', transform.emit.bind(transform, 'error')).on('response', function (res) {
            let { statusCode, headers } = res
            // 请求OSS对象出错时，在流对象上抛出错误
            if (statusCode < 200 || statusCode >= 300) {
                let buf = []
                res.on('data', Array.prototype.push.bind(buf)).on('end', function () {
                    // 响应的主体数据
                    let body = Buffer.concat(buf).toString()
                    // 将响应的主体数据用于错误信息，触发错误事件
                    transform.emit('error', new HTTPError(statusCode, body))
                })
            } else {
                // 通过在流对象上触发 headers 事件，传递响应首部
                transform.emit('headers', headers)
                res.on('error', transform.emit.bind(transform, 'error')).pipe(transform)
            }
        })

        return transform
    }

    /**
     * 打开OSS的上传连接，返回一个可写流
     * @param {string} objectName OSS对象名
     * @param {Object} headers 请求首部
     */
    putObj(objectName, headers) {
        let method = 'PUT'
        let key = 'Date'
        if (!getVal(headers, key)) {
            headers.Date = this.getDate()
        }
        // 获取OSS授权首部
        headers.Authorization = this.getAuthorization({method,headers,objectName})
        // 获取OSS的对象链接
        let url = this.getUrl(objectName)
        let opt = urlParser.parse(url)
        Object.assign(opt, { method, headers })
        // 根据协议选择代理
        let agent = opt.protocol === 'https:' ? https : http
        // 发起请求，返回请求对象
        return agent.request(opt)
    }

    // 获取OSS对象的HTTP链接
    getUrl (objectName) {
        return 'http://' + [this.options.bucket, this.options.region, 'aliyuncs.com'].join('.') + '/' + objectName
    }

    // 根据配置参数生成授权首部
    getAuthorization (opt) {
        return 'OSS ' + this.options.accessKeyId + ':' + this.getSignature(opt)
    }

    // 根据配置参数生成签名信息
    getSignature (options) {
        const method = options.method ? options.method.toUpperCase() : 'GET'
        const type = getVal(options.headers, 'content-type') || options.type || ''
        const headers = options.headers ? this.canonicalizedOssHeaders(options.headers) : ''
        const md5str = getVal(options.headers, 'content-md5') || (options.body ? this.getMD5(options.body) : '')
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