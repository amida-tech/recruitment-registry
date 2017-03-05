'use strict';

const db = require('../db');

const SurveyQuestion = db.SurveyQuestion;
const SurveySection = db.SurveySection;
const SurveySectionQuestion = db.SurveySectionQuestion;

const updateQuestionSectionDependency = function updateQuestionSectionDependency(parents, id, questionParents, sectionParents) {
    const { sectionId, parentId, questionParentId } = sectionParents.get(id);
    parents.push({ sectionId });
    if (parentId) {
        updateQuestionSectionDependency(parents, parentId, questionParents, sectionParents);
    }
    if (questionParentId) {
        parents.push({ questionId: questionParentId });
        const parentId = questionParents.get(questionParentId);
        if (parentId) {
            updateQuestionSectionDependency(parents, parentId, questionParents, sectionParents);
        }
    }
};

const updateQuestionDependency = function updateQuestionDependency(question, questionParents, sectionParents) {
    const id = question.questionId;
    const parentId = questionParents.get(id);
    if (parentId) {
        question.parents = [];
        updateQuestionSectionDependency(question.parents, parentId, questionParents, sectionParents);
    }
};

module.exports = class SurveyQuestionsDAO {
    constructor() {}

    listSurveyQuestions(surveyId, addDependency) {
        const options = {
            where: { surveyId },
            raw: true,
            attributes: ['questionId', 'required'],
            order: 'line',
        };
        return SurveyQuestion.findAll(options)
            .then((questions) => {
                if (addDependency) {
                    return this.addDependency(surveyId, questions);
                }
                return questions;
            });
    }

    addDependency(surveyId, questions) {
        return SurveySection.findAll({
            where: { surveyId },
            raw: true,
            order: 'line',
            attributes: ['id', 'sectionId', 'parentId', 'parentQuestionId'],
        })
            .then((sections) => {
                if (!sections.length) {
                    return questions;
                }
                const ids = sections.map(({ id }) => id);
                return SurveySectionQuestion.findAll({
                    where: { surveySectionId: { $in: ids } },
                    raw: true,
                    order: 'line',
                    attributes: ['surveySectionId', 'questionId'],
                })
                    .then((sectionQuestions) => {
                        const sectionParents = sections.reduce((r, section) => {
                            r.set(section.id, section);
                            return r;
                        }, new Map());
                        const questionParents = sectionQuestions.reduce((r, sectionQuestion) => {
                            r.set(sectionQuestion.questionId, sectionQuestion.surveySectionId);
                            return r;
                        }, new Map());
                        questions.forEach((question) => {
                            updateQuestionDependency(question, questionParents, sectionParents);
                        });
                        return questions;
                    });
            });
    }
};
