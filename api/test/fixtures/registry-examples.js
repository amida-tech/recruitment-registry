'use strict';

const surveys = require('./survey-examples');

module.exports = [{
    name: 'Alzheimer',
    survey: surveys.Alzheimer.survey
}, {
    name: 'Example',
    survey: surveys.Example.survey
}];
