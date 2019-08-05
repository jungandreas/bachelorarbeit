/**
 * Transactions
 * inspired by https://github.com/hyperledger/composer-sample-networks
 */

/**
 * global constants
 */
const factory = getFactory();
const NS = 'org.bachelorarbeit';

/**
 * Create new record with steps
 * @param {org.bachelorarbeit.UpdateSteps} updateSteps - the UpdateSteps transaction
 * @transaction
 */
async function updateSteps(updateSteps) {
  // get current records of all steps 
  const stepsRegistry = await getAssetRegistry(NS + '.Steps');
  const assets = await stepsRegistry.getAll();
  const lengthAllSteps = await assets.length;

  const userId = updateSteps.user.userId;
  const userIdRelationship = "Relationship {id=org.bachelorarbeit.User#" + userId + "}"

  // get the highest id in database
  let highestIdAllUsers = 0;
  let highestIdUser = 0;
  let highestIdUserPosition = 0;
  for (i = 0; i < lengthAllSteps; i++) {
    let stepId = parseInt(assets[i].stepsId);
    if (stepId > highestIdAllUsers) {
      highestIdAllUsers = stepId;
    }
    if (userIdRelationship == assets[i].user.toString()) {
      if (stepId > highestIdUser) {
        highestIdUser = stepId;
        highestIdUserPosition = i;
      }
    }
  }

  // last record of this user
  const lastRecord = assets[highestIdUserPosition]
  const lastUpdate = lastRecord.date;

  const stepsId = highestIdAllUsers + 1; // record id is the next number
  const numberOfNewRecords = updateSteps.date.length;
  let stepsArray = [];
  let updated = 0; // -1 when record updated 

  for (i = 0; i < numberOfNewRecords; i++) {
    // date must be newer and more steps than before
    if (updateSteps.date[i] > lastUpdate) {
      // create new steps
      let steps = factory.newResource(NS, 'Steps', (stepsId + i + updated).toString());
      steps.date = updateSteps.date[i];
      steps.steps = updateSteps.steps[i];
      steps.user = updateSteps.user;
      // add new steps
      stepsArray.push(steps);
    }
    else {
      if (updateSteps.steps[i] > lastRecord.steps) {
        lastRecord.steps = updateSteps.steps[i];
        const assetRegistry = await getAssetRegistry(NS + '.Steps');
        await assetRegistry.update(lastRecord);
      }
      updated = -1;
    }
  }
  await stepsRegistry.addAll(stepsArray);
}


/**
 * Update access and refresh token from a user
 * @param {org.bachelorarbeit.UpdateTokens} updateTokens - the UpdateTokens transaction
 * @transaction
 */
async function updateTokens(updateTokens) {
  // get all users
  const userRegistry = await getParticipantRegistry(NS + '.User');
  const assets = await userRegistry.getAll();
  const lengthUser = await assets.length;

  // find this user
  for (i = 0; i < lengthUser; i++) {
    if (assets[i].userId == updateTokens.user.userId) {
      let user = assets[i];
      user.accessToken = updateTokens.accessToken;
      user.refreshToken = updateTokens.refreshToken;
      userRegistry.update(user);
      return;
    }
  }
}

/**
 * Update activityTracker from a user
 * @param {org.bachelorarbeit.UpdateActivityTracker} updateActivityTracker - the UpdateActivityTracker transaction
 * @transaction
 */
async function updateActivityTracker(updateActivityTracker) {
  // get all users
  const userRegistry = await getParticipantRegistry(NS + '.User');
  const assets = await userRegistry.getAll();
  const lengthUser = await assets.length;

  // find this user
  for (i = 0; i < lengthUser; i++) {
    if (assets[i].userId == updateActivityTracker.user.userId) {
      let user = assets[i];
      user.activityTracker = updateActivityTracker.activityTracker;
      user.userIdActivityTracker = updateActivityTracker.userIdActivityTracker;
      userRegistry.update(user);
      return;
    }
  }
}

/**
 * Add sharedWith from a user
 * @param {org.bachelorarbeit.AddSharedWith} addSharedWith - the AddSharedWith transaction
 * @transaction
 */
async function addSharedWith(addSharedWith) {
  // get all users
  const userRegistry = await getParticipantRegistry(NS + '.User');
  const assets = await userRegistry.getAll();
  const lengthUser = await assets.length;

  // find this user
  for (i = 0; i < lengthUser; i++) {
    if (assets[i].userId == addSharedWith.user.userId) {
      let user = assets[i];
      user.sharedWith.push(addSharedWith.sharedWith)
      userRegistry.update(user);
      return;
    }
  }
}

/**
 * Remove sharedWith from a user
 * @param {org.bachelorarbeit.RemoveSharedWith} removeSharedWith - the RemoveSharedWith transaction
 * @transaction
 */
async function removeSharedWith(removeSharedWith) {
  // get all users
  const userRegistry = await getParticipantRegistry(NS + '.User');
  const assets = await userRegistry.getAll();
  const lengthUser = await assets.length;

  // find this user
  for (i = 0; i < lengthUser; i++) {
    if (assets[i].userId == removeSharedWith.user.userId) {
      let user = assets[i];
      let length = user.sharedWith.length;
      for (j = 0; j < length; j++){
        if (user.sharedWith[j] == removeSharedWith.sharedWith){
          user.sharedWith.splice(j, 1);
          userRegistry.update(user);
          return;
        }
      }
    }
  }
}

/**
 * Initialize some test assets and participants useful for running a demo.
 * @param {org.bachelorarbeit.SetupDemo} setupDemo - the SetupDemo transaction
 * @transaction
 */
async function setupDemo(setupDemo) {

  // create the user
  const user = factory.newResource(NS, 'User', '1');
  user.firstName = 'Hans';
  user.lastName = 'Muster';
  user.email = 'hans.muster@beispiel.ch';
  user.activityTracker = 'Fitbit';
  user.userIdActivityTracker = 'Userid von Fitbit';
  user.accessToken = 'Accesstoken';
  user.refreshToken = 'Refreshtoken';
  let sharedWith = ['resource:org.bachelorarbeit.User#2'];
  user.sharedWith = sharedWith;

  // create the second user
  const user_2 = factory.newResource(NS, 'User', '2');
  user_2.firstName = 'Heiri';
  user_2.lastName = 'Meier';
  user_2.email = 'heiri.meier@ntb.ch';
  user_2.activityTracker = 'Polar';
  user_2.userIdActivityTracker = 'Userid von Polar';
  user_2.accessToken = 'Accesstoken';
  user_2.refreshToken = 'polar doesn\'t need refresh token';
  let sharedWith_2 = ['']; 
  user_2.sharedWith = sharedWith_2;

  let stepsArray = [];
  // create the steps  
  let steps = factory.newResource(NS, 'Steps', '1');
  steps.date = 20190526;
  steps.steps = 5000;
  steps.user = factory.newRelationship(NS, 'User', '1');

  stepsArray.push(steps);
  steps = factory.newResource(NS, 'Steps', '2');
  steps.date = 20190619;
  steps.steps = 7000;
  steps.user = factory.newRelationship(NS, 'User', '2');

  stepsArray.push(steps);

  // add the users
  const userRegistry = await getParticipantRegistry(NS + '.User');
  await userRegistry.addAll([user, user_2]);

  // add the steps
  const stepsRegistry = await getAssetRegistry(NS + '.Steps');
  await stepsRegistry.addAll(stepsArray);
}
