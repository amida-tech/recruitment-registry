'use strict';

const express = require('express');

const controller = require('./survey.controller');

const auth = require('../../auth/auth.service');

var router = new express.Router();

router.post('/', auth.isAuthenticated(), controller.createSurvey);
router.get('/empty/:name', controller.getEmptySurvey);
router.get('/:name', auth.isAuthenticated(), controller.getSurveyByName);

module.exports = router;
