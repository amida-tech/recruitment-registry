'use strict';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');

const expect = chai.expect;

class ConsentCommon {
    constructor(hxConsent, history, generator) {
        this.hxConsent = hxConsent;
        this.history = history;
        this.generator = generator;
    }

    createConsentFn(typeIndices) {
        const history = this.history;
        const hxConsent = this.hxConsent;
        const generator = this.generator;
        return function () {
            const sections = typeIndices.map(typeIndex => history.typeId(typeIndex));
            const clientConsent = generator.newConsent({ sections });
            return models.consent.createConsent(clientConsent)
                .then(result => hxConsent.pushWithId(clientConsent, result.id));
        };
    }

    verifyConsentFn(index) {
        const hxConsent = this.hxConsent;
        return function () {
            const expected = hxConsent.server(index);
            return models.consent.getConsent(expected.id)
                .then(consent => {
                    const expected = hxConsent.server(index);
                    expect(consent).to.deep.equal(expected);
                });
        };
    }

    formExpectedConsent(index, typeIndices, signatures) {
        const serverConsent = this.hxConsent.server(index);
        const expectedSections = typeIndices.map(typeIndex => {
            const consentDocument = _.cloneDeep(this.history.server(typeIndex));
            if (consentDocument === null) {
                return null;
            }
            const typeDetail = this.history.type(typeIndex);
            delete consentDocument.typeId;
            const section = Object.assign({}, typeDetail, consentDocument);
            if (signatures) {
                const sign = signatures[typeIndex];
                section.signature = Boolean(sign);
                if (sign) {
                    section.language = sign;
                }
            }
            return section;
        });
        const result = _.omit(serverConsent, 'typeIds');
        result.sections = expectedSections;
        return result;
    }

    formTranslatedExpectedConsent(index, typeIndices, signatures, language) {
        const serverConsent = this.hxConsent.server(index);
        const expectedSections = typeIndices.map(typeIndex => {
            const consentDocument = _.cloneDeep(this.history.translatedServer(typeIndex, language));
            if (consentDocument === null) {
                return null;
            }
            const typeDetail = this.history.translatedType(typeIndex, language);
            delete consentDocument.typeId;
            const section = Object.assign({}, typeDetail, consentDocument);
            if (signatures) {
                const sign = signatures[typeIndex];
                section.signature = Boolean(sign);
                if (sign) {
                    section.language = sign;
                }
            }
            return section;
        });
        const result = _.omit(serverConsent, 'typeIds');
        result.sections = expectedSections;
        return result;
    }
}

module.exports = ConsentCommon;
