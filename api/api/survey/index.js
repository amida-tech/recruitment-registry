'use strict';

const express = require('express');

const controller = require('./survey.controller');

const auth = require('../../auth/auth.service');

var router = new express.Router();

router.post('/', controller.createSurvey);
router.get('/empty/:name', controller.getEmptySurvey);
router.get('/:name', controller.getSurveyByName);

module.exports = router;
