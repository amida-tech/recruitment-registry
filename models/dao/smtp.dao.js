'use strict';

const _ = require('lodash');

module.exports = class SMTPDAO {
    constructor(db) {
        this.db = db;
    }

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
                            return SmtpText.destroy({ where: {}, transaction })
                                .then(() => SmtpText.create({ subject, content, language: 'en' }, { transaction }));
                        }
                        return null;
                    });
            });
    }

    createSmtp(smtp) {
        const sequelize = this.db.sequelize;
        return sequelize.transaction(tx => this.createSmtpTx(smtp, tx));
    }

    updateSmtpTextTx({ subject, content }, language, transaction) {
        const SmtpText = this.db.SmtpText;
        return SmtpText.destroy({ where: { language }, transaction })
            .then(() => SmtpText.create({ subject, content, language }, { transaction }));
    }

    updateSmtpText(smtpText, language) {
        const sequelize = this.db.sequelize;
        language = language || 'en';
        return sequelize.transaction(tx => this.updateSmtpTextTx(smtpText, language, tx));
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
