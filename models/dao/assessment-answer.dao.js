'use strict';

const Sequelize = require('sequelize');
const _ = require('lodash');

const Base = require('./base');
const RRError = require('../../lib/rr-error');
const SPromise = require('../../lib/promise');
const queryrize = require('../../lib/queryrize');

const Op = Sequelize.Op;

const copySqlQuery = queryrize.readQuerySync('copy-answers.sql');

module.exports = class AnswerAssessmentDAO extends Base {
    constructor(db, dependencies) {
        super(db);
        Object.assign(this, dependencies);
    }

    getMasterId(inputRecord, transaction) {
        const { userId, surveyId, assessmentId } = inputRecord;
        if (!assessmentId) {
            return SPromise.resolve({ userId, surveyId, assessmentId: null });
        }
        const where = { assessmentId };
        const attributes = ['surveyId'];
        return this.db.AssessmentSurvey.findAll({ where, raw: true, attributes, transaction })
            .then(result => result.map(r => r.surveyId))
            .then((surveyIds) => {
                if (!surveyId) {
                    if (surveyIds.length === 1) {
                        return surveyIds[0];
                    }
                    return RRError.reject('answerInvalidAssesSurveys');
                }
                if (surveyIds.indexOf(surveyId) >= 0) {
                    return surveyId;
                }
                return RRError.reject('answerInvalidSurveyInAsses');
            })
            .then(validSurveyId => ({ userId, surveyId: validSurveyId, assessmentId }));
    }

    updateStatus(assessmentId, status, transaction) {
        const Table = this.db.AssessmentAnswer;
        return Table.findOne({
            where: { assessmentId },
            raw: true,
            attributes: ['status'],
            transaction,
        })
            .then((existingRecord) => {
                const record = { assessmentId, status };
                if (!existingRecord) {
                    return Table.create(record, { transaction });
                } else if (existingRecord.status !== status) {
                    return Table.destroy({ where: { assessmentId }, transaction })
                        .then(() => Table.create(record, { transaction }));
                }
                return null;
            });
    }

    createAssessmentAnswersTx(inputRecord, transaction) {
        const answers = _.cloneDeep(inputRecord.answers);
        const status = inputRecord.status || 'completed';
        const language = inputRecord.language || 'en';
        return this.getMasterId(inputRecord, transaction)
            .then(masterId => this.answer.validateCreate(masterId, answers, status, transaction)
                .then(() => this.updateStatus(inputRecord.assessmentId, status, transaction))
                .then(() => {
                    const ids = _.map(answers, 'questionId');
                    const where = { questionId: { [Op.in]: ids } };
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
            .then(() => this.answer.listAnswers({ scope: 'assessment', assessmentId }))
            .then(answers => this.getAssessmentAnswersStatus({ assessmentId })
                .then(status => ({ status, answers })));
    }

    getAssessmentAnswersOnly({ userId, assessmentId }) {
        return this.answer.validateConsent({ userId, assessmentId }, 'read')
            .then(() => this.answer.listAnswers({ scope: 'assessment', assessmentId }));
    }

    copyAssessmentAnswersTx(inputRecord, transaction) {
        const status = inputRecord.status || 'completed';
        return this.getMasterId(inputRecord, transaction)
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

    getAssessmentAnswersStatus({ assessmentId }) {
        const where = { assessmentId };
        return this.db.AssessmentAnswer.findOne({ where, raw: true, attributes: ['status'] })
            .then(record => (record ? record.status : 'new'));
    }

    getAssessmentAnswersList(options = {}) {
        return this.assessment.listAssessments(options)
            .then((assessments) => {
                if (assessments.length) {
                    const ids = assessments.map(r => r.id);
                    return this.db.AssessmentAnswer.findAll({
                        where: { assessmentId: { [Op.in]: ids } },
                        raw: true,
                        attributes: ['assessmentId', 'status'],
                    })
                        .then((answers) => {
                            const mapInput = answers.map(r => [r.assessmentId, r.status]);
                            const map = new Map(mapInput);
                            assessments.forEach((r) => {
                                r.status = map.get(r.id) || 'new';
                            });
                            return assessments;
                        });
                }
                return assessments;
            });
    }
};
