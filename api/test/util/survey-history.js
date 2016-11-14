'use strict';

const History = require('./entity-history');

module.exports = class SurveyHistory extends History {
	constructor() {
		super(['id', 'name']);
	}
};
