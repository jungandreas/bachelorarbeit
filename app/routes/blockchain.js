var express = require('express');
var router = express.Router();
var keys = require('./keys');
var clientIdFitbit = keys.IdFitbit;
var clientSecretFitbit = keys.SecretFitbit;
var redirectURIFitbit = keys.URIFitbit;
var encodedSecretAndClientFitbit = Buffer.from(clientIdFitbit+':'+clientSecretFitbit).toString('base64');
var clientIdPolar = keys.IdPolar;
var clientSecretPolar = keys.SecretPolar;
var redirectURIPolar = keys.URIPolar;
var encodedSecretAndClientPolar = Buffer.from(clientIdPolar+':'+clientSecretPolar).toString('base64');


router.get('/steps', function (req, res, next) {
    let user = req.query.user;
    getUserFromBlockchain(user)
        .then(function (blockchainUser) {
            //console.log(blockchainUser);
            getStepsBlockchain(user)
                .then(function (jsonStep) {
                    //console.log(jsonStep);
                    let forFrontend = formatForFrontendGraphics(jsonStep);
                    // console.log(forFrontend);
                    // console.log(blockchainUser[0].sharedWith);
                    getSharedData(blockchainUser[0].sharedWith, forFrontend)
                        .then(function (sharedData) {
                            // console.log(sharedData);
                            res.send(sharedData);
                        }).catch(function (error) {
                            res.status(501).send(error);
                        });

                }).catch(function (error) {
                    res.status(500).send(error);
                });
        }).catch(function (error) {
            res.status(500).send(error);
        });
});

router.get('/user', function (req, res, next) {
    let user = req.query.user;
    fetch('http://localhost:3000/api/queries/selectUserByUserIdActivityTracker?inputValue=' + user)
        .then(function (response) {
            return response.json();
        }).then(function (jsonRes) {
            // console.log(JSON.stringify(jsonRes));
            res.send(jsonRes);
        });
});

router.get('/', function (req, res, next) {
    res.redirect('http://localhost:3001/daten.html');
})


//refresh the Datas in the Blockchain
router.get('/refreshBlockchain', function (req, res, next) {
    let user = req.query.user;
    fetch('http://localhost:3000/api/queries/selectUserByUserIdActivityTracker?inputValue=' + user)
        .then(function (response) {
            return response.json();
        }).then(function (jsonRes) {
            //console.log(JSON.stringify(jsonRes));
            //check which Activity Tracker producer the user has
            switch (jsonRes[0].activityTracker) {
                case 'Fitbit':
                    fitbit(res, jsonRes, user);
                    break;
                case 'Polar':
                    polar(res, jsonRes, user);
                    break;
                default:
                    res.status(501).send('The Trackers from ' + jsonRes[0].activityTracker + 'is not implemented.');
                    break;
            }
        });
})


module.exports = router;

require('es6-promise').polyfill;
require('isomorphic-fetch');



//   ___________________________________________________
//  |    ______   ______             ______    ____    |
//  |   |      | |      |  |        |      |  |    |   |
//  |   |______| |      |  |        |______|  |____|   |
//  |   |        |      |  |        |      |  |\       |
//  |   |        |______|  |______  |      |  | \      |
//  |__________________________________________________|

/**
 * get the data from Polar and post it to the Blockchain
 * @param res to answer to the frontend which made the request to actualize the Blockchain
 * @param jsonRes the response from the Blockchain which contains the userId of the Blockchain and the accessToken
 * @param user the userId from Polar
 */
function polar(res, jsonRes, user) {
    let accessToken = jsonRes[0].accessToken;
    let userId = jsonRes[0].userId;
    //console.log('Polar')
    //console.log(userId);
    createTransactionPolar(accessToken, user)
        .then(function (transactionJson) {
            let url = transactionJson['resource-uri'];
            getActivtiesPolar(url, accessToken)
                .then(function (listActivitiesJson) {
                    getAllActivitiesPolar(listActivitiesJson["activity-log"], accessToken)
                        .then(function (allActivities) {
                            let onlyOneActivityperDate = getOnlyOneActivityperDatePolar(allActivities);
                            onlyOneActivityperDate.sort(function (a, b) {
                                let dateA = new Date(a.date);
                                let dateB = new Date(b.date);
                                return (+dateA) - (+dateB);
                            });
                            let newSteps = prepareStepsPushPolar(onlyOneActivityperDate, userId);
                            updateSteps(newSteps)
                                .then(function (addToBlockchainWorkedJson) {
                                    //console.log(addToBlockchainWorkedJson);
                                    // commitTransactionPolar(url, accessToken)
                                    //     .then(function (putSuccessfully) {
                                    //         // console.log(putSuccessfully);
                                    getStepsBlockchain(user)
                                        .then(function (jsonStep) {
                                            //console.log(jsonStep);
                                            let forFrontend = formatForFrontendGraphics(jsonStep);
                                            // console.log(forFrontend);
                                            // console.log(jsonRes[0].sharedWith);
                                            getSharedData(jsonRes[0].sharedWith, forFrontend)
                                                .then(function (sharedData) {
                                                    // console.log(sharedData);
                                                    res.send(sharedData);
                                                }).catch(function (error) {
                                                    res.status(501).send(error);
                                                });

                                        }).catch(function (error) {
                                            res.status(500).send(error);
                                        });
                                    // }).catch(function (error) {
                                    //     res.status(500).send(error);
                                    // });
                                }).catch(function (error) {
                                    res.status(500).send(error);
                                });
                        }).catch(function (error) {
                            res.status(500).send(error);
                        });
                }).catch(function (error) {
                    res.status(500).send(error);
                });
        }).catch(function (error) {
            // console.log(error);
            if (error == 204) {
                getStepsBlockchain(user).then(function (jsonStep) {
                    res.send(formatForFrontendGraphics(jsonStep));
                }).catch(function (error) {
                    res.status(500).send(error);
                })
            }
            else {
                res.status(500).send(error);
            }
        });
}

/**
 * Makes a new Transaction to Polar and sends it
 * @param accessToken to authenticate the user
 * @param user the id from polar
 * @returns {Promise} is resolved if the request is successfully otherwise it will be rejected
 */
function createTransactionPolar(accessToken, user) {
    return new Promise(function (resolve, reject) {
        fetch('https://www.polaraccesslink.com/v3/users/' + user + '/activity-transactions', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + accessToken
            },
            body: ''
        }).then(function (transactionResponse) {
            if (transactionResponse.status == 201) {
                return transactionResponse.json();
            }
            else {
                // console.log(transactionResponse);
                reject(transactionResponse.status);
            }
        }).then(function (transactionResponseJson) {
            resolve(transactionResponseJson);
        }).catch(function (error) {
            reject(error);
        });
    });
}

/**
 * makes a request to an URL with the Authorization Header set to Bearer and the accessToken added
 * @param url the url for the GET request
 * @param accessToken to authenticate the user
 * @returns {Promise} is resolved if the request is successfully otherwise it will be rejected
 */
function getActivtiesPolar(url, accessToken) {
    return new Promise(function (resolve, reject) {
        fetch(url, {
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        }).then(function (listActivityResponse) {
            return listActivityResponse.json();
        }).then(function (listActivitesJson) {
            resolve(listActivitesJson);
        }).catch(function (error) {
            reject(error);
        });
    });
}

/**
 * iterates over an array of URL's and saves the return objects into an array
 * @param urlArray the Array with all URL's of the activities from Polar
 * @param accessToken to authenticate the user
 * @returns {Promise} is resolved when all request are successfully and all the request are done
 */
function getAllActivitiesPolar(urlArray, accessToken) {
    return new Promise(function (resolve, reject) {
        let allActivities = [];
        for (let i = 0; i < urlArray.length; i++) {
            getActivtiesPolar(urlArray[i], accessToken)
                .then(function (activityJson) {
                    allActivities.push(activityJson);
                    if (allActivities.length == urlArray.length) {
                        resolve(allActivities);
                    }
                })
                .catch(function (error) {
                    reject(error);
                });
        }
    })
}

/**
 * aktes only the newest entry per Date and return it in a new Array
 * @param allActivities the array with all activity summaries from Polar
 * @returns {Array} an array with only the newest entry per Date
 */
function getOnlyOneActivityperDatePolar(allActivities) {
    // console.log(allActivities);
    let onlyOneActivityperDate = [];
    for (var i = 0; i < allActivities.length; i++) {
        if (onlyOneActivityperDate.length > 0) {
            let needTopush = true;
            for (var j = 0; j < onlyOneActivityperDate.length; j++) {
                let dateOnlyOneActivityperDate = new Date(onlyOneActivityperDate[j].date);
                let createdOnlyOneActivityperDate = new Date(onlyOneActivityperDate[j].created);
                let dateAllActivities = new Date(allActivities[i].date)
                let createdAllActivities = new Date(allActivities[i].created)
                if (+dateOnlyOneActivityperDate == +dateAllActivities) {
                    needTopush = false;
                    if (+createdOnlyOneActivityperDate < +createdAllActivities) {
                        onlyOneActivityperDate[j] = allActivities[i];
                    }
                    j = onlyOneActivityperDate.length;
                }
            }
            if (needTopush) {
                onlyOneActivityperDate.push(allActivities[i]);
            }
        }
        else {
            onlyOneActivityperDate.push(allActivities[i]);
        }
    }
    return onlyOneActivityperDate;
}

/**
 * creates the object which can be directly given to the updateSteps method
 * @param onlyOneActivityDate an Array with only the newest entries per Date
 * @param userId the id from the Blockchain to identify the user
 * @returns {{$class: string, date: Array, steps: Array, user: string}} object to pass to the Blockchain to update the entries
 */
function prepareStepsPushPolar(onlyOneActivityDate, userId) {
    let newSteps = {
        "$class": "org.bachelorarbeit.UpdateSteps",
        "date": [],
        "steps": [],
        "user": "resource:org.bachelorarbeit.User#" + userId
    };
    onlyOneActivityDate.forEach(step => {
        // console.log(step);
        let dateTime = step.date;
        let dateArray = dateTime.split("-");
        let dateString = "" + dateArray[0] + dateArray[1] + dateArray[2];
        let valueSteps = step['active-steps'];
        // console.log("Date: " + dateString + "\nSteps: " + valueSteps);
        newSteps.date.push(parseInt(dateString));
        newSteps.steps.push(valueSteps);
    });
    return newSteps;
}

/**
 * commit the transaction to Polar so that in a next request it will not send this activities again
 * @param url the url with the transaction id and the user id in it
 * @param accessToken to authenticate the user
 * @returns {Promise} is resolved if the request is successfully otherwise it will be rejected
 */
function commitTransactionPolar(url, accessToken) {
    // console.log(addToBlockchainWorkedJson);
    return new Promise(function (resolve, reject) {
        fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        }).then(function (putResponse) {
            if (putResponse.status != 200) {
                // console.log(putResponse);
                reject(putResponse.statusText)
            }
            else {
                // console.log('Put worked');
                resolve(putResponse.statusText);
            }
        }).catch(function (error) {
            reject(error);
        });
    });
}



//   ____________________________________________
//  |    ____     _______   _____      _______  |
//  |   |       |    |     |     |  |     |     |
//  |   |___    |    |     |_____|  |     |     |
//  |   |       |    |     |     |  |     |     |
//  |   |       |    |     |_____|  |     |     |
//  |___________________________________________|

/**
 * gets the data from fitbit and post it to the Blockchain
 * @param res to answer to the frontend which made the request to actualize the Blockchain
 * @param jsonRes the response from the Blockchain which contains the userId of the Blockchain, the accessToken and the refreshToken
 * @param user the userId from Fitbit
 */
function fitbit(res, jsonRes, user) {
    let userId = jsonRes[0].userId;
    //console.log("Fitbit");
    //get the steps from the user
    fetch('http://localhost:3000/api/queries/selectStepsByUser?inputValue=resource:org.bachelorarbeit.User%23' + userId)
        .then(function (resStep) {
            return resStep.json();
        }).then(function (jsonStep) {
            //console.log(jsonStep);
            // get the needed Data to actualize the Blockchain
            let json = getNewestEntry(jsonStep);
            //console.log(json);
            let jsonDate = json.date + "";
            let beginnDate = formatDateFromStringToISOString(jsonDate);
            let accessToken = jsonRes[0].accessToken;
            let refreshToken = jsonRes[0].refreshToken;
            //get the steps from Fitbit
            getStepsFitbit(beginnDate, user, accessToken, refreshToken, userId)
                .then(function (stepJson) {
                    //console.log(stepJson);
                    let newSteps = prepareStepsPushFitbit(stepJson, userId);
                    // write the steps to the Blockchain
                    updateSteps(newSteps)
                        .then(function (addToBlockchainWorkedJson) {
                            //console.log(addToBlockchainWorkedJson);
                            getStepsBlockchain(user)
                                .then(function (jsonStep) {
                                    //console.log(jsonStep);
                                    let forFrontend = formatForFrontendGraphics(jsonStep);
                                    // console.log(forFrontend);
                                    // console.log(jsonRes[0].sharedWith);
                                    getSharedData(jsonRes[0].sharedWith, forFrontend)
                                        .then(function (sharedData) {
                                            // console.log(sharedData);
                                            res.send(sharedData);
                                        }).catch(function (error) {
                                            res.status(501).send(error);
                                        });

                                }).catch(function (error) {
                                    res.status(500).send(error);
                                });
                        });
                }).catch(function (error) {
                    //console.log(error);
                    res.send(error);
                });
        });
}

/**
 * takes the json response from Fitbit and makes the right object to push to the Blockchain
 * @param stepJson the Json response from Fitbit
 * @param userId the UserId from the Blockchain
 * @returns {{$class: string, date: Array, steps: Array, user: string}} an Object which can be directly passed to the updateSteps function
 */
function prepareStepsPushFitbit(stepJson, userId) {
    // console.log(stepJson);
    // console.log(stepJson["activities-steps"]);
    let newSteps = {
        "$class": "org.bachelorarbeit.UpdateSteps",
        "date": [],
        "steps": [],
        "user": "resource:org.bachelorarbeit.User#" + userId
    };
    let noStepsArray = [];
    for (let i = 0; i < stepJson['activities-steps'].length; i++) {
        let step = stepJson['activities-steps'][i];
        let dateTime = step.dateTime;
        let dateArray = dateTime.split("-");
        let dateString = "" + dateArray[0] + dateArray[1] + dateArray[2];
        let valueSteps = step.value;
        // console.log("Date: " + dateString + "\nSteps: " + valueSteps);
        if (valueSteps > 0) {
            for (let j = 0; j < noStepsArray.length; j++) {
                let noStepDate = noStepsArray[j];
                newSteps.date.push(noStepDate);
                newSteps.steps.push(0);
            }
            newSteps.date.push(parseInt(dateString));
            newSteps.steps.push(valueSteps);
            noStepsArray = [];
        }
        else {
            noStepsArray.push(parseInt(dateString));
            //console.log('no data for ' + dateTime)
        }

    }
    return newSteps;
}

/**
 *  request to Fitbit to get the steps from the beginnDate until today
 *  If the Accesses Token is expired the function renews it
 * @param beginnDate  a String YYYY-MM-DD
 * @param user the UserId from Fitbit for the request
 * @param accessToken the Token to access the Data
 * @param refreshToken for the case the Access Token has expired
 * @param userId to write the updated Tokens back to the user in the Blockchain
 * @returns {Promise<any>} the response Json from Fitbit for activities/steps
 */
function getStepsFitbit(beginnDate, user, accessToken, refreshToken, userId) {
    //console.log(beginnDate);
    //console.log(user);
    //console.log(accessToken);
    //console.log(refreshToken);
    //console.log(userId);
    return new Promise(function (resolve, reject) {
        fetch('https://api.fitbit.com/1/user/' + user + '/activities/steps/date/today/' + beginnDate + '.json', {
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        }).then(function (stepResponse) {
            //console.log(stepResponse.status)
            switch (stepResponse.status) {
                case 200:
                    return stepResponse.json();
                    break;
                case 401:
                    return stepResponse.json();
                    break;
                default:
                    throw new Error(stepResponse.json());
                    break;
            }
        }).then(function (stepsJson) {
            //console.log(stepsJson);
            if (Object.keys(stepsJson).includes('errors')) {
                if (stepsJson.errors[0].errorType == 'expired_token') {
                    refreshTokenFitbit(refreshToken, userId)
                        .then(function (updateTokensResponseJson) {
                            accessToken = updateTokensResponseJson.accessToken;
                            refreshToken = updateTokensResponseJson.refreshToken;
                            getStepsFitbit(beginnDate, user, accessToken, refreshToken, userId)
                                .then(function (stepJson1) {
                                    resolve(stepJson1);
                                })
                                .catch(function (error) {
                                    reject(error);
                                });
                        }).catch(function (error) {
                            reject(error);
                        })
                }
                else {
                    reject(stepsJson);
                }
            }
            else {
                resolve(stepsJson);
            }
        }).catch(function (error) {
            reject(error);
        })
    })
}

/**
 * refreshes the Access Token for Fitbit
 * @param refreshToken the Refresh Token from the user to get a new Access Token without the authenticate Process
 * @param userId from the user in the Blockchain to actualize it
 * @returns {Promise} resolves when the token are updated successfully
 */
function refreshTokenFitbit(refreshToken, userId) {
    //console.log(refreshToken);
    //console.log(userId);
    return new Promise(function (resolve, reject) {
        fetch('https://api.fitbit.com/oauth2/token', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + encodedSecretAndClientFitbit,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=refresh_token&refresh_token=' + refreshToken + '&expires_in=28800'
        }).then(function (refreshTokenResponse) {
            return refreshTokenResponse.json();
        }).then(function (refreshTokenResponseJson) {
            let accessToken = refreshTokenResponseJson.access_token;
            let refreshToken = refreshTokenResponseJson.refresh_token;
            let newAccessToken = {
                '$class': 'org.bachelorarbeit.UpdateTokens',
                'user': 'resource:org.bachelorarbeit.User#' + userId,
                'accessToken': accessToken,
                'refreshToken': refreshToken
            };
            updateTokenInBlockchain(newAccessToken)
                .then(function (updatedToken) {
                    resolve(updatedToken);
                })
                .catch(function (error) {
                    reject(error);
                });
        }).catch(function (error) {
            reject(error);
        });
    });
}




//   ______________________________________________________________________________________
//  |    ______            ______    ______        ______             ______               |
//  |   |      | |        |      |  |        | /  |        |      |  |      |  |  |\   |   |
//  |   |______| |        |      |  |        |/   |        |______|  |______|  |  | \  |   |
//  |   |      | |        |      |  |        |\   |        |      |  |      |  |  |  \ |   |
//  |   |______| |______  |______|  |______  | \  |______  |      |  |      |  |  |   \|   |
//  |______________________________________________________________________________________|

/**
 * *writes the steps into the Blockchain
 * @param newSteps an Object which looks like: {
 *      "$class": "org.bachelorarbeit.UpdateSteps",
 *      "date": [],
 *      "steps": [],
 *      "user": "resource:org.bachelorarbeit.User#" + userId
 *      }
 * @returns {Promise<any>} A Promise which is resolved when the answer body is correct returned
 */
function updateSteps(newSteps) {
    //console.log(newSteps);
    return new Promise(function (resolve, reject) {
        fetch('http://localhost:3000/api/UpdateSteps', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newSteps)
        }).then(function (response) {
            //console.log(response);
            return response.json();
        }).then(function (jsonResponse) {
            resolve(jsonResponse);
        }).catch(function (error) {
            reject(error);
        })
    });
}

/**
 * get the steps from the Blockchain
 * @param user user id from the Activity Tracker API
 * @returns {Promise<any>} A Promis which is resolved, when the steps from the user are loaded
 */
function getStepsBlockchain(user) {
    return new Promise(function (resolve, reject) {
        getUserFromBlockchain(user)
            .then(function (jsonRes) {
                // console.log(JSON.stringify(jsonRes));
                let userId = jsonRes[0].userId;

                fetch('http://localhost:3000/api/queries/selectStepsByUser?inputValue=resource:org.bachelorarbeit.User%23' + userId)
                    .then(function (resStep) {
                        // console.log(resStep);
                        return resStep.json();
                    }).then(function (jsonStep) {
                        resolve(jsonStep);
                    }).catch(function (error) {
                        reject(error);
                    });

            }).catch(function (error) {
                reject(error);
            });
    });
}

/**
 * gets the user from the blockchain 
 * @param user user id from the Activity Tracker API
 * @returns {Promise<any>} A Promis which is resolved if the user is returned
 */
function getUserFromBlockchain(user) {
    return new Promise(function (resolve, reject) {
        fetch('http://localhost:3000/api/queries/selectUserByUserIdActivityTracker?inputValue=' + user)
            .then(function (response) {
                return response.json();
            }).then(function (jsonRes) {
                resolve(jsonRes);
            }).catch(function (error) {
                reject(error);
            })
    });
}

/**
 * updates the Access Token and the Refresh Token in the Blockchain
 * @param newAccessToken an Object which has to look like:
 *      {
 *          '$class': 'org.bachelorarbeit.UpdateTokens',
 *          'user': 'resource:org.bachelorarbeit.User#UserId',
 *          'accessToken': accessToken,
 *          'refreshToken': refreshToken
 *      }
 * @returns {Promise} which is resolved when the tokens are updated successfully
 */
function updateTokenInBlockchain(newAccessToken) {
    //console.log(newAccessToken);
    return new Promise(function (resolve, reject) {
        fetch('http://localhost:3000/api/updateTokens', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newAccessToken)
        }).then(function (updateTokensResponse) {
            return updateTokensResponse.json();
        }).then(function (updateTokensResponseJson) {
            resolve(updateTokensResponseJson);
        }).catch(function (error) {
            reject(error);
        })
    });

}




//   ___________________________________________________________________
//  |    ______    _____            _____    ____    _____             |
//  |   |         |        |\   |  |        |    |  |     |  |         |
//  |   |  ____   |_____   | \  |  |_____   |____|  |_____|  |         |
//  |   |      |  |        |  \ |  |        |\      |     |  |         |
//  |   |______|  |_____   |   \|  |_____   | \     |     |  |______   |
//  |__________________________________________________________________|

/**
 * gets the entry with the highest id, which is the one with the newest Date
 * @param jsonStep all Entries from the Blockchain in an Array
 * @returns {*} the Object with the highest ID
 */
function getNewestEntry(jsonStep) {
    let highestId = 0;
    let indexOfhighestId = 0;
    for (let i = 0; i < jsonStep.length; i++) {
        let id = parseInt(jsonStep[i].stepsId);
        //console.log('HighestId: ' + highestId + '\nId: ' + id);
        if (highestId < id) {
            highestId = id;
            indexOfhighestId = i;
            //console.log(highestId);
        }
    }
    return jsonStep[indexOfhighestId];
}

/**
 * makes from a non space date YYYYMMDD a ISO-Date formatted string YYYY-MM-DD
 * @param jsonDate a String YYYYMMDD
 * @returns {string} a string in ISO format for dates YYYY-MM-DD
 */
function formatDateFromStringToISOString(jsonDate) {
    let splitString = jsonDate.split("");
    let year = "";
    let month = "";
    let day = "";
    for (let i = 0; i < splitString.length; i++) {
        if (i < 4) {
            year = year + splitString[i];
        }
        else if (i < 6) {
            month = month + splitString[i];
        }
        else if (i < 8) {
            day = day + splitString[i];
        }
    }
    return year + '-' + month + '-' + day;
}

/**
 * formates the data, that it can be easy used in the frontend for chartjs
 * @param blockchainResponse an Array with the objects from the Blockchain
 * @returns {Object} An Object which contains the Data in the Right Formate for Chart.js
 */
function formatForFrontendGraphics(blockchainResponse) {
    let dataForFrontend = {
        ownData: [],
        labels: [],
        otherUsers: []
    };
    let dateFormate = {
        year: 'numeric',
        month: 'numeric',
        day: '2-digit'
    };
    blockchainResponse.sort(function (a, b) {
        let idA = parseInt(a.stepsId);
        let idB = parseInt(b.stepsId);
        return idA - idB;
    });
    //console.log(blockchainResponse);
    for (let i = 0; i < blockchainResponse.length; i++) {
        let blockchainEntry = blockchainResponse[i];
        //console.log(blockchainEntry);
        let date = new Date(formatDateFromStringToISOString(blockchainEntry.date + ''));
        let data = {
            x: date,
            y: blockchainEntry.steps
        };
        dataForFrontend.labels.push(date.toLocaleDateString('de-CH', dateFormate));
        dataForFrontend.ownData.push(data);
    }
    // console.log(dataForFrontend);
    return dataForFrontend;
}

/**
 * 
 * @param userArray array of userId's which these user is allowed to look at
 * @param forFrontend an Object which has the data to create the chart
 */
function getSharedData(userArray, forFrontend) {
    return new Promise(function (resolve, reject) {
        //console.log(userArray);
        for (let i = 0; i < userArray.length; i++) {
            let userId = userArray[i].replace('#', '%23');
            // console.log(userId);
            fetch('http://localhost:3000/api/queries/selectStepsByUser?inputValue=' + userId)
                .then(function (resStep) {
                    // console.log(resStep);
                    return resStep.json();
                }).then(function (jsonStep) {
                    jsonStep.sort(function (a, b) {
                        let idA = parseInt(a.stepsId);
                        let idB = parseInt(b.stepsId);
                        return idA - idB;
                    });
                    // console.log(jsonStep);
                    let otherUser = {
                        userName: userId,
                        data: []
                    };
                    for (let i = 0; i < jsonStep.length; i++) {
                        let blockchainEntry = jsonStep[i];
                        // console.log(blockchainEntry);
                        let date = new Date(formatDateFromStringToISOString(blockchainEntry.date + ''));
                        let data = {
                            x: date,
                            y: blockchainEntry.steps
                        };
                        otherUser.data.push(data);
                        // console.log(otherUser);
                    }
                    forFrontend.otherUsers.push(otherUser);
                    // console.log(forFrontend);
                    // console.log(userArray.length);
                    // console.log(forFrontend.otherUsers.length)
                    if (userArray.length == forFrontend.otherUsers.length) {
                        // console.log('returnData');
                        resolve(forFrontend);
                    }
                }).catch(function (error) {
                    reject(error);
                });
        }
    });
}
