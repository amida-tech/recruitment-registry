'use strict';

const swaggerTools = require('swagger-tools');

const models = require('./models');
const swaggerJson = require('./swagger.json');
const security = require('./security');
const logger = require('./logger');
const jsutil = require('./lib/jsutil');

const errHandler = function (err, req, res, next) {
    logger.error(err);

    err = jsutil.errToJSON(err);

    if (res.headersSent) {
        return next(err);
    }
    if ((!res.statusCode) || (res.statusCode < 300)) {
        res.statusCode = 500;
    }

    // assume all sequelize errors are invalid input
    if (err.name && (typeof err.name === 'string')) {
        if ((err.name.toLowerCase().slice(0, 9) === 'sequelize')) {
            res.statusCode = 400;
        }
    }

    res.json(err);
};

exports.initialize = function (app, options, callback) {
    const swaggerObject = options.swaggerJson || swaggerJson;
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

exports.generate = function (options, callback) {
    const app = require('./app');
    exports.initialize(app, options, callback);
};
