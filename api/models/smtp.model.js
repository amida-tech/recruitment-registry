'use strict';

const _ = require('lodash');

module.exports = function (sequelize, DataTypes) {
    const SmtpText = sequelize.models.smtp_text;

    const Smtp = sequelize.define('smtp', {
        protocol: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        username: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        password: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        host: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        from: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'email_from'
        },
        otherOptions: {
            type: DataTypes.JSON,
            allowNull: false,
            field: 'other_options'
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at',
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true,
        classMethods: {
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
            },
            createSmtp(smtp) {
                return sequelize.transaction(tx => Smtp.createSmtpTx(smtp, tx));
            },
            updateSmtpTextTx({ subject, content }, language, tx) {
                return SmtpText.destroy({
                        where: { language },
                        transaction: tx
                    })
                    .then(() => SmtpText.create({ subject, content, language }, { transaction: tx }));
            },
            updateSmtpText(smtpText, language) {
                language = language || 'en';
                return sequelize.transaction(tx => Smtp.updateSmtpTextTx(smtpText, language, tx));
            },
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
            },
            deleteSmtp() {
                return Smtp.destroy({ where: { deletedAt: null } });
            }
        }
    });

    return Smtp;
};
