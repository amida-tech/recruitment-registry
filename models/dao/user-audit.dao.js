'use strict';

module.exports = class UserAuditDAO {
    constructor(db) {
        this.db = db;
    }

    createUserAudit(userAudit) {
        return this.db.UserAudit.create(userAudit);
    }

    listUserAudits() {
        return this.db.UserAudit.findAll({
            raw: true,
            attributes: ['userId', 'endpoint', 'operation'],
            order: 'created_at',
        });
    }
};
