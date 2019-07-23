var userIdFitbit = 'user ID fitbit';
var userIdPolar = 'user id Polar';

function checkDateInURL() {
    let search = new URLSearchParams(document.location.search);
    let date = search.get('date');
    let activityTracker = search.get('ActivityTracker');
    if (activityTracker == 'fitbit') {
        let accessToken = search.get('access_token');
        let refreshToken = search.get('refresh_token');
        let userId = search.get('user_id');
        let expiresIn = search.get('expires_in')
        if (accessToken == null) {

        } else {
            window.history.pushState({}, document.title, "/?ActivityTracker=" + activityTracker + "&expires_in=" + expiresIn + "&access_token=" + accessToken + '&refresh_token=' + refreshToken + '&user_id=' + userId);
        }
        if (date != "" && date != null) {
            getStepsFitbit(date);
        } else {
            alert(date + ' date empty');
        }
    }
    else if (activityTracker == 'polar') {
        alert('Polar');
    }
    else {
        alert(activityTracker);
    }
}


function checkAccessToken() {
    let date = document.getElementById('date').value;
    let search = new URLSearchParams(document.location.search);
    let activityTracker = document.querySelector('input[type=radio]:checked');
    if (activityTracker.value == 'fitbit') {
        let accessToken = search.get('access_token');
        if (accessToken == "" || accessToken == null || search.get('ActivityTracker') != 'fitbit') {
            document.location = "http://localhost:3001/fitbit?date=" + date;
        }
        else {
            getStepsFitbit(date);
        }
    }
    if (activityTracker.value == 'polar') {
        let accessToken = search.get('access_token');
        if (accessToken == "" || accessToken == null || search.get('ActivityTracker') != 'polar') {
            document.location = "http://localhost:3001/polar?date=" + date;
        }
        else {
            getStepsPolar(date);
        }
    }

}

function getStepsFitbit(date) {
    let search = new URLSearchParams(document.location.search);
    let userId = search.get('user_id');
    let accessToken = search.get('access_token');
    if (date != "") {
        fetch('https://api.fitbit.com/1/user/' + userId + '/activities/date/' + date + '.json', {
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        }).then(function (response) {
            let responseJson = response.json();
            let responsStatus = response.status;
            if (responsStatus != 200 && responsStatus != 401) {
                throw new Error(responsStatus);
            }
            else {
                return responseJson;
            }
        }).then(function (jsonResponse) {
            if (Object.keys(jsonResponse).includes('errors')) {
                if (jsonResponse.errors[0].errorType == 'expired_token') {
                    refreshTokenFitbit(date);
                }
                else {
                    alert(jsonResponse.errors[0].errorType);
                }
            }
            else {
                alert(jsonResponse.summary.steps);
            }

            // if (response.status == 401) {
            //     alert('it works');
            // }
        }).catch(function (error) {
            // if (error.errors[0].errorType == 'expired_token') {
            //     fetch('http://localhost:3001/fitbit/refreshToken'{})
            // }
            alert(JSON.stringify(error));
        });
    }
    else {
        alert(accessToken);
    }
}

function getStepsPolar(date) {
    let search = new URLSearchParams(document.location.search);
    let accessToken = search.get('access_token');
    let userId = search.get('user_id');
    alert('itworks');
    let body = {
        accessToken: accessToken,
        userId: userId
    };
    fetch('http://localhost:3001/polar/activity', {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }).then(function (response) {
        return response.json();
    }).then(function (res) {
        alert(JSON.stringify(res));
    });
}

function refreshTokenFitbit(date) {
    let search = new URLSearchParams(document.location.search);
    let refreshToken = search.get('refresh_token');
    let json = {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        expires_in: 3600
    }
    fetch("http://localhost:3001/fitbit/refreshToken?date=" + date, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(json)
    }).then(function (response) {
        let responseJson = response.json();
        document.location.href = response.url;
    });
    // .then(function(jsonResponse){
    //     alert(JSON.stringify(jsonResponse));
    //     //document.location.href = response.url+"&date="+date;
    // });
}

function refreshBlockchain() {
    let activityTracker;
    let key = document.querySelector('input[type=radio]:checked').value;
    switch (key) {
        case 'fitbit':
            activityTracker = userIdFitbit;
            break;
        case 'polar':
            activityTracker = userIdPolar;
            break;

        default:
            alert(key);
            break;
    }
    fetch('http://localhost:3001/data/refreshBlockchain?user=' + activityTracker)
        .then(function (response) {
            let responsStatus = response.status;
            if (response.status == 200) {
                return response.json();
                // alert('refresh worked');
            }
            else {
                alert('something went wrong');
            }
        }).then(function(jsonResponse){
            getData(jsonResponse);
        });
}


function getData(data) {
    var ctx = document.getElementById('compareSteps').getContext('2d');
    let dateFormate = {
        year: 'numeric',
        month: 'numeric',
        day: '2-digit'
    };
    let color = createRandomColor();
    let chart = {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'My Data',
                data: data.ownData,
                backgroundColor: color,
                borderColor: color.replace('0.5', '1'),
                lineTension: 0
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }],
                xAxes: [{
                    type: 'time',
                    distribution: 'linear',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'DD.MM.YYYY'
                        }
                    }
                }]
            }
        }
    };
    for (let i = 0; i < data.otherUsers.length; i++) {
        let user = data.otherUsers[i];
        color = createRandomColor();
        let dataset = {
            label: user.userName,
            data: user.data,
            backgroundColor: color,
            borderColor: color.replace('0.5', '1'),
            lineTension: 0
        }
        chart.data.datasets.push(dataset);
    }
    var myChart = new Chart(ctx, chart);
}

function createRandomColor() {
    let possibilities = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'];
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color = color+possibilities[Math.floor(Math.random()*16)];
    }
    let rHex = color.slice(1,3);
    let gHex = color.slice(3,5);
    let bHex = color.slice(5,7);
    let r = parseInt(rHex, 16);
    let g = parseInt(gHex, 16);
    let b = parseInt(bHex, 16);
    color = 'rgba('+ r + ', ' + g + ', ' + b + ', ' + '0.5)';
    return color;
}