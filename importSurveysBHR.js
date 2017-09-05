'use strict';

const models = require('./models');

const choiceSets = require('./import/bhr-gap/choice-sets');
const surveys = require('./import/bhr-gap/bhr-gap-surveys');

models.choiceSet.createChoiceSets(choiceSets);
models.macro.createSurveys(surveys);
