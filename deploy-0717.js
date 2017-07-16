'use strict';

/* eslint no-console: 0 */

const models = require('./models');
const converter = require('./deploytest/converter');

converter(models)
    .then(() => {
        console.log('success');
    })
    .catch((err) => {
        console.log('failure');
        console.log(err);
    });
