'use strict';

const express = require('express');

const controller = require('./answer.controller');

const auth = require('../../auth/auth.service');

var router = new express.Router();

router.post('/', controller.createAnswers);

module.exports = router;
