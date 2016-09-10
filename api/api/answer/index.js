'use strict';

const express = require('express');

const controller = require('./answer.controller');

var router = new express.Router();

router.post('/', controller.createAnswers);

module.exports = router;
