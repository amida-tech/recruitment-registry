'use strict';

const config = require('./config');

const app = require('./app');
const appgen = require('./app-generator');

appgen.initialize(app, function (err) {
    if (err) {
        console.log('Server failed to start due to error: %s', err);
    } else {
        app.listen(config.port, function () {
            console.log('Server started at ', config.port);
        });
    }
});

module.exports = app;
