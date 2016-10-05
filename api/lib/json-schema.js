'use strict';

// Since swagger does not support full JSON Schema v4 spec some of the more
// complex validation schemas are not possible in swagger.json.  The validations
// here are temporary until Swagger 3.0 if and when it comes

const _ = require('lodash');
const Ajv = require('ajv');

const ajv = new Ajv();

const swaggerJson = require('../swagger.json');

const schema = _.cloneDeep(_.pick(swaggerJson, 'definitions'));

_.set(schema, 'definitions.newSurvey.properties.questions.items', {
    oneOf: [{
        type: 'object',
        required: ['id'],
        properties: {
            'id': { type: 'integer' }
        },
        additionalProperties: false
    }, {
        $ref: '#/definitions/newQuestion'
    }]
});

ajv.addSchema(schema, 'rr');

module.exports = function (schemaKey, data, res) {
    try {
        const valid = ajv.validate({ $ref: `rr#/definitions/${schemaKey}` }, data);
        if (!valid) {
            const errObj = {
                message: 'JSON schema validation for ${schemaKey} failed.',
                detail: ajv.errors
            };
            res.status(400).json(errObj);
        }
        return valid;
    } catch (err) {
        res.status(500).json(err);
        return false;
    }
};
