const assert = require('assert')
const config = require('./oss.config')
const AliImg = require('../lib/file')
const describe = function (description, task) {
  const success = function () {
    console.log('\x1b[32m%s\x1b[0m', description)
  }
  const fail = function (err) {
    console.error('\x1b[31m%s\n  %s\n  %s\x1b[0m', description, err.message, err.stack)
  }
  const callback = function (err) {
    if (err) {
      return fail(err)
    }
    success()
  }
  if (task.length === 1) {
    return task(callback)
  }
  try {
    task()
    success()
  } catch (err) {
    fail(err)
  }
}

const img = new AliImg(config)

describe('test lib/file.js', function () {
  const savePath = function () {
    describe('test savePath()', function (done) {
      img(__dirname + '/test.jpg').resize(500, 500).save('500x500.jpg', (err, url) => {
        if (err) {
          return done(err)
        }
        done()
        saveUrl(url)
      })
    })
  }
  const saveUrl = function (url) {
    describe('test saveUrl()', function (done) {
      img(url).drawText(20, 20, 'Hello').save('Hello.jpg', (err, url) => {
        if (err) {
          return done(err)
        }
        done()
        toStream(url)
      })
    })
  }
  const toStream = function (url) {
    describe('test stream()', function (done) {
      img(url).circle(600).stream().pipe(
        require('fs').createWriteStream(__dirname + '/circle_600.jpg').on('error', done).on('finish', function () {
          done()
          toBuffer(__dirname + '/circle_600.jpg')
        })
      )
    })
  }
  const toBuffer = function (fullpath) {
    describe('test toBuffer()', function (done) {
      img(fullpath).rotate(60).toBuffer(function (err, buf) {
        if (err) {
          return done(err)
        }
        require('fs').writeFile(__dirname + '/rotate_60.jpg', buf, function (err) {
          if (err) {
            return done(err)
          }
          done()
          write()
        })
      })
    })
  }
  const write = function () {
    describe('test write()', function (done) {
      img(__dirname + '/test.jpg').blur(20, 20).write(__dirname + '/blur_20.jpg', function (err, fullpath) {
        if (err) {
          return done(err)
        }
        done()
      })
    })
  }
  savePath()
})
