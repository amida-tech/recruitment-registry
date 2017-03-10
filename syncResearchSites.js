'use strict';

const models = require('./models');

const researchSiteSeed = require('./test/util/research-site-seed');
const researchSiteExamples = require('./test/fixtures/example/research-site-demo');

models.sequelize.query('SELECT COUNT(*) AS count FROM research_site', { type: models.sequelize.QueryTypes.SELECT })
  .then((result) => {
      if (result[0].count === '0') {
          return models.sequelize.sync({ force: true })
        .then(() => researchSiteSeed(researchSiteExamples))
        .then(() => console.log('success'));
      }
      console.log('already initialized');
      return null;
  })
  .then(() => process.exit(0))
  .catch((err) => {
      console.log('failure');
      console.log(err);
      process.exit(1);
  });
