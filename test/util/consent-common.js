'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const _ = require('lodash');

class ConsentCommon {
    constructor(hxConsent, history, generator) {
        this.hxConsent = hxConsent;
        this.history = history;
        this.generator = generator;
    }

    formExpectedConsent(index, typeIndices, signatures) {
        const serverConsent = this.hxConsent.server(index);
        const expectedSections = typeIndices.map((typeIndex) => {
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
        const expectedSections = typeIndices.map((typeIndex) => {
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

    getSurveyConsentDocuments(documentInfo) {
        const documentIndices = documentInfo.map(info => (Array.isArray(info) ? info[1] : info));
        const consentIndices = documentInfo.map(info => (Array.isArray(info) ? info[0] : null));
        const result = this.history.serversInList(documentIndices);
        _.range(result.length).forEach((index) => {
            const consentIndex = consentIndices[index];
            if (consentIndex !== null) {
                const consent = this.hxConsent.server(consentIndex);
                result[index].consentId = consent.id;
                result[index].consentName = consent.name;
            }
        });
        return result;
    }
}

module.exports = ConsentCommon;
