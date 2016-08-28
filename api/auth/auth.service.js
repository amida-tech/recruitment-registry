'use strict';

const passport = require('passport');

exports.initialAuth = function() {  // this will be dissolved in the auth route later
	return passport.authenticate('basic', {
	    session: false
	})
};

exports.isAuthenticated = function() {
	return passport.authenticate('jwt', {
    	session: false
	})
};