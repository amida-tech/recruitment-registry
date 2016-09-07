'use strict';

const express = require('express');

const controller = require('./ethnicity.controller');

var router = new express.Router();

router.get('/', controller.getEthnicities);

module.exports = router;
