'use strict';

const moment = require('moment');
const _ = require('lodash');

const db = require('../db');
const RRError = require('../../lib/rr-error');

const sequelize = db.sequelize;
const User = db.User;

const attributes = ['id', 'username', 'email', 'role', 'firstname', 'lastname', 'createdAt'];

module.exports = class UserDAO {
    constructor(dependencies) {
        Object.assign(this, dependencies);
    }

    createUser(user, transaction) {
        const options = transaction ? { transaction } : {};
        if (user.username === user.email) {
            return RRError.reject('userIdenticalUsernameEmail');
        }
        user = Object.assign({}, user);
        if (!user.username) {
            const email = user.email;
            if (email && (typeof email === 'string')) {
                user.username = email.toLowerCase();
            }
        }
        user.originalUsername = user.username;
        if (!user.role) {
            user.role = 'participant';
        }
        return User.create(user, options);
    }

    getUser(id) {
        return User.findById(id, { raw: true, attributes })
            .then(user => _.omitBy(user, _.isNil));
    }

    listUsers(options = {}) {
        const role = options.role ? options.role : { $in: ['clinician', 'participant'] };
        const where = { role };
        return User.findAll({ raw: true, where, attributes, order: 'username' })
            .then(users => users.map(user => _.omitBy(user, _.isNil)));
    }

    deleteUser(id) {
        return User.destroy({ where: { id } });
    }

    updateUser(id, userPatch) {
        return User.findById(id)
            .then((user) => {
                const fields = Object.assign({}, userPatch);
                if (user.username === user.email.toLowerCase()) {
                    if (Object.prototype.hasOwnProperty.call(fields, 'username')) {
                        return RRError.reject('userNoUsernameChange');
                    }
                    if (Object.prototype.hasOwnProperty.call(fields, 'email')) {
                        fields.username = fields.email.toLowerCase();
                    }
                }
                ['lastname', 'firstname'].forEach((key) => {
                    if (Object.prototype.hasOwnProperty.call(fields, key)) {
                        if (!fields[key]) {
                            fields[key] = null;
                        }
                    }
                });
                return user.update(fields);
            });
    }

    resetPasswordToken(email) {
        const lowerEmailColumn = sequelize.fn('lower', sequelize.col('email'));
        const where = sequelize.where(lowerEmailColumn, sequelize.fn('lower', email));
        return User.find({ where })
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
