'use strict';

const express = require('express');

const controller = require('./answer.controller');

const auth = require('../../auth/auth.service');

var router = new express.Router();

router.post('/', auth.isAuthenticated(), controller.createAnswers);

module.exports = router;
