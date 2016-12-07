'use strict';

const childProcess = require('child_process');

const config = require('./config');

const app = require('./app');
const appgen = require('./app-generator');

appgen.initialize(app, {}, function (err) {
    if (err) {
        console.log('Server failed to start due to error: %s', err);
    } else {
        runScript(function () {
            app.listen(config.port, function () {
                console.log('Server started at ', config.port);
            });
        });
    }
});

module.exports = app;

/**
 * Helper function to run the seed script on server start
 */
function runScript(callback) {

    // keep track of whether callback has been invoked to prevent multiple invocations
    var invoked = false;

    var process = childProcess.fork(config.startupScript);

    // listen for errors as they may prevent the exit event from firing
    process.on('error', function (err) {
        if (invoked) return;
        invoked = true;
        callback(err);
    });

    // execute the callback once the process has finished running
    process.on('exit', function (code) {
        if (invoked) return;
        invoked = true;
        var err = code === 0 ? null : new Error('exit code ' + code);
        callback(err);
    });

}