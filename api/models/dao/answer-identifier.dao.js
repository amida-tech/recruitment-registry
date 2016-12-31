'use strict';

const db = require('../db');
const RRError = require('../../lib/rr-error');

const AnswerIdentifier = db.AnswerIdentifier;

module.exports = class QuestionIdentifierDAO {
    constructor() {}

    getIdsByAnswerIdentifier(type, identifier) {
        return AnswerIdentifier.findOne({
                where: { type, identifier },
                attributes: ['questionId', 'questionChoiceId'],
                raw: true
            })
            .then(ids => {
                if (!ids) {
                    return RRError.reject('answerIdentifierNotFound');
                }
                if (ids.questionChoiceId === null) {
                    delete ids.questionChoiceId;
                }
                return ids;
            });
    }

    getAnswerIdsToIdentifierMap(type) {
        return AnswerIdentifier.findAll({
                where: { type },
                attributes: ['identifier', 'questionId', 'questionChoiceId', 'tag'],
                raw: true
            })
            .then(records => {
                return records.reduce((r, record) => {
                    const questionChoiceId = record.questionChoiceId;
                    const key = record.questionId + (questionChoiceId ? (':' + questionChoiceId) : '');
                    r[key] = { identifier: record.identifier, tag: record.tag };
                    return r;
                }, {});
            });
    }
};
