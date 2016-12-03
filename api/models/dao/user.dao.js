'use strict';

const util = require('util');
const moment = require('moment');

const db = require('../db');
const RRError = require('../../lib/rr-error');

const sequelize = db.sequelize;
const User = db.User;

const clientUpdatableFields = ['email', 'password'].reduce((r, p) => {
    r[p] = true;
    return r;
}, {});

module.exports = class UserDAO {
    constructor(dependencies) {
        Object.assign(this, dependencies);
    }

    createUser(user, transaction) {
        const options = transaction ? { transaction } : {};
        if (user.username === user.email) {
            return RRError.reject('userIdenticalUsernameEmail');
        }
        return User.create(user, options);
    }

    getUser(id) {
        return User.findById(id, {
            raw: true,
            attributes: {
                exclude: [
                    'createdAt',
                    'updatedAt',
                    'deletedAt',
                    'password',
                    'resetPasswordToken',
                    'resetPasswordExpires'
                ]
            }
        });
    }

    deleteUser(id) {
        return User.destroy({ where: { id } });
    }

    updateUser(id, values, options) {
        options = options || {};
        return User.findById(id, options)
            .then(user => {
                Object.keys(values).forEach(key => {
                    if (!clientUpdatableFields[key]) {
                        const msg = util.format('Field %s cannot be updated.', key);
                        throw new sequelize.ValidationError(msg);
                    }
                });
                return user.update(values, options);
            });
    }

    authenticateUser(username, password) {
        return User.findOne({ where: { username } })
            .then(user => {
                if (user) {
                    return user.authenticate(password)
                        .then(() => user);
                } else {
                    return RRError.reject('authenticationError');
                }
            });
    }

    resetPasswordToken(email) {
        return User.find({ where: { email } })
            .then((user) => {
                if (!user) {
                    return RRError.reject('invalidEmail');
                }
                return user.updateResetPWToken();
            });
    }

    resetPassword(resetPasswordToken, password) {
        return User.find({ where: { resetPasswordToken } })
            .then((user) => {
                if (!user) {
                    return RRError.reject('invalidOrExpiredPWToken');
                }
                const expires = user.resetPasswordExpires;
                const mExpires = moment.utc(expires);
                if (moment.utc().isAfter(mExpires)) {
                    return RRError.reject('invalidOrExpiredPWToken');
                }
                user.password = password;
                return user.save();
            });
    }
};
