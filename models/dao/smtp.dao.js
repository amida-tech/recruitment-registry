'use strict';

const _ = require('lodash');

const Base = require('./base');

module.exports = class SMTPDAO extends Base {
    createSmtpTx(smtp, transaction) {
        const Smtp = this.db.Smtp;
        const SmtpText = this.db.SmtpText;
        return Smtp.destroy({ where: { deletedAt: null }, transaction })
            .then(() => {
                const fields = _.omit(smtp, ['subject', 'content']);
                const { subject, content } = smtp;
                return Smtp.create(fields, { transaction })
                    .then(() => {
                        if (content) {
                            const record = { subject, content, language: 'en' };
                            return SmtpText.destroy({ where: {}, transaction })
                                .then(() => SmtpText.create(record, { transaction }));
                        }
                        return null;
                    });
            });
    }

    createSmtp(smtp) {
        return this.transaction(tx => this.createSmtpTx(smtp, tx));
    }

    updateSmtpTextTx({ subject, content }, language, transaction) {
        const SmtpText = this.db.SmtpText;
        return SmtpText.destroy({ where: { language }, transaction })
            .then(() => SmtpText.create({ subject, content, language }, { transaction }));
    }

    updateSmtpText(smtpText, language) {
        return this.transaction(tx => this.updateSmtpTextTx(smtpText, language || 'en', tx));
    }

    getSmtp(options = {}) {
        const Smtp = this.db.Smtp;
        const SmtpText = this.db.SmtpText;
        const attributes = {
            exclude: ['id', 'createdAt', 'deletedAt'],
        };
        return Smtp.findOne({ raw: true, attributes })
            .then((smtp) => {
                if (!smtp) {
                    return null;
                }
                const language = options.language || 'en';
                return SmtpText.findOne({
                    raw: true,
                    where: { language },
                    attributes: ['subject', 'content'],
                })
                    .then((text) => {
                        if (!text && (language !== 'en')) {
                            return SmtpText.findOne({
                                raw: true,
                                where: { language: 'en' },
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

    deleteSmtp() {
        return this.db.Smtp.destroy({ where: { deletedAt: null } });
    }
};
