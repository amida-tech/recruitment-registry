'use strict';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');
const constNames = require('../../models/const-names');

const expect = chai.expect;

const BaseTests = class BaseTests {
    constructor({ hxUser, hxSurvey }) {
        this.hxUser = hxUser;
        this.hxSurvey = hxSurvey;
    }

    verifyList(userSurveys, statusList = []) {
        let expected = _.cloneDeep(this.hxSurvey.listServers());
        expected = expected.map(r => _.omitBy(r, _.isNil));
        expected = expected.reduce((r, userSurvey, index) => {
            if (userSurvey.type !== constNames.feedbackSurveyType) {
                const status = statusList[index] || 'new';
                Object.assign(userSurvey, { status });
                r.push(userSurvey);
            }
            return r;
        }, []);
        expected = expected.map(r => _.omit(r, ['type', 'authorId']));
        expect(userSurveys).to.deep.equal(expected);
    }
};

const SpecTests = class FeedbackSurveySpecTests extends BaseTests {
    verifyUserSurveyListFn(userIndex, statusList) {
        const self = this;
        return function verifyUserSurveyList() {
            const userId = self.hxUser.id(userIndex);
            return models.userSurvey.listUserSurveys(userId)
                .then(userSurveys => self.verifyList(userSurveys, statusList));
        };
    }
};

const IntegrationTests = class FeedbackSurveyIntegrationTests extends BaseTests {
    constructor(rrSuperTest, dependencies) {
        super(dependencies);
        this.rrSuperTest = rrSuperTest;
    }

    verifyUserSurveyListFn(statusList) {
        const self = this;
        return function verifyUserSurveyList() {
            return self.rrSuperTest.get('/user-surveys', true, 200)
                .then(res => self.verifyList(res.body, statusList));
        };
    }
};

module.exports = {
    SpecTests,
    IntegrationTests,
};
