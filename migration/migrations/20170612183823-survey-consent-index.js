'use strict';

module.exports = {
    up(queryInterface) {
        return queryInterface.removeIndex('survey_consent', ['survey_id', 'consent_type_id', 'action'], { indicesType: 'UNIQUE' })
          .then(() => queryInterface.addIndex(
            'survey_consent',
            ['survey_id', 'consent_type_id', 'action'],
            { where: { deleted_at: { $eq: null } }, indicesType: 'UNIQUE' }));
    },
};
