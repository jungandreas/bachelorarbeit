var express = require('express');
var router = express.Router();
const https = require('https');
var date = "";
var keys = require('./keys');
var clientIdPolar = keys.IdPolar;
var clientSecretPolar = keys.SecretPolar;
var redirectURIPolar = keys.URIPolar;
var encodedSecretAndClientPolar = Buffer.from(clientIdPolar+':'+clientSecretPolar).toString('base64');


/* GET  */
router.get('/', function (req, res, next) {
    date = req.query.date;
    //console.log(date);
    res.redirect('https://flow.polar.com/oauth2/authorization?response_type=code&scope=accesslink.read_all&client_id='+clientIdPolar+'&redirect_uri='+redirectURIPolar);
    //console.log('autentification code');
});

router.get('/token', function (req, res, next) {
    //console.log('token request')
    let code =req.query.code;
    //console.log('code='+code);
    requestTokenPolar(code, res);
   
});

router.post('/activity', function(req, res, next) {
    //console.log('get Activity Polar');
    let json = req.body;
    // console.log(json);
    let accessToken = json.accessToken;
    let userId = json.userId;
    let options = {
        hostname: 'www.polaraccesslink.com',
        port: 443,
        path: '/v3/users/'+userId+'/activity-transactions',
        method: 'POST',
        headers: {
            'Authorization': 'Bearer '+accessToken
        }
    };
    let body ='';
    // console.log(options);
    let allActivities = [];
    let postRequest = https.request(options, function(response) {
        response.setEncoding('utf8');
        // console.log('recevied response');
        // console.log(response.statusCode);
        if (response.statusCode == 201){
            response.on('data', function (chunk) {
                // console.log('recivied Data');
                let jsonResponse = JSON.parse(chunk);
                let url = jsonResponse['resource-uri'];
                fetch(url, {
                    headers: {
                        'Authorization': 'Bearer '+accessToken
                    }
                }).then(function(listActivitesResponse){
                    return listActivitesResponse.json();
                }).then(function(listActivitesJson){   
                    return new Promise(function(resolve, reject){
                        for (var i = 0; i < listActivitesJson["activity-log"].length; i++) {
                            fetch(listActivitesJson["activity-log"][i], {
                                headers: {
                                    'Authorization': 'Bearer '+accessToken
                                }
                            }).then(function(activityResponse) {
                                return activityResponse.json();
                            }).then(function(activityResponseJson) {
                                allActivities.push(activityResponseJson);
                                if (listActivitesJson["activity-log"].length===allActivities.length) {
                                    resolve();
                                }
                            });
                        }
                    });
                    
                }).then(function(){
                    //console.log(allActivities);
                    let onlyOneActivityperDate = [];
                    // console.log('onlyOneActivityperDate Length: ' + onlyOneActivityperDate.length);
                    for (var i = 0; i < allActivities.length; i++) {
                        // console.log('For Loop allActivities ' + i);
                        if (onlyOneActivityperDate.length > 0) {
                            let needTopush = true;
                            for (var j = 0; j < onlyOneActivityperDate.length; j++) {
                                // console.log('For Loop onlyOneActivityperDate '+ j);
                                let dateOnlyOneActivityperDate = new Date(onlyOneActivityperDate[j].date);
                                let createdOnlyOneActivityperDate = new Date(onlyOneActivityperDate[j].created);
                                // console.log('onlyOneActivityperDate: ');
                                // console.log(+dateOnlyOneActivityperDate);
                                // console.log(+createdOnlyOneActivityperDate);
                                let dateAllActivities = new Date(allActivities[i].date)
                                let createdAllActivities = new Date(allActivities[i].created)
                                // console.log('allActivities: ');
                                // console.log(+dateAllActivities);
                                // console.log(+createdAllActivities);
                                if (+dateOnlyOneActivityperDate == +dateAllActivities) {
                                    needTopush = false;
                                    if (+createdOnlyOneActivityperDate < +createdAllActivities) {
                                        onlyOneActivityperDate[j] = allActivities[i];
                                    }
                                    j = onlyOneActivityperDate.length;
                                }
                            }
                            if(needTopush) {
                                onlyOneActivityperDate.push(allActivities[i]);
                            }
                        }
                        else {
                            onlyOneActivityperDate.push(allActivities[i]);
                        }
                    }
                    //console.log(onlyOneActivityperDate);
                    res.send(onlyOneActivityperDate);
                });
            });
        }
        else {
            //console.log('no data');
            let data = {
                steps: 'empty',
                statusCode: response.statusCode
        };
            res.send(JSON.stringify(data));
        }
    });
    // console.log('before write');
    postRequest.write(body);
    // console.log('before end');
    postRequest.end();
    // console.log('after end');    
});


module.exports = router;

require('es6-promise').polyfill;
require('isomorphic-fetch');



function requestTokenPolar(code, res) {
    let body = 'grant_type=authorization_code&redirect_uri='+redirectURIPolar+'&code='+code;
    // console.log('body='+body);
    let options ={
        hostname: 'polarremote.com',
        port: 443,
        path: '/v2/oauth2/token',
        method: 'POST',
        headers: {
            'Authorization': 'Basic '+ encodedSecretAndClientPolar,
            'Content-Type' : 'application/x-www-form-urlencoded',
            'Accept': 'application/json;charset=UTF-8'
        }
    };
    // console.log(options);

    let postRequest = https.request(options, function(response) {
        response.setEncoding('utf8');
        // console.log('resevied response');
        response.on('data', function (chunk) {
            // console.log('recivied Data');
            let jsonResponse = JSON.parse(chunk);
            // console.log('Response: '+ JSON.stringify(jsonResponse));
            let access_token = jsonResponse.access_token;
            let userId = jsonResponse.x_user_id;
            // console.log(access_token);
            res.redirect('http://localhost:3001?ActivityTracker=polar&expires_in='+jsonResponse.expires_in+'&access_token='+access_token+'&user_id='+userId+'&date='+date);
            // console.log('redirect to home page');
        });
        
    });
    // console.log('before write');
    postRequest.write(body);
    // console.log('before end');
    postRequest.end();
    // console.log('after end');
}

