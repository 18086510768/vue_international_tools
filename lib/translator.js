const request = require('request-promise')
var crypto = require('crypto');

//其他翻译接口：阿凡达免费翻译接口 AppKey：	4dfc58d4d4b84a5c885db8597275874c

/**
 * 翻译器
 */
function Translator() {
  this.config = {
    from: '',
    to: '',
    appKey: '', //应用id
    secretKey: '', //密钥
  }
}

/**
 * sha256加密
 */
Translator.prototype.sha256 = function sha256(str) {
  var crypto_sha256 = crypto.createHash("sha256");
  crypto_sha256.update(str);
  return crypto_sha256.digest('hex');
}

/**
 * 生成[0,n]区间的随机整数
 * 比如生成[0,100]的闭区间随机整数，getRandomN(100)
 */
Translator.prototype.getRandomN = function getRandomN(roundTo) {
  return Math.round(Math.random() * roundTo);
}

/**
 * {a:'111',b:'222'} => a=111&b=222
 */
Translator.prototype.generateUrlParams = function generateUrlParams(_params) {
  const paramsData = [];
  for (const key in _params) {
    if (_params.hasOwnProperty(key)) {
      paramsData.push(key + '=' + _params[key]);
    }
  }
  const result = paramsData.join('&');
  return result;
}

/**
 * 进行翻译
 */
Translator.prototype.translate = async function (word) {
  let youdaoHost = 'http://openapi.youdao.com/api';
  // 在get请求中，中文需要进行uri编码
  let encodeURIWord = encodeURI(word);
  let salt = this.getRandomN(1000);
  let curtime = parseInt(new Date().getTime() / 1000); //秒为单位的时间戳
  // let curtime = 1571997753;
  //超过20个字符需要特殊加密处理,参见文档https://ai.youdao.com/appmgr.s，微信登录
  let sign = this.sha256(this.config.appKey + word + salt + curtime + this.config.secretKey);
  let paramsJson = {
    q: encodeURIWord,
    from: this.config.from,
    to: this.config.to,
    appKey: this.config.appKey,
    salt: salt,
    sign: sign,
    signType: 'v3',
    curtime
  }
  console.log('有道接口参数==》', paramsJson)
  // let url = `http://openapi.youdao.com/api?q=${encodeURI(q)}&from=${from}&to=${to}&appKey=${appKey}&salt=${salt}&sign=${sign}`;
  let url = youdaoHost + '?' + this.generateUrlParams(paramsJson);
  let result = await request.get({
    url: url
  });
  return 'translation' in JSON.parse(result) ? JSON.parse(result)['translation'][0] : word
}

module.exports = Translator;