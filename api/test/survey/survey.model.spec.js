/* global describe,before,after,beforeEach,afterEach,it,xit*/
'use strict';

var chai = require('chai');
var _ = require('lodash');

const helper = require('../helpers');
const db = require('../../db');

var expect = chai.expect;

var Survey = db.Survey;

describe('survey unit', function() {
	before(function() {
        return db.sequelize.sync({
            force: true
        });
	});

	const example = {
		name: 'Example',
		questions: [{
			text: 'Which sports do you like?',
			type: 'multi-choice-multi',
			choices: [
				'Football',
				'Basketball',
				'Soccer',
				'Tennis'
			]
		}, {
			text: 'What is your hair color?',
			type: 'multi-choice-single',
			choices: [
				'Black',
				'Brown',
				'Blonde',
				'Other'
			]
		}, {
			text: 'Where were you born?',
			type: 'text'
		}]
	};

	it('post/get survey', function() {
		return Survey.post(example).then(function(id) {
			return Survey.get(id).then(function(result) {
				const ids = _.map(result.questions, 'id');
				return helper.buildServerQuestions(example.questions, ids).then(function(expectedQuestions) {
					const expected = {
						id,
						name: example.name,
						questions: expectedQuestions
					};
					expect(result).to.deep.equal(expected);
				});
			});
		});
	});
});
