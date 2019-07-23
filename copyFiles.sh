#!/bin/bash

#copy files to /fabric-dev-servers
yes | cp blockchain/logic.js ~/fabric-dev-servers/bachelorarbeit/lib/logic.js
yes | cp blockchain/org.bachelorarbeit.cto ~/fabric-dev-servers/bachelorarbeit/models/org.bachelorarbeit.cto
yes | cp blockchain/permissions.acl ~/fabric-dev-servers/bachelorarbeit/permissions.acl
yes | cp blockchain/queries.qry ~/fabric-dev-servers/bachelorarbeit/queries.qry

