#!/bin/bash

#install useful tool for Linux
yes | sudo apt-get install curl
yes | sudo apt-get install vim
yes | sudo apt-get update
yes | sudo apt-get upgrade

# install Visual studio code
sudo snap install --classic code

#install composer prerequisites
curl -O https://hyperledger.github.io/composer/latest/prereqs-ubuntu.sh
chmod u+x prereqs-ubuntu.sh
./prereqs-ubuntu.sh
