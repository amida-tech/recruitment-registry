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
};
