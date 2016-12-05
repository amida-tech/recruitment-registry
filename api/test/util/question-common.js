'use strict';

const scopeToFieldsMap = {
    'summary': ['id', 'type', 'text', 'instruction'],
    'complete': null,
    'export': ['id', 'type', 'text', 'instruction', 'choices']
};

module.exports = {
	getFieldsForList(scope) {
		scope = scope || 'summary';
		return scopeToFieldsMap[scope];
	}
};
