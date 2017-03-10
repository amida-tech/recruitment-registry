'use strict';

const models = require('./models');

const researchSiteSeed = require('./test/util/research-site-seed');
const researchSiteExamples = require('./test/fixtures/example/research-site-demo');

models.sequelize.sync({ force: true })
    .then(() => {
      researchSiteSeed(researchSiteExamples)
    })
    .then(() => {
        console.log('success');
    })
    .catch((err) => {
        console.log('failure');
        console.log(err);
    });
