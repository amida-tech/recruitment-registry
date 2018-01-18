'use strict';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');
const errSpec = require('./err-handler-spec');

const expect = chai.expect;

const FeedbackSurveyHistory = class {
    constructor(hxSurvey) {
        this.default = null;
        this.surveyAssigned = {};
        this.hxSurvey = hxSurvey;
    }

    push(feedbackSurveyIndex, surveyIndex) {
        if (_.isNil(surveyIndex)) {
            this.default = feedbackSurveyIndex;
            return;
        }
        this.surveyAssigned[surveyIndex] = feedbackSurveyIndex;
    }

    getFeedbackIndex(surveyIndex) {
        if (_.isNil(surveyIndex)) {
            return { isDefault: true, feedbackIndex: this.default };
        }
        const result = this.surveyAssigned[surveyIndex];
        if (_.isNil(result)) {
            return { isDefault: true, feedbackIndex: this.default };
        }
        return { isDefault: false, feedbackIndex: result };
    }

    get(surveyIndex, options = {}) {
        const hxSurvey = this.hxSurvey;
        const { isDefault, feedbackIndex } = this.getFeedbackIndex(surveyIndex);
        if (_.isNil(feedbackIndex)) {
            return { feedbackSurveyId: 0 };
        }
        const result = { isDefault, feedbackSurveyId: hxSurvey.id(feedbackIndex) };
        if (options.full) {
            result.survey = hxSurvey.server(feedbackIndex);
        }
        return result;
    }

    delete(surveyIndex) {
        if (_.isNil(surveyIndex)) {
            this.default = null;
            return;
        }
        delete this.surveyAssigned[surveyIndex];
    }

    list() {
        const hxSurvey = this.hxSurvey;
        const result = [];
        _.forOwn(this.surveyAssigned, (value, key) => {
            const index = parseInt(key, 10);
            const feedbackSurveyId = hxSurvey.id(value);
            const surveyId = hxSurvey.id(index);
            result.push({ feedbackSurveyId, surveyId });
        });
        const sortedResult = _.sortBy(result, 'surveyId');
        if (!_.isNil(this.default)) {
            const feedbackSurveyId = hxSurvey.id(this.default);
            sortedResult.push({ feedbackSurveyId });
        }
        return sortedResult;
    }

    updateSurveyDeleted(index) {
        if (this.default === index) {
            this.default = null;
        }
        delete this.surveyAssigned[index];
        _.forOwn(this.surveyAssigned, (value, key) => {
            if (value === index) {
                delete this.surveyAssigned[key];
            }
        });
    }
};

const BaseTests = class BaseTests {
    constructor(hxSurvey) {
        this.hxSurvey = hxSurvey;
        this.hxFeedbackSurvey = new FeedbackSurveyHistory(hxSurvey);
    }

    errorCreateFeedbackSurveyFn(index, surveyIndex, errKey) {
        const self = this;
        return function errorCreateFeedbackSurvey() {
            const feedbackSurveyId = self.hxSurvey.id(index);
            let surveyId = null;
            if (!_.isNil(surveyIndex)) {
                surveyId = self.hxSurvey.id(surveyIndex);
            }
            const payload = { feedbackSurveyId };
            if (surveyId) {
                Object.assign(payload, { surveyId });
            }
            return self.errorCreateFeedbackSurveyPx(payload, errKey);
        };
    }

    createFeedbackSurveyFn(index, surveyIndex) {
        const self = this;
        return function createFeedbackSurvey() {
            const feedbackSurveyId = self.hxSurvey.id(index);
            let surveyId = null;
            if (!_.isNil(surveyIndex)) {
                surveyId = self.hxSurvey.id(surveyIndex);
            }
            const payload = { feedbackSurveyId };
            if (surveyId) {
                Object.assign(payload, { surveyId });
            }
            return self.createFeedbackSurveyPx(payload)
                .then(() => {
                    self.hxFeedbackSurvey.push(index, surveyIndex);
                });
        };
    }

    getFeedbackSurveyFn(surveyIndex, options = {}) {
        const self = this;
        return function getFeedbackSurvey() {
            const surveyId = _.isNil(surveyIndex) ? null : self.hxSurvey.id(surveyIndex);
            return self.getFeedbackSurveyPx(surveyId, options)
                .then((result) => {
                    const expected = self.hxFeedbackSurvey.get(surveyIndex, options);
                    if (options.full && expected.feedbackSurveyId) {
                        delete expected.survey.authorId;
                    }
                    expect(result).to.deep.equal(expected);
                });
        };
    }

    deleteFeedbackSurveyFn(surveyIndex) {
        const self = this;
        return function deleteFeedbackSurvey() {
            const surveyId = _.isNil(surveyIndex) ? null : self.hxSurvey.id(surveyIndex);
            return self.deleteFeedbackSurveyPx(surveyId)
                .then(() => self.hxFeedbackSurvey.delete(surveyIndex));
        };
    }

    listFeedbackSurveysFn() {
        const self = this;
        return function listFeedbackSurvey() {
            return self.listFeedbackSurveysPx()
                .then((result) => {
                    const expected = self.hxFeedbackSurvey.list();
                    expect(result).to.deep.equal(expected);
                });
        };
    }

    updateHistoryWhenSurveyDeleted(index) {
        this.hxFeedbackSurvey.updateSurveyDeleted(index);
    }
};

const SpecTests = class FeedbackSurveySpecTests extends BaseTests {
    constructor(hxSurvey) {
        super(hxSurvey);
        this.models = models;
    }

    errorCreateFeedbackSurveyPx(payload, errKey) {
        const errFn = errSpec.expectedErrorHandlerFn(errKey);
        return this.models.feedbackSurvey.createFeedbackSurvey(payload)
            .then(errSpec.throwingHandler, errFn);
    }

    createFeedbackSurveyPx(payload) {
        return this.models.feedbackSurvey.createFeedbackSurvey(payload);
    }

    getFeedbackSurveyPx(surveyId, options = {}) {
        return this.models.feedbackSurvey.getFeedbackSurvey(surveyId, options);
    }

    deleteFeedbackSurveyPx(surveyId) {
        return this.models.feedbackSurvey.deleteFeedbackSurvey(surveyId);
    }

    listFeedbackSurveysPx() {
        return this.models.feedbackSurvey.listFeedbackSurveys();
    }
};

const IntegrationTests = class FeedbackSurveyIntegrationTests extends BaseTests {
    constructor(rrSuperTest, hxSurvey) {
        super(hxSurvey);
        this.rrSuperTest = rrSuperTest;
    }

    errorCreateFeedbackSurveyPx(payload, errKey) {
        return this.rrSuperTest.post('/feedback-surveys', payload, 400)
            .then(res => errSpec.verifyErrorMessage(res, errKey));
    }

    createFeedbackSurveyPx(payload) {
        const { feedbackSurveyId, surveyId } = payload;
        if (surveyId) {
            return this.rrSuperTest.post('/feedback-surveys', payload, 204);
        }
        return this.rrSuperTest.post('/default-feedback-survey', { feedbackSurveyId }, 204);
    }

    getFeedbackSurveyPx(surveyId, options = {}) {
        const path = surveyId ? `/feedback-surveys/${surveyId}` : '/default-feedback-survey';
        return this.rrSuperTest.get(path, true, 200, options)
            .then(res => res.body);
    }

    deleteFeedbackSurveyPx(surveyId) {
        const path = surveyId ? `/feedback-surveys/${surveyId}` : '/default-feedback-survey';
        return this.rrSuperTest.delete(path, 204);
    }

    listFeedbackSurveysPx() {
        return this.rrSuperTest.get('/feedback-surveys', true, 200)
            .then(res => res.body);
    }
};

module.exports = {
    SpecTests,
    IntegrationTests,
};
