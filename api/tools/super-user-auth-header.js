'use strict';

const config = require('../config');

const superUser = config.initialUser;

const buffer = new Buffer(superUser.username + ':' + superUser.password);

const header = 'Basic ' + buffer.toString('base64');

console.log(header);
