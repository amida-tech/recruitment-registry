'use strict';

const subjects = require('./subjects');
const currentMedications = require('./current-medications');
const demographics = require('./demographics');
const diet = require('./diet.js');
const earlyHistory = require('./early-history');
const everydayCognition = require('./everyday-cognition');
const familyTree = require('./family-tree');
const initialM00 = require('./initial-m00');
const initialM06 = require('./initial-m06');
const initialM12 = require('./initial-m12');
const initialM18 = require('./initial-m18');
const initialM24 = require('./initial-m24');
const medicalHistory = require('./medical-history');
const mood = require('./mood');
const memtrax = require('./memtrax');
const ncptGonogo = require('./ncpt-gonogo');
const ncptMemorySpan = require('./ncpt-memoryspan');
const ncptOverall = require('./ncpt-overall');
const ncptReverseMemorySpan = require('./ncpt-reversememoryspan');
const ncptTrailMakingb = require('./ncpt-trailmakingb');
const osutbiImpacts = require('./osutbi-impacts');
const osutbiInjuries = require('./osutbi-injuries');
const osutbi = require('./osutbi');
const qualityOfLife = require('./quality-of-life');
const quolibri = require('./quolibri');
const rivermead = require('./rivermead');
const sleep = require('./sleep');

module.exports = [
    subjects,
    currentMedications,
    demographics,
    diet,
    earlyHistory,
    everydayCognition,
    familyTree,
    initialM00,
    initialM06,
    initialM12,
    initialM18,
    initialM24,
    medicalHistory,
    mood,
    memtrax,
    ncptGonogo,
    ncptMemorySpan,
    ncptOverall,
    ncptReverseMemorySpan,
    ncptTrailMakingb,
    osutbiImpacts,
    osutbiInjuries,
    osutbi,
    qualityOfLife,
    quolibri,
    rivermead,
    sleep,
];
