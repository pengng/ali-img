const OSS = require('ali-oss').Wrapper
const request = require('request')
const path = require('path')
const fs = require('fs')
const Img = require('./img')

class AliImg {
  constructor(options) {
    this.oss = new OSS(options)
    return this.createImage.bind(this)
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
}

AliImg.Img = Img

module.exports = AliImg