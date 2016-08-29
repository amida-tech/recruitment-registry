'use strict';

const bcrypt = require('bcrypt');

module.exports = function (sequelize, DataTypes) {
    const User = sequelize.define('user', {
        email: DataTypes.TEXT,
        password: DataTypes.TEXT,
        admin: DataTypes.BOOLEAN
    }, {
        timestamps: false,
        hooks: {
            beforeBulkCreate: function (users, fields, fn) {
                var totalUpdated = 0;
                users.forEach(function (user) {
                    user.updatePassword(function (err) {
                        if (err) {
                            return fn(err);
                        }
                        totalUpdated += 1;
                        if (totalUpdated === users.length) {
                            return fn();
                        }
                    });
                });
            },
            beforeCreate: function (user, fields, fn) {
                user.updatePassword(fn);
            },
            beforeUpdate: function (user, fields, fn) {
                if (user.changed('password')) {
                    return user.updatePassword(fn);
                }
                fn();
            }
        },
        classMethods: {
            comparePassword: function(password, hash) {
                return bcrypt.compareSync(password, hash);
            }
        },
        instanceMethods: {
            updatePassword: function (fn) {
                // Handle new/update passwords
                var value = this.password;
                if (! value) {
                    fn(new Error('Invalid password'));
                }
                bcrypt.hash(value, 10, (err, hash) => {
                    if (err) {
                        return fn(err);
                    }
                    this.password = hash;
                    fn(null);
                })
            }
        }
    });

    return User;
};
