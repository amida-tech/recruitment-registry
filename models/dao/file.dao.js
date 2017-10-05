'use strict';

const Base = require('./base');
const RRError = require('../../lib/rr-error');

module.exports = class FileDAO extends Base {
    createFile(userId, { name, content }) {
        return this.db.File.create({ userId, name, content })
            .then(({ id }) => ({ id }));
    }

    getFile(userId, id) {
        const attributes = ['name', 'content'];
        return this.db.File.findById(id, { raw: true, where: { userId }, attributes })
            .then((record) => {
                if (!record) {
                    return RRError.reject('fileNoSuchFile');
                }
                return record;
            });
    }

    listFiles(userId) {
        const attributes = ['id', 'name'];
        return this.db.File.findAll({ raw: true, where: { userId }, attributes, order: ['id'] });
    }
};
