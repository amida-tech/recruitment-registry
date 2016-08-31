'use strict';

const config = require('./config');
const app = require('./app');
const db = require('./db');

//
// Start an instance of the app on the port specified in the proper
// NODE_ENV config obj. It's okay to log synchronously here on server
// initialization.
//

db.sequelize.sync().then(function () {
    app.listen(config.port, function () {
        console.log('Server started at ', config.port);
    });
}).catch(function (err) {
    console.log('Server failed to start due to error: %s', err);
});

module.exports = app;
