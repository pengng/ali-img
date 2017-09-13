const assert = require('assert')
const AliImg = require('../lib/file')

const img = new AliImg({
  region: 'oss-cn-shenzhen',
  bucket: 'staticcc',
  accessKeyId: 'LTAIrREO4DyvMWqr',
  accessKeySecret: 'uGtgrYjaJjGpZKjKjAR8qwVqeS6Zux'
})

describe('test lib/file.js', function () {
  it('test getMD5()', function () {
    const md5str = img.getMD5('Hello World')
    assert.equal(md5str, 'sQqNsWTgdUEFt6mb5y4/5Q==')
  })
  it('test getObject()', function (done) {
    img.getObject('google.png', function (err, response, body) {
      if (err) {
        return console.error(err)
      }
      console.log(body)
      done()
    })
  })
})
