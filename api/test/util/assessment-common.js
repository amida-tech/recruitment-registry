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

module.exports = {
    SpecTests
};
