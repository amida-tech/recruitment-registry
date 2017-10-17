'use strict';

const _ = require('lodash');

const Base = require('./base');
const queryrize = require('../../lib/queryrize');

const copySqlQuery = queryrize.readQuerySync('copy-answers.sql');

module.exports = class AnswerAssessmentDAO extends Base {
    constructor(db, dependencies) {
        super(db);
        Object.assign(this, dependencies);
    }

    createAssessmentAnswersTx(inputRecord, transaction) {
        const answers = _.cloneDeep(inputRecord.answers);
        const status = inputRecord.status || 'completed';
        const language = inputRecord.language || 'en';
        return this.answer.getMasterIndex(inputRecord, transaction)
            .then(masterId => this.answer.validateCreate(masterId, answers, status, transaction)
                .then(() => this.answer.updateStatus(masterId, status, transaction))
                .then(() => {
                    const ids = _.map(answers, 'questionId');
                    const where = { questionId: { $in: ids } };
                    where.assessmentId = masterId.assessmentId;
                    return this.db.Answer.destroy({ where, transaction });
                })
                .then(() => {
                    const payload = { masterId, answers, language };
                    return this.answer.prepareAndFileAnswer(payload, transaction);
                }));
    }

    createAssessmentAnswers(input) {
        return this.transaction(tx => this.createAssessmentAnswersTx(input, tx));
    }

    getAssessmentAnswers({ userId, assessmentId }) {
        return this.answer.validateConsent({ userId, assessmentId }, 'read')
            .then(() => this.answer.listAnswers({ assessmentId }));
    }

    copyAssessmentAnswersTx(inputRecord, transaction) {
        const status = inputRecord.status || 'completed';
        return this.answer.getMasterIndex(inputRecord, transaction)
            .then(masterId => this.answer.validateConsent(masterId, 'create', transaction)
                .then(() => this.answer.updateStatus(masterId, status, transaction))
                .then(() => {
                    const where = {};
                    if (masterId.assessmentId) {
                        where.assessmentId = masterId.assessmentId;
                    } else {
                        where.userId = masterId.userId;
                        where.surveyId = masterId.surveyId;
                    }
                    return this.db.Answer.destroy({ where, transaction });
                })
                .then(() => {
                    const { userId, assessmentId, prevAssessmentId } = inputRecord;
                    const params = {
                        user_id: userId,
                        assessment_id: assessmentId,
                        prev_assessment_id: prevAssessmentId,
                    };
                    return this.query(copySqlQuery, params, transaction);
                }));
    }

    copyAssessmentAnswers(input) {
        return this.transaction(tx => this.copyAssessmentAnswersTx(input, tx));
    }
};
