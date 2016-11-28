'use strict';

// Since swagger does not support full JSON Schema v4 spec some of the more
// complex validation schemas are not possible in swagger.json.  The validations
// here are temporary until Swagger 3.0 if and when it comes

const _ = require('lodash');
const Ajv = require('ajv');

const ajv = new Ajv();

const RRError = require('./rr-error');
const jsutil = require('./jsutil');
const swaggerJson = require('../swagger.json');

const schema = _.cloneDeep(_.pick(swaggerJson, 'definitions'));

_.set(schema, 'definitions.newSurvey.properties.questions.items', {
    oneOf: [{
        type: 'object',
        required: ['id', 'required'],
        properties: {
            'id': { type: 'integer' },
            'required': { type: 'boolean' }
        },
        additionalProperties: false
    }, {
        $ref: '#/definitions/newSurveyQuestion'
    }]
});

const questionTypes = [
    'text', 'bool', 'date', 'pounds', 'integer', 'zip',
    'year', 'month', 'day', 'feet-inches', 'blood-pressure'
];

_.set(schema, 'definitions.newSurveyQuestion', {
    oneOf: [{
        type: 'object',
        required: ['text', 'type', 'required'],
        properties: {
            text: { type: 'string' },
            instruction: { type: 'string' },
            type: { type: 'string', enum: questionTypes },
            meta: {
                $ref: '#/definitions/questionMeta'
            },
            required: { type: 'boolean' },
            actions: {
                $ref: '#/definitions/newActions'
            }
        },
        additionalProperties: false
    }, {
        type: 'object',
        required: ['text', 'type', 'required', 'choices'],
        properties: {
            text: { type: 'string' },
            instruction: { type: 'string' },
            required: { type: 'boolean' },
            type: { type: 'string', enum: ['choice'] },
            meta: {
                $ref: '#/definitions/questionMeta'
            },
            choices: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['text'],
                    properties: {
                        text: { type: 'string' }
                    },
                    additionalProperties: false
                }
            },
            actions: {
                $ref: '#/definitions/newActions'
            }
        },
        additionalProperties: false,
    }, {
        type: 'object',
        required: ['text', 'type', 'required', 'oneOfChoices'],
        properties: {
            text: { type: 'string' },
            instruction: { type: 'string' },
            required: { type: 'boolean' },
            type: { type: 'string', enum: ['choice'] },
            meta: {
                $ref: '#/definitions/questionMeta'
            },
            oneOfChoices: {
                type: 'array',
                items: { type: 'string', minLength: 1 }
            },
            actions: {
                $ref: '#/definitions/newActions'
            }
        },
        additionalProperties: false,
    }, {
        type: 'object',
        required: ['text', 'type', 'required', 'choices'],
        properties: {
            text: { type: 'string' },
            instruction: { type: 'string' },
            required: { type: 'boolean' },
            type: { type: 'string', enum: ['choices'] },
            meta: {
                $ref: '#/definitions/questionMeta'
            },
            choices: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['text'],
                    properties: {
                        text: { type: 'string' },
                        type: { type: 'string', enum: ['text', 'bool', 'month', 'year', 'day', 'integer'] }
                    },
                    additionalProperties: false
                }
            },
            actions: {
                $ref: '#/definitions/newActions'
            }
        },
        additionalProperties: false
    }]
});

_.set(schema, 'definitions.newQuestion', {
    oneOf: [{
        type: 'object',
        required: ['text', 'type'],
        properties: {
            text: { type: 'string' },
            instruction: { type: 'string' },
            type: { type: 'string', enum: questionTypes },
            meta: {
                $ref: '#/definitions/questionMeta'
            },
            parentId: {
                type: 'integer',
                minimum: 1
            },
            actions: {
                $ref: '#/definitions/newActions'
            }
        },
        additionalProperties: false
    }, {
        type: 'object',
        required: ['text', 'type', 'choices'],
        properties: {
            text: { type: 'string' },
            instruction: { type: 'string' },
            type: { type: 'string', enum: ['choice'] },
            meta: {
                $ref: '#/definitions/questionMeta'
            },
            parentId: {
                type: 'integer',
                minimum: 1
            },
            choices: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['text'],
                    properties: {
                        text: { type: 'string' }
                    },
                    additionalProperties: false
                }
            },
            actions: {
                $ref: '#/definitions/newActions'
            }
        },
        additionalProperties: false,
    }, {
        type: 'object',
        required: ['text', 'type', 'oneOfChoices'],
        properties: {
            text: { type: 'string' },
            instruction: { type: 'string' },
            type: { type: 'string', enum: ['choice'] },
            meta: {
                $ref: '#/definitions/questionMeta'
            },
            parentId: {
                type: 'integer',
                minimum: 1
            },
            oneOfChoices: {
                type: 'array',
                items: { type: 'string', minLength: 1 }
            },
            actions: {
                $ref: '#/definitions/newActions'
            }
        },
        additionalProperties: false,
    }, {
        type: 'object',
        required: ['text', 'type', 'choices'],
        properties: {
            text: { type: 'string' },
            instruction: { type: 'string' },
            type: { type: 'string', enum: ['choices'] },
            meta: {
                $ref: '#/definitions/questionMeta'
            },
            parentId: {
                type: 'integer',
                minimum: 1
            },
            choices: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['text'],
                    properties: {
                        text: { type: 'string' },
                        type: { type: 'string', enum: ['text', 'bool', 'month', 'year', 'day', 'integer'] }
                    },
                    additionalProperties: false
                }
            },
            actions: {
                $ref: '#/definitions/newActions'
            }
        },
        additionalProperties: false
    }]
});

ajv.addSchema(schema, 'rr');

module.exports = function (schemaKey, data, res) {
    try {
        const valid = ajv.validate({ $ref: `rr#/definitions/${schemaKey}` }, data);
        if (!valid) {
            const err = (new RRError('jsonSchemaFailed', schemaKey)).toObject();
            err.detail = ajv.errors;
            res.status(400).json(err);
        }
        return valid;
    } catch (err) {
        res.status(500).json(jsutil.errToJSON(err));
        return false;
    }
};
