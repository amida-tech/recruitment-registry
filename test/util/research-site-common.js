'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const _ = require('lodash');

// see zip-util-common for valid US zipcodes
const zipCodeInformation = {
    20000: ['20000', '00001', '00002', '00003', '90010', '90020', '90030'],
    20001: ['20001', '01001', '01002', '01003', '90010', '90030', '90050'],
    20002: ['20002', '02001', '02002', '02003', '90010', '90030', '90050'],
    20003: ['20003', '03001', '03002', '03003', '90010', '90040', '90030'],
    20004: ['20004', '04001', '04002', '04003', '91010', '91040', '91030'],
    20005: ['20005', '05001', '05002', '05003', '91010', '91030', '91050'],
    20006: ['20006', '06001', '06002', '06003', '91010', '91030', '91050'],
    20007: ['20007', '07001', '07002', '07003', '91010', '91020', '91030'],
    20008: ['20008', '08001', '08002', '08003', '92010', '92020', '92030'],
    'M4B 1B4': ['M4B1B5', 'M4B1C7', 'M4B1C3'],
    M4B1E1: ['M4B1G5', 'M4B1J1'],
    20009: ['20009', '09001', '09002', '09003', '92010', '92030', '92050'],
    20010: ['20010', '10001', '10002', '10003', '92010', '92030', '92050'],
    20011: ['20011', '11001', '11002', '11003', '92010', '92020', '92030'],
    88888: ['80001', '80002'],
    M4B1B4: ['M4B1B5', 'M4B1C7', 'M4B1C3'],
};

const vicinityZipCodes = Object.keys(zipCodeInformation).reduce((r, vicinityZipCode) => {
    const zipCodes = zipCodeInformation[vicinityZipCode];
    const vicinities = {};
    zipCodes.forEach((zipCode) => {
        let vicinity = r[zipCode];
        if (!vicinity) {
            vicinity = [];
            vicinities[zipCode] = vicinity;
        }
        vicinity.push(vicinityZipCode);
    });
    return Object.assign({}, vicinities, r);
}, {});

const getResearchSiteZips = function () {
    return Object.keys(zipCodeInformation);
};

const findVicinity = function (zip) {
    return zipCodeInformation[zip];
};

const findNear = function (zip) {
    return vicinityZipCodes[zip];
};

module.exports = {
    getResearchSiteZips,
    vicinityZipCodes,
    findVicinity,
    findNear,
    exampleZipCodes: _.cloneDeep(['90010', '90020', '90030', '90040', '90050']),
};
