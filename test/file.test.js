
const AliImg = require('../lib/file')

const img = new AliImg({
  region: 'oss-cn-shenzhen',
  bucket: 'staticcc',
  accessKeyId: 'LTAIrREO4DyvMWqr',
  accessKeySecret: 'uGtgrYjaJjGpZKjKjAR8qwVqeS6Zux'
})

const url = img('article/img/15005444701702203.png').drawText(100, 100, '测试').format('png').resize(400, 400).getUrl()
console.log(url)
