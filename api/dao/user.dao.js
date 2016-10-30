'use strict';

const _ = require('lodash');
const util = require('util');
const moment = require('moment');

const db = require('../models/db');
const SPromise = require('../lib/promise');

const sequelize = db.sequelize;
const ConsentSignature = db.ConsentSignature;
const User = db.User;

const clientUpdatableFields = ['email', 'password'].reduce((r, p) => {
    r[p] = true;
    return r;
}, {});

module.exports = class {
	constructor(dependencies) {
        Object.assign(this, dependencies);
	}

	getUser(id) {
	    return User.findById(id, {
	        raw: true,
	        attributes: {
	            exclude: [
	                'createdAt',
	                'updatedAt',
	                'password',
	                'resetPasswordToken',
	                'resetPasswordExpires'
	            ]
	        }
	    });
	}

	updateUser(id, values, options) {
	    options = options || {};
	    return User.findById(id, options).then(user => {
	        Object.keys(values).forEach(key => {
	            if (!clientUpdatableFields[key]) {
	                const msg = util.format('Field %s cannot be updated.', key);
	                throw new sequelize.ValidationError(msg);
	            }
	        });
	        return user.update(values, options);
	    });
	}

	authenticateUser(id, password) {
	    return User.findById(id).then(user => {
	        return user.authenticate(password);
	    });
	}

	resetPasswordToken(email) {
	    return User.find({
	        where: {
	            email: email
	        }
	    }).then((user) => {
	        if (!user) {
	            const err = new Error('Email is invalid.');
	            return SPromise.reject(err);
	        } else {
	            return user.updateResetPWToken();
	        }
	    });
	}

	resetPassword(token, password) {
	    const rejection = function () {
	        const err = new Error('Password reset token is invalid or has expired.');
	        return SPromise.reject(err);
	    };
	    return User.find({
	        where: {
	            resetPasswordToken: token
	        }
	    }).then((user) => {
	        if (!user) {
	            return rejection();
	        } else {
	            const expires = user.resetPasswordExpires;
	            const mExpires = moment.utc(expires);
	            if (moment.utc().isAfter(mExpires)) {
	                return rejection();
	            } else {
	                user.password = password;
	                return user.save();
	            }
	        }
	    });
	}

	listConsentDocuments(userId, options = {}) {
	    const _options = { summary: true };
	    const typeIds = options.typeIds;
	    if (typeIds && typeIds.length) {
	        _options.typeIds = typeIds;
	    }
	    if (options.transaction) {
	        _options.transaction = options.transaction;
	    }
	    if (options.language) {
	        _options.language = options.language;
	    }
	    return this.consentDocument.listConsentDocuments(_options)
	        .then(activeDocs => {
	            const query = {
	                where: { userId },
	                raw: true,
	                attributes: ['consentDocumentId'],
	                order: 'consent_document_id'
	            };
	            if (options.transaction) {
	                query.transaction = options.transaction;
	            }
	            return ConsentSignature.findAll(query)
	                .then(signedDocs => _.map(signedDocs, 'consentDocumentId'))
	                .then(signedDocIds => activeDocs.filter(activeDoc => signedDocIds.indexOf(activeDoc.id) < 0));
	        });
	}
};

