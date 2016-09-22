'use strict';

module.exports = function (sequelize, DataTypes) {
    const QuestionType = sequelize.define('question_type', {
        name: {
            type: DataTypes.TEXT,
            allowNull: false,
            primaryKey: true
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        hooks: {
            afterSync: function (options) {
                if (options.force) {
                    const names = ['text', 'choice', 'choices', 'bool', 'choicesplus'];
                    const ps = names.map(name => QuestionType.create({ name }));
                    return sequelize.Promise.all(ps);
                }
            }
        }
    });

    return QuestionType;
};
