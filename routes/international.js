const express = require('express');
const router = express.Router();
const fs = require('fs');

const path = require('path');
const tasteType = require('../lib/analysis'); //主分析方法

const LineByLineReader = require('line-by-line'); //逐行读取文件
const os = require('os');

const Translator = require('../lib/translator'); //有道翻译

const multer = require('multer') //文件上传中间件
const moment = require('moment') //事件处理moment
const nowTime = moment(new Date().getTime()).format('YYYYMMDDHHmmss')
const uploadFolder = './upload/' + nowTime + '/' //文件保存目录

//创建文件夹
let createFolder = function (folder) {
  try {
    fs.accessSync(folder)
  } catch (e) {
    fs.mkdirSync(folder)
  }
};

// 通过 filename 属性定制
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    createFolder(uploadFolder) //创建文件夹
    cb(null, uploadFolder) // 保存的路径，备注：需要自己创建
  },
  filename: function (req, file, cb) {
    // 将保存文件名设置为 字段名 + 时间戳，比如 logo-1478521468943
    // cb(null, file.fieldname + '-' + Date.now())
    cb(null, file.originalname)
  }
});
// 通过 storage 选项来对 上传行为 进行定制化,自定义文件名
var upload = multer({
  storage: storage
})

//全局配置项
const cutTransWordsLen = 15 // 翻译的最长字符
let ip //ip地址

//有道翻译translator配置项
let translator = new Translator()

translator.config = {
  from: 'zh_CHS', // zh-CHS(中文) || ja(日语) || EN(英文) || fr(法语) ...
  to: 'EN',
  appKey: 'YouAppKey', // https://ai.youdao.com 
  secretKey: 'YouSecretKey'
}

/* 测试：node.js读取文件 */
router.get('/readFile', function (req, res, next) {
  // 异步读取
  fs.readFile(path.join(__dirname, '../static/test.vue'), function (err, data) {
    if (err) {
      res.send(err);
    }
    res.send(data.toString());
  });
});

/* 文件上传接口 */
router.post('/uploadTransFiles', upload.array('transFiles'), function (req, res, next) {
  let file = req.files //上传的文件对象数组
  let logStr = '' // 日志文件
  const mimeTypeArr = ['vue', 'html', 'xhtml', 'js', 'txt', 'css', 'scss']
  ip = req.headers['host'] ? req.headers['host'] : req.ip //获取IP地址
  global.Log.info('ip==>\n', req.headers)
  let preWriteFileArr = file.map(item => {
    logStr += JSON.stringify(item)
    let fileType = item.originalname.split('.').slice().pop()
    if (mimeTypeArr.some(el => el == fileType)) {
      return {
        path: '.' + uploadFolder + item.originalname,
        filename: item.originalname.replace(`.${fileType}`, ''),
        mimetype: fileType
      }
    }
  }).filter(el => el)
  global.Log.info('files==>\n', logStr)
  if (preWriteFileArr && preWriteFileArr.length) {
    writeFile(preWriteFileArr).then(data => {
      res.send({
        code: 1,
        msg: '翻译文件成功',
        path: data
      }) //自动国际化完成，输出文件地址
    })
  } else {
    res.send({
      code: 0,
      msg: '没有上传有效的文件，请上传' + mimeTypeArr.join('、') + '类型的文件'
    })
  }
});

/**
 * 循环写入文件
 * @param {Array} fileArr 
 */
async function writeFile(fileArr) {
  let ouputArr = [] //输出下载路径对象数组
  createFolder('./static/output/' + nowTime + '/') //创建输出文件夹
  for (let i = 0; i < fileArr.length; i++) {
    let writedPathObj = await readLine(fileArr[i]) //写入成功返回输出路径的对象
    ouputArr.push(writedPathObj)
  }
  return ouputArr
}

/**
 * 逐行写入方法
 * @param {Object} fileObj 
 */
function readLine(fileObj) {
  return new Promise((resolve, inject) => {
    const OUTPUTTYPE = 'js'; //翻译文件输出类型，枚举'js'、'json',默认js
    let fReadName = path.join(__dirname, fileObj.path); //读入文件
    let fWriteMainName = path.join(__dirname, `../static/output/${nowTime}/${fileObj.filename}.${fileObj.mimetype}`); //输出主文件
    let fWriteZhName = path.join(__dirname, `../static/output/${nowTime}/${fileObj.filename}_zh.${OUTPUTTYPE}`); //输出中文json文件
    let fWriteEnName = path.join(__dirname, `../static/output/${nowTime}/${fileObj.filename}_en.${OUTPUTTYPE}`); //输出英文接送文件

    let firstLineFlag = true
    let lr = new LineByLineReader(fReadName); //逐行读取插件
    let fWriteM = fs.createWriteStream(fWriteMainName); //创建主文件写入流
    let fWriteZh = fs.createWriteStream(fWriteZhName); //创建中文文件写入流
    let fWriteEn = fs.createWriteStream(fWriteEnName); //创建英文文件写入

    lr.on('line', function (line) {
      lr.pause(); // 暂停读行

      // 输出国际化文件首行
      if (firstLineFlag) {
        let outputFirstLine = OUTPUTTYPE == 'js' ? 'export default {' : '{'
        fWriteZh.write(outputFirstLine + os.EOL)
        fWriteEn.write(outputFirstLine + os.EOL)
        firstLineFlag = false
      }

      //异步写入
      if (isNote(line)) { //当前行为注释或日志行
        fWriteM.write(line + os.EOL)
        lr.resume() // 继续读行
      } else {
        /**
         * 正则/[\u4e00-\u9fa5]+/g匹配出中文词组，+号为出现1次或者多次
         * 1.中文数字组合
         * 2.中文冒号组合
         * 3.中文单位组合（人）
         * 4.中文/组合（/ \）
         * */
        const ZHRULE = /([\u4e00-\u9fa5]*[0-9]*[\u4e00-\u9fa5]+[0-9]*[:：\/\\\（）\(\)]*)+/g
        let findZhLine = line.match(ZHRULE); //按匹配规则分割出中文词组
        if (findZhLine != null) { //待翻译的数组
          getTranslateLine(line, findZhLine, fileObj.filename).then(res => { //获取国际化后的当前行，准备写入
            fWriteM.write(res.line + os.EOL) // 写入主文件
            res.wirteConfigPropArr.forEach(item => { //写入翻译配置文件
              fWriteZh.write(creatKeyValueStr(item.prop, item.zhWords) + os.EOL) // 中文
              fWriteEn.write(creatKeyValueStr(item.prop, item.translatedWords) + os.EOL) //英文
            })
            lr.resume() // 继续读行
          })
        } else {
          fWriteM.write(line + os.EOL)
          lr.resume() // 继续读行
        }
      }
    });

    //读行异常
    lr.on('error', function (err) {
      console.log('readline error...', error)
      global.Log.error('readError==>', error)
    });

    //读行结束
    lr.on('end', function () {
      fWriteZh.write('}')
      fWriteEn.write('}')
      resolve({
        mainFilePath: `/output/${nowTime}/${fileObj.filename}.${fileObj.mimetype}`,
        zhFilePath: `/output/${nowTime}/${fileObj.filename}_zh.${OUTPUTTYPE}`,
        enFilePath: `/output/${nowTime}/${fileObj.filename}_en.${OUTPUTTYPE}`
      })
      console.log('readline close...')
    });
  })
}

/**
 * 是否注释、日志
 * @param {*String} str 
 */
function isNote(str) {
  let trimStr = str.trim()
  let noteFlagArr = ['<!--', '//', '/*', 'console.'] //注释、日志标识数组
  return noteFlagArr.some(item => trimStr.indexOf(item) === 0)
}

/**
 * 获取翻译后的行
 * @param {String} line 
 * @param {Array} zhArr 
 * @param {String} fileName 
 */
let propTotalMap = new Map() // 英文属性全量Map,['name','姓名']
let samePropIndex = 1 // 英文属性重名后的自增序号
async function getTranslateLine(line, zhArr, fileName) {
  let wirteConfigPropArr = []
  if (line && zhArr && zhArr.length) {
    for (let i = 0; i < zhArr.length; i++) {
      let zhType = tasteType(line, zhArr[i]) //获取当前中文所处位置
      if (zhType.needTranslate) { //需要翻译
        let enWords = await translator.translate(zhArr[i].slice(0, cutTransWordsLen)) //有道翻译
        let propStatus = isAtPropMap(propTotalMap, createCamelEnProp(enWords), zhArr[i]) //去重后的属性名对象
        if (propStatus.needWirte) wirteConfigPropArr.push({ //将非重复的属性加入待写入数组
          prop: propStatus.prop, //属性名
          translatedWords: enWords, //翻译后的英文
          zhWords: zhArr[i] //中文
        })
        let prop = propStatus.prop //获取过滤后的属性
        line = formartEnStr(zhType, `${fileName}.${prop}`, line, zhArr[i])
      }
    }
    console.log('line==>' + line)
  }
  return {
    line,
    wirteConfigPropArr
  }
}

//=====================替换规则=========================
/**
 * 格式化用于替换主文件的英文字符串
 * @param {String} fileNameAndProp 文件名加英文属性名,test.login
 * @param {Object} typeObj 中文在当前行的类型对象
 * @param {String} line 
 * @param {String} zhWords 
 */
function formartEnStr(typeObj, fileNameAndProp, line, zhWords) {
  const typeActionMap = new Map([
    ['html', () => line.replace(zhWords, `{{$t('${fileNameAndProp}')}}`)],
    ['htmlProp', () => {
      if (typeObj && typeObj.prop) {
        if (!typeObj.prop.includes(':')) {
          line = line.replace(typeObj.prop, `:${typeObj.prop}`)
        }
        return line.replace(zhWords, `$t('${fileNameAndProp}')`)
      }
    }],
    ['htmlPropJoin', () => {
      let oldWords = line.includes(`'${zhWords}'`) ? `'${zhWords}'` : `"${zhWords}"`
      return line.replace(oldWords, `$t('${fileNameAndProp}')`)
    }],
    ['singleWords', () => line.replace(zhWords, `{{$t('${fileNameAndProp}')}}`)],
    ['script', () => {
      let oldWords = line.includes(`'${zhWords}'`) ? `'${zhWords}'` : `"${zhWords}"`
      return line.replace(oldWords, `this.$t('${fileNameAndProp}')`)
    }],
    ['scriptEs6Join', () => {
      return line.replace(zhWords, `\$\{this.$t('${fileNameAndProp}')\}`)
    }]
  ])

  try {
    return typeActionMap.get(typeObj.type)() || line
  } catch (e) {
    return line
  }
}

/**
 * 创建键值对字符串
 * @param {String} key 
 * @param {String} value 
 * @param {String} type 
 */
function creatKeyValueStr(key, value, type = 'js') {
  return type == 'js' ? `${key}:'${value}',` : `"${key}":"${value}",`
}

/**
 * 判断属性是否在集合中，并返回属性
 * @param {Map} propMap //英文属性全量数组
 * @param {String} prop 
 * @param {String} zhWords 
 */
function isAtPropMap(propMap, prop, zhWords) {
  let status = {
    prop,
    needWirte: true //是否需要写入国际化文件
  }
  if (propMap.has(prop)) { //属性集合中已有属性
    if (propMap.get(prop) === zhWords) {
      status.needWirte = false
    } else {
      status.prop += samePropIndex
      propMap.set(status.prop, zhWords)
      samePropIndex++
    }
  } else {
    propMap.set(prop, zhWords)
  }
  return status
}

/**
 * 创建驼峰处理的英文属性
 * @param {String} enWords 
 */
function createCamelEnProp(enWords) {
  let enSplitArr = enWords.split(' ')
  let camelStr = ''
  const SPECIALSTR = /[`~!@#$%^&*()_\-+=<>?:"{}|,.\/;'\\[\]·~！@#￥%……&*（）——\-+={}|《》？：“”【】、；‘'，。、]/g //匹配特殊字符
  const MAXWORDSLEN = 6 //超出截取驼峰处理单词数
  const cutSingleWordsLen = 4 //截取字符长度
  if (enSplitArr.length < MAXWORDSLEN) { //小于MAXWORDSLEN完整保留且驼峰处理
    enSplitArr.forEach((item, idx) => camelStr += idx === 0 ? item.toLocaleLowerCase() : item.slice(0, 1).toUpperCase() + item.slice(1))
  } else {
    enSplitArr.slice(0, MAXWORDSLEN).forEach((item, idx) => camelStr += idx === 0 ? item.toLocaleLowerCase() : item.slice(0, 1).toUpperCase() + item.slice(1, cutSingleWordsLen))
  }
  return camelStr.replace(SPECIALSTR, '') //去除属性中的特殊字符并返回
}

module.exports = router;