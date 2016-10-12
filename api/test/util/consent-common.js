'use strict';

const _ = require('lodash');

class ConsentCommon {
    constructor(hxConsent, history) {
        this.hxConsent = hxConsent;
        this.history = history;
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
                section.signature = Boolean(signatures[typeIndex]);
            }
            return section;
        });
        let result = _.omit(serverConsent, 'typeIds');
        result.sections = expectedSections;
        return result;
    }
}

module.exports = ConsentCommon;
