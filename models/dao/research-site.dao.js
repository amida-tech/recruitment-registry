'use strict';

const db = require('../db');
const SPromise = require('../../lib/promise');
const zipUtil = require('../../lib/zip-util');

const ResearchSite = db.ResearchSite;
const ResearchSiteVicinity = db.ResearchSiteVicinity;

const attributes = ['id', 'name', 'url', 'street', 'city', 'state', 'zip'];

module.exports = class ResearchSiteDAO {
    constructor() {}

    createResearchSite(researchSite) {
        return db.sequelize.transaction(transaction => {
            return ResearchSite.create(researchSite, { transaction })
                .then(({ id }) => {
                    return zipUtil.findVicinity(researchSite.zip)
                        .then(vicinity => this.createResearchSiteVicinityTx(id, vicinity, transaction))
                        .then(() => ({ id }));
                });
        });
    }

    listResearchSites(options = {}) {
        const zip = options.nearZip;
        if (options.nearZip) {
            return ResearchSiteVicinity.findAll({
                    raw: true,
                    where: { zip },
                    attributes: [],
                    order: 'research_site_id',
                    include: [{ model: ResearchSite, as: 'vicinity', attributes }],
                })
                .then(sites => {
                    return sites.map(site => {
                        return attributes.reduce((r, attribute) => {
                            r[attribute] = site[`vicinity.${attribute}`];
                            return r;
                        }, {});
                    });
                });
        } else {
            return ResearchSite.findAll({ raw: true, attributes, order: 'id' });
        }
    }

    patchResearchSite(id, researchSiteUpdate) {
        return db.sequelize.transaction(transaction => {
            return ResearchSite.update(researchSiteUpdate, { where: { id }, transaction })
                .then(() => {
                    const zip = researchSiteUpdate.zip;
                    if (zip) {
                        return zipUtil.findVicinity(zip)
                            .then(vicinity => this.createResearchSiteVicinityTx(id, vicinity, transaction));
                    }
                });
        });
    }

    deleteResearchSite(id) {
        return db.sequelize.transaction(transaction => {
            return ResearchSite.destroy({ where: { id }, transaction })
                .then(() => ResearchSiteVicinity.destroy({ where: { researchSiteId: id }, transaction }));
        });
    }

    getResearchSite(id) {
        return ResearchSite.findById(id, { raw: true, attributes });
    }

    createResearchSiteVicinityTx(researchSiteId, vicinity, transaction) {
        return ResearchSiteVicinity.destroy({ where: { researchSiteId }, transaction })
            .then(() => {
                if (vicinity.length) {
                    const promises = vicinity.map(zip => ResearchSiteVicinity.create({ zip, researchSiteId }, { transaction }));
                    return SPromise.all(promises);
                }
            });
    }

    createResearchSiteVicinity(researchSiteId, vicinity) {
        return db.sequelize.transaction(transaction => {
            return this.createResearchSiteVicinityTx(researchSiteId, vicinity, transaction);
        });
    }
};
