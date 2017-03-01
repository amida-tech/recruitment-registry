'use strict';

const db = require('../db');

const SurveyQuestion = db.SurveyQuestion;
const SurveySection = db.SurveySection;
const SurveySectionQuestion = db.SurveySectionQuestion;

const updateQuestionSectionDependency = function updateQuestionSectionDependency(parents, sectionId, questionParents, sectionParents) {
    const parent = sectionParents.get(sectionId);
    if (parent) {
        parents.push(parent);
        if (parent.sectionId) {
            return updateQuestionSectionDependency(parents, parent.sectionId, questionParents, sectionParents);
        }
        if (parent.questionId) {
            const grandparentSectionId = questionParents.get(parent.questionId);
            if (grandparentSectionId) {
                parents.push({ sectionId: grandparentSectionId });
                updateQuestionSectionDependency(parents, grandparentSectionId, questionParents, sectionParents);
            }
        }
    }
};

const updateQuestionDependency = function updateQuestionDependency(question, questionParents, sectionParents) {
    const id = question.questionId;
    const sectionId = questionParents.get(id);
    if (sectionId) {
        question.parents = [{ sectionId }];
        updateQuestionSectionDependency(question.parents, sectionId, questionParents, sectionParents);
    }
};

module.exports = class SurveyQuestionsDAO {
    constructor() {}

    listSurveyQuestions(surveyId, addDependency) {
        const options = {
            where: { surveyId },
            raw: true,
            attributes: ['questionId', 'required'],
            order: 'line'
        };
        return SurveyQuestion.findAll(options)
            .then(questions => {
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
                attributes: ['id', 'type', 'parentId', 'parentQuestionId']
            })
            .then(sections => {
                if (!sections.length) {
                    return questions;
                }
                const ids = sections.map(({ id }) => id);
                return SurveySectionQuestion.findAll({
                        where: { surveySectionId: { $in: ids } },
                        raw: true,
                        order: 'line',
                        attributes: ['surveySectionId', 'questionId']
                    })
                    .then(sectionQuestions => {
                        const sectionParents = sections.reduce((r, section) => {
                            if (section.parentId) {
                                r.set(section.id, { sectionId: section.parentId });
                                return r;
                            }
                            if (section.parentQuestionId) {
                                r.set(section.id, { questionId: section.parentQuestionId });
                                return r;
                            }
                            return r;
                        }, new Map());
                        const questionParents = sectionQuestions.reduce((r, sectionQuestion) => {
                            r.set(sectionQuestion.questionId, sectionQuestion.surveySectionId);
                            return r;
                        }, new Map());
                        questions.forEach(question => {
                            updateQuestionDependency(question, questionParents, sectionParents);
                        });
                        return questions;
                    });
            });
    }
};
