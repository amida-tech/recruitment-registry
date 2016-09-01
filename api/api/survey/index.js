'use strict';

const express = require('express');

const controller = require('./survey.controller');

const auth = require('../../auth/auth.service');

var router = new express.Router();

router.get('/empty/:name', controller.getEmptySurvey);
router.post('/', auth.isAuthenticated(), controller.createSurvey);

module.exports = router;
