'use strict';

const express = require('express');

const auth = require('../../auth/auth.service');

const controller = require('./user.controller');

var router = new express.Router();

router.get('/me', auth.isAuthenticated(), controller.showCurrentUser);
router.post('/', controller.createNewUser);

module.exports = router;
