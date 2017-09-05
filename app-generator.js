'use strict';

const _ = require('lodash');
const config = require('./config');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const expressWinston = require('express-winston');
const swaggerTools = require('swagger-tools');

const modelsGenerator = require('./models/generator');
const swaggerUtil = require('./lib/swagger-util');

const swaggerJson = require('./swagger.json');
const security = require('./security');
const logger = require('./logger');
const jsutil = require('./lib/jsutil');
const i18n = require('./i18n');

const errHandler = function (err, req, res, next) { // eslint-disable-line no-unused-vars
    logger.error(err);
    const jsonErr = jsutil.errToJSON(err);
    if ((!res.statusCode) || (res.statusCode < 300)) {
        res.statusCode = 500;
    }
    res.json(jsonErr);
};

const userAudit = function (req, res, next) {
    const userId = _.get(req, 'user.id');
    if (userId) {
        const operationSpec = _.get(req, 'swagger.operationPath', ['', '', '']);
        let endpoint = operationSpec[1];
        const operation = operationSpec[2];
        if (req.swagger.params) {
            _.forOwn(req.swagger.params, (description, name) => {
                const value = description && description.value;
                if (value && _.get(description, 'schema.in') === 'path') {
                    endpoint = endpoint.replace(`{${name}}`, value);
                }
            });
        }
        if (endpoint !== '/user-audits') {
            req.models.userAudit.createUserAudit({ userId, endpoint, operation });
        }
    }
    next();
};

const modelsSupplyFn = function (inputModels) {
    return function modelsSupply(req, res, next) { // eslint-disable-line no-unused-vars
        req.models = inputModels;
        next();
    };
};

const multiModelsSupplyFn = function (inputModels) {
    return function multiModelsSupply(req, res, next) { // eslint-disable-line no-unused-vars
        const schema = _.get(req, 'swagger.params.schema.value');
        req.models = inputModels[schema];
        next();
    };
};

const formSwaggerObject = function (schema, effectiveConfig, effectiveSwaggerJson) {
    if (Array.isArray(schema)) {
        const result = _.cloneDeep(effectiveSwaggerJson);
        swaggerUtil.updateSchema(result, schema);
        return result;
    }
    if (schema !== 'public') {
        if (effectiveConfig.db.addSchemaPath) {
            const result = _.cloneDeep(effectiveSwaggerJson);
            swaggerUtil.updateSchemaConst(result, schema);
            return result;
        }
    }
    return effectiveSwaggerJson;
};

exports.extractSchema = function extractSchema(configSchema) {
    const schemas = configSchema.split('~');
    if (schemas.length > 1) {
        return schemas;
    }
    return configSchema;
};

exports.initialize = function initialize(app, options, callback) {
    const effectiveConfig = options.config || config;
    const schema = exports.extractSchema(effectiveConfig.db.schema);
    const effSwaggerJson = options.swaggerJson || swaggerJson;
    const swaggerObject = formSwaggerObject(schema, effectiveConfig, effSwaggerJson);
    app.use(i18n.init);
    swaggerTools.initializeMiddleware(swaggerObject, (middleware) => {
        app.use(middleware.swaggerMetadata());

        app.use(middleware.swaggerValidator({
            validateResponse: true,
        }));

        const m = options.models || modelsGenerator(schema);
        app.locals.models = m; // eslint-disable-line no-param-reassign
        if (Array.isArray(schema)) {
            app.use(multiModelsSupplyFn(m));
        } else {
            app.use(modelsSupplyFn(m));
        }

        app.use(middleware.swaggerSecurity(security));

        app.use(userAudit);

        const controllers = options.controllers || './controllers';
        app.use(middleware.swaggerRouter({
            useStubs: false,
            ignoreMissingHandlers: true,
            controllers,
        }));

        app.use(middleware.swaggerUi());

        app.use(errHandler);

        m.sequelize.sync({ force: effectiveConfig.env === 'test' })
            .then(() => callback(null, app))
            .catch(err => callback(err, app));
    });
};

const determineOrigin = function (origin) {
    if (origin === '*') {
        return '*';
    }
    const corsWhitelist = origin.split(' ');
    return function dofn(requestOrigin, callback) {
        const originStatus = corsWhitelist.indexOf(requestOrigin) > -1;
        const errorMsg = originStatus ? null : 'CORS Error';
        callback(errorMsg, originStatus);
    };
};

exports.newExpress = function newExpress(options = {}) {
    const app = express();

    const jsonParser = bodyParser.json();

    const effectiveConfig = options.config || config;
    const origin = effectiveConfig.cors.origin;

    const corsOptions = {
        credentials: true,
        origin: determineOrigin(origin),
        allowedheaders: [
            'Accept',
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'X-HTTP-Allow-Override',
        ],
    };

    expressWinston.requestWhitelist.push('body');
    expressWinston.responseWhitelist.push('body');

    app.use(expressWinston.logger({
        winstonInstance: logger,
        msg: 'HTTP {{req.method}} {{req.url}}',
        expressFormat: true,
        colorize: true,
    }));

    app.use(cors(corsOptions));
    app.use(cookieParser());
    app.use(jsonParser);
    app.enable('trust proxy');
    app.use(passport.initialize());

    app.use((req, res, next) => {
        const isAuth = req.url.indexOf('/auth/basic') >= 0;
        const token = _.get(req, 'cookies.rr-jwt-token');
        if (token && !isAuth) {
            _.set(req, 'headers.authorization', `Bearer ${token}`);
        }
        next();
    });

    return app;
};

exports.generate = function generate(options, callback) {
    const app = this.newExpress();
    this.initialize(app, options, callback);
};
