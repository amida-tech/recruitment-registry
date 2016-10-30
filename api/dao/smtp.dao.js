'use strict';

const _ = require('lodash');

const db = require('../models/db');

const sequelize = db.sequelize;
const Smtp = db.Smtp;
const SmtpText = db.SmtpText;

module.exports = class {
	constructor() {}

	createSmtpTx(smtp, tx) {
	    return Smtp.destroy({ where: { deletedAt: null }, transaction: tx })
	        .then(() => {
	            const fields = _.omit(smtp, ['subject', 'content']);
	            const { subject, content } = smtp;
	            return Smtp.create(fields, { transaction: tx })
	                .then(() => {
	                    if (content) {
	                        return SmtpText.destroy({
	                                where: {},
	                                transaction: tx
	                            })
	                            .then(() => SmtpText.create({ subject, content, language: 'en' }, { transaction: tx }));
	                    }
	                });
	        });
	}

	createSmtp(smtp) {
	    return sequelize.transaction(tx => this.createSmtpTx(smtp, tx));
	}

	updateSmtpTextTx({ subject, content }, language, tx) {
	    return SmtpText.destroy({
	            where: { language },
	            transaction: tx
	        })
	        .then(() => SmtpText.create({ subject, content, language }, { transaction: tx }));
	}

 	updateSmtpText(smtpText, language) {
	    language = language || 'en';
	    return sequelize.transaction(tx => this.updateSmtpTextTx(smtpText, language, tx));
	}

	getSmtp(options = {}) {
	    const attributes = {
	        exclude: ['id', 'createdAt', 'deletedAt']
	    };
	    return Smtp.findOne({ raw: true, attributes })
	        .then(smtp => {
	            if (!smtp) {
	                return null;
	            }
	            const language = options.language || 'en';
	            return SmtpText.findOne({
	                    raw: true,
	                    where: { language },
	                    attributes: ['subject', 'content']
	                })
	                .then(text => {
	                    if (!text && (language !== 'en')) {
	                        return SmtpText.findOne({
	                            raw: true,
	                            where: { language: 'en' },
	                            attributes: ['subject', 'content']
	                        });
	                    }
	                    return text;
	                })
	                .then(text => {
	                    if (text) {
	                        Object.assign(smtp, text);
	                    }
	                    return smtp;
	                });
	        });
	}

	deleteSmtp() {
	    return Smtp.destroy({ where: { deletedAt: null } });
	}
};

