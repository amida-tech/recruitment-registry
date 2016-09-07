'use strict';

const _possibleNames = ['text', 'choice', 'choices', 'bool'];

module.exports = function (sequelize, DataTypes) {
    const QuestionType = sequelize.define('question_type', {
        name: {
            type: DataTypes.TEXT
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
                    let p = sequelize.Promise.resolve(true);
                    _possibleNames.map(function (name) {
                        p = p.then(function () {
                            return QuestionType.create({
                                name
                            });
                        });
                    });
                    return p;
                }
            }
        },
        classMethods: {
            possibleNames: function () {
                return _possibleNames.slice();
            },
            idByName: function (name) {
                return _possibleNames.indexOf(name) + 1;
            },
            nameById: function (id) {
                return _possibleNames[id - 1];
            },
            isSingle(name) {
                return name !== 'choices';
            },
            isId(name) {
                return name === 'choices' || name === 'choice';
            },
            isBoolean(name) {
                return name === 'bool';
            }
        }
    });

    return QuestionType;
};
