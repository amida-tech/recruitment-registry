'use strict';

const _ = require('lodash');

const SPromise = require('../../lib/promise');

module.exports = class AssessmentDAO {
    constructor(db, dependencies) {
        Object.assign(this, dependencies);
        this.db = db;
    }

    closeUserAssessmentById(id, { userId, assessmentId, status = 'collected' }, transaction) {
        const UserAssessment = this.db.UserAssessment;
        const AssessmentSurvey = this.db.AssessmentSurvey;
        const Answer = this.db.Answer;
        const UserAssessmentAnswer = this.db.UserAssessmentAnswer;
        return UserAssessment.update({ status }, { where: { id }, transaction })
            .then(() => UserAssessment.destroy({ where: { id }, transaction }))
            .then(() => {
                if (status === 'collected') {
                    return AssessmentSurvey.findAll({
                        where: { assessmentId },
                        attributes: ['surveyId'],
                        raw: true,
                        transaction,
                    })
                        .then(surveyIds => surveyIds.map(({ surveyId }) => surveyId))
                        .then(surveyIds => Answer.findAll({
                            where: { userId, surveyId: { $in: surveyIds } },
                            attributes: ['id'],
                            raw: true,
                            transaction,
                        }))
                        .then((answers) => {
                            const records = answers.map(answer => ({ answerId: answer.id, userAssessmentId: id }));
                            const promises = records.map(record => UserAssessmentAnswer.create(record, { transaction }));
                            return SPromise.all(promises);
                        });
                }
                return null;
            });
    }

    openUserAssessment({ userId, assessmentId }) {
        const sequelize = this.db.sequelize;
        const UserAssessment = this.db.UserAssessment;
        return sequelize.transaction(transaction => UserAssessment.findAll({
            where: { userId, assessmentId },
            attributes: ['id', 'sequence', 'deletedAt'],
            order: 'sequence',
            raw: true,
            paranoid: false,
            transaction,
        })
                .then((userAssessments) => {
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
                .then((sequence) => {
                    const record = { userId, assessmentId, sequence, status: 'scheduled' };
                    return UserAssessment.create(record, { transaction }).then(({ id }) => ({ id }));
                }));
    }

    closeUserAssessment({ userId, assessmentId, status }) {
        const sequelize = this.db.sequelize;
        const UserAssessment = this.db.UserAssessment;
        return sequelize.transaction(transaction => UserAssessment.findOne({ where: { userId, assessmentId }, attributes: ['id'], transaction })
                .then(({ id }) => this.closeUserAssessmentById(id, { userId, assessmentId, status }, transaction)));
    }

    listUserAssessments(userId, assessmentId) {
        return this.db.UserAssessment.findAll({
            where: { userId, assessmentId },
            attributes: ['id', 'sequence'],
            order: 'sequence',
            raw: true,
            paranoid: false,
        });
    }

    listUserAssessmentAnswers(id) {
        return this.db.UserAssessmentAnswer.findAll({
            where: { userAssessmentId: id },
            raw: true,
        })
            .then((records) => {
                const ids = records.map(({ answerId }) => answerId);
                return this.answer.listAnswers({ ids, history: true });
            });
    }

    importBulk(records) {
        return this.db.sequelize.transaction((transaction) => {
            const promises = records.map((record) => {
                const dbRecord = _.omit(record, 'answerIds');
                return this.db.UserAssessment.create(dbRecord, { transaction })
                    .then(({ id }) => id);
            });
            return SPromise.all(promises)
                .then((ids) => {
                    const answerRecords = records.reduce((r, { answerIds }, index) => {
                        const userAssessmentId = ids[index];
                        answerIds.forEach(answerId => r.push({ userAssessmentId, answerId }));
                        return r;
                    }, []);
                    const promises = answerRecords.map(answerRecord => this.db.UserAssessmentAnswer.create(answerRecord, { transaction })
                            .then(({ id }) => id));
                    return SPromise.all(promises);
                });
        });
    }

    exportBulk() {
        const sequelize = this.db.sequelize;
        const UserAssessment = this.db.UserAssessment;
        const Assessment = this.db.Assessment;
        const createdAtColumn = [sequelize.fn('to_char', sequelize.col('user_assessment.created_at'), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'createdAt'];
        const attributes = ['id', 'userId', 'assessmentId', 'meta', createdAtColumn];
        return UserAssessment.findAll({
            attributes,
            include: [{ model: Assessment, as: 'assessment', attributes: ['id', 'name'] }],
            order: ['userId', 'assessmentId', 'sequence'],
            raw: true,
            paranoid: false,
        });
    }

    exportBulkAnswers(ids) {
        return this.db.UserAssessmentAnswer.findAll({
            where: { userAssessmentId: { $in: ids } },
            attributes: ['answerId', 'userAssessmentId'],
            order: ['userAssessmentId', 'answerId'],
            raw: true,
        });
    }
};
