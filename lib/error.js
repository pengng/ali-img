const AliImgError = function (message, code) {
  this.message = message
  this.code = code || -1
  this.name = 'AliImgError'
  Error.captureStackTrace(this, AliImgError)
}
AliImgError.prototype = Object.create(Error.prototype)

const HTTPError = function (statusCode, message) {
  this.statusCode = statusCode
  this.message = message || ''
  this.name = 'HTTPError'
  Error.captureStackTrace(this, HTTPError)
}
HTTPError.prototype = Object.create(Error.prototype)

module.exports = {
  AliImgError: AliImgError,
  HTTPError: HTTPError
}