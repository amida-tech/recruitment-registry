'use strict';

const auth = require('./auth');

module.exports = function (app) {
    app.use('/api/v1.0/auth', require('./auth'));
};
