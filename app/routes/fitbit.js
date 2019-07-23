var express = require('express');
var router = express.Router();
const https = require('https');
var date = "";
var expiresIn = 28800;
var keys = require('./keys');
var clientIdFitbit = keys.IdFitbit;
var clientSecretFitbit = keys.SecretFitbit;
var redirectURIFitbit = keys.URIFitbit;
var encodedSecretAndClientFitbit = Buffer.from(clientIdFitbit+':'+clientSecretFitbit).toString('base64');


/* GET  */
router.get('/', function (req, res, next) {
    date = req.query.date;
    // console.log(date);
    res.redirect('https://www.fitbit.com/oauth2/authorize?response_type=code&client_id='+clientIdFitbit+'&redirect_uri='+redirectURIFitbit+'&scope=activity%20profile&expires_in=' + expiresIn);
    // console.log('autentification code');
});

router.get('/token', function (req, res, next) {
    //console.log('token request')
    let code =req.query.code;
    //console.log('code='+code);
    // res.redirect(307, 'https://api.fitbit.com/oauth2/token');
    requestTokenFitbit(code, res);
   
});

router.post('/refreshToken', function (req, res, next) {
    //console.log('token refresh')
    let json = req.body;
    date = req.query.date;
    // console.log(date);
    // console.log(json);
    let body = 'grant_type=refresh_token&refresh_token='+json.refresh_token+'&expires_in='+expiresIn;
    // console.log(body);
    let options = {
        hostname: 'api.fitbit.com',
        port: 443,
        path: '/oauth2/token',
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + encodedSecretAndClientFitbit,
            'Content-Type' : 'application/x-www-form-urlencoded'
        }
    }

    let postRequest = https.request(options, function(response) {
        response.setEncoding('utf8');
        response.on('data', function (chunk) {
            let jsonResponse = JSON.parse(chunk);
            // console.log('Response: '+ JSON.stringify(jsonResponse));
            let access_token = jsonResponse.access_token;
            let userId = jsonResponse.user_id;
            let refresh_token = jsonResponse.refresh_token;
            let expiresIn = jsonResponse.expires_in;
            // console.log(access_token);
            // console.log('Date: '+date);
            //res.send(jsonResponse);
            res.redirect('http://localhost:3001?ActivityTracker=fitbit&expires_in='+expiresIn+'&access_token='+access_token+'&refresh_token='+refresh_token+'&user_id='+userId+'&date='+date);
            // console.log('redirect to home page')
        });
        
    });
    postRequest.write(body);
    postRequest.end();
});

module.exports = router;

require('es6-promise').polyfill;
require('isomorphic-fetch');




function requestTokenFitbit(code, res) {
    let body = 'client_id='+clientIdFitbit+'&grant_type=authorization_code&redirect_uri='+redirectURIFitbit+'&code='+code+'&expires_in=' + expiresIn;
    // console.log('body='+body);
    let options ={
        hostname: 'api.fitbit.com',
        port: 443,
        path: '/oauth2/token',
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + encodedSecretAndClientFitbit,
            'Content-Type' : 'application/x-www-form-urlencoded'
        }
    }

    let postRequest = https.request(options, function(response) {
        response.setEncoding('utf8');
        response.on('data', function (chunk) {
            let jsonResponse = JSON.parse(chunk);
            // console.log('Response: '+ JSON.stringify(jsonResponse));
            let access_token = jsonResponse.access_token;
            let userId = jsonResponse.user_id;
            let refresh_token = jsonResponse.refresh_token;
            // console.log(access_token);
            res.redirect('http://localhost:3001?ActivityTracker=fitbit&expires_in='+jsonResponse.expires_in+'&access_token='+access_token+'&refresh_token='+refresh_token+'&user_id='+userId+'&date='+date);
            // console.log('redirect to home page')
        });
        
    });
    postRequest.write(body);
    postRequest.end();
}
