'use strict';

module.exports = function (sequelize, DataTypes) {
    const ConsentSectionSignature = sequelize.define('consent_section_signature', {
        consentSectionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'consent_section_id',
            unique: 'signature',
            references: {
                model: 'consent_section',
                key: 'id'
            }
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id',
            unique: 'signature',
            references: {
                model: 'registry_user',
                key: 'id'
            }
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        classMethods: {
            createSignature: function (userId, consentSectionId, tx) {
                const options = tx ? { transaction: tx } : {};
                return ConsentSectionSignature.create({ userId, consentSectionId }, options)
                    .then(({ id }) => ({ id }));
            }
        }
    });

    return ConsentSectionSignature;
};
