var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index.js');
var usersRouter = require('./routes/users.js');
var fitbitRouter = require('./routes/fitbit.js');
var polarRouter = require('./routes/polar.js');
var blockchainRouter = require('./routes/blockchain.js');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/fitbit', fitbitRouter);
app.use('/polar', polarRouter);
app.use('/data', blockchainRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

///////////////////////////////////////////////////////////////////////////


// app.get('/', function (req, res) {
//   authenticateFitbit();
//   console.log('test');
//   res.send('Hello World!');
// });

app.listen(3001, function () {
  console.log('Example app listening on port 3001!');

});
/*
app.get('/daten', function(req,res){
  res.sendfile(__dirname + '/public/daten.html');
 });

 app.get('/vergleichen', function(req,res){
  res.sendfile(__dirname + '/public/vergleichen.html');
 });
/*
require('es6-promise').polyfill;
require('isomorphic-fetch');

fetch('http://localhost:3000/api/Commodity')
.then(function(response){
  return response.json();
})
.then(function(myJson){
  console.log(JSON.stringify(myJson))
})

fetch('http://localhost:3000/api/Trader')
.then(function(response){
  return response.json();
})
.then(function(myJson){
  console.log(JSON.stringify(myJson))
})
*/

function authenticateFitbit() {
  fetch('https://fitbit.com/oauth2?response_type=code&client_id=22D9J7&redirect_uri=http%3A%2F%2Flocalhost:3000&scope=activity%20profile')
      .then(function (response) {
          let code = window.location.search.substring(6);
          console.log(code);
          requestTokenFitbit(code);
      })
}


function requestTokenFitbit(code) {
  fetch('https://api.fitbit.com/oauth2/token')
      .then(function (response) {
          console.log(response);
      })
}

function getActivityOnDate(userId) {
  let date = document.getElementById('date').value;
  fetch('https://api.fitbit.com/1/user/' + userId + '/activities/date' + date + '.json')
}