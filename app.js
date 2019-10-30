let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');

//===解析参数中间件===
let bodyParser = require('body-parser');

let international = require('./routes/international');


//====全局日志模块====
let log4js = require('log4js');
// 注：配置里的日志目录要先创建，才能加载配置，不然会出异常

log4js.configure('./log4js.json');
let log = log4js.getLogger('logInfo');

global.Log = log;

let app = express();

// =========view engine setup,设置html为新的模板引擎==============
let ejs = require('ejs'); //我是新引入的ejs插件

app.engine('html', ejs.__express);
app.set('view engine', 'html');

//=============默认的jade模板引擎=================
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); //设置可静态访问的文件夹
app.use(express.static(path.join(__dirname, 'static'))); //设置可静态访问的文件夹

// parse application/x-www-form-urlencoded 解析参数
app.use(bodyParser.urlencoded({
  extended: false
}))
// parse application/json 解析参数
app.use(bodyParser.json())

app.use('/international', international);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
