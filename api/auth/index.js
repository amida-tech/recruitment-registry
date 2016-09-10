'use strict';

const express = require('express');

const passportBasic = require('./basic/passport');

passportBasic.init();

var router = new express.Router();

router.use('/basic', require('./basic'));

module.exports = router;
