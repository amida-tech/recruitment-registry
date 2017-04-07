'use strict';

/* eslint no-console: 0 */

const config = require('./config');

const app = require('./app');
const appgen = require('./app-generator');

appgen.initialize(app, {}, (err) => {
    if (err) {
        console.log('Server failed to start due to error: %s', err);
    } else {
        app.listen(config.port, () => {
            console.log('Server started at ', config.port);
        });
    }
});

module.exports = app;
