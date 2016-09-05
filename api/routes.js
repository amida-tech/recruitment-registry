'use strict';

const auth = require('./auth');

module.exports = function (app) {
    app.use('/api/v1.0/auth', require('./auth'));

    app.use('/api/v1.0/user', require('./api/user'));
    app.use('/api/v1.0/survey', require('./api/survey'));
};
