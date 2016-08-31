'use strict';

var _ = require('lodash');

const db = require('../db');

exports.buildServerQuestion = function(question, id) {
	return db.sequelize.query('select id, text from question_choices where question_id = :id', {
		replacements: {
			id
		},
           type: db.sequelize.QueryTypes.SELECT
	}).then(function(result) {
		return result.reduce(function(r, choice) {
			r[choice.text] = choice.id;
			return r;
		}, {});
	}).then(function(choiceMap) {
		const result = _.cloneDeep(question);
		result.id = id;
		if (result.choices) {
			result.choices = result.choices.map(function(choice) {
				return {
					text: choice,
					id: choiceMap[choice]
				}
			});
		}
		return result;
	});
};

exports.buildServerQuestions = function(questions, ids) {
	return db.sequelize.Promise.all(_.range(0, questions.length).map(function(index) {
		return exports.buildServerQuestion(questions[index], ids[index]);
	}))
};
