'use strict';

const express = require('express');

const controller = require('./gender.controller');

var router = new express.Router();

router.get('/', controller.getGenders);

module.exports = router;
