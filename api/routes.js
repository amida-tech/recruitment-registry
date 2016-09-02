'use strict';

const auth = require('./auth');

module.exports = function (app) {
    app.use('/auth/v1.0', require('./auth'));

    app.use('/api/v1.0/user', require('./api/user'));
    app.use('/api/v1.0/survey', require('./api/survey'));

    // all other routes should return a 404
    app.route('/*').get((req, res) => {
        var result = {
            status: 404
        };
        res.status(result.status);
        res.json(result, result.status);
    });
};
