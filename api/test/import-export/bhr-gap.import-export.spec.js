/* global before,xdescribe,it,it*/
'use strict';
process.env.NODE_ENV = 'test';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const models = require('../../models');
const SPromise = require('../../lib/promise');

const bhrGapImport = require('../../import/bhr-gap');
const bhrGapExport = require('../../export/bhr-gap');

const CSVConverterImport = require('../../import/csv-converter');
const CSVConverterExport = require('../../export/csv-converter');

const SharedSpec = require('../util/shared-spec.js');

const comparator = require('../util/comparator');

const enumerations = require('../../import/bhr-gap/enumerations.js');
const surveys = require('../../import/bhr-gap/bhr-gap-surveys');

const shared = new SharedSpec();

xdescribe('bhr gap import-export', function () {
    const fixtureDir = '/Work/BHR_GAP-2016.12.09';
    const outputDir = path.join(__dirname, '../generated');

    const store = {
        surveyMap: null,
        answerIdentifierMap: null
    };

    before(shared.setUpFn());

    it('load all enumerations', function () {
        return models.enumeration.createEnumerations(enumerations)
            .then(() => models.enumeration.listEnumerations())
            .then(enumerations => {
                const promises = enumerations.map(({ id }) => models.enumeration.getEnumeration(id));
                return SPromise.all(promises).then(result => comparator.updateEnumerationMap(result));
            });
    });

    it('load all surveys', function () {
        return models.macro.createSurveys(surveys);
    });

    it('survey identifier map', function () {
        return models.surveyIdentifier.getIdsBySurveyIdentifier('bhr-gap')
            .then(map => store.surveyMap = map);
    });

    surveys.forEach(bhrSurvey => {
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

    it('import users', function () {
        const filepath = path.join(fixtureDir, 'Subjects.csv');
        return bhrGapImport.importSubjects(filepath);
    });

    it('export subject answer', function () {
        const filepath = path.join(outputDir, 'Subjects_exported.csv');
        return bhrGapExport.writeSubjectsData(filepath, 'SubjectCode')
            .then(({ rows, columns }) => {
                const exportConverter = new CSVConverterExport({ fields: columns });
                const filepath = path.join(fixtureDir, 'Subjects.csv');
                const converter = new CSVConverterImport({ checkType: false, ignoreEmpty: true });
                return converter.fileToRecords(filepath)
                    .then(result => {
                        result = _.sortBy(result, 'SubjectCode');
                        return result;
                    })
                    .then(result => {
                        const filepath = path.join(outputDir, 'Subjects_original.csv');
                        fs.writeFileSync(filepath, exportConverter.dataToCSV(result));
                    });

            });
    });

    const transformTableDataFn = function (columIdentifier, filebase) {
        return function () {
            const filepath = path.join(fixtureDir, `${filebase}.csv`);
            const outputFilepath = path.join(outputDir, `${filebase}-trans.csv`);
            return bhrGapImport.transformSurveyFile(filepath, columIdentifier, outputFilepath);
        };
    };

    const importTableDataFn = function (tableIdentifier, filebase) {
        return function () {
            const transFile = path.join(outputDir, `${filebase}-trans.csv`);
            return bhrGapImport.importTransformedSurveyFile(tableIdentifier, transFile);
        };
    };

    const exportTableDataFn = function (surveyType, answerType, filenamebase) {
        return function () {
            const filepath = path.join(outputDir, `${filenamebase}_exported.csv`);
            return bhrGapExport.writeTableData(surveyType, answerType, filepath, ['SubjectCode', 'Timepoint'])
                .then(({ columns }) => {
                    const exportConverter = new CSVConverterExport({ fields: columns });
                    const filepath = path.join(fixtureDir, `${filenamebase}.csv`);
                    const converter = new CSVConverterImport({ checkType: false, ignoreEmpty: true });
                    return converter.fileToRecords(filepath)
                        .then(result => {
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
        it(`transform ${filebase}`, transformTableDataFn(columIdentifier, filebase));
        it(`import ${filebase}`, importTableDataFn(tableIdentifier, filebase));
        it(`export ${filebase}`, exportTableDataFn(tableIdentifier, columIdentifier, filebase));
    };

    //BHRGAPTable('CurrentMedications', 'current-medications', 'bhr-gap-current-meds-column');
    //BHRGAPTable('Demographics', 'demographics', 'bhr-gap-demographics-column');
    //BHRGAPTable('Diet', 'diet', 'bhr-gap-diet-column');
    BHRGAPTable('EarlyHistory', 'early-history', 'bhr-gap-early-history-column');
    //BHRGAPTable('EverydayCognition', 'everyday-cognition', 'bhr-gap-everyday-cognition-column');
    //BHRGAPTable('FamilyTree', 'family-tree', 'bhr-gap-family-tree-column');
    //BHRGAPTable('Initial_m00', 'initial-m00', 'bhr-gap-initial-m00-column');
    //BHRGAPTable('Initial_m06', 'initial-m06', 'bhr-gap-initial-m06-column');
    //BHRGAPTable('Initial_m12', 'initial-m12', 'bhr-gap-initial-m12-column');
    //BHRGAPTable('Initial_m18', 'initial-m18', 'bhr-gap-initial-m18-column');
    //BHRGAPTable('Initial_m24', 'initial-m24', 'bhr-gap-initial-m24-column');
    //BHRGAPTable('MedicalHistory', 'medical-history', 'bhr-gap-medical-history-column');
    //BHRGAPTable('Mood', 'mood', 'bhr-gap-mood-column');
    //BHRGAPTable('OSUTBI_Impacts', 'osutbi-impacts', 'bhr-gap-osutbi-impacts-column');
    //BHRGAPTable('OSUTBI_Injuries', 'osutbi-injuries', 'bhr-gap-osutbi-injuries-column');
    //BHRGAPTable('OSUTBI', 'osutbi', 'bhr-gap-osutbi-column');
    //BHRGAPTable('QualityOfLife', 'quality-of-life', 'bhr-gap-quality-of-life-column');
    //BHRGAPTable('Sleep', 'sleep', 'bhr-gap-sleep-column');
    //BHRGAPTable('Rivermead', 'rivermead', 'bhr-gap-rivermead-column');
    //BHRGAPTable('QUOLIBRI', 'quolibri', 'bhr-gap-quolibri-column');
    //BHRGAPTable('NCPT_GoNoGo', 'ncpt-gonogo', 'bhr-gap-ncpt-gonogo-column');
    //BHRGAPTable('NCPT_MemorySpan', 'ncpt-memoryspan', 'bhr-gap-ncpt-memoryspan-column');
    //BHRGAPTable('NCPT_Overall', 'ncpt-overall', 'bhr-gap-ncpt-overall-column');
    //BHRGAPTable('NCPT_ReverseMemorySpan', 'ncpt-reversememoryspan', 'bhr-gap-ncpt-reversememoryspan-column');
    //BHRGAPTable('NCPT_TrailMakingB', 'ncpt-trailmakingb', 'bhr-gap-ncpt-trailmakingb-column');
    //BHRGAPTable('MemTrax', 'memtrax', 'bhr-gap-memtrax-column');
});
