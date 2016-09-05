'use strict';

const express = require('express');

const passportBasic = require('./basic/passport');
const authService = require('./auth.service');

passportBasic.init();
authService.init();

var router = new express.Router();

router.use('/basic', require('./basic'));

module.exports = router;
