'use strict';

module.exports = function assessmentAnswer(sequelize, Sequelize, schema) {
    const tableName = 'assessment_answer';
    const modelName = `${schema}_${tableName}`;
    const Op = Sequelize.Op;
    return sequelize.define(modelName, {
        assessmentId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'assessment_id',
            references: {
                model: {
                    schema,
                    tableName: 'assessment',
                },
                key: 'id',
            },
        },
        status: {
            type: Sequelize.ENUM('new', 'in-progress', 'completed'),
            allowNull: false,
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: Sequelize.DATE,
            field: 'deleted_at',
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true,
        indexes: [{ unique: true, fields: ['assessment_id'], where: { deleted_at: { [Op.eq]: null } } }],
    });
};
