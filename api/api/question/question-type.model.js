'use strict';

const _possibleNames = ['text', 'multi-choice-single', 'multi-choice-multi'];

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
                    return sequelize.Promise.all(_possibleNames.map(function (name) {
                        return QuestionType.create({
                            name
                        });
                    }));
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
                return name !== 'multi-choice-multi';
            },
            isId(name) {
                return name === 'multi-choice-multi' || name === 'multi-choice-single';
            }
        }
    });

    return QuestionType;
};
