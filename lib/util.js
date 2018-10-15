const { HTTPError } = require('./error')

// 获取对象的指定键的值，忽略大小写
const getVal = function(obj, key) {
    // 传入值转小写形式
    key = key.toLowerCase()
    // 找到对象的真实键名
    let realKey = Object.keys(obj).find(function (k) {
        return k.toLowerCase() === key
    })

    return obj[realKey]
}

/**
 * 合成成功和错误回调，返回新的函数，用于处理HTTP响应的分支处理
 * @param {Function} succ 成功回调
 * @param {Function} fail 错误回调
 */
const compose = function(succ, fail) {
    // 返回新的函数，接收响应对象
    return function (res) {
        let { statusCode } = res
        // 当响应状态码不是200时，调用错误回调
        if (statusCode < 200 || statusCode >= 300) {
            let buf = []
            res.on('data', Array.prototype.push.bind(buf)).on('end', function () {
                // 将状态码和主体数据传给错误回调
                fail(new HTTPError(statusCode, Buffer.concat(buf).toString()))
            })
        } else {
            // 调用成功回调，丢弃主体数据
            res.resume()
            succ()
        }
    }
}

module.exports = { getVal, compose }