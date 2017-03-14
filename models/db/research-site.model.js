'use strict';

const _ = require('lodash');

module.exports = function(sequelize, DataTypes) {

    let schema = {
        name: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        url: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        street: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        street2: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        city: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        state: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        zip: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at',
        },
    };

    let ResearchSite = sequelize.define('research_site',
    schema,
    {
        freezeTableName: true,
        schema: sequelize.options.schema,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        paranoid: true,
    },
    {
        instanceMethods: {
          toJSON: function() {
            let privateAttributes = ['street2'];
            if(this.street2 === null) {
              this.street12 = 'khjsadfhjfsdhjkfs';
              return _.omit(this.dataValues, privateAttributes);
            };
          }
        }
    }
    // ,{
    //     validate: {
    //       street2NotRequired: function() {
    //         if(this.street2 === null) {
    //           console.log('~~~~~~~~~~~~~~~~~~>>>> street2 null!');
    //         }
    //       }
    //     }
    // }
    );

    return ResearchSite;
};
