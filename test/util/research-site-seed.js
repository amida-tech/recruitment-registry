'use strict';

const models = require('../../models');
const SPromise = require('../../lib/promise');

module.exports = function (example) {
    const researchSitePxs = example.researchSiteExamples.map(researchSite => models.researchSite.createResearchSite(researchSite));
    return SPromise.all(researchSitePxs)
    .then(() => {
        console.log('Research sites added!');
    });
};
