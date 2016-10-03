'use strict';

const _ethnicities = [
    'Caucasian',
    'Hispanic',
    'African',
    'Asian'
];

module.exports = function (sequelize, DataTypes) {
    const Ethnicity = sequelize.define('ethnicity', {
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
                    _ethnicities.map(function (name) {
                        p = p.then(function () {
                            Ethnicity.create({
                                name
                            });
                        });
                    });
                    return p;
                }
            }
        },
        classMethods: {
            ethnicities: function () {
                return _ethnicities.slice();
            },
            idByName: function (name) {
                return _ethnicities.indexOf(name) + 1;
            },
            nameById: function (id) {
                return _ethnicities[id - 1];
            }
        },
    });

    return Ethnicity;
};
