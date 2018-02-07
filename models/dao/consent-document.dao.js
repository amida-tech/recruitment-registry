'use strict';

const Sequelize = require('sequelize');
const _ = require('lodash');

const RRError = require('../../lib/rr-error');
const SPromise = require('../../lib/promise');

const Translatable = require('./translatable');

const Op = Sequelize.Op;

module.exports = class ConsentDocumentDAO extends Translatable {
    constructor(db, dependencies) {
        super(db, 'ConsentDocumentText', 'consentDocumentId', ['content', 'updateComment']);
        Object.assign(this, dependencies);

        const cbDeleteType = options => this.beforeConsentTypeDestroy(options);
        db.ConsentType.addHook('beforeBulkDestroy', 'consentDocument', cbDeleteType);
    }

    static finalizeDocumentFields(document, fields, options) {
        const selected = _.omit(fields, 'id');
        const r = Object.assign(document, selected);
        if (!options.keepTypeId) {
            delete r.typeId;
        }
        return r;
    }

    listSurveyConsents() {
        const attributes = ['id', 'surveyId', 'consentTypeId'];
        return this.db.SurveyConsent.findAll({ raw: true, attributes })
            .then((surveyConsents) => {
                if (!surveyConsents.length) {
                    return surveyConsents;
                }
                const surveyIdSet = new Set(surveyConsents.map(({ surveyId }) => surveyId));
                return this.survey.listSurveys({ ids: Array.from(surveyIdSet) })
                    .then((surveys) => {
                        const surveyMap = new Map(surveys.map(survey => [survey.id, survey]));
                        return surveyMap;
                    })
                    .then((surveyMap) => {
                        const result = new Map();
                        surveyConsents.forEach(({ consentTypeId, surveyId }) => {
                            let typeSurveys = result.get(consentTypeId);
                            if (!typeSurveys) {
                                typeSurveys = [];
                                result.set(consentTypeId, typeSurveys);
                            }
                            if (!typeSurveys.find(({ id }) => (surveyId === id))) {
                                const survey = surveyMap.get(surveyId);
                                if (survey) {
                                    typeSurveys.push({ id: surveyId, name: survey.name });
                                }
                            }
                        });
                        // Remove empty elements ()
                        result.forEach((surveys, key) => {
                            if (!surveys.length) {
                                result.delete(key);
                            }
                        });
                        result.forEach(surveys => surveys.sort((r, p) => (r.id - p.id)));
                        return result;
                    });
            });
    }

    findTypeIds(options) {
        const { role, roleOnly, typeIds } = options;
        if (roleOnly && !role) {
            return RRError.reject('consentDocumentRoleOnlyWithoutRole');
        }
        if (role) {
            let where = { role };
            if (!roleOnly) {
                where = { [Op.or]: [where, { role: null }] };
            }
            if (typeIds && typeIds.length) {
                where.id = typeIds;
            }
            const findOptions = { where };
            if (options.transaction) {
                findOptions.transaction = options.transaction;
            }
            return this.db.ConsentType.findAll({
                raw: true, attributes: ['id'], where,
            })
                .then((ids) => {
                    if (ids.length) {
                        const result = ids.map(({ id }) => id);
                        if (typeIds && typeIds.length) {
                            const set = new Set(result);
                            return typeIds.filter(r => set.has(r));
                        }
                        return result;
                    }
                    return 'empty';
                });
        }
        return SPromise.resolve(typeIds);
    }

    listConsentDocuments(options = {}) {
        let typeIds;
        const createdAtColumn = this.timestampColumn('consent_document', 'created');
        const query = {
            raw: true,
            attributes: ['id', 'typeId', createdAtColumn],
            order: ['id'],
        };
        if (options.transaction) {
            query.transaction = options.transaction;
        }
        if (options.history) {
            query.paranoid = !options.history;
        }
        return this.findTypeIds(options)
            .then((ids) => {
                typeIds = ids;
                if (ids === 'empty') {
                    return [];
                }
                if (typeIds && typeIds.length) {
                    query.where = { typeId: { [Op.in]: typeIds } };
                }
                return this.db.ConsentDocument.findAll(query);
            })
            .then((documents) => {
                if (typeIds === 'empty') {
                    return [];
                }
                if (options.summary) {
                    return documents;
                }
                return this.updateAllTexts(documents, options.language);
            })
            .then((documents) => {
                if (typeIds === 'empty') {
                    return [];
                }
                if (options.history) {
                    return documents;
                }
                const opt = {};
                if (options.transaction) {
                    opt.transaction = options.transaction;
                }
                if (typeIds && typeIds.length) {
                    opt.ids = typeIds;
                }
                if (options.language) {
                    opt.language = options.language;
                }
                return this.consentType.listConsentTypes(opt)
                    .then((types) => {
                        if (options.summary) {
                            return types.map(type => _.omit(type, 'type'));
                        }
                        return types;
                    })
                    .then((types) => {
                        if (types.length !== documents.length) {
                            return RRError.reject('noSystemConsentDocuments');
                        }
                        return _.keyBy(types, 'id');
                    })
                    .then((types) => {
                        if (options.surveys) {
                            return this.listSurveyConsents()
                                .then((surveysMap) => {
                                    surveysMap.forEach((surveys, typeId) => {
                                        Object.assign(types[typeId], { surveys });
                                    });
                                    return types;
                                });
                        }
                        return types;
                    })
                    .then((types) => {
                        if (options.typeOrder) {
                            const map = _.keyBy(documents, 'typeId');
                            const result = typeIds.map((typeId) => {
                                const docs = map[typeId];
                                const fields = types[typeId];
                                return ConsentDocumentDAO.finalizeDocumentFields(docs, fields, options); // eslint-disable-line max-len
                            });
                            return result;
                        }
                        documents.forEach((r) => {
                            const typeId = r.typeId;
                            ConsentDocumentDAO.finalizeDocumentFields(r, types[typeId], options);
                        });
                        return documents;
                    });
            });
    }

    createConsentDocument(input) {
        const ConsentDocument = this.db.ConsentDocument;
        return this.transaction((transaction) => {
            const typeId = input.typeId;
            return ConsentDocument.destroy({ where: { typeId }, transaction })
                .then(() => ConsentDocument.create(input, { transaction }))
                .then((result) => {
                    const textInput = { id: result.id };
                    textInput.content = input.content;
                    if (input.updateComment) {
                        textInput.updateComment = input.updateComment;
                    }
                    return this.createTextTx(textInput, transaction)
                        .then(({ id }) => ({ id }));
                });
        });
    }

    updateConsentDocumentText({ id, content, updateComment }, language) {
        return this.createText({ id, content, updateComment, language });
    }

    getConsentDocument(id, options = {}) {
        const ConsentDocument = this.db.ConsentDocument;
        return ConsentDocument.findById(id, { raw: true, attributes: ['id', 'typeId'] })
            .then(result => this.updateText(result, options.language));
    }

    getConsentDocumentByTypeId(typeId, options = {}) {
        return this.db.ConsentDocument.findOne({
            raw: true,
            where: { typeId },
            attributes: ['id', 'typeId'],
        })
            .then((result) => {
                if (result) {
                    return this.updateText(result, options.language);
                }
                return RRError.reject('consentTypeNotFound');
            });
    }

    getUpdateCommentHistory(typeId, language) {
        const ConsentDocument = this.db.ConsentDocument;
        return ConsentDocument.findAll({
            raw: true,
            attributes: ['id'],
            where: { typeId },
            order: ['id'],
            paranoid: false,
        })
            .then(documents => this.updateAllTexts(documents, language))
            .then(documents => _.map(documents, 'updateComment'));
    }

    beforeConsentTypeDestroy(options) {
        const { where: whereType, transaction } = options;
        const where = { typeId: whereType.id };
        return this.db.ConsentDocument.destroy({ where, transaction });
    }
};
