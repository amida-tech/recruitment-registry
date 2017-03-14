'use strict';

const SPromise = require('../../lib/promise');
const zipUtil = require('../../lib/zip-util');

const attributes = ['id', 'name', 'url', 'street', 'city', 'state', 'zip'];

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

module.exports = class ResearchSiteDAO {
    constructor(db) {
        this.db = db;
    }

    createResearchSite(researchSite) {
        const ResearchSite = this.db.ResearchSite;
        formatResearchSite(researchSite);
        return this.db.sequelize
                .transaction(transaction => ResearchSite.create(researchSite, { transaction })
                .then(({ id }) => zipUtil.findVicinity(researchSite.zip)
                        .then(vicinity => (
                            this.createResearchSiteVicinityTx(id, vicinity, transaction)
                        ))
                        .then(() => ({ id }))));
    }

    listResearchSites(options = {}) {
        const zip = formatZip(options.nearZip);
        const ResearchSite = this.db.ResearchSite;
        const ResearchSiteVicinity = this.db.ResearchSiteVicinity;
        if (options.nearZip) {
            return ResearchSiteVicinity.findAll({
                raw: true,
                where: { zip },
                attributes: [],
                order: 'research_site_id',
                include: [{ model: ResearchSite, as: 'vicinity', attributes }],
            })
                .then(sites => sites.map(site => attributes.reduce((r, attribute) => {
                    const patch = {};
                    patch[attribute] = site[`vicinity.${attribute}`];
                    return Object.assign({}, patch, r);
                }, {})));
        }
        return ResearchSite.findAll({ raw: true, attributes, order: 'id' });
    }

    patchResearchSite(id, researchSiteUpdate) {
        formatResearchSite(researchSiteUpdate);
        const ResearchSite = this.db.ResearchSite;
        return this.db.sequelize.transaction(transaction => (
                    ResearchSite.update(researchSiteUpdate, { where: { id }, transaction })
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
        const ResearchSite = this.db.ResearchSite;
        const ResearchSiteVicinity = this.db.ResearchSiteVicinity;
        return this.db.sequelize.transaction(transaction => (
            ResearchSite
                .destroy({ where: { id }, transaction })
                .then(() => (
                    ResearchSiteVicinity.destroy({ where: { researchSiteId: id }, transaction })
                ))
        ));
    }

    getResearchSite(id) {
        const ResearchSite = this.db.ResearchSite;
        return ResearchSite.findById(id, { raw: true, attributes });
    }

    createResearchSiteVicinityTx(researchSiteId, vicinity, transaction) {
        const ResearchSiteVicinity = this.db.ResearchSiteVicinity;
        return ResearchSiteVicinity.destroy({ where: { researchSiteId }, transaction })
            .then(() => {
                if (vicinity.length) {
                    const promises = vicinity
                        .map(formatZip)
                        .map(zip => (
                            ResearchSiteVicinity.create({ zip, researchSiteId }, { transaction })
                        ));
                    return SPromise.all(promises);
                }
                return null;
            });
    }

    createResearchSiteVicinity(researchSiteId, vicinity) {
        return this.db.sequelize.transaction(transaction => (
            this.createResearchSiteVicinityTx(researchSiteId, vicinity, transaction)
        ));
    }
};
