'use strict';

const makeMapById = function (objects) {
    return objects.reduce((r, object) => {
        const id = object.id;
        if (id) {
            r[id] = object;
        }
        return r;
    }, {});
};

const findPatchsRemoved = function (objects, patchObjectMap) {
    return objects.reduce((r, { id }) => {
        if (!patchObjectMap[id]) {
            r.push(id);
        }
        return r;
    }, []);
};

const findPatchsMatched = function (objects, patchObjectMap) {
    return objects.reduce((r, object) => {
        const id = object.id;
        const patch = patchObjectMap[id];
        if (patch) {
            r.push({ patch, object });
        }
        return r;
    }, []);
};

const compareToPatches = function (objects, patches) {
    const patchObjectMap = makeMapById(patches);
    const removed = findPatchsRemoved(objects, patchObjectMap);
    const matches = findPatchsMatched(objects, patchObjectMap);
    return { removed, matches };
};

module.exports = {
    makeMapById,
    compareToPatches,
};
