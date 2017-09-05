'use strict';

const _ = require('lodash');

const Base = require('./base');

module.exports = class SMTPDAO extends Base {
    createSmtpTx(smtp, transaction) {
        const Smtp = this.db.Smtp;
        const SmtpText = this.db.SmtpText;
        const type = smtp.type;
        return Smtp.destroy({ where: { type }, transaction })
            .then(() => {
                const fields = _.omit(smtp, ['subject', 'content']);
                if (!fields.type) {
                    fields.type = type;
                }
                const { subject, content } = smtp;
                return Smtp.create(fields, { transaction })
                    .then(() => {
                        if (content) {
                            const record = { type, subject, content, language: 'en' };
                            return SmtpText.destroy({ where: { type }, transaction })
                                .then(() => SmtpText.create(record, { transaction }));
                        }
                        return null;
                    });
            });
    }

    createSmtp(smtp) {
        return this.transaction(tx => this.createSmtpTx(smtp, tx));
    }

    updateSmtpTextTx({ type, subject, content }, language, transaction) {
        const SmtpText = this.db.SmtpText;
        return SmtpText.destroy({ where: { type, language }, transaction })
            .then(() => SmtpText.create({ type, subject, content, language }, { transaction }));
    }

    updateSmtpText(smtpText, language) {
        return this.transaction(tx => this.updateSmtpTextTx(smtpText, language || 'en', tx));
    }

    getSmtp(options) {
        const Smtp = this.db.Smtp;
        const SmtpText = this.db.SmtpText;
        const attributes = {
            exclude: ['id', 'createdAt', 'deletedAt', 'type'],
        };
        const type = options.type;
        return Smtp.findOne({ where: { type }, raw: true, attributes })
            .then((smtp) => {
                if (!smtp) {
                    return null;
                }
                const language = options.language || 'en';
                return SmtpText.findOne({
                    raw: true,
                    where: { type, language },
                    attributes: ['subject', 'content'],
                })
                    .then((text) => {
                        if (!text && (language !== 'en')) {
                            return SmtpText.findOne({
                                raw: true,
                                where: { type, language: 'en' },
                                attributes: ['subject', 'content'],
                            });
                        }
                        return text;
                    })
                    .then((text) => {
                        if (text) {
                            Object.assign(smtp, text);
                        }
                        return smtp;
                    });
            });
    }

    deleteSmtp(type) {
        return this.db.Smtp.destroy({ where: { type } });
    }
};
