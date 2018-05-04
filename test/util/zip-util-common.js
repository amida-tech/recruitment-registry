'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

// valid US zip codes
const exampleZips = {
    20001: ['20001', '21001', '23002', '22003', '20010', '20020', '20030'],
    20002: ['20002', '23001', '24002', '23003', '21010', '20030', '20050'],
    20003: ['20003', '24001', '25002', '24003', '24010', '20030', '20050'],
    20004: ['20004', '28001', '28002', '25003', '27010', '20040', '20030'],
    20005: ['20005', '29001', '29002', '24003', '28010', '21040', '21030'],
};

const exampleZipsWithRangeOfOneMile = {
    10001: [
        '10001', '10199', '10156', '10018', '10117', '10116', '10119', '10123',
        '10122', '10121', '10087', '10060', '10157', '10138', '10036', '10120',
        '10109', '10011', '10118', '10113', '10185', '10129', '10124', '10108',
        '10114', '10110', '10101', '10102', '10175', '10020',
    ],
    20001: [
        '20001', '20060', '20005', '20059', '20055', '20538', '20056', '20417',
        '20223', '20572', '20507', '20268', '20239', '20548', '20527', '20529',
        '20081', '20424', '20422', '20401', '20071', '20573', '20211', '20426',
        '20535',
    ],
    90001: [
        '90001', '90052',
    ],
};

const getSampleData = function (generator, index, hasRangeOfOneMile) {
    const possibleZips = Object.keys(exampleZips);
    const zip = possibleZips[(index || 0) % possibleZips.length];
    // eslint-disable-next-line  no-nested-ternary
    const vicinity = hasRangeOfOneMile
        ? (exampleZips[zip] ? exampleZips[zip] : -1)
        : (exampleZipsWithRangeOfOneMile[zip] ? exampleZipsWithRangeOfOneMile[zip] : -1);
    const apiResponse = {
        results: vicinity.map(generator.newZipCodeApiObject.bind(generator)),
    };

    // api response with 250 results
    const fullZips = [...Array(250)].map((val, idx) => vicinity[idx % vicinity.length]);
    const fullApiResponse = {
        results: fullZips.map(generator.newZipCodeApiObject.bind(generator)),
    };
    return { zip, vicinity, apiResponse, fullApiResponse };
};

module.exports = {
    exampleZips,
    exampleZipsWithRangeOfOneMile,
    getSampleData,
};
