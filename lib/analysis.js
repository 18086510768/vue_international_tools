//==================================================
//                    主分析方法
// write by wangyue
// 2019-10-23
//==================================================
/**
 * 分析中文字符串在文件中的类型
 * @param {String} line
 * @param {String} zhWords
 */
function tasteType(line, zhWords) {
  let zhPositionObj = { // 中文位置描述对象
    type: 'html', //中文字符串所在的位置，字典：html、htmlProp、htmlPropJoin、singleWords、script,scriptEs6Join,scriptNote,默认html
    needTranslate: true, //是否需要翻译
    prop: null //属性名（可能含有：@等字符）,type为htmlProp时需要
  }

  let tryStrArr = [] //判断规则

  if (!(/^[\u4E00-\u9FA5]+$/).test(line.trim())) { //非纯中文行
    if (checkHtml(line)) { //html行
      tryStrArr = ['=\"', '=\''] // 规则：判断是否在标签属性中
      let unNormalStrArr = ['==\"', '==\''] //排除规则： 排除 =='女' 或者 ==='女'的情况
      let isAtProp = tryStrArr.some(item => line.includes(addTryWords(zhWords, item))) // 中文是否在标签内的属性中
      let isUnNormal = unNormalStrArr.some(item => line.includes(addTryWords(zhWords, item))) //排除

      if (isAtProp && !isUnNormal) { //在属性中，排除==",类似title="****"
        console.log('属性中,需要给属性加:')
        let tryWords = tryStrArr.filter(item => line.includes(addTryWords(zhWords, item)))[0] + zhWords

        zhPositionObj.type = 'htmlProp'
        zhPositionObj.prop = getZhWordsProp(line, tryWords)
      } else { //在属性中，但参与拼接或者用于判断,类似==>'套间：'+items.suiteName、item2.studentSex == '女'
        let tryJoinStrArr = ['\"', '\'']
        let htmlPropJoin = tryJoinStrArr.some(item => line.includes(addTryWords(zhWords, item, true)))

        if (htmlPropJoin) {
          zhPositionObj.type = 'htmlPropJoin'
        }
      }
    } else { //js行
      tryStrArr = ['\"', '\''] // 规则：判断是否为js注释

      let isNotScriptNote = tryStrArr.some(item => line.includes(addTryWords(zhWords, item, true)))

      if (isNotScriptNote) { //js中的中文
        zhPositionObj.type = 'script'
      } else { //js行中es6拼接或者注释
        //生成判断类似es6拼接的正则
        // let isJoinReg = new RegExp("/`(([^\u4e00-\u9fa5]*[\u4e00-\u9fa5]*)*" + zhWords + "([^\u4e00-\u9fa5]*[\u4e00-\u9fa5]*)*)+`/g")
        if (eval('/`(([^\u4e00-\u9fa5]*[\u4e00-\u9fa5]*)*' + zhWords + '([^\u4e00-\u9fa5]*[\u4e00-\u9fa5]*)*)+`/g').test(line)) { //  /`(([^\u4e00-\u9fa5]*[\u4e00-\u9fa5]*)*我怕大象([^\u4e00-\u9fa5]*[\u4e00-\u9fa5]*)*)+`/g.test('let a = `${b}我怕大象?s实打实add爱迪生a${b}`')
          zhPositionObj.type = 'scriptEs6Join'
        } else {
          zhPositionObj.type = 'scriptNote'
          zhPositionObj.needTranslate = false //注释行不需要翻译
        }
      }
    }
  } else { //纯中文行
    zhPositionObj.type = 'singleWords'
  }
  console.log('尝出味道了==>', zhPositionObj)
  return zhPositionObj
}

/**
 * 字符串中是否含有html标签
 * @param {String} htmlStr
 */
function checkHtml(htmlStr) {
  let reg = /<[^>]+>/g; //匹配html规则

  return reg.test(htmlStr)
}

/**
 * 给中文字符两侧添加需尝试的字符，以便定位中文所处位置
 * @param {String} words 中文字符
 * @param {String} tryStr 需要尝试拼装的字符
 * @param {Boolean} tryStr 是否严格匹配
 */
function addTryWords(words, tryStr, strict = false) {
  return `${tryStr}${words}${strict ? tryStr : ''}`
}

/**
 * 获取属性中的中文所依附的属性
 * @param {String} line
 * @param {String} tryWords
 */
function getZhWordsProp(line, tryWords) {
  let wordsIndex = line.indexOf(tryWords)
  let splitWordsArr = line.slice(0, wordsIndex).split(' ') //空格隔开词组
  let prop = splitWordsArr[splitWordsArr.length - 1]

  return prop
}


module.exports = tasteType
