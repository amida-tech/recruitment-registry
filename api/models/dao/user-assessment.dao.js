'use strict';

const _ = require('lodash');

const db = require('../db');

const sequelize = db.sequelize;
const SPromise = require('../../lib/promise');

const UserAssessment = db.UserAssessment;
const AssessmentSurvey = db.AssessmentSurvey;
const Answer = db.Answer;
const UserAssessmentAnswer = db.UserAssessmentAnswer;

module.exports = class AssessmentDAO {
    constructor(dependencies) {
        Object.assign(this, dependencies);
    }

    closeUserAssessmentById(id, { userId, assessmentId, status = 'collected' }, transaction) {
        return UserAssessment.update({ status }, { where: { id, }, transaction })
            .then(() => UserAssessment.destroy({ where: { id }, transaction }))
            .then(() => {
                if (status === 'collected') {
                    return AssessmentSurvey.findAll({
                            where: { assessmentId },
                            attributes: ['surveyId'],
                            raw: true,
                            transaction
                        })
                        .then(surveyIds => surveyIds.map(({ surveyId }) => surveyId))
                        .then(surveyIds => Answer.findAll({
                            where: { userId, surveyId: { $in: surveyIds } },
                            attributes: ['id'],
                            raw: true,
                            transaction
                        }))
                        .then(answers => {
                            const records = answers.map(answer => ({ answerId: answer.id, userAssessmentId: id }));
                            const promises = records.map(record => UserAssessmentAnswer.create(record, { transaction }));
                            return SPromise.all(promises);
                        });
                }
            });
    }

    openUserAssessment({ userId, assessmentId }) {
        return sequelize.transaction(transaction => {
            return UserAssessment.findAll({
                    where: { userId, assessmentId },
                    attributes: ['id', 'sequence', 'deletedAt'],
                    order: 'sequence',
                    raw: true,
                    paranoid: false,
                    transaction
                })
                .then(userAssessments => {
                    const length = userAssessments.length;
                    if (!length) {
                        return 0;
                    }
                    const lastUserAssessment = userAssessments[length - 1];
                    const sequence = lastUserAssessment.sequence + 1;
                    if (lastUserAssessment.deletedAt) {
                        return sequence;
                    }
                    return this.closeUserAssessmentById(lastUserAssessment.id, { assessmentId, userId }, transaction)
                        .then(() => sequence);
                })
                .then(sequence => {
                    const record = { userId, assessmentId, sequence, status: 'scheduled' };
                    return UserAssessment.create(record, { transaction }).then(({ id }) => ({ id }));
                });
        });
    }

    closeUserAssessment({ userId, assessmentId, status }) {
        return sequelize.transaction(transaction => {
            return UserAssessment.findOne({ where: { userId, assessmentId }, attributes: ['id'], transaction })
                .then(({ id }) => this.closeUserAssessmentById(id, { userId, assessmentId, status }, transaction));
        });
    }

    listUserAssessments(userId, assessmentId) {
        return UserAssessment.findAll({
            where: { userId, assessmentId },
            attributes: ['id', 'sequence'],
            order: 'sequence',
            raw: true,
            paranoid: false
        });
    }

    listUserAssessmentAnswers(id) {
        return UserAssessmentAnswer.findAll({
                where: { userAssessmentId: id },
                raw: true
            })
            .then(records => {
                const ids = records.map(({ answerId }) => answerId);
                return this.answer.listAnswers({ ids, history: true });
            });
    }

    importBulk(records) {
        return sequelize.transaction(transaction => {
            const promises = records.map(record => {
                const dbRecord = _.omit(record, 'answerIds');
                return UserAssessment.create(dbRecord, { transaction })
                    .then(({ id }) => id);
            });
            return SPromise.all(promises)
                .then(ids => {
                    const answerRecords = records.reduce((r, { answerIds }, index) => {
                        const userAssessmentId = ids[index];
                        answerIds.forEach(answerId => r.push({ userAssessmentId, answerId }));
                        return r;
                    }, []);
                    const promises = answerRecords.map(answerRecord => {
                        return UserAssessmentAnswer.create(answerRecord, { transaction })
                            .then(({ id }) => id);
                    });
                    return SPromise.all(promises);
                });
        });
    }
};
