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

const questionTypes = [
    'text', 'bool', 'date', 'pounds', 'integer', 'zip', 'float',
    'year', 'month', 'day', 'feet-inches', 'blood-pressure',
    'open-choice', 'file',
];

const choiceTypes = [
    'bool', 'text', 'year', 'month', 'day', 'integer', 'date',
    'pounds', 'zip', 'feet-inches', 'blood-pressure', 'float',
];

_.set(schema, 'definitions.newSurveyQuestion', {
    oneOf: [{
        type: 'object',
        required: ['id', 'required'],
        properties: {
            id: { type: 'integer' },
            required: { type: 'boolean' },
            isIdentifying: { type: 'boolean' },
            enableWhen: {
                $ref: '#/definitions/newEnableWhen',
            },
            sections: {
                type: 'array',
                items: {
                    $ref: '#/definitions/newSection',
                },
                minItems: 1,
            },
        },
        additionalProperties: false,
    }, {
        type: 'object',
        required: ['text', 'type', 'required'],
        properties: {
            text: { type: 'string' },
            instruction: { type: 'string' },
            type: { type: 'string', enum: questionTypes },
            meta: {
                $ref: '#/definitions/questionMeta',
            },
            multiple: {
                type: 'boolean',
            },
            maxCount: {
                type: 'integer',
                minimum: 1,
            },
            common: {
                type: 'boolean',
            },
            sections: {
                type: 'array',
                items: {
                    $ref: '#/definitions/newSection',
                },
                minItems: 1,
            },
            required: { type: 'boolean' },
            isIdentifying: { type: 'boolean' },
            enableWhen: {
                $ref: '#/definitions/newEnableWhen',
            },
        },
        additionalProperties: false,
    }, {
        type: 'object',
        required: ['text', 'type', 'required', 'choices'],
        properties: {
            text: { type: 'string' },
            instruction: { type: 'string' },
            required: { type: 'boolean' },
            isIdentifying: { type: 'boolean' },
            type: { type: 'string', enum: ['choice'] },
            common: {
                type: 'boolean',
            },
            sections: {
                type: 'array',
                items: {
                    $ref: '#/definitions/newSection',
                },
                minItems: 1,
            },
            meta: {
                $ref: '#/definitions/questionMeta',
            },
            multiple: {
                type: 'boolean',
            },
            maxCount: {
                type: 'integer',
                minimum: 1,
            },
            choices: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['text'],
                    properties: {
                        text: { type: 'string' },
                        meta: { type: 'object' },
                        code: { type: 'string' },
                    },
                    additionalProperties: false,
                },
            },
            enableWhen: {
                $ref: '#/definitions/newEnableWhen',
            },
        },
        additionalProperties: false,
    }, {
        type: 'object',
        required: ['text', 'type', 'required', 'oneOfChoices'],
        properties: {
            text: { type: 'string' },
            instruction: { type: 'string' },
            required: { type: 'boolean' },
            isIdentifying: { type: 'boolean' },
            type: { type: 'string', enum: ['choice'] },
            common: {
                type: 'boolean',
            },
            sections: {
                type: 'array',
                items: {
                    $ref: '#/definitions/newSection',
                },
                minItems: 1,
            },
            multiple: {
                type: 'boolean',
            },
            maxCount: {
                type: 'integer',
                minimum: 1,
            },
            meta: {
                $ref: '#/definitions/questionMeta',
            },
            oneOfChoices: {
                type: 'array',
                items: { type: 'string', minLength: 1 },
            },
            enableWhen: {
                $ref: '#/definitions/newEnableWhen',
            },
        },
        additionalProperties: false,
    }, {
        type: 'object',
        required: ['text', 'type', 'required', 'choices'],
        properties: {
            text: { type: 'string' },
            instruction: { type: 'string' },
            required: { type: 'boolean' },
            isIdentifying: { type: 'boolean' },
            type: { type: 'string', enum: ['choices'] },
            common: {
                type: 'boolean',
            },
            sections: {
                type: 'array',
                items: {
                    $ref: '#/definitions/newSection',
                },
                minItems: 1,
            },
            meta: {
                $ref: '#/definitions/questionMeta',
            },
            choices: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['text'],
                    properties: {
                        text: { type: 'string' },
                        type: { type: 'string', enum: choiceTypes },
                        code: { type: 'string' },
                        meta: { type: 'object' },
                    },
                    additionalProperties: false,
                },
            },
            enableWhen: {
                $ref: '#/definitions/newEnableWhen',
            },
        },
        additionalProperties: false,
    }, {
        type: 'object',
        required: ['text', 'type', 'required', 'choices'],
        properties: {
            text: { type: 'string' },
            instruction: { type: 'string' },
            required: { type: 'boolean' },
            isIdentifying: { type: 'boolean' },
            type: { type: 'string', enum: ['open-choice'] },
            common: {
                type: 'boolean',
            },
            sections: {
                type: 'array',
                items: {
                    $ref: '#/definitions/newSection',
                },
                minItems: 1,
            },
            meta: {
                $ref: '#/definitions/questionMeta',
            },
            choices: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['text'],
                    properties: {
                        text: { type: 'string' },
                        type: { type: 'string', enum: ['text', 'bool'] },
                        code: { type: 'string' },
                        meta: { type: 'object' },
                    },
                    additionalProperties: false,
                },
            },
            multiple: {
                type: 'boolean',
            },
            maxCount: {
                type: 'integer',
                minimum: 1,
            },
            enableWhen: {
                $ref: '#/definitions/newEnableWhen',
            },
        },
        additionalProperties: false,
    }, {
        type: 'object',
        required: ['text', 'type', 'required'],
        properties: {
            text: { type: 'string' },
            instruction: { type: 'string' },
            required: { type: 'boolean' },
            isIdentifying: { type: 'boolean' },
            type: { type: 'string', enum: ['choice-ref'] },
            common: {
                type: 'boolean',
            },
            sections: {
                type: 'array',
                items: {
                    $ref: '#/definitions/newSection',
                },
                minItems: 1,
            },
            choiceSetReference: {
                type: 'string',
                minLength: 1,
            },
            choiceSetId: {
                type: 'integer',
                mininimum: 1,
            },
            meta: {
                $ref: '#/definitions/questionMeta',
            },
            multiple: {
                type: 'boolean',
            },
            maxCount: {
                type: 'integer',
                minimum: 1,
            },
            enableWhen: {
                $ref: '#/definitions/newEnableWhen',
            },
        },
        additionalProperties: false,
    }, {
        type: 'object',
        required: ['text', 'type', 'required', 'meta'],
        properties: {
            text: { type: 'string' },
            instruction: { type: 'string' },
            required: { type: 'boolean' },
            isIdentifying: { type: 'boolean' },
            type: { type: 'string', enum: ['scale'] },
            common: {
                type: 'boolean',
            },
            sections: {
                type: 'array',
                items: {
                    $ref: '#/definitions/newSection',
                },
                minItems: 1,
            },
            meta: {
                type: 'object',
                required: ['scaleLimits'],
                properties: {
                    scaleLimits: {
                        type: 'object',
                        properties: {
                            min: {
                                type: 'number',
                            },
                            max: {
                                type: 'number',
                            },
                        },
                        minProperties: 1,
                        additionalProperties: false,
                    },
                },
                additionalProperties: true,
            },
            multiple: {
                type: 'boolean',
            },
            maxCount: {
                type: 'integer',
                minimum: 1,
            },
            enableWhen: {
                $ref: '#/definitions/newEnableWhen',
            },
        },
    }],
});

_.set(schema, 'definitions.newQuestion', {
    oneOf: [{
        type: 'object',
        required: ['text', 'type'],
        properties: {
            text: { type: 'string' },
            isIdentifying: { type: 'boolean' },
            instruction: { type: 'string' },
            type: { type: 'string', enum: questionTypes },
            common: {
                type: 'boolean',
            },
            multiple: { type: 'boolean' },
            maxCount: { type: 'integer', minimum: 1 },
            questionIdentifier: {
                $ref: '#/definitions/newIdentifier',
            },
            answerIdentifier: {
                $ref: '#/definitions/newIdentifier',
            },
            meta: {
                $ref: '#/definitions/questionMeta',
            },
            parentId: {
                type: 'integer',
                minimum: 1,
            },
        },
        additionalProperties: false,
    }, {
        type: 'object',
        required: ['text', 'type', 'choices'],
        properties: {
            text: { type: 'string' },
            instruction: { type: 'string' },
            isIdentifying: { type: 'boolean' },
            type: { type: 'string', enum: ['choice'] },
            common: {
                type: 'boolean',
            },
            multiple: { type: 'boolean' },
            maxCount: { type: 'integer', minimum: 1 },
            questionIdentifier: {
                $ref: '#/definitions/newIdentifier',
            },
            answerIdentifier: {
                $ref: '#/definitions/newIdentifier',
            },
            meta: {
                $ref: '#/definitions/questionMeta',
            },
            parentId: {
                type: 'integer',
                minimum: 1,
            },
            choices: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['text'],
                    properties: {
                        text: { type: 'string' },
                        meta: { type: 'object' },
                        answerIdentifier: {
                            $ref: '#/definitions/newIdentifier',
                        },
                        code: { type: 'string' },
                    },
                    additionalProperties: false,
                },
            },
        },
        additionalProperties: false,
    }, {
        type: 'object',
        required: ['text', 'type', 'oneOfChoices'],
        properties: {
            text: { type: 'string' },
            instruction: { type: 'string' },
            isIdentifying: { type: 'boolean' },
            type: { type: 'string', enum: ['choice'] },
            common: {
                type: 'boolean',
            },
            multiple: { type: 'boolean' },
            maxCount: { type: 'integer', minimum: 1 },
            meta: {
                $ref: '#/definitions/questionMeta',
            },
            parentId: {
                type: 'integer',
                minimum: 1,
            },
            oneOfChoices: {
                type: 'array',
                items: { type: 'string', minLength: 1 },
            },
        },
        additionalProperties: false,
    }, {
        type: 'object',
        required: ['text', 'type', 'choices'],
        properties: {
            text: { type: 'string' },
            instruction: { type: 'string' },
            isIdentifying: { type: 'boolean' },
            type: { type: 'string', enum: ['choices'] },
            common: {
                type: 'boolean',
            },
            multiple: { type: 'boolean' },
            maxCount: { type: 'integer', minimum: 1 },
            questionIdentifier: {
                $ref: '#/definitions/newIdentifier',
            },
            answerIdentifier: {
                $ref: '#/definitions/newIdentifier',
            },
            choiceSetId: {
                type: 'integer',
                minimum: 1,
            },
            choiceSetReference: {
                type: 'string',
                minLength: 1,
            },
            meta: {
                $ref: '#/definitions/questionMeta',
            },
            parentId: {
                type: 'integer',
                minimum: 1,
            },
            choices: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['text'],
                    properties: {
                        text: { type: 'string' },
                        type: { type: 'string', enum: choiceTypes },
                        answerIdentifier: {
                            $ref: '#/definitions/newIdentifier',
                        },
                        meta: { type: 'object' },
                        code: { type: 'string' },
                    },
                    additionalProperties: false,
                },
            },
        },
        additionalProperties: false,
    }, {
        type: 'object',
        required: ['text', 'type'],
        properties: {
            text: { type: 'string' },
            instruction: { type: 'string' },
            isIdentifying: { type: 'boolean' },
            type: { type: 'string', enum: ['choice-ref'] },
            common: {
                type: 'boolean',
            },
            multiple: { type: 'boolean' },
            maxCount: { type: 'integer', minimum: 1 },
            questionIdentifier: {
                $ref: '#/definitions/newIdentifier',
            },
            answerIdentifier: {
                $ref: '#/definitions/newIdentifier',
            },
            choiceSetId: {
                type: 'integer',
                minimum: 1,
            },
            choiceSetReference: {
                type: 'string',
                minLength: 1,
            },
            meta: {
                $ref: '#/definitions/questionMeta',
            },
            parentId: {
                type: 'integer',
                minimum: 1,
            },
        },
        additionalProperties: false,
    }, {
        type: 'object',
        required: ['text', 'type', 'choices'],
        properties: {
            text: { type: 'string' },
            instruction: { type: 'string' },
            isIdentifying: { type: 'boolean' },
            type: { type: 'string', enum: ['open-choice'] },
            common: {
                type: 'boolean',
            },
            multiple: { type: 'boolean' },
            maxCount: { type: 'integer', minimum: 1 },
            questionIdentifier: {
                $ref: '#/definitions/newIdentifier',
            },
            answerIdentifier: {
                $ref: '#/definitions/newIdentifier',
            },
            meta: {
                $ref: '#/definitions/questionMeta',
            },
            parentId: {
                type: 'integer',
                minimum: 1,
            },
            choices: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['text'],
                    properties: {
                        text: { type: 'string' },
                        type: { type: 'string', enum: ['text', 'bool'] },
                        answerIdentifier: {
                            $ref: '#/definitions/newIdentifier',
                        },
                        meta: { type: 'object' },
                        code: { type: 'string' },
                    },
                    additionalProperties: false,
                },
            },
        },
        additionalProperties: false,
    }, {
        type: 'object',
        required: ['text', 'type', 'meta'],
        properties: {
            text: { type: 'string' },
            instruction: { type: 'string' },
            isIdentifying: { type: 'boolean' },
            type: { type: 'string', enum: ['scale'] },
            common: {
                type: 'boolean',
            },
            multiple: { type: 'boolean' },
            maxCount: { type: 'integer', minimum: 1 },
            questionIdentifier: {
                $ref: '#/definitions/newIdentifier',
            },
            answerIdentifier: {
                $ref: '#/definitions/newIdentifier',
            },
            meta: {
                type: 'object',
                required: ['scaleLimits'],
                properties: {
                    scaleLimits: {
                        type: 'object',
                        properties: {
                            min: {
                                type: 'number',
                            },
                            max: {
                                type: 'number',
                            },
                        },
                        minProperties: 1,
                        additionalProperties: false,
                    },
                },
                additionalProperties: true,
            },
            parentId: {
                type: 'integer',
                minimum: 1,
            },
        },
        additionalProperties: false,
    }],
});

ajv.addSchema(schema, 'rr');

module.exports = function jsonSchema(schemaKey, data, res) {
    try {
        const valid = ajv.validate({ $ref: `rr#/definitions/${schemaKey}` }, data);
        if (!valid) {
            const code = 'jsonSchemaFailed';
            const msgErr = new RRError(code, schemaKey);
            const message = msgErr.getMessage(res);
            const err = { code, message };
            err.detail = ajv.errors;
            res.status(400).json(err);
        }
        return valid;
    } catch (err) {
        res.status(500).json(jsutil.errToJSON(err));
        return false;
    }
};
