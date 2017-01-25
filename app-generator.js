'use strict';

const config = require('./config');

const swaggerTools = require('swagger-tools');

const models = require('./models');
const swaggerJson = require('./swagger.json');
const security = require('./security');
const logger = require('./logger');
const jsutil = require('./lib/jsutil');

const errHandler = function (err, req, res, next) {
    next = next; // rid of unused error
    logger.error(err);
    err = jsutil.errToJSON(err);
    if ((!res.statusCode) || (res.statusCode < 300)) {
        res.statusCode = 500;
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
            force: config.env === 'test'
        }).then(function () {
            callback(null, app);
        });
    });
};

exports.generate = function (options, callback) {
    const app = require('./app');
    exports.initialize(app, options, callback);
};
