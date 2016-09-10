'use strict';

const express = require('express');

const auth = require('../../auth/auth.service');

const controller = require('./registry.controller');

var router = new express.Router();

router.post('/user-profile', controller.createProfile);
router.get('/user-profile/:name', controller.getProfile);

module.exports = router;
