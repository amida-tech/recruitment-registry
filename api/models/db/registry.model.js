'use strict';

module.exports = function (sequelize, DataTypes) {
    const Registry = sequelize.define('registry', {
        profileSurveyId: {
            type: DataTypes.INTEGER,
            field: 'profile_survey_id',
            references: {
                model: 'survey',
                key: 'id'
            }
        }
    }, {
        freezeTableName: true,
        hooks: {
            afterSync(options) {
                if (options.force) {
                    return Registry.create();
                }
            }
        }
    });

    return Registry;
};
