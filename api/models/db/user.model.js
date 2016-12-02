'use strict';

const _ = require('lodash');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const config = require('../../config');
const SPromise = require('../../lib/promise');
const RRError = require('../../lib/rr-error');

module.exports = function (sequelize, DataTypes) {
    const bccompare = SPromise.promisify(bcrypt.compare, {
        context: bcrypt
    });
    const bchash = SPromise.promisify(bcrypt.hash, {
        context: bcrypt
    });
    const randomBytes = SPromise.promisify(crypto.randomBytes, {
        context: crypto
    });

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
            set(val) {
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
            afterSync(options) {
                if (options.force) {
                    const user = _.assign(config.superUser, {
                        role: 'admin'
                    });
                    return User.create(user);
                }
            },
            beforeCreate(user) {
                return user.updatePassword();
            },
            beforeUpdate(user) {
                if (user.changed('password')) {
                    return user.updatePassword();
                }
            }
        },
        instanceMethods: {
            authenticate(password) {
                return bccompare(password, this.password)
                    .then(result => {
                        if (!result) {
                            throw new RRError('authenticationError');
                        }
                    });
            },
            updatePassword() {
                return bchash(this.password, config.crypt.hashrounds)
                    .then(hash => {
                        this.password = hash;
                    });
            },
            updateResetPWToken() {
                return randomBytes(config.crypt.resetTokenLength)
                    .then(buf => {
                        const token = buf.toString('hex');
                        return token;
                    })
                    .then((token) => {
                        return randomBytes(config.crypt.resetPasswordLength).then(passwordBuf => {
                            return {
                                token,
                                password: passwordBuf.toString('hex')
                            };
                        });
                    })
                    .then((result) => {
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
