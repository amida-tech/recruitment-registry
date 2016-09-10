'use strict';

const express = require('express');

const controller = require('./user.controller');

var router = new express.Router();

router.get('/me', controller.showCurrentUser);
router.post('/', controller.createNewUser);

module.exports = router;
