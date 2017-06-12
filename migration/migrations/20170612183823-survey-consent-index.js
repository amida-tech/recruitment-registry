'use strict';

module.exports = {
    up(queryInterface) {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.
      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
        queryInterface.removeIndex('survey_consent', ['survey_id', 'consent_type_id', 'action'], { indicesType: 'UNIQUE' })
          .then(() => queryInterface.addIndex('survey_consent', ['survey_id', 'consent_type_id', 'action'], { where: { deleted_at: { $eq: null } }, indicesType: 'UNIQUE' }));
    },

    //  down: function (queryInterface, Sequelize) {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
    // }
};
