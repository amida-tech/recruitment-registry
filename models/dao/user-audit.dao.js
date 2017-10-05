'use strict';

const Base = require('./base');

module.exports = class UserAuditDAO extends Base {
    createUserAudit(userAudit) {
        return this.db.UserAudit.create(userAudit);
    }

    listUserAudits() {
        return this.db.UserAudit.findAll({
            raw: true,
            attributes: ['userId', 'endpoint', 'operation'],
            order: ['created_at'],
        });
    }
};
