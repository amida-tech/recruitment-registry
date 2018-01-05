'use strict';

/* eslint no-console: 0 */

const config = require('./config');
const appGenerator = require('./app-generator');
const modelsGenerator = require('./models/generator');

const consentSeed = require('./test/util/consent-seed');
const consentExample = require('./test/fixtures/example/consent-demo');

const researchSiteSeed = require('./test/util/research-site-seed');
const researchSiteExamples = require('./test/fixtures/example/research-site-demo');

const gapDemoSurveySeed = require('./test/util/gap-demo-survey-seed');
const gapDemoSurveys = require('./test/fixtures/example/gap-demo-survey');
const exampleSurveys = require('./test/fixtures/example/survey');

const schema = appGenerator.extractSchema(config.db.schema) || 'public';
const models = modelsGenerator(schema);

const initializeData = function (m) {
    return m.profileSurvey.createProfileSurvey(exampleSurveys.zipYOBProfileSurvey)
        .then(() => consentSeed(consentExample, m))
        .then(() => researchSiteSeed(researchSiteExamples, m))
        .then(() => gapDemoSurveySeed(gapDemoSurveys, m));
};

const sschema = Array.isArray(schema) ? schema[0] : schema;

models.sequelize.query(`SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = '${sschema}' AND table_name = 'registry_user'`, { type: models.sequelize.QueryTypes.SELECT })
    .then((result) => {
        if (result[0].count === '0') {
            return models.sequelize.sync({ force: true })
                .then(() => {
                    if (Array.isArray(schema)) {
                        let pxs = null;
                        schema.forEach((r) => {
                            const px = initializeData(models[r]).then(() => console.log(`${r} initialized.`));
                            if (pxs) {
                                pxs = pxs.then(() => px);
                            } else {
                                pxs = px;
                            }
                        });
                        return pxs;
                    }
                    return initializeData(models);
                })
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
