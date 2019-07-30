#!/bin/bash

#install CLI tools
npm install -g composer-cli@0.20
npm install -g composer-rest-server@0.20
npm install -g generator-hyperledger-composer@0.20
npm install -g yo

#install Playground
npm install -g composer-playground@0.20

#install hyperledger Fabric
mkdir ~/fabric-dev-servers && cd ~/fabric-dev-servers
curl -O https://raw.githubusercontent.com/hyperledger/composer-tools/master/packages/fabric-dev-servers/fabric-dev-servers.tar.gz
tar -xvf fabric-dev-servers.tar.gz
cd ~/fabric-dev-servers
export FABRIC_VERSION=hlfv12
sudo ./downloadFabric.sh

#starting Hyperledger Fabric for the first time
cd ~/fabric-dev-servers
export FABRIC_VERSION=hlfv12
sudo ./startFabric.sh
./createPeerAdminCard.sh
yo hyperledger-composer:businessnetwork
