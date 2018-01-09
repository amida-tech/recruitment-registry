'use strict';

const Sequelize = require('sequelize');
const _ = require('lodash');

const Base = require('./base');

const Op = Sequelize.Op;

module.exports = class AssessmentDAO extends Base {
    constructor(db, dependencies) {
        super(db);
        Object.assign(this, dependencies);
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
                            where: { userId, surveyId: { [Op.in]: surveyIds } },
                            attributes: ['id'],
                            raw: true,
                            transaction,
                        }))
                        .then((answers) => {
                            const records = answers.map(answer => ({
                                answerId: answer.id, userAssessmentId: id,
                            }));
                            return UserAssessmentAnswer.bulkCreate(records, { transaction });
                        });
                }
                return null;
            });
    }

    openUserAssessment({ userId, assessmentId }) {
        const UserAssessment = this.db.UserAssessment;
        return this.transaction(transaction => UserAssessment.findAll({
            where: { userId, assessmentId },
            attributes: ['id', 'version', 'deletedAt'],
            order: ['version'],
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
                    const version = lastUserAssessment.version + 1;
                    if (lastUserAssessment.deletedAt) {
                        return version;
                    }
                    const lastId = lastUserAssessment.id;
                    const record = { assessmentId, userId };
                    return this.closeUserAssessmentById(lastId, record, transaction)
                        .then(() => version);
                })
                .then((version) => {
                    const record = { userId, assessmentId, version, status: 'scheduled' };
                    return UserAssessment.create(record, { transaction })
                        .then(({ id }) => ({ id }));
                }));
    }

    closeUserAssessment({ userId, assessmentId, status }) {
        return this.transaction((transaction) => {
            const record = { userId, assessmentId, status };
            const where = { userId, assessmentId };
            return this.db.UserAssessment.findOne({ where, attributes: ['id'], transaction })
                .then(({ id }) => this.closeUserAssessmentById(id, record, transaction));
        });
    }

    listUserAssessments(userId, assessmentId) {
        return this.db.UserAssessment.findAll({
            where: { userId, assessmentId },
            attributes: ['id', 'version'],
            order: ['version'],
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
        return this.transaction((transaction) => {
            const dbRecords = records.map(record => _.omit(record, 'answerIds'));
            return this.db.UserAssessment.bulkCreate(dbRecords, { transaction, returning: true })
                .then(result => result.map(({ id }) => id))
                .then((ids) => {
                    const answerRecords = records.reduce((r, { answerIds }, index) => {
                        const userAssessmentId = ids[index];
                        answerIds.forEach(answerId => r.push({ userAssessmentId, answerId }));
                        return r;
                    }, []);
                    return this.db.UserAssessmentAnswer.bulkCreate(answerRecords, { transaction });
                });
        });
    }

    exportBulk() {
        const UserAssessment = this.db.UserAssessment;
        const Assessment = this.db.Assessment;
        const createdAtColumn = this.timestampColumn('user_assessment', 'created');
        const attributes = ['id', 'userId', 'assessmentId', 'meta', createdAtColumn];
        return UserAssessment.findAll({
            attributes,
            include: [{ model: Assessment, as: 'assessment', attributes: ['id', 'name'] }],
            order: ['userId', 'assessmentId', 'version'],
            raw: true,
            paranoid: false,
        });
    }

    exportBulkAnswers(ids) {
        return this.db.UserAssessmentAnswer.findAll({
            where: { userAssessmentId: { [Op.in]: ids } },
            attributes: ['answerId', 'userAssessmentId'],
            order: ['userAssessmentId', 'answerId'],
            raw: true,
        });
    }
};
