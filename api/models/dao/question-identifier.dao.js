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
};
