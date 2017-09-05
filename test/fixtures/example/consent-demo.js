'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const consentTypes = [{
    name: 'terms-of-use',
    title: 'Terms of Use',
    type: 'single',
}, {
    name: 'consent',
    title: 'Consent Form',
    type: 'single',
}];

const consentDocuments = [{
    typeByName: 'terms-of-use',
    content: 'This is a terms of use document.',
}, {
    typeByName: 'consent',
    content: 'This is a document.',
}];

const consents = [{
    name: 'terms-of-use',
    sectionsByName: ['terms-of-use'],
}, {
    name: 'consent',
    sectionsByName: ['consent'],
}];

module.exports = {
    consentTypes,
    consentDocuments,
    consents,
};
