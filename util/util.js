/* 
这里面封装的是共用方法及属性值
*/
const jwt = require('jsonwebtoken'); 

//加密算法
function rstr2b64(input) {
  var b64pad = ''
  var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var output = "";
  var len = input.length;
  for (var i = 0; i < len; i += 3) {
    var triplet = (input.charCodeAt(i) << 16)
      | (i + 1 < len ? input.charCodeAt(i + 1) << 8 : 0)
      | (i + 2 < len ? input.charCodeAt(i + 2) : 0);
    for (var j = 0; j < 4; j++) {
      if (i * 8 + j * 6 > input.length * 8) output += b64pad;
      else output += tab.charAt((triplet >>> 6 * (3 - j)) & 0x3F);
    }
  }
  return output;
}

//生成token
let secretOrPrivateKey = "wxhwlx";// 这是加密的key（密钥）
function setToken(obj,time){
  let privateKey = secretOrPrivateKey;// 这是加密的key（密钥）
  let token = jwt.sign(obj, privateKey, {
    expiresIn: time // 过期时间，以秒为单位
  });
  return token;
}

//解析token
function getToken(token){
  return new Promise((resolve, reject) => {
    jwt.verify(token, secretOrPrivateKey, (err, decode) => {
      if(err){
        reject(err)
      }else(
        resolve(decode)
      )
    })
  })
}

module.exports = { rstr2b64, setToken, getToken };
