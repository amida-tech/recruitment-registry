'use strict';

const _ = require('lodash');

const Base = require('./base');
const RRError = require('../../lib/rr-error');

module.exports = class RegistryDAO extends Base {
    createRegistry(registry) {
        if (registry.url && registry.schema) {
            return RRError.reject('registryBothURLSchema', registry.name);
        }
        return this.db.Registry.create(registry).then(({ id }) => ({ id }));
    }

    listRegistries() {
        const attributes = ['id', 'name'];
        return this.db.Registry.findAll({ raw: true, attributes, order: ['name'] });
    }

    findRegistries() {
        const attributes = ['id', 'name', 'url', 'schema'];
        return this.db.Registry.findAll({ raw: true, attributes })
            .then((registries) => {
                if (!registries.length) {
                    return RRError.reject('registryNoneFound');
                }
                return registries;
            });
    }

    getRegistry(id) {
        const attributes = ['id', 'name', 'url', 'schema'];
        return this.db.Registry.findById(id, { raw: true, attributes })
            .then(registry => _.omitBy(registry, _.isNil));
    }

    deleteRegistry(id) {
        return this.db.Registry.destroy({ where: { id } });
    }
};
