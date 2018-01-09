'use strict';

const Base = require('./base');

const attributes = [
    'id', 'username', 'email', 'role', 'firstname', 'lastname', 'institution', 'createdAt',
];

module.exports = class DemographicsDAO extends Base {
    listDemographics() {
        // TODO: orderBy query param?
        return this.db.User.findAll({
            raw: true,
            attributes,
            order: ['code'],
        });
    }
};
