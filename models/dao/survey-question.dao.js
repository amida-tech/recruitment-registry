'use strict';

const Sequelize = require('sequelize');
const Base = require('./base');

const Op = Sequelize.Op;

const updateQuestionSectionDependency = function (parents, id, questionParents, sectionParents) {
    const { sectionId, parentId, questionParentId } = sectionParents.get(id);
    parents.push({ sectionId });
    if (parentId) {
        updateQuestionSectionDependency(parents, parentId, questionParents, sectionParents);
    }
    if (questionParentId) {
        parents.push({ questionId: questionParentId });
        const parentId2 = questionParents.get(questionParentId);
        if (parentId2) {
            updateQuestionSectionDependency(parents, parentId2, questionParents, sectionParents);
        }
    }
};

const updateQuestionDependency = function (question, questionParents, sectionParents) {
    const id = question.questionId;
    const parentId = questionParents.get(id);
    if (parentId) {
        const parents = [];
        question.parents = parents; // eslint-disable-line no-param-reassign
        updateQuestionSectionDependency(parents, parentId, questionParents, sectionParents);
    }
};

module.exports = class SurveyQuestionsDAO extends Base {
    constructor(db, dependencies) {
        super(db);
        Object.assign(this, dependencies);
    }

    listSurveyQuestions(surveyId, addDependency) {
        const options = {
            where: { surveyId },
            raw: true,
            attributes: ['questionId', 'required'],
            order: ['line'],
        };
        return this.db.SurveyQuestion.findAll(options)
            .then((questions) => {
                if (addDependency) {
                    return this.addDependency(surveyId, questions);
                }
                return questions;
            });
    }

    createSurveyQuestionsTx({ surveyId, questions }, transaction) {
        const records = questions.map(({ id: questionId, required }, line) => {
            const record = { surveyId, questionId, required: Boolean(required), line };
            return record;
        });
        return this.db.SurveyQuestion.bulkCreate(records, { transaction });
    }

    addDependency(surveyId, questions) {
        return this.db.SurveySection.findAll({
            where: { surveyId },
            raw: true,
            order: ['line'],
            attributes: ['id', 'sectionId', 'parentId', 'parentQuestionId'],
        })
            .then((sections) => {
                if (!sections.length) {
                    return questions;
                }
                const ids = sections.map(({ id }) => id);
                return this.db.SurveySectionQuestion.findAll({
                    where: { surveySectionId: { [Op.in]: ids } },
                    raw: true,
                    order: ['line'],
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

    importSurveyQuestionsTx(surveyQuestions, transaction) {
        return this.db.SurveyQuestion.bulkCreate(surveyQuestions, { transaction });
    }
};
