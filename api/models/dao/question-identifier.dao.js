'use strict';

const db = require('../db');
const RRError = require('../../lib/rr-error');

const QuestionIdentifier = db.QuestionIdentifier;

module.exports = class QuestionIdentifierDAO {
    constructor() {}

    getQuestionIdByIdentifier(type, identifier) {
        return QuestionIdentifier.findOne({
                where: { type, identifier },
                attributes: ['questionId'],
                raw: true
            })
            .then(ids => {
                if (!ids) {
                    return RRError.reject('questionIdentifierNotFound');
                }
                return ids;
            });
    }

    getQuestionIdToIdentifierMap(type, ids) {
        return QuestionIdentifier.findAll({
                where: { type, questionId: { $in: ids } },
                attributes: ['identifier', 'questionId'],
                raw: true
            })
            .then(records => {
                return records.reduce((r, record) => {
                    r[record.questionId] = record.identifier;
                    return r;
                }, {});
            });
    }
};
