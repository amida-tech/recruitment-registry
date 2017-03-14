'use strict';

const moment = require('moment');
const _ = require('lodash');

const RRError = require('../../lib/rr-error');

const attributes = ['id', 'username', 'email', 'role', 'firstname', 'lastname', 'createdAt'];

module.exports = class UserDAO {
    constructor(db, dependencies) {
        Object.assign(this, dependencies);
        this.db = db;
    }

    createUser(newUser, transaction) {
        const options = transaction ? { transaction } : {};
        if (newUser.username === newUser.email) {
            return RRError.reject('userIdenticalUsernameEmail');
        }
        const user = Object.assign({}, newUser);
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
        return this.db.User.create(user, options);
    }

    getUser(id) {
        return this.db.User.findById(id, { raw: true, attributes })
            .then(user => _.omitBy(user, _.isNil));
    }

    listUsers(options = {}) {
        const role = options.role ? options.role : { $in: ['clinician', 'participant'] };
        const where = { role };
        return this.db.User.findAll({ raw: true, where, attributes, order: 'username' })
            .then(users => users.map(user => _.omitBy(user, _.isNil)));
    }

    deleteUser(id) {
        return this.db.User.destroy({ where: { id } });
    }

    updateUser(id, userPatch) {
        return this.db.User.findById(id)
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
        const sequelize = this.db.sequelize;
        const lowerEmailColumn = sequelize.fn('lower', sequelize.col('email'));
        const where = sequelize.where(lowerEmailColumn, sequelize.fn('lower', email));
        return this.db.User.find({ where })
            .then((user) => {
                if (!user) {
                    return RRError.reject('invalidEmail');
                }
                return user.updateResetPWToken();
            });
    }

    resetPassword(resetPasswordToken, password) {
        const User = this.db.User;
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
                Object.assign(user, { password });
                return user.save();
            });
    }
};
