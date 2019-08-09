# Documentation
It shows you the full documentation of the application and the Blockchain.

## Blockchain
The domain model of the data in the Blockchain is:<br>
![Domain Model](images/domain_model.png)

For the different Transactions it is defined what parameters they need to fulfil the task.

To update steps:<br>
![UpdateSteps](images/transaction_updateSteps.png)
![UpdateSteps](images/transaction_UpdateSteps1.png)
![UpdateSteps](images/transaction_UpdateSteps2.png)

To get steps from a user:<br>
![GetStepsFromUser](images/transaction_getStepsFromUser.png)

To update the tokens:<br>
![UpdateTokens](images/transaction_updateTokens.png)
![UpdateTokens](images/transaction_UpdateTokens.png)

To change the manufacturer of the Activity Tracker:<br>
![UpdateActivityTracker](images/transaction_updateActivityTracker.png)
![UpdateActivityTracker](images/transaction_UpdateActivityTracker.png)

To add with who I share my data:<br>
![AddSharedWith](images/transaction_addSharedWith.png)
![AddSharedWith](images/transaction_AddSharedWith.png)

To remove with who I share my data:<br>
![RemoveSharedWith](images/transaction_removeSharedWith.png)
![RemoveSharedWith](images/transaction_RemoveSharedWith.png)

To document the API there is a [.yaml file](doku_API_Blockchain.yaml).


## Application
The application has two parts. The First one get the data from Fitbit or Polar and shows it in the browser. The second one takes the data from Fitbit or Polar put it into the Blockchain and then get the Data from there and shows it in the fronted in a [Chart.js](https://www.chartjs.org/).
The first Part is manly to authorise the application and get the required tokens. Given to the fact, that it is only a prototype this token need to be copied into the Blockchain manually.
The authorisation process follows the following procedure:<br>
![authorisation_Process](images/authorisation.jpg)

To decide the manufacturer the application follows: <br>
![manufacturerChoice](images/refreshBlockchain.jpg)

It now can follow the [Fitbit procedure](images/fitbit.jpg) or the [Polar procedures](images/polar.jpg).

For the return format and the structure needed to make request to the application is a [.yaml File](doku_API_Application.yaml) defined.
