'use strict';

/* eslint no-console: 0 */

const config = require('./config');
const appGenerator = require('./app-generator');
const modelsGenerator = require('./models/generator');

const actualLink = '${link}'; // eslint-disable-line no-template-curly-in-string
const smtp = {
    type: 'cohort-csv',
    protocol: 'smtp',
    username: 'user@amida.com',
    password: 'password',
    host: 'smtp.gmail.com',
    from: 'smtp@rr.com',
    otherOptions: {
        port: 587,
    },
    subject: 'Cohort Admin',
    content: `Click on this please: ${actualLink}`,
};

const schema = appGenerator.extractSchema(config.db.schema) || 'public';
const models = modelsGenerator(schema);

models.sequelize.sync({ force: false })
    .then(() => models.smtp.createSmtp(smtp))
    .then(() => process.exit(0))
    .catch((err) => {
        console.log('failure');
        console.log(err);
        process.exit(1);
    });
