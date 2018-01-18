'use strict';

const Sequelize = require('sequelize');
const _ = require('lodash');

const Base = require('./base');
const constNames = require('../const-names');
const RRError = require('../../lib/rr-error');

const Op = Sequelize.Op;

module.exports = class FeedbackSurveyDAO extends Base {
    constructor(db, dependencies) {
        super(db);
        Object.assign(this, dependencies);

        const cbDeleteSurvey = options => this.beforeSurveyDestroy(options);
        db.Survey.addHook('beforeBulkDestroy', 'feedbackSurvey', cbDeleteSurvey);
    }

    validateCreateFeedbackSurvey({ feedbackSurveyId, surveyId }, transaction) {
        let where = { id: feedbackSurveyId };
        if (surveyId) {
            where = { [Op.or]: [where, { id: surveyId }] };
        }
        const attributes = ['id', 'type'];
        return this.db.Survey.findAll({ raw: true, attributes, where, transaction })
            .then((surveys) => {
                const expectedCount = surveyId ? 2 : 1;
                if (expectedCount !== surveys.length) {
                    return RRError.reject('feedbackSurveyNoDeletedDefault');
                }
                const feedbackSurvey = surveys.find(({ id }) => id === feedbackSurveyId);
                if (feedbackSurvey.type !== constNames.feedbackSurveyType) {
                    return RRError.reject('feedbackSurveyNoWrongType');
                }
                if (surveyId) {
                    const survey = surveys.find(({ id }) => id === surveyId);
                    if (survey.type === constNames.feedbackSurveyType) {
                        return RRError.reject('feedbackSurveyNoWrongType');
                    }
                }
                return null;
            });
    }

    createFeedbackSurveyTx({ feedbackSurveyId, surveyId }, transaction) {
        const FeedbackSurvey = this.db.FeedbackSurvey;
        const record = { feedbackSurveyId, surveyId: surveyId || null };
        const where = { surveyId: record.surveyId };
        return this.validateCreateFeedbackSurvey({ feedbackSurveyId, surveyId }, transaction)
            .then(() => FeedbackSurvey.destroy({ where, transaction }))
            .then(() => FeedbackSurvey.create(record, { transaction }));
    }

    createFeedbackSurvey(payload) {
        return this.transaction(transaction => this.createFeedbackSurveyTx(payload, transaction));
    }

    deleteFeedbackSurvey(surveyId) {
        const where = { surveyId: surveyId || null };
        return this.db.FeedbackSurvey.destroy({ where });
    }

    getFeedbackSurvey(surveyId, options = {}) {
        let where;
        if (surveyId === null) {
            where = { surveyId };
        } else {
            where = { [Op.or]: [{ surveyId }, { surveyId: null }] };
        }
        const attributes = ['feedbackSurveyId', 'surveyId'];
        return this.db.FeedbackSurvey.findAll({ raw: true, attributes, where })
            .then((records) => {
                if (!records.length) {
                    return { feedbackSurveyId: 0 };
                }
                let record;
                if (records.length === 2) {
                    record = records.find(r => r.surveyId);
                } else {
                    record = records[0];
                }
                const { surveyId: recordSurveyId, feedbackSurveyId } = record;
                const result = { feedbackSurveyId };
                result.isDefault = (recordSurveyId === null);
                if (options.full) {
                    return this.survey.getSurvey(feedbackSurveyId, options)
                        .then(survey => Object.assign(result, { survey }));
                }
                return result;
            });
    }

    listFeedbackSurveys() {
        const attributes = ['feedbackSurveyId', 'surveyId'];
        const order = ['surveyId'];
        return this.db.FeedbackSurvey.findAll({ raw: true, attributes, order })
            .then(result => result.map(r => _.omitBy(r, _.isNil)));
    }

    beforeSurveyDestroy(options) {
        const { where: whereSurvey, transaction } = options;
        const where = { feedbackSurveyId: whereSurvey.id };
        return this.db.FeedbackSurvey.count({ where, transaction })
            .then((count) => {
                if (count > 0) {
                    return RRError.reject('surveyNoDeleteFeedback');
                }
                const whereLinked = { surveyId: whereSurvey.id };
                return this.db.FeedbackSurvey.destroy({ where: whereLinked, transaction });
            });
    }
};
