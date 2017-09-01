const OSS = require('ali-oss').Wrapper
const request = require('request')
const path = require('path')
const fs = require('fs')
const AliImage = require('./image')

class File {
  constructor(options) {
    this.oss = new OSS(options)
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
    if (/^https?:\/\//.test(path)) {
      const objectName = Date.now() + '' + parseInt(Math.random() * 8999 + 1000) + '.jpg'
      this.putFromUrl(path, objectName)
    } else {
      
    }
  }
  getUrl(image) {
    if (!(image instanceof AliImage)) {
      throw new TypeError('getUrl() argument must be AliImage instance')
    }
    return this.oss.signatureUrl(image.objectName, {
      expires: 3600,
      process: image.stringify()
    })
  }
  static extend(styleName, func) {
    styles[styleName] = func
  }
}

File.AliImage = AliImage

module.exports = File