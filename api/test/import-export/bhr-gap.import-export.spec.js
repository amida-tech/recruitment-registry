/* global before,xdescribe,it*/
'use strict';
process.env.NODE_ENV = 'test';

const fs = require('fs');
const path = require('path');

const models = require('../../models');
const db = require('../../models/db');

const bhrGapImport = require('../../import/bhr-gap');
const bhrSurveys = require('../../import/bhr-gap-surveys');

const CSVConverterExport = require('../../export/csv-converter');

const SharedSpec = require('../util/shared-spec.js');

const comparator = require('../util/comparator');

const shared = new SharedSpec();

xdescribe('bhr gap import-export', function () {
    const fixtureDir = '/Work/BHR_GAP-2016.12.09';
    const outputDir = path.join(__dirname, '../generated');

    const store = {
        surveyMap: null
    };

    before(shared.setUpFn());

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
                        ignoreSurveyIdentifier: true
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

    it('create subjects file', function () {
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

    it('import subjects answers', function () {
        const query = 'copy answer (user_id, survey_id, question_id, question_choice_id, value, language_code) from \'/Work/git/recruitment-registry/api/test/generated/bhrsubjects.csv\' csv header';
        return db.sequelize.query(query);
    });
});
