'use strict';

const Base = require('./base');
const RRError = require('../../lib/rr-error');

module.exports = class FileDAO extends Base {
    createFile({ name, content }) {
        return this.db.File.create({ name, content })
            .then(({ id }) => ({ id }));
    }

    getFile(id) {
        const attributes = ['name', 'content'];
        return this.db.File.findById(id, { raw: true, attributes })
            .then((record) => {
                if (!record) {
                    return RRError.reject('fileNoSuchFile');
                }
                return record;
            });
    }
};
