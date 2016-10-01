'use strict';

module.exports = function (sequelize, DataTypes) {
    const DocumentType = sequelize.define('document_type', {
        name: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        description: {
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
        paranoid: true,
        classMethods: {
            getDocumentTypes: function() {
                return DocumentType.findAll({
                    raw: true,
                    attributes: ['id', 'name', 'description'],
                    order: 'id'
                });
            },
            createDocumentType: function({name, description}) {
                return DocumentType.create({name, description})
                    .then(({id}) => ({id}));
            },
            deleteDocumentType: function(id) {
                return sequelize.transaction(function (tx) {
                    return DocumentType.destroy({where: {id}, transaction: tx})
                        .then(() => sequelize.models.document.destroy({
                            where: {typeId: id}
                        }, {transaction: tx}));
                });
            }
        }
    });

    return DocumentType;
};
