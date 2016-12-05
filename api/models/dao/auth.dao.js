'use strict';

const db = require('../db');
const RRError = require('../../lib/rr-error');

const sequelize = db.sequelize;
const User = db.User;

module.exports = class UserDAO {
    constructor() {}

    getUser({ id, username }) {
        return User.findOne({
            raw: true,
            where: { id, originalUsername: username },
            attributes: ['id', 'username', 'email', 'role']
        });
    }

    authenticateUser(username, password) {
        return User.findOne({
                where: {
                    $or: [
                        { username },
                        {
                            $and: [{
                                username: sequelize.fn('lower', sequelize.col('email'))
                            }, {
                                username: sequelize.fn('lower', username)
                            }]
                        }
                    ]
                }
            })
            .then(user => {
                if (user) {
                    return user.authenticate(password)
                        .then(() => ({
                            id: user.id,
                            originalUsername: user.originalUsername
                        }));
                } else {
                    return RRError.reject('authenticationError');
                }
            });
    }
};
