'use strict';

/* eslint no-console: 0 */

const models = require('../../models');
const SPromise = require('../../lib/promise');

module.exports = function researchSiteSeed(example) {
    const researchSitePxs = example.researchSiteExamples.map(researchSite => models.researchSite.createResearchSite(researchSite));
    return SPromise.all(researchSitePxs)
    .then(() => {
        console.log('Research sites added!');
    });
};
