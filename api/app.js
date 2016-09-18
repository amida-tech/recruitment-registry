'use strict';

const config = require('./config');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const passport = require('passport');
const expressWinston = require('express-winston');

const logger = require('./logger');

const app = express();

const jsonParser = bodyParser.json();

if (!config.logging.disable) {
    app.use(expressWinston.logger({
        winstonInstance: logger,
        msg: 'HTTP {{req.method}} {{req.url}}',
        expressFormat: true,
        colorize: true
    }));
}

app.use(cors());
app.use(jsonParser);
app.use(passport.initialize());
app.use(passport.session());

module.exports = app;
