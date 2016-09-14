'use strict';

const _ = require('lodash');
const bcrypt = require('bcrypt');

const config = require('../config');

const GENDER_MALE = 'male';
const GENDER_FEMALE = 'female';
const GENDER_OTHER = 'other';

module.exports = function (sequelize, DataTypes) {
    var bccompare = sequelize.Promise.promisify(bcrypt.compare, {
        context: bcrypt
    });
    var bchash = sequelize.Promise.promisify(bcrypt.hash, {
        context: bcrypt
    });

    const User = sequelize.define('user', {
        username: {
            type: DataTypes.TEXT,
            unique: {
                msg: 'The specified username is already in use.'
            },
            validate: {
                notEmpty: true
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
                this.setDataValue('email', val && val.toLowerCase());
            },
            allowNull: false
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
            },
            get: function () {
                const value = this.getDataValue('ethnicity');
                if ((value === null || value === undefined)) {
                    return value;
                }
                return sequelize.models.ethnicity.nameById(value);
            }
        },
        gender: {
            type: DataTypes.ENUM(GENDER_MALE, GENDER_FEMALE, GENDER_OTHER)
        },
        role: {
            type: DataTypes.ENUM('admin', 'participant', 'clinician')
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
            afterSync: function (options) {
                if (options.force) {
                    var user = _.assign(config.superUser, {
                        role: 'admin'
                    });
                    return User.create(user);
                }
            },
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
            beforeCreate: function (user, fields) {
                return user.updatePassword();
            },
            beforeUpdate: function (user, fields) {
                if (user.changed('password')) {
                    return user.updatePassword();
                }
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
            },
            genders: function () {
                return [GENDER_MALE, GENDER_FEMALE, GENDER_OTHER];
            },
            register: function (input) {
                return sequelize.transaction(function (tx) {
                    input.user.role = 'participant';
                    return User.create(input.user, {
                        transaction: tx
                    }).then(function (user) {
                        const answerInput = {
                            userId: user.id,
                            surveyId: input.surveyId,
                            answers: input.answers
                        };
                        return sequelize.models.answer.createAnswersTx(answerInput, tx).then(function () {
                            return user.id;
                        });
                    });
                });
            },
            showWithSurvey: function (input) {
                return User.getUser(input.userId).then(function (user) {
                    return sequelize.models.survey.getAnsweredSurveyByName(user.id, input.surveyName).then(function (survey) {
                        return {
                            user,
                            survey
                        };
                    });
                });
            }
        },
        instanceMethods: {
            authenticate: function (password) {
                return bccompare(password, this.password).then(function (result) {
                    if (!result) {
                        throw new Error('Authentication error.');
                    }
                });
            },
            updatePassword: function () {
                return bchash(this.password, 10).then((hash) => {
                    this.password = hash;
                });
            }
        }
    });

    return User;
};
