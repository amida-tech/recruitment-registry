'use strict';

/* eslint no-console: 0 */

const models = require('./models');

models.sequelize.sync({ force: true })
    .then(() => process.exit(0))
    .catch((err) => {
        console.log('failure');
        console.log(err);
        process.exit(1);
    });
