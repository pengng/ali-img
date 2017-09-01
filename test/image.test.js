const assert = require('assert')
const AliImage = require('../lib/image')

describe('test image.js', () => {
  it('test toString()', () => {
    const image = new AliImage('objectName')
    image.resize(100, 200).circle(100)
    const newImage = new AliImage('objectName2')
    newImage
      .resize(200, 200)
      .circle(200)
      .format('png')
      .watermark(20, 20, image, { position: 'se'})
      .circle(200)
      .watermark(20, 20, image, { position: 'se'})
      .fontSize(25)
      .fill('000000')
      .font('方正楷体')
      .drawText(200, 200, '今天天气不错！')
    const str = newImage.toString()
    console.log(str)
  })
})