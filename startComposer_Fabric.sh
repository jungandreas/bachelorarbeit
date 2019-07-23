#!/bin/bash

cd ~/fabric-dev-servers
#restart fabric
sudo ./stopFabric.sh
sudo ./startFabric.sh

cd bachelorarbeit

#create archive File
composer archive create -t dir -n .

#start composer
composer network install --card PeerAdmin@hlfv1 --archiveFile bachelorarbeit@0.0.1.bna
composer network start --networkName bachelorarbeit --networkVersion 0.0.1 --networkAdmin admin --networkAdminEnrollSecret adminpw --card PeerAdmin@hlfv1 --file networkadmin.card
composer card import --file networkadmin.card

#start Rest Server
composer-rest-server -c admin@bachelorarbeit -n never -u true -w true &
