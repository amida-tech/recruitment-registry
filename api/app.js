'use strict';

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const passport = require('passport');
const logger = require('./logger');
const config = require('./config');

const app = express();

const jsonParser = bodyParser.json();

/* Middleware */
if (process.env.NODE_ENV === 'development') {
    app.use(logger);
}

app.use(cors());
app.use(jsonParser);
app.use(passport.initialize());
app.use(passport.session());

// Routes
require('./routes')(app);

module.exports = app;
