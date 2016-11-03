'use strict';

const models = require('../../models');

const authentication01 = require('./authentication-01');
const authorization01 = require('./authorization-01');
const adminQuestion01 = require('./admin-question-01');
const adminQuestion02 = require('./admin-question-02');
const adminQuestion03 = require('./admin-question-03');
const adminQuestion04 = require('./admin-question-04');
const adminSurvey01 = require('./admin-survey-01');
const adminProfileSurvey01 = require('./admin-profile-survey-01');
const adminConsentDocument01 = require('./admin-consent-document-01');
const adminConsentDocument02 = require('./admin-consent-document-02');
const adminConsentDocument03 = require('./admin-consent-document-03');
const adminConsentDocument04 = require('./admin-consent-document-04');
const registration01 = require('./registration-01');
const registration02 = require('./registration-02');
const registration03 = require('./registration-03');
const registration04 = require('./registration-04');
const profile01 = require('./profile-01');
const profile02 = require('./profile-02');

const locals = {};

models.sequelize.sync({ force: true })
	.then(() => locals)
	.then(authentication01)
	.then(authorization01)
	.then(adminQuestion01)
	.then(adminQuestion02)
	.then(adminQuestion03)
	.then(adminQuestion04)
	.then(adminSurvey01)
	.then(adminProfileSurvey01)
	.then(adminConsentDocument01)
	.then(adminConsentDocument02)
	.then(adminConsentDocument03)
	.then(adminConsentDocument04)
	.then(registration01)
	.then(registration02)
	.then(registration03)
	.then(registration04)
	.then(profile01)
	.then(profile02)
	.then(profile01)
	.then(() => {
		console.log('success');
		process.exit(0);
	})
	.catch((err) => {
		console.log(err);
		process.exit(1);
	});
