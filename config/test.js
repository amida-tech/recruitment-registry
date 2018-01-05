'use strict';

const path = require('path');

module.exports = {
    jwt: {
        secret: 'this is a secret',
    },
    cors: {
        origin: '*',
    },
    db: {
        name: 'recregtest',
        poolIdle: 1000,
    },
    tmpDirectory: path.join(__dirname, '../test/generated'),
    constantContact: {
        baseApiUrl: 'http://turnip.test',
        token: 'turnip',
        apiKey: 'turnip api',
        secret: 'secret turnip',
        listId: 42,
    },
};
