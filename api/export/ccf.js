'use strict';

const _ = require('lodash');

const models = require('../models');
const SPromise = require('../lib/promise');

const cId = 'number';
const cHash = 'objectId (Hash Tag Used for Questions)';
const cConditional = 'conditional (Answer Hash Tag used with skipCount to skip next question if certain answer is picked)';
const cAnswerHash = 'hash (Hash Tag Used for Answers)';
const cSkipCount = 'skipCount (Number of Questions Skipped if Contitional answer is picked)';
const cAnswerKey = 'hash (Hash Tag Used for Answers)';

const convertQuestions = function (pillars, questions, choices, answers) {
    const pillarsResult = _.cloneDeep(pillars);
    pillarsResult.forEach(pillar => delete pillar.questions);
    pillarsResult.forEach(pillar => pillar.isBHI = pillar.isBHI ? 'true' : 'false');
    const questionMap = new Map(questions.map(qx => [qx.id, qx]));
    const choiceMap = new Map(choices.map(choice => [choice.id, choice]));
    const answerMap = new Map(answers.map(answer => {
        let key = answer.questionId;
        if (answer.choice) {
            key = key += ':' + answer.choice;
        }
        return [key, answer];
    }));
    const result = [];
    let questionIndex = 1;
    pillars.forEach(pillar => {
        result.push({
            [cId]: pillar.title
        });
        pillar.questions.forEach(({ questionId, skipCount, condition }) => {
            const question = questionMap.get(questionId);
            let current = {
                [cId]: questionIndex ? questionIndex.toString() : questionIndex,
                [cHash]: question.key,
                question: question.text,
                answerType: question.type ? question.type.toString() : question.type
            };
            if (question.instruction) {
                current.instruction = question.instruction;
            }
            if (skipCount) {
                current[cSkipCount] = skipCount;
                current[cConditional] = condition;
            }
            if (question.choices) {
                question.choices.forEach(choiceId => {
                    const choice = choiceMap.get(choiceId);
                    const key = question.id + ':' + choice.id;
                    const answer = answerMap.get(key);
                    current.answer = choice.value;
                    if (choice.toggle) {
                        current.toggle = choice.toggle;
                    }
                    if (answer) {
                        current.tag = answer.tag;
                        current[cAnswerKey] = answer.key;
                    }
                    result.push(current);
                    current = {};
                });
            } else {
                const answer = answerMap.get(question.id);
                if (answer) {
                    current.tag = answer.tag;
                    current[cAnswerKey] = answer.key;
                    if (answer.toggle) {
                        current.toggle = answer.toggle;
                    }
                }
                result.push(current);
            }
            ++questionIndex;
        });
    });
    return { Questions: result, Pillars: pillarsResult };
};

const answerKey = function (answer) {
    return answer.user_id + ':' + answer.pillar_hash;
};

const answersJson = function (jsonDB) {
    const result = [];
    const assessments = jsonDB.assessments.map((assessment, index, all) => {
        const deletedAt = all[index + 1] ? all[index + 1].updated_at : null;
        return Object.assign({ deleted_at: deletedAt }, assessment);
    });

    assessments.forEach(assessment => {
        const answersActiveIndex = {};
        let activeIndex = 0;
        const answers = jsonDB.answers.reduce((r, answer) => {
            if (!assessment.deleted_at || (assessment.deleted_at > answer.updated_at)) {
                r.push(answer);
                answersActiveIndex[answerKey(answer)] = activeIndex;
                ++activeIndex;
            }
            return r;
        }, []);
        answers.forEach((answer, index) => {
            if (index !== answersActiveIndex[answerKey(answer)]) {
                return;
            }
            const common = {
                pillar_hash: answer.pillar_hash,
                hb_user_id: answer.user_id,
                updated_at: answer.updated_at,
                hb_assessment_id: assessment.id
            };
            answer.answers.forEach(a => {
                const r = Object.assign({
                    answer_hash: a.answer_hash,
                    boolean_value: (a.boolean_value === undefined ? 'null' : a.boolean_value),
                    string_value: (a.string_value === undefined ? 'null' : a.string_value)
                }, common);
                result.push(r);
            });
        });
    });
    return result;
};

const convertJsonDB = function convertJsonDB(jsonDB) {
    const surveys = convertQuestions(jsonDB.pillars, jsonDB.questions, jsonDB.choices, jsonDB.qanswers);
    return {
        answers: answersJson(jsonDB),
        surveys
    };
};

const exportSurveys = function () {
    return models.survey.listSurveys({ scope: 'id-only' })
        .then(ids => SPromise.all(ids.map(id => models.survey.getSurvey(id))))
        .then(surveys => {
            const ids = surveys.reduce((r, survey) => {
                survey.questions.forEach(question => r.push(question.id));
                return r;
            }, []);
            return models.questionIdentifier.getQuestionIdToIdentifierMap('cc', ids)
                .then(questionIdentifierMap => {
                    return models.answerIdentifier.getAnswerIdsToIdentifierMap('cc')
                        .then(answerIdentifierMap => ({ surveys, questionIdentifierMap, answerIdentifierMap }));
                });
        })
        .then(({ surveys, questionIdentifierMap, answerIdentifierMap }) => {
            let index = 0;
            const exportedQuestions = surveys.reduce((r, survey) => {
                r.push({ number: survey.name });
                survey.questions.forEach(question => {
                    ++index;
                    let line = {
                        number: index.toString(),
                        question: question.text,
                        [cHash]: questionIdentifierMap[question.id]
                    };
                    const instruction = question.instruction;
                    if (instruction) {
                        line.instruction = instruction;
                    }
                    const skip = question.skip;
                    if (skip) {
                        line[cSkipCount] = skip.count;
                        line[cConditional] = answerIdentifierMap[question.id + ':' + skip.rule.answer.choice].identifier;
                    }
                    const meta = question.meta;
                    if (meta) {
                        const answerType = meta.ccType;
                        if (answerType) {
                            line.answerType = answerType.toString();
                        }
                    }
                    const choices = question.choices;
                    if (!choices) {
                        const { identifier, tag } = answerIdentifierMap[question.id];
                        line[cAnswerHash] = identifier;
                        line.tag = tag;
                        r.push(line);
                        return;
                    }
                    const toggleQuestion = choices.find(({ type }) => (type === 'bool-sole'));
                    choices.forEach(choice => {
                        line.answer = choice.text;
                        const { identifier, tag } = answerIdentifierMap[question.id + ':' + choice.id];
                        line[cAnswerHash] = identifier;
                        line.tag = tag;
                        if (toggleQuestion) {
                            line.toggle = (choice.type === 'bool-sole' ? 'checkalloff' : 'checkthis');
                        }
                        r.push(line);
                        line = {};
                    });
                });
                return r;
            }, []);
            const exportedSurveys = surveys.reduce((r, survey) => {
                const meta = survey.meta;
                r.push({
                    id: meta.id,
                    isBHI: meta.isBHI ? 'true' : 'false',
                    maxScore: meta.maxScore,
                    title: survey.name
                });
                return r;
            }, []);
            return { questions: exportedQuestions, pillars: exportedSurveys };
        });
};

module.exports = {
    convertJsonDB,
    exportSurveys
};
