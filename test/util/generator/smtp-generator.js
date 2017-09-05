'use strict';

module.exports = class SmtpGenerator {
    constructor() {
        this.index = -1;
    }

    newSmtp() {
        this.index = this.index + 1;
        const index = this.index;
        return {
            protocol: `protocol_${index}`,
            username: `username_${index}`,
            password: `password_${index}`,
            host: `host_${index}`,
            from: `from_${index}`,
            otherOptions: {
                key1: `key1_${index}`,
                key2: `key2_${index}`,
            },
        };
    }

    newSmtpText() {
        this.index = this.index + 1;
        const index = this.index;
        const actualLink = '${link}'; // eslint-disable-line no-template-curly-in-string
        return {
            subject: `subject_${index}`,
            content: `content_${index} with link:${actualLink}`,
        };
    }
};
