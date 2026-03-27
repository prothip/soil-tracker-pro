#!/bin/bash
# Kill any existing on 3002
fuser -k 3002/tcp 2>/dev/null
sleep 1
node backend/src/index.js
