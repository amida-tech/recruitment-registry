'use strict';

module.exports = class RRSupertest {
    constructor() {
        this.store = {
            server: null,
            auth: null
        };
        this.baseUrl = '/api/v1.0/';
    }
};
