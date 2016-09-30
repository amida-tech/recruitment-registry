'use strict';

module.exports = function (sequelize, DataTypes) {
    const DocumentType = sequelize.define('document_type', {
        name: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at'
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        hooks: {
            afterSync: function (options) {
                if (options.force) {
                    const names = ['terms-of-use', 'consent'];
                    const ps = names.map(name => DocumentType.create({ name }));
                    return sequelize.Promise.all(ps);
                }
            }
        }
    });

    return DocumentType;
};
