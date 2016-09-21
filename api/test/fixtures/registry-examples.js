'use strict';

const surveys = require('./survey-examples');

module.exports = [{
    name: 'Example',
    survey: surveys.Example.survey
}, {
    name: 'Alzheimer',
    survey: surveys.Alzheimer.survey
}];
