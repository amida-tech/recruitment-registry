'use strict';

const express = require('express');

const auth = require('../../auth/auth.service');

const controller = require('./controller');

var router = new express.Router();

router.get('/', auth.isAuthenticated(), controller.showCurrentUser);
router.get('/token', auth.initialAuth(), controller.createToken);
router.post('/', controller.createNewUser);

module.exports = router;