'use strict';

module.exports = class UserAuditDAO {
    constructor(db) {
        this.db = db;
    }

    createUserAudit(userAudit) {
        return this.db.UserAudit.create(userAudit);
    }
};
