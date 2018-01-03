'use strict';

const Sequelize = require('sequelize');
const moment = require('moment');
const _ = require('lodash');

const Base = require('./base');
const RRError = require('../../lib/rr-error');

const Op = Sequelize.Op;

const attributes = [
    'id', 'username', 'email', 'role', 'firstname', 'lastname', 'institution', 'createdAt',
];

module.exports = class UserDAO extends Base {
    constructor(db, dependencies) {
        super(db);
        Object.assign(this, dependencies);
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
        let role = options.role ? options.role : { [Op.in]: ['clinician', 'participant'] };
        if (role === 'all') {
            role = { [Op.in]: ['admin', 'clinician', 'participant'] };
        }
        const where = { role };
        return this.db.User.findAll({ raw: true, where, attributes, order: ['username'] })
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
                ['lastname', 'firstname', 'institution'].forEach((key) => {
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

    importDummyUsers(originalIds) {
        const password = 'pw';
        const role = 'import';
        const records = originalIds.map((id) => {
            const username = `username_${id}`;
            const email = `${username}@dummy.com`;
            return { username, email, password, role };
        });
        return this.db.User.bulkCreate(records, { returning: true })
            .then((users) => {
                const userIdMap = new Map();
                originalIds.forEach((id, index) => {
                    const newId = users[index].id;
                    userIdMap.set(id, newId);
                });
                return userIdMap;
            });
    }
};
