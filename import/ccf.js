'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const _ = require('lodash');
const intoStream = require('into-stream');

const SPromise = require('../lib/promise');
const RRError = require('../lib/rr-error');

const XLSXConverter = require('./xlsx-converter');

const models = require('../models');

const headers = {
    number: 'id',
    'objectId (Hash Tag Used for Questions)': 'key',
    question: 'text',
    instruction: 'instruction',
    'skipCount (Number of Questions Skipped if Contitional answer is picked)': 'skipCount',
    answerType: 'type',
    'conditional (Answer Hash Tag used with skipCount to skip next question if certain answer is picked)': 'condition',
    answer: 'choice',
    'hash (Hash Tag Used for Answers)': 'answerKey',
    tag: 'tag',
    toggle: 'toggle',
};

const identifierType = 'ccf';

const converters = {
    answers() {
        return new XLSXConverter({
            dateTimes: ['updated_at'],
        });
    },
    assessments() {
        return new XLSXConverter({
            dateTimes: ['updated_at'],
        });
    },
    surveys() {
        return new XLSXConverter({
            sheets: [{
                name: 'Questions',
            }, {
                name: 'Pillars',
            }],
        });
    },
};

const answerUpdateSingle = function (line, question) {
    question.answerKey = line.answerKey;
    question.tag = line.tag;
};

const answerUpdateChoice = function (line, question, choices) {
    if (!question.choices) {
        question.choices = [];
    }
    const choice = {
        id: choices.length + 1,
        value: line.choice,
    };
    if (line.toggle) {
        choice.toggle = line.toggle;
    }
    choice.answerKey = line.answerKey;
    if (question.condition === choice.answerKey) {
        question.skipValue = choice.id;
    }
    choice.tag = line.tag;
    question.choices.push(choice.id);
    choices.push(choice);
};

const answerUpdate = {
    1: answerUpdateChoice,
    2: answerUpdateChoice,
    3: answerUpdateChoice,
    4: answerUpdateChoice,
    5: answerUpdateSingle,
    7: answerUpdateChoice,
    8: answerUpdateChoice,
    9: answerUpdateChoice,
    10: answerUpdateChoice,
};

const questionTypes = {
    5: 'zip',
    10: ['month', 'day', 'year'],
    2: 'choice',
    3: 'choice',
    7: 'choice',
    4: 'choices',
    8: ['integer'],
    9: ['integer', 'integer'],
};

const surveysPost = function (fileData) {
    fileData.Questions = fileData.Questions.map(row => Object.keys(row).reduce((r, key) => {
        const newKey = headers[key] || key;
        const value = row[key];
        r[newKey] = value;
        return r;
    }, {}));
    const surveysTitleIndex = _.keyBy(fileData.Pillars, 'title');
    fileData.Pillars.forEach((pillar) => { pillar.isBHI = (pillar.isBHI === 'true'); });
    if (!(fileData.Pillars && surveysTitleIndex)) {
        throw new Error('Pillar records have to be read before questions.');
    }
    let activePillar = null;
    let activeQuestion = null;
    const questions = [];
    const choices = [];
    fileData.Questions.forEach((line) => {
        const objKeys = Object.keys(line);
        if ((objKeys.length === 1) && (objKeys[0] === 'id')) {
            const title = line.id;
            activePillar = surveysTitleIndex[title];
            if (!activePillar) {
                throw new Error(`Unknown pillar: ${title}`);
            }
            activePillar.questions = [];
            return;
        }
        if (!activePillar) {
            throw new Error('Unexpected line.  Pillar title expected');
        }
        if (line.key) {
            activeQuestion = {
                id: questions.length + 1,
                key: line.key,
                text: line.text,
                instruction: line.instruction || '',
                type: line.type,
            };
            if (Object.prototype.hasOwnProperty.call(activeQuestion, 'type')) {
                activeQuestion.type = parseInt(activeQuestion.type, 10);
            }
            if (line.condition) {
                activeQuestion.condition = line.condition;
                activeQuestion.skipCount = line.skipCount;
            }
            activePillar.questions.push(activeQuestion);
            questions.push(activeQuestion);
        }
        if (!activeQuestion) {
            throw new Error('Unexpected line. Question key expected');
        }
        const fnAnswer = answerUpdate[activeQuestion.type];
        if (fnAnswer) {
            fnAnswer(line, activeQuestion, choices);
            return;
        }
        throw new Error(`Unexpected line.  Unsupported type: ${activeQuestion.type}`);
    });
    return { choices, pillars: fileData.Pillars, questions };
};

const answersPost = function (fileData) {
    fileData.forEach((r) => {
        if (r.string_value === 'null') {
            delete r.string_value;
        }
        if (r.boolean_value === 'null') {
            delete r.boolean_value;
        }
    });

    const answers = [];
    const indexAnswers = {};
    const assessmentIndex = {};
    const jsonByAssessment = _.groupBy(fileData, 'hb_assessment_id');
    const assessments = Object.keys(jsonByAssessment);
    assessments.forEach((assessment, assessIndex) => {
        const current = jsonByAssessment[assessment];
        jsonByAssessment[assessment] = current.reduce((r, p) => {
            delete p.hb_assessment_id;
            const index = `${p.pillar_hash}\t${p.hb_user_id}\t${p.updated_at}`;
            if (assessmentIndex[index] !== undefined && assessmentIndex[index] !== assessIndex) {
                const record = indexAnswers[index];
                record.assessments[assessment] = true;
                return r;
            }
            assessmentIndex[index] = assessIndex;
            let record = indexAnswers[index];
            if (!record) {
                record = {
                    user_id: p.hb_user_id,
                    pillar_hash: p.pillar_hash,
                    updated_at: p.updated_at,
                    answers: [],
                    assessments: {
                        [assessment]: true,
                    },
                };
                answers.push(record);
                indexAnswers[index] = record;
            }
            const answer = { answer_hash: p.answer_hash };
            if (Object.prototype.hasOwnProperty.call(p, 'string_value')) {
                answer.string_value = p.string_value;
            } else if (Object.prototype.hasOwnProperty.call(p, 'boolean_value')) {
                answer.boolean_value = p.boolean_value;
            }
            record.answers.push(answer);
            return r;
        }, []);
    });
    return { answers, assesmentAnswers: jsonByAssessment };
};

const postActions = {
    answers: answersPost,
    surveys: surveysPost,
};

const importFiles = function (filepaths) {
    const result = {};
    const keys = ['surveys', 'assessments', 'answers'];
    const promises = keys.map((key) => {
        const filepath = filepaths[key];
        const converter = converters[key]();
        return converter.fileToRecords(filepath)
            .then((json) => {
                const fn = postActions[key];
                if (fn) {
                    Object.assign(result, fn(json));
                } else {
                    result[key] = json;
                }
            });
    });
    return SPromise.all(promises)
        .then(() => result);
};

const updateChoiceLines = function (lines, question, questionType, choiceMap) {
    const id = question.id;
    const { text, instruction = '', key } = question;
    let questionInfo = `${questionType},"${text}","${instruction}",${key}`;
    question.choices.forEach((choiceId) => {
        const { value, toggle = '', answerKey, tag } = choiceMap.get(choiceId);
        const choiceType = '';
        const choiceInfo = `${choiceId},"${value}",${choiceType},${answerKey},${tag},${toggle}`;
        const line = `${id},${questionInfo},${choiceInfo}`;
        lines.push(line);
        questionInfo = ',,,';
    });
};

const updateMultiQuestionLines = function (lines, question, questionType, choiceMap) {
    const id = question.id;
    question.choices.forEach((choiceId, index) => {
        const { value, answerKey, tag } = choiceMap.get(choiceId);
        const choiceType = questionType[index];
        let questionInfo = `${choiceType},"${value}",,`;
        const answerInfo = `${answerKey},${tag}`;
        const line = `${id}-${choiceId},${questionInfo},,,,${answerInfo}`;
        lines.push(line);
        questionInfo = ',,,';
    });
};

const updateSingleQuestionLine = function (lines, question, questionType) {
    const { id, text, instruction = '', key, answerKey, tag } = question;
    const questionInfo = `${questionType},"${text}","${instruction}",${key}`;
    const answerInfo = `${answerKey},${tag}`;
    const line = `${id},${questionInfo},,,,${answerInfo}`;
    lines.push(line);
};

const importQuestionsToDB = function ({ questions, choices }) {
    const choiceMap = new Map(choices.map(choice => [choice.id, choice]));
    const csv = questions.reduce((r, question) => {
        const questionType = questionTypes[question.type];
        if (questionType === 'choice' || questionType === 'choices') {
            updateChoiceLines(r, question, questionType, choiceMap);
            return r;
        }
        if (Array.isArray(questionType)) {
            updateMultiQuestionLines(r, question, questionType, choiceMap);
            return r;
        }
        updateSingleQuestionLine(r, question, questionType);
        return r;
    }, ['id,type,text,instruction,key,choiceId,choiceText,choiceType,answerKey,tag,toggle']);
    const options = { meta: [{ name: 'ccType', type: 'question' }, { name: 'toggle', type: 'choice' }], sourceType: identifierType };
    const stream = intoStream(csv.join('\n'));
    return models.question.importQuestions(stream, options);
};

const importSectionsToDB = function (jsonDB, rules, questionIdMap) {
    const sectionQuestionMap = new Map();
    const parentQuestionMap = new Map();
    let sectionId = 0;
    let parentSectionId;
    const sectionCsv = jsonDB.pillars.reduce((r, pillar) => {
        let skipCountIndex = 0;
        pillar.questions.forEach((question) => {
            if (skipCountIndex) {
                skipCountIndex -= 1;
            }
            if (!skipCountIndex) {
                parentSectionId = '';
            }
            sectionId += 1;
            if (question.type >= 8) {
                const line = `${sectionId},${question.text},${question.instruction},${question.type},${question.key}`;
                r.push(line);
            } else {
                const line = `${sectionId},,,${question.type},${question.key}`;
                r.push(line);
            }
            sectionQuestionMap.set(question.id, { sectionId, parentSectionId });
            if (question.skipCount) {
                sectionId += 1;
                const line = `${sectionId}`;
                r.push(line);
                parentQuestionMap.set(question.id, sectionId);
                parentSectionId = sectionId;
                skipCountIndex = question.skipCount + 1;
                const questionChoiceId = question.skipValue;
                const ruleId = rules.length;
                const rule = `${ruleId},${pillar.id},not-equals,${sectionId},${question.id},${questionChoiceId}`;
                rules.push(rule);
            }
        });
        return r;
    }, ['id,name,description,type,key']);
    const sectionStream = intoStream(sectionCsv.join('\n'));
    const sectionImportOptions = { meta: [{ name: 'type' }, { name: 'key' }] };
    return models.section.importSections(sectionStream, sectionImportOptions)
        .then(sectionIdMap => ({ questionIdMap, sectionIdMap, parentQuestionMap, sectionQuestionMap }));
};

const importSurveysToDb = function (jsonDB, rules, spec) {
    const { questionIdMap, sectionIdMap, parentQuestionMap, sectionQuestionMap } = spec;
    const surveysCsv = jsonDB.pillars.reduce((r, pillar) => {
        const { id, title, isBHI, maxScore, description } = pillar;
        let surveyInfo = `${title},${description},${isBHI},${maxScore}`;
        const required = 'true';
        pillar.questions.forEach((question) => {
            const questionId = question.id;
            const { sectionId, parentSectionId = '' } = sectionQuestionMap.get(questionId);
            if (question.type >= 8) {
                question.choices.forEach((choiceId) => {
                    const multiQuestionId = `${questionId}-${choiceId}`;
                    const line = `${id},${surveyInfo},,${parentSectionId},${sectionId},${multiQuestionId},${required}`;
                    r.push(line);
                });
            } else {
                const line = `${id},${surveyInfo},,${parentSectionId},${sectionId},${questionId},${required}`;
                r.push(line);
            }
            const conditionSectionId = parentQuestionMap.get(questionId);
            if (conditionSectionId) {
                const line = `${id},${surveyInfo},${questionId},,${conditionSectionId},,`;
                r.push(line);
            }
            surveyInfo = ',,,';
        });
        return r;
    }, ['id,name,description,isBHI,maxScore,parentQuestionId,parentSectionId,sectionId,questionId,required']);
    const stream = intoStream(surveysCsv.join('\n'));
    const meta = [{ name: 'isBHI', type: 'boolean' }, { name: 'maxScore', type: 'integer' }];
    const options = { meta, sourceType: identifierType };
    return models.survey.importSurveys(stream, { questionIdMap, sectionIdMap }, options)
        .then((surveyIdMap) => {
            const ruleStream = intoStream(rules.join('\n'));
            return models.answerRule.importAnswerRules(ruleStream, { sectionIdMap, questionIdMap, surveyIdMap })
                .then(() => surveyIdMap);
        });
};

const importToDb = function (jsonDB) {
    const rules = ['id,surveyId,logic,sectionId,answerQuestionId,questionChoiceId'];
    return importQuestionsToDB(jsonDB)
        .then(questionIdMap => importSectionsToDB(jsonDB, rules, questionIdMap))
        .then(spec => importSurveysToDb(jsonDB, rules, spec))
        .then(surveyIdMap => _.values(surveyIdMap).map(survey => ({ id: survey })))
        .then(surveys => models.assessment.createAssessment({ name: 'BHI', surveys }));
};

const toDbFormat = function (userId, surveyId, createdAt, answersByQuestionId) {
    const dbAnswers = answersByQuestionId.reduce((r, answer) => {
        const questionId = answer.questionId;
        const questionType = answer.questionType;
        if (questionType === 'choices') {
            answer.answers.forEach(({ questionChoiceId, questionChoiceType, value }) => {
                if (questionChoiceType === 'month') {
                    if (value.length === 1) {
                        value = `0${value}`;
                    }
                }
                r.push({ userId, surveyId, createdAt, questionId, questionChoiceId, value });
            });
            return r;
        }
        if (questionType === 'choice') {
            const questionChoiceId = answer.answers.reduce((p, a) => {
                if ((a.questionChoiceType !== 'bool') || (typeof a.value !== 'boolean')) {
                    throw new RRError('ccfInconsistentAnswerForType', 'choice', a.questionChoiceType);
                }
                if (!a.value) {
                    return p;
                }
                if (p !== null) {
                    throw new RRError('ccfMultipleSelectionsForChoice');
                }
                p = a.questionChoiceId;
                return p;
            }, null);
            if (questionChoiceId === null) {
                throw new RRError('ccfNoSelectionsForChoice');
            }
            r.push({ userId, surveyId, createdAt, questionId, questionChoiceId });
            return r;
        }
        let value = answer.answers[0].value;
        if (questionType === 'month') {
            if (value.length === 1) {
                value = `0${value}`;
            }
        }
        r.push({ userId, surveyId, createdAt, questionId, value });
        return r;
    }, []);
    return dbAnswers;
};

const importAnswersToDb = function (jsonDB, userIdMap) {
    return models.surveyIdentifier.getIdsBySurveyIdentifier(identifierType)
        .then(surveyIdMap => models.answerIdentifier.getTypeInformationByAnswerIdentifier(identifierType)
                .then(answerIdMap => ({ surveyIdMap, answerIdMap })))
        .then(({ surveyIdMap, answerIdMap }) => {
            let records = jsonDB.answers.map((answer) => {
                const surveyIdentifier = answer.pillar_hash;
                const surveyId = surveyIdMap.get(surveyIdentifier);
                const answerIndex = new Map();
                const createdAt = answer.updated_at;
                const answersByQuestionId = answer.answers.reduce((r, record) => {
                    const answerIdentifier = record.answer_hash;
                    const answerInfo = answerIdMap.get(answerIdentifier);
                    const questionId = answerInfo.questionId;
                    let dbAnswer = answerIndex.get(questionId);
                    if (!dbAnswer) {
                        dbAnswer = { questionId, questionType: answerInfo.questionType, answers: [] };
                        r.push(dbAnswer);
                        answerIndex.set(questionId, dbAnswer);
                    }
                    const answer2 = {};
                    if (answerInfo.questionChoiceId) {
                        answer2.questionChoiceId = answerInfo.questionChoiceId;
                        answer2.questionChoiceType = answerInfo.questionChoiceType;
                    }
                    if (Object.prototype.hasOwnProperty.call(record, 'string_value')) {
                        answer2.value = record.string_value.toString();
                    } else if (Object.prototype.hasOwnProperty.call(record, 'boolean_value')) {
                        answer2.value = record.boolean_value;
                    }
                    dbAnswer.answers.push(answer2);
                    return r;
                }, []);
                const userId = userIdMap.get(answer.user_id);
                const dbAnswers = toDbFormat(userId, surveyId, createdAt, answersByQuestionId);
                return dbAnswers;
            });
            let overallIndex = 0;
            records.forEach((record, index) => {
                const assessmentSet = jsonDB.answers[index].assessments;
                const endIndex = overallIndex + record.length;
                jsonDB.assessments.forEach((assessment) => {
                    if (assessmentSet[assessment.id]) {
                        let answerIndices = assessment.answerIndices;
                        if (!answerIndices) {
                            answerIndices = [];
                            assessment.answerIndices = answerIndices;
                        }
                        _.range(overallIndex, endIndex).forEach((answerIndex) => {
                            answerIndices.push(answerIndex);
                        });
                    }
                });
                overallIndex = endIndex;
            });
            records = _.flatten(records);
            records.forEach((record) => {
                record.language = 'en';
            });
            return models.answer.importRecords(records)
                .then((ids) => {
                    const records2 = jsonDB.assessments.map((assessment, index, assessments) => {
                        const createdAt = assessment.updated_at;
                        const record = {
                            userId: userIdMap.get(assessment.hb_user_id),
                            assessmentId: 1,
                            version: index,
                            status: 'collected',
                            meta: {
                                key: assessment.assessment_id,
                            },
                            createdAt,
                            updatedAt: createdAt,
                        };
                        const nextIndex = index + 1;
                        if (nextIndex < assessments.length) {
                            record.deletedAt = assessments[nextIndex].updated_at;
                        }
                        record.answerIds = assessment.answerIndices.map(answerIndex => ids[answerIndex]);
                        return record;
                    });
                    return models.userAssessment.importBulk(records2);
                });
        });
};

const importUsers = function (filepath) {
    const converter = new XLSXConverter();
    return converter.fileToRecords(filepath)
        .then(users => users.map(({ id }) => id))
        .then(ids => models.user.importDummyUsers(ids));
};

const ImportFiles = function (filepaths) {
    return importUsers(filepaths.users)
        .then(userIdMap => importFiles(filepaths)
            .then(ccfData => importToDb(ccfData)
                .then(() => importAnswersToDb(ccfData, userIdMap)))
            .then(() => userIdMap));
};

module.exports = {
    converters,
    ImportFiles,
};
