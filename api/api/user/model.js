'use strict';

const bcrypt = require('bcrypt');

module.exports = function (sequelize, DataTypes) {
    const User = sequelize.define('user', {
        email: DataTypes.TEXT,
        password: DataTypes.TEXT,
        admin: DataTypes.BOOLEAN
    }, {
        timestamps: false,
        classMethods: {
            hashPassword: function(password) {
                return bcrypt.hashSync(password, 10);
            },
            comparePassword: function(password, hash) {
                return bcrypt.compareSync(password, hash);
            }
        }
    });

    return User;
};
