'use strict';

const updateSchema = function (spec) {
    spec.paths = Object.keys(spec.paths).reduce((r, path) => {
        const d = spec.paths[path];
        const newPath = `/{schema}${path}`;
        if (!d.parameters) {
            d.parameters = [];
        }
        d.parameters.push({
            name: 'schema',
            in: 'path',
            required: true,
            type: 'string',
        });
        r[newPath] = d;
        return r;
    }, {});
};

module.exports = {
    updateSchema,
};
