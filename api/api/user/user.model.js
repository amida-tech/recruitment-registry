'use strict';

const bcrypt = require('bcrypt');

module.exports = function (sequelize, DataTypes) {
    const User = sequelize.define('user', {
        username: {
            type: DataTypes.TEXT,
            unique: {
                msg: 'The specified username is already in use.'
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
            set: function (val) {
                this.setDataValue('email', val.toLowerCase());
            }
        },
        password: {
            type: DataTypes.TEXT,
            validate: {
                notEmpty: true
            },
            allowNull: false
        },
        zip: {
            type: DataTypes.TEXT
        },
        ethnicity: {
            type: DataTypes.INTEGER,
            references: {
                model: 'ethnicity',
                key: 'id'
            },
            set: function (val) {
                if (typeof val === 'string') {
                    val = sequelize.models.ethnicity.idByName(val);
                }
                this.setDataValue('ethnicity', val);
            }
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
            getUser: function (id) {
                return User.findById(id, {
                    raw: true
                }).then(function (result) {
                    var e = result.ethnicity;
                    if (e) {
                        result.ethnicity = sequelize.models.ethnicity.nameById(e);
                    }
                    return result;
                });
            }
        },
        instanceMethods: {
            authenticate: function (password, callback) {
                const hash = this.password;
                bcrypt.compare(password, hash, callback);
            },
            updatePassword: function (fn) {
                // Handle new/update passwords
                var value = this.password;
                if (!value) {
                    fn(new Error('Invalid password'));
                }
                bcrypt.hash(value, 10, (err, hash) => {
                    if (err) {
                        return fn(err);
                    }
                    this.password = hash;
                    fn(null);
                });
            }
        }
    });

    return User;
};
