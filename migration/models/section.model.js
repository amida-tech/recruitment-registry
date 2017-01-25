'use strict';

module.exports = function (sequelize, DataTypes) {
    const Section = sequelize.define('rr_section', {
        indices: {
            type: DataTypes.ARRAY(DataTypes.INTEGER),
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at',
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true
    });

    return Section;
};
