'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

/* eslint no-console: 0 */

const models = require('../../models');
const SPromise = require('../../lib/promise');

module.exports = function researchSiteSeed(example, inputModels) {
    const m = inputModels || models;
    const researchSitePxs = example.researchSiteExamples.map(researchSite => m.researchSite.createResearchSite(researchSite));
    return SPromise.all(researchSitePxs)
    .then(() => {
        console.log('Research sites added!');
    });
};
