'use strict';

const models = require('../../models');
const SPromise = require('../../lib/promise');

module.exports = function (example) {
    const researchSitePxs = example.researchSiteExamples.map(researchSite => models.researchSite.createResearchSite(researchSite));
    return SPromise.all(researchSitePxs)
    .then(() => {
      // TODO: stuff
      console.log('Research site added!');
    });
};
