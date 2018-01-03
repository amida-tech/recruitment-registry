'use strict';

const Sequelize = require('sequelize');
const RRError = require('../../lib/rr-error');

const Base = require('./base');

const Op = Sequelize.Op;

module.exports = class UserDAO extends Base {
    getUser({ id, username }) {
        const User = this.db.User;
        return User.findOne({
            raw: true,
            where: { id, originalUsername: username },
            attributes: ['id', 'username', 'email', 'role'],
        });
    }

    authenticateUser(username, password) {
        const User = this.db.User;
        const sequelize = this.db.sequelize;
        return User.findOne({
            where: {
                [Op.or]: [
                        { username },
                    {
                        [Op.and]: [{
                            username: sequelize.fn('lower', sequelize.col('email')),
                        }, {
                            username: sequelize.fn('lower', username),
                        }],
                    },
                ],
            },
        })
            .then((user) => {
                if (user) {
                    if (user.role === 'import') {
                        return RRError.reject('authenticationImportedUser');
                    }
                    return user.authenticate(password)
                        .then(() => ({
                            id: user.id,
                            originalUsername: user.originalUsername,
                        }));
                }
                return RRError.reject('authenticationError');
            });
    }
};
