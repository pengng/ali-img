const assert = require('assert')
const AliImg = require('../lib/file')

const img = new AliImg({
  region: 'oss-cn-shenzhen',
  bucket: 'staticcc',
  accessKeyId: 'LTAIrREO4DyvMWqr',
  accessKeySecret: 'uGtgrYjaJjGpZKjKjAR8qwVqeS6Zux'
})

describe('test lib/file.js', function () {
  // it('test getMD5()', function () {
  //   const md5str = img.getMD5('Hello World')
  //   assert.equal(md5str, 'sQqNsWTgdUEFt6mb5y4/5Q==')
  // })
  // it('test getObject()', function (done) {
  //   img.getObject('google.png', function (err, response, body) {
  //     if (err) {
  //       return console.error(err)
  //     }
  //     console.log(body)
  //     done()
  //   })
  // })
  // it('test putObject()', function (done) {
  //   img.putObjectFromUrl('http://wx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTLmnGMszeibYjRDarwbbSErz3oTQZ7PJLVCzIBBA1NwoONXjf5wIVOl223iaTia9BVQkLrCOL6IGk42Q/0', 'google4.png', function (err, response, body) {
  //     console.log(arguments)
  //     done()
  //   })
  // })
  it('test Img()', function (done) {
    const url = 'http://wx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTLmnGMszeibYjRDarwbbSErz3oTQZ7PJLVCzIBBA1NwoONXjf5wIVOl223iaTia9BVQkLrCOL6IGk42Q/0'
    img(url)
      .circle(1000)
      .format('png')
      .write('lib/6.png', (err) => {
        console.log(err)
        console.log('success')
        done()
      })
  })
})
