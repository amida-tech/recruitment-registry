'use strict';

const config = require('./config');

const app = require('./app');
const swaggerTools = require('swagger-tools');
const db = require('./db');

const swaggerObject = require('./swagger.json');

swaggerTools.initializeMiddleware(swaggerObject, function (middleware) {
    //app.use(middleware.swaggerMetadata());
    //app.use(middleware.swaggerValidator({
    //	validateResponse: true
    //}));

    //app.use(middleware.swaggerRouter({useStubs: true, controllers: './controllers'}));

    app.use(middleware.swaggerUi());

    // all other routes should return a 404
    app.route('/*').get((req, res) => {
        var result = {
            status: 404
        };
        res.status(result.status);
        res.json(result, result.status);
    });

    db.sequelize.sync().then(function () {
        app.listen(config.port, function () {
            console.log('Server started at ', config.port);
        });
    }).catch(function (err) {
        console.log('Server failed to start due to error: %s', err);
    });
});

module.exports = app;
