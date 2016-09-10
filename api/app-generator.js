'use strict';

const config = require('./config');

const swaggerTools = require('swagger-tools');

const models = require('./models');
const swaggerObject = require('./swagger.json');
const security = require('./security');

const errHandler = function (err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }
    if ((!res.statusCode) || (res.statusCode < 300)) {
        res.statusCode = 500;
    }
    if (typeof err !== 'object') { // send error for now, meybe we should message for error from different packages
        err = {
            message: 'Unknown error'
        };
    } else {
        if (err.name === 'SequelizeValidationError') {
            res.statusCode = 400;
        }
    }

    res.send(err);
};

exports.initialize = function (app, callback) {
    swaggerTools.initializeMiddleware(swaggerObject, function (middleware) {
        app.use(middleware.swaggerMetadata());

        app.use(middleware.swaggerValidator({
            validateResponse: true
        }));

        app.use(middleware.swaggerSecurity(security));

        app.use(middleware.swaggerRouter({
            useStubs: false,
            ignoreMissingHandlers: true,
            controllers: './controllers'
        }));

        app.use(middleware.swaggerUi());

        app.use(errHandler);

        models.sequelize.sync({
            force: process.env.NODE_ENV === 'test'
        }).then(function () {
            callback(null, app);
        }).catch(function (err) {
            callback(err);
        });
    });
};

exports.generate = function (callback) {
    const app = require('./app');
    exports.initialize(app, callback);
};
