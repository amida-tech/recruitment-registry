'use strict';

const chai = require('chai');

const models = require('../../models');

const expect = chai.expect;

const SpecTests = class AssessmentSpecTests {
    constructor(generator, hxSurvey, hxAssessment) {
        this.generator = generator;
        this.hxSurvey = hxSurvey;
        this.hxAssessment = hxAssessment;
    }

    createAssessmentFn(indices) {
        const generator = this.generator;
        const hxSurvey = this.hxSurvey;
        const hxAssessment = this.hxAssessment;
        return function () {
            const surveyIds = indices.map(index => hxSurvey.id(index));
            const assessment = generator.newAssessment(surveyIds);
            return models.assessment.createAssessment(assessment)
                .then(({ id }) => hxAssessment.pushWithId(assessment, id));
        };
    }

    getAssessmentFn(index) {
        const hxAssessment = this.hxAssessment;
        return function () {
            const id = hxAssessment.id(index);
            return models.assessment.getAssessment(id)
                .then(assessment => {
                    expect(assessment).to.deep.equal(hxAssessment.server(index));
                });
        };
    }

    listAssessmentFn() {
        const hxAssessment = this.hxAssessment;
        return function () {
            return models.assessment.listAssessments()
                .then(list => {
                    expect(list).to.deep.equal(hxAssessment.listServers());
                });
        };
    }
};

const IntegrationTests = class AssessmentSpecTests {
    constructor(rrSuperTest, generator, hxSurvey, hxAssessment) {
        this.rrSuperTest = rrSuperTest;
        this.generator = generator;
        this.hxSurvey = hxSurvey;
        this.hxAssessment = hxAssessment;
    }

    createAssessmentFn(indices) {
        const rrSuperTest = this.rrSuperTest;
        const generator = this.generator;
        const hxSurvey = this.hxSurvey;
        const hxAssessment = this.hxAssessment;
        return function (done) {
            const surveyIds = indices.map(index => hxSurvey.id(index));
            const assessment = generator.newAssessment(surveyIds);
            rrSuperTest.post('/assessments', assessment, 201)
                .expect(function (res) {
                    hxAssessment.pushWithId(assessment, res.body.id);
                })
                .end(done);
        };
    }

    getAssessmentFn(index) {
        const rrSuperTest = this.rrSuperTest;
        const hxAssessment = this.hxAssessment;
        return function (done) {
            const id = hxAssessment.id(index);
            rrSuperTest.get(`/assessments/${id}`, true, 200)
                .expect(function (res) {
                    expect(res.body).to.deep.equal(hxAssessment.server(index));
                })
                .end(done);
        };
    }

    listAssessmentFn() {
        const rrSuperTest = this.rrSuperTest;
        const hxAssessment = this.hxAssessment;
        return function (done) {
            rrSuperTest.get('/assessments', true, 200)
                .expect(function (res) {
                    expect(res.body).to.deep.equal(hxAssessment.listServers());
                })
                .end(done);
        };
    }
};

module.exports = {
    SpecTests,
    IntegrationTests
};