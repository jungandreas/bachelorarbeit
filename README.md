# Bachelor Thesis Blockchain for Health Data
Improve technical interoperability for better comparison of activity tracker data from different manufacturers

## Introduction
In this Repository are all the files, which are needed to set up the application. This application is the result of the bachelorthesis "Blockchain for Health Data". How the application will be installed is described in the Instruction section.

## Instructions
All this is tested with a Linux Ubuntu 18.04.2 LTS normal installation.

1. Get the data from git
	1. install git
	```
		yes | sudo apt-get install git
	```
	2. clone the git repository
	```
		git clone https://github.com/jungandreas/bachelorarbeit.git
	```

2. Install all pre-requisites
	1. navigate to the directory "/bachelorarbeit"
	2. run the script "installPreRequisites.sh"
	```
		./installPreRequisites.sh
	```
	3. Logout and log back in, to finish the installation
3. Install the development Enviroment
	1. navigate to the directory "/bachelorarbeit" if you are not already in it
	2. run the script "installDevelopmentEnviroment.sh" this will also start the installation of your first network
	```
		./installDevelopmentEnvironment.sh
	```
 	3. Now follow the steps through:
 	```
 		? Business network name: bachelorarbeit
 		? description: yourDescription
	 	? Author name: yourName
 		? Author email: yourEmail
	 	? License: Apache-2.0
 		? Namespace: org.bachelorarbeit
	 	? Do you want to generate an empty template network? No: generate a populated sample network
 	```

 **If you get any conflict** overwrite them with the option a (overwrite this and all others) or y (overwrite).
 
4. Copy the files
	1. navigate to the directory "/bachelorarbeit" if you are not already in it
	2. run the script "copyFiles.sh"
	```
		./copyFiles.sh
	```

5. Start the Network
 	1. navigate to the directory "/bachelorarbeit" if you are not already in it
 	2. run the script "startComposer_Farbric.sh"
 	```
 		./startComposer_Farbric.sh
 	```

6. Configure the Application and start it
 	1. get your applications id and secret from Polar (https://auth.polar.com/login) and Fitbit (https://dev.fitbit.com/login)
 	2. Copy your Client Secret and Id's into the file [key.js](app/routes/keys.js) in the directory "/bachelorarbeit/app/routes"
 	3. now you can start the application, from the directory "/bachelorarbeit" with the command:
 		```
 		node app/app.js
 		```
7. Get some data and compare them
 	1. get some valid tokens and id's
 		1. this is done by going to localhost:3001 choose the Activity Tracker Company and press "Test Date"
 		2. copy the URL parameters into a text editor, you need:
 			- Access token
 			- User id
 			- And if it is Fitbit the refresh token
 		3. repeat this with the other manufacturer
 	2. put them into the users
 		1. go to localhost:3000/explorer
 		2. open the setupDemo
 		3. open the post request and press the button "Try it out!"
 		4. open the user section
 		5. open the get "/user" request and press the button "Try it out!"
 		6. open the put "/user/{id}" request
 			- copy one of the users into the data field
 				- change the tokens
 				- change the userIdActivityTracker
 			- copy the userId into the parameter field and remove it from the data field
 			- press the button "Try it out!"
 			- now do the same with the other user
 		7. copy the user id's into the [script.js](/app/public/javascript/script.js) file in the directory "/bachelorarbeit/app/public/javascript"
 		8. go to http://localhost:3001/data
 8. you should now have a working application

## Documentation
The documentation is in the directory [documentation](/documentation)


## Participants
- [Janick Hartmann](https://github.com/JanickH)
- [Andreas Jung](https://github.com/jungandreas)
