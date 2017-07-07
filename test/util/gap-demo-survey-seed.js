'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

/* eslint no-console: 0 */

const models = require('../../models');
const SPromise = require('../../lib/promise');

module.exports = function gapDemoSurveySeed(example, inputModels) {
    const m = inputModels || models;
    const gapDemoSurveyPxs = example.gapDemoSurveys.map(survey => m.survey.createSurvey(survey));
    return SPromise.all(gapDemoSurveyPxs)
    .then(() => {
        console.log('GAP demo surveys sites added!');
    });
};
