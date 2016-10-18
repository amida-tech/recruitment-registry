'use strict';

const util = require('util');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const moment = require('moment');

const config = require('../config');

const GENDER_MALE = 'male';
const GENDER_FEMALE = 'female';
const GENDER_OTHER = 'other';

module.exports = function (sequelize, DataTypes) {
    const bccompare = sequelize.Promise.promisify(bcrypt.compare, {
        context: bcrypt
    });
    const bchash = sequelize.Promise.promisify(bcrypt.hash, {
        context: bcrypt
    });
    const randomBytes = sequelize.Promise.promisify(crypto.randomBytes, {
        context: crypto
    });

    const clientUpdatableFields = ['email', 'password', 'zip', 'ethnicity', 'gender'].reduce(function (r, p) {
        r[p] = true;
        return r;
    }, {});

    const User = sequelize.define('registry_user', {
        username: {
            type: DataTypes.TEXT,
            unique: {
                msg: 'The specified username is already in use.'
            },
            validate: {
                notEmpty: true
            },
            allowNull: false
        },
        email: {
            type: DataTypes.TEXT,
            unique: {
                msg: 'The specified email address is already in use.'
            },
            validate: {
                isEmail: true
            },
            set: function (val) {
                this.setDataValue('email', val && val.toLowerCase());
            },
            allowNull: false
        },
        password: {
            type: DataTypes.TEXT,
            validate: {
                notEmpty: true
            },
            allowNull: false
        },
        zip: {
            type: DataTypes.TEXT
        },
        ethnicity: {
            type: DataTypes.INTEGER,
            references: {
                model: 'ethnicity',
                key: 'id'
            },
            set: function (val) {
                if (typeof val === 'string') {
                    val = sequelize.models.ethnicity.idByName(val);
                }
                this.setDataValue('ethnicity', val);
            },
            get: function () {
                const value = this.getDataValue('ethnicity');
                if ((value === null || value === undefined)) {
                    return value;
                }
                return sequelize.models.ethnicity.nameById(value);
            }
        },
        gender: {
            type: DataTypes.ENUM(GENDER_MALE, GENDER_FEMALE, GENDER_OTHER)
        },
        role: {
            type: DataTypes.ENUM('admin', 'participant', 'clinician')
        },
        resetPasswordToken: {
            unique: {
                msg: 'Internal error generating unique token.'
            },
            type: DataTypes.STRING,
        },
        resetPasswordExpires: {
            type: DataTypes.DATE,
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at',
        },
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        hooks: {
            afterSync: function (options) {
                if (options.force) {
                    const user = _.assign(config.superUser, {
                        role: 'admin'
                    });
                    return User.create(user);
                }
            },
            beforeCreate: function (user) {
                return user.updatePassword();
            },
            beforeUpdate: function (user) {
                if (user.changed('password')) {
                    return user.updatePassword();
                }
            }
        },
        classMethods: {
            getUser: function (id) {
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
                }).then(function (result) {
                    const e = result.ethnicity;
                    if (e) {
                        result.ethnicity = sequelize.models.ethnicity.nameById(e);
                    }
                    return result;
                });
            },
            genders: function () {
                return [GENDER_MALE, GENDER_FEMALE, GENDER_OTHER];
            },
            updateUser: function (id, values, options) {
                options = options || {};
                return User.findById(id, options).then(function (user) {
                    Object.keys(values).forEach(function (key) {
                        if (!clientUpdatableFields[key]) {
                            const msg = util.format('Field %s cannot be updated.', key);
                            throw new sequelize.ValidationError(msg);
                        }
                    });
                    return user.update(values, options);
                });
            },
            authenticateUser: function (id, password) {
                return User.findById(id).then(function (user) {
                    return user.authenticate(password);
                });
            },
            resetPasswordToken: function (email) {
                return this.find({
                    where: {
                        email: email
                    }
                }).then((user) => {
                    if (!user) {
                        const err = new Error('Email is invalid.');
                        return sequelize.Promise.reject(err);
                    } else {
                        return user.updateResetPWToken();
                    }
                });
            },
            resetPassword: function (token, password) {
                const rejection = function () {
                    const err = new Error('Password reset token is invalid or has expired.');
                    return sequelize.Promise.reject(err);
                };
                return this.find({
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
            },
            listConsentDocuments: function (userId, typeIds, tx, language) {
                const options = { summary: true };
                if (typeIds && typeIds.length) {
                    options.typeIds = typeIds;
                }
                if (tx) {
                    options.transaction = tx;
                }
                if (language) {
                    options.language = language;
                }
                return sequelize.models.consent_document.listConsentDocuments(options)
                    .then(activeDocs => {
                        const query = {
                            where: { userId },
                            raw: true,
                            attributes: ['consentDocumentId'],
                            order: 'consent_document_id'
                        };
                        if (tx) {
                            query.transaction = tx;
                        }
                        return sequelize.models.consent_signature.findAll(query)
                            .then(signedDocs => _.map(signedDocs, 'consentDocumentId'))
                            .then(signedDocIds => activeDocs.filter(activeDoc => signedDocIds.indexOf(activeDoc.id) < 0));
                    });
            }
        },
        instanceMethods: {
            authenticate: function (password) {
                return bccompare(password, this.password).then(function (result) {
                    if (!result) {
                        throw new Error('Authentication error.');
                    }
                });
            },
            updatePassword: function () {
                return bchash(this.password, config.crypt.hashrounds).then((hash) => {
                    this.password = hash;
                });
            },
            updateResetPWToken: function () {
                return randomBytes(config.crypt.resetTokenLength).then((buf) => {
                    const token = buf.toString('hex');
                    return token;
                }).then((token) => {
                    return randomBytes(config.crypt.resetPasswordLength).then((passwordBuf) => {
                        return {
                            token,
                            password: passwordBuf.toString('hex')
                        };
                    });
                }).then((result) => {
                    this.resetPasswordToken = result.token;
                    this.password = result.password;
                    this.resetPasswordExpires = config.expiresForDB();
                    return this.save().then(() => {
                        return result.token;
                    });
                });
            }
        }
    });

    return User;
};
