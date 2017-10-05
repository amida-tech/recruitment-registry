'use strict';

const _ = require('lodash');

const Base = require('./base');
const zipUtil = require('../../lib/zip-util');

const attributes = ['id', 'name', 'phone', 'ext', 'phone2', 'ext2', 'url', 'street', 'street2', 'city', 'state', 'zip'];

const formatZip = function formatZip(zip) {
    return zip ? zip.replace(/ /g, '') : zip;
};
const formatResearchSite = function formatResearchSite(researchSite) {
    if (researchSite.zip) {
        const zip = formatZip(researchSite.zip);
        return Object.assign({}, { zip }, researchSite);
    }
    return researchSite;
};

module.exports = class ResearchSiteDAO extends Base {
    createResearchSite(researchSite) {
        formatResearchSite(researchSite);
        return this.transaction(transaction => this.db.ResearchSite.create(researchSite, { transaction }) // eslint-disable-line max-len
                .then(({ id }) => zipUtil.findVicinity(researchSite.zip)
                        .then(vicinity => (
                            this.createResearchSiteVicinityTx(id, vicinity, transaction)
                        ))
                        .then(() => ({ id }))));
    }

    listResearchSitesWithNulls(options = {}) {
        const zip = formatZip(options.nearZip);
        if (options.nearZip) {
            return this.db.ResearchSiteVicinity.findAll({
                raw: true,
                where: { zip },
                attributes: [],
                order: ['research_site_id'],
                include: [{ model: this.db.ResearchSite, as: 'vicinity', attributes }],
            })
                .then(sites => sites.map(site => attributes.reduce((r, attribute) => {
                    const patch = {};
                    patch[attribute] = site[`vicinity.${attribute}`];
                    return Object.assign({}, patch, r);
                }, {})));
        }
        return this.db.ResearchSite.findAll({ raw: true, attributes, order: ['id'] });
    }

    listResearchSites(options = {}) {
        return this.listResearchSitesWithNulls(options)
          .then(sites => sites.map(site => _.omitBy(site, _.isNil)));
    }

    patchResearchSite(id, researchSiteUpdate) {
        formatResearchSite(researchSiteUpdate);
        return this.transaction(transaction => (
                    this.db.ResearchSite.update(researchSiteUpdate, { where: { id }, transaction })
                )
                .then(() => {
                    const zip = researchSiteUpdate.zip;
                    if (zip) {
                        return zipUtil.findVicinity(zip).then(vicinity => (
                            this.createResearchSiteVicinityTx(id, vicinity, transaction)
                        ));
                    }
                    return null;
                }));
    }

    deleteResearchSite(id) {
        return this.transaction(transaction => (
            this.db.ResearchSite
                .destroy({ where: { id }, transaction })
                .then(() => (
                    this.db.ResearchSiteVicinity.destroy({ where: { researchSiteId: id }, transaction }) // eslint-disable-line max-len
                ))
        ));
    }

    getResearchSite(id) {
        return this.db.ResearchSite.findById(id, { raw: true, attributes })
            .then(researchSite => _.omitBy(researchSite, _.isNil));
    }

    createResearchSiteVicinityTx(researchSiteId, vicinity, transaction) {
        return this.db.ResearchSiteVicinity.destroy({ where: { researchSiteId }, transaction })
            .then(() => {
                if (vicinity.length) {
                    const records = vicinity.map(formatZip).map(zip => ({ zip, researchSiteId }));
                    return this.db.ResearchSiteVicinity.bulkCreate(records, { transaction });
                }
                return null;
            });
    }

    createResearchSiteVicinity(researchSiteId, vicinity) {
        return this.transaction(transaction => (
            this.createResearchSiteVicinityTx(researchSiteId, vicinity, transaction)
        ));
    }
};
