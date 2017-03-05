'use strict';

const moment = require('moment');
const _ = require('lodash');

const db = require('../db');
const RRError = require('../../lib/rr-error');

const sequelize = db.sequelize;
const User = db.User;

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
        return User.findById(id, {
            raw: true,
            attributes: ['id', 'username', 'email', 'role'],
        });
    }

    listUsers(options = {}) {
        const role = options.role ? options.role : { $in: ['clinician', 'participant'] };
        const where = { role };
        return User.findAll({
            raw: true,
            where,
            attributes: ['id', 'username', 'email', 'role'],
            order: 'username',
        });
    }

    deleteUser(id) {
        return User.destroy({ where: { id } });
    }

    updateUser(id, fields) {
        return User.findById(id)
            .then((user) => {
                fields = _.pick(fields, ['username', 'email', 'password']);
                if (user.username === user.email.toLowerCase()) {
                    if (fields.hasOwnProperty('username')) {
                        return RRError.reject('userNoUsernameChange');
                    }
                    if (fields.hasOwnProperty('email')) {
                        fields.username = fields.email.toLowerCase();
                    }
                }
                return user.update(fields);
            });
    }

    resetPasswordToken(email) {
        const where = sequelize.where(sequelize.fn('lower', sequelize.col('email')), sequelize.fn('lower', email));
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
