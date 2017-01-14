/* global before,describe,it,it,xit*/
'use strict';
process.env.NODE_ENV = 'test';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const models = require('../../models');
const db = require('../../models/db');
const SPromise = require('../../lib/promise');

const bhrGapImport = require('../../import/bhr-gap');
const bhrGapExport = require('../../export/bhr-gap');

const CSVConverterImport = require('../../import/csv-converter');
const CSVConverterExport = require('../../export/csv-converter');

const SharedSpec = require('../util/shared-spec.js');

const comparator = require('../util/comparator');

const shared = new SharedSpec();
const bhrSurveys = bhrGapImport.surveys;

describe('bhr gap import-export', function () {
    const fixtureDir = '/Work/BHR_GAP-2016.12.09';
    const outputDir = path.join(__dirname, '../generated');

    const store = {
        surveyMap: null,
        answerIdentifierMap: null
    };

    before(shared.setUpFn());

    it('load all enumerations', function () {
        return bhrGapImport.loadEnumerations()
            .then(() => models.enumeration.listEnumerations())
            .then(enumerations => {
                const promises = enumerations.map(({ id }) => models.enumeration.getEnumeration(id));
                return SPromise.all(promises).then(result => comparator.updateEnumerationMap(result));
            });
    });

    it('load all surveys', function () {
        return bhrGapImport.loadSurveys();
    });

    it('survey identifier map', function () {
        return models.surveyIdentifier.getIdsBySurveyIdentifier('bhr-gap')
            .then(map => store.surveyMap = map);
    });

    bhrSurveys.forEach(bhrSurvey => {
        it(`compare survey ${bhrSurvey.identifier.value}`, function () {
            const identifier = bhrSurvey.identifier.value;
            const surveyId = store.surveyMap.get(identifier);
            return models.survey.getSurvey(surveyId)
                .then(survey => {
                    const options = {
                        ignoreQuestionIdentifier: true,
                        ignoreSurveyIdentifier: true,
                        ignoreAnswerIdentifier: true
                    };
                    comparator.survey(bhrSurvey, survey, options);
                });
        });
    });

    let subjectsData;

    it('create user file', function () {
        const filepath = path.join(fixtureDir, 'Subjects.csv');
        const surveyId = store.surveyMap.get('subjects');
        return bhrGapImport.convertSubjects(filepath, surveyId)
            .then(result => {
                subjectsData = result;
                const userConverter = new CSVConverterExport({ fields: ['username', 'email', 'password', 'role'] });
                const userFilepath = path.join(outputDir, 'bhruser.csv');
                fs.writeFileSync(userFilepath, userConverter.dataToCSV(result.userRecords));
            });
    });

    const subjectMap = new Map();
    it('import users', function () {
        const query = 'copy registry_user (username, email, password, role) from \'/Work/git/recruitment-registry/api/test/generated/bhruser.csv\' csv header';
        return db.sequelize.query(query)
            .then(() => db.sequelize.query('select id, username from registry_user', { type: db.sequelize.QueryTypes.SELECT }))
            .then(users => users.forEach(({ id, username }) => subjectMap.set(username, id)));
    });

    xit('create subjects file', function () {
        const subjectAnswers = subjectsData.answerRecords.map(r => {
            r.user_id = subjectMap.get(r.username);
            delete r.username;
            r.language_code = 'en';
            return r;
        });
        const answerConverter = new CSVConverterExport({ fields: ['user_id', 'survey_id', 'question_id', 'question_choice_id', 'value', 'language_code'] });
        const answerFilepath = path.join(outputDir, 'bhrsubjects.csv');
        fs.writeFileSync(answerFilepath, answerConverter.dataToCSV(subjectAnswers));
    });

    xit('import subjects answers', function () {
        const query = 'copy answer (user_id, survey_id, question_id, question_choice_id, value, language_code) from \'/Work/git/recruitment-registry/api/test/generated/bhrsubjects.csv\' csv header';
        return db.sequelize.query(query);
    });

    const createTableFilesAndAssessmentsFn = function (filename, surveyType, answerType) {
        return function () {
            const filepath = path.join(fixtureDir, filename);
            const surveyId = store.surveyMap.get(surveyType);
            return bhrGapImport.convertFileToRecords(filepath, surveyId, subjectMap, answerType)
                .then(result => {
                    result.forEach(({ answers }, assessmentName) => {
                        if (answers && answers.length) {
                            const converter = new CSVConverterExport({ doubleQuotes: '""', fields: ['user_id', 'survey_id', 'question_id', 'question_choice_id', 'multiple_index', 'value', 'language_code'] });
                            const outfilepath = path.join(outputDir, `${surveyType}-${assessmentName}.csv`);
                            fs.writeFileSync(outfilepath, converter.dataToCSV(answers));
                        }
                    });
                    return result;
                })
                .then(result => {
                    store.assessmentMap = new Map();
                    const promises = [...result.keys()].map(assessmentName => {
                        const name = `${surveyType}-${assessmentName}`;
                        return models.assessment.createAssessment({ name, surveys: [{ id: surveyId }] })
                            .then(({ id }) => store.assessmentMap.set(name, id));
                    });
                    return SPromise.all(promises).then(() => result);
                })
                .then(result => {
                    result.forEach(({ userAssessments }, assessmentName) => {
                        const name = `${surveyType}-${assessmentName}`;
                        const assessment_id = store.assessmentMap.get(name);
                        userAssessments.forEach(userAssessment => {
                            userAssessment.assessment_id = assessment_id;
                            userAssessment.sequence = 1;
                        });
                        const converter = new CSVConverterExport({ doubleQuotes: '""', fields: ['user_id', 'assessment_id', 'sequence', 'status'] });
                        const outfilepath = path.join(outputDir, `${surveyType}-assessment-${assessmentName}.csv`);
                        fs.writeFileSync(outfilepath, converter.dataToCSV(userAssessments));
                    });
                });

        };
    };

    const importTableAssessmentsFn = function (surveyIdentifierType, assessmentName) {
        return function () {
            const filepath = path.join(outputDir, `${surveyIdentifierType}-assessment-${assessmentName}.csv`);
            if (fs.existsSync(filepath)) {
                const query = `copy user_assessment (user_id, assessment_id, sequence, status) from '${filepath}' csv header`;
                return db.sequelize.query(query);
            }
        };
    };

    const importTableAnswersFn = function (surveyIdentifierType, assessmentName) {
        return function () {
            const filepath = path.join(outputDir, `${surveyIdentifierType}-${assessmentName}.csv`);
            if (fs.existsSync(filepath)) {
                const query = 'select max(id) as lastid from answer';
                return db.sequelize.query(query, { type: db.sequelize.QueryTypes.SELECT })
                    .then(result => result[0].lastid)
                    .then(lastid => {
                        lastid = lastid || 0;
                        const query = `copy answer (user_id, survey_id, question_id, question_choice_id, multiple_index, value, language_code) from '${filepath}' csv header`;
                        return db.sequelize.query(query)
                            .then(() => {
                                const name = `${surveyIdentifierType}-${assessmentName}`;
                                const assessmentId = store.assessmentMap.get(name);
                                const insert = 'insert into user_assessment_answer (answer_id, user_assessment_id)';
                                const select = 'select answer.id as answer_id, user_assessment.id as user_assessment_id from answer, user_assessment';
                                const where = `where answer.id > ${lastid} and user_assessment.user_id = answer.user_id and user_assessment.assessment_id = ${assessmentId}`;
                                const query = `${insert} ${select} ${where}`;
                                return db.sequelize.query(query);
                            });
                    });
            }
        };
    };

    const exportTableDataFn = function (surveyType, answerType, filenamebase) {
        return function () {
            return bhrGapExport.exportTableData(surveyType, answerType)
                .then(({ columns, rows }) => {
                    const filepath = path.join(outputDir, `${filenamebase}_exported.csv`);
                    const converter = new CSVConverterExport({ fields: columns });
                    fs.writeFileSync(filepath, converter.dataToCSV(rows));
                    return converter;
                })
                .then(exportConverter => {
                    const filepath = path.join(fixtureDir, `${filenamebase}.csv`);
                    const converter = new CSVConverterImport({ checkType: false, ignoreEmpty: true });
                    return converter.fileToRecords(filepath)
                        .then(result => {
                            result = result.map(row => {
                                delete row.DaysAfterBaseLine;
                                delete row.Latest;
                                return row;
                            });
                            result = _.sortBy(result, ['SubjectCode', 'Timepoint']);
                            return result;
                        })
                        .then(result => {
                            const filepath = path.join(outputDir, `${filenamebase}_original.csv`);
                            fs.writeFileSync(filepath, exportConverter.dataToCSV(result));
                        });
                });
        };
    };

    const BHRGAPTable = (filebase, tableIdentifier, columIdentifier) => {
        const csvFilename = `${filebase}.csv`;
        it(`create ${filebase} files and assessments`, createTableFilesAndAssessmentsFn(csvFilename, tableIdentifier, columIdentifier));

        ['m00', 'm06', 'm12', 'm18', 'm24', 'm30'].map(assessmentName => {
            it(`import ${filebase} user assessments for assessment ${assessmentName}`, importTableAssessmentsFn(tableIdentifier, assessmentName));
            it(`import ${filebase} files for assessment ${assessmentName}`, importTableAnswersFn(tableIdentifier, assessmentName));
        });

        it(`export ${filebase}`, exportTableDataFn(tableIdentifier, columIdentifier, filebase));
    };


    BHRGAPTable('CurrentMedications', 'current-medications', 'bhr-gap-current-meds-column');
    BHRGAPTable('Demographics', 'demographics', 'bhr-gap-demographics-column');
    BHRGAPTable('Diet', 'diet', 'bhr-gap-diet-column');
    BHRGAPTable('EarlyHistory', 'early-history', 'bhr-gap-early-history-column');
    BHRGAPTable('EverydayCognition', 'everyday-cognition', 'bhr-gap-everyday-cognition-column');
    BHRGAPTable('FamilyTree', 'family-tree', 'bhr-gap-family-tree-column');
    BHRGAPTable('Initial_m00', 'initial-m00', 'bhr-gap-initial-m00-column');
    BHRGAPTable('Initial_m06', 'initial-m06', 'bhr-gap-initial-m06-column');
    BHRGAPTable('Initial_m12', 'initial-m12', 'bhr-gap-initial-m12-column');
    BHRGAPTable('Initial_m18', 'initial-m18', 'bhr-gap-initial-m18-column');
    BHRGAPTable('Initial_m24', 'initial-m24', 'bhr-gap-initial-m24-column');
    BHRGAPTable('MedicalHistory', 'medical-history', 'bhr-gap-medical-history-column');
    BHRGAPTable('Mood', 'mood', 'bhr-gap-mood-column');
    BHRGAPTable('OSUTBI_Impacts', 'osutbi-impacts', 'bhr-gap-osutbi-impacts-column');
    BHRGAPTable('OSUTBI_Injuries', 'osutbi-injuries', 'bhr-gap-osutbi-injuries-column');
    BHRGAPTable('OSUTBI', 'osutbi', 'bhr-gap-osutbi-column');
    BHRGAPTable('QualityOfLife', 'quality-of-life', 'bhr-gap-quality-of-life-column');
    BHRGAPTable('Sleep', 'sleep', 'bhr-gap-sleep-column');
    BHRGAPTable('Rivermead', 'rivermead', 'bhr-gap-rivermead-column');
    BHRGAPTable('QUOLIBRI', 'quolibri', 'bhr-gap-quolibri-column');
    BHRGAPTable('NCPT_GoNoGo', 'ncpt-gonogo', 'bhr-gap-ncpt-gonogo-column');
    BHRGAPTable('NCPT_MemorySpan', 'ncpt-memoryspan', 'bhr-gap-ncpt-memoryspan-column');
    BHRGAPTable('NCPT_Overall', 'ncpt-overall', 'bhr-gap-ncpt-overall-column');
    BHRGAPTable('NCPT_ReverseMemorySpan', 'ncpt-reversememoryspan', 'bhr-gap-ncpt-reversememoryspan-column');
    BHRGAPTable('NCPT_TrailMakingB', 'ncpt-trailmakingb', 'bhr-gap-ncpt-trailmakingb-column');
    BHRGAPTable('MemTrax', 'memtrax', 'bhr-gap-memtrax-column');
});
