
const FileCloud = require('../lib/file')
const { AliImage } = FileCloud

const fileCloud = new FileCloud({
  region: '',
  bucket: '',
  accessKeyId: '',
  accessKeySecret: ''
})

const markImage = new AliImage('article/img/15005444701702203.png')
const image = new AliImage('article/img/15005444701987303.png')
markImage.resize(100, 100).circle(100)
image
  .watermark(100, 100, markImage, {
    position: 'nw'
  })
  .resize(800, 800)
  .circle(800)
  .drawText(100, 100, 'Hello')
  .format('png')

const url = fileCloud.getUrl(image)
console.log(url)
