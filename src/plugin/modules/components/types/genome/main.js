define([
    './browse'
], function () {
    'use strict';

    function normalize(object) {
        object['genome'] = {
            title: object.data.scientific_name || object.object_name,
            description: 'description here...',
            assemblyGuid: object.data.assembly_guid,
            domain: object.data.domain,
            featureCount: object.data.features,
            scientificName: object.data.scientific_name,
            taxonomy: object.data.taxonomy ? object.data.taxonomy.split(';').map(function (item) {
                return item.trim(' ');
            }).filter(function (item) {
                return (item.trim(' ').length !== 0);
            }) : []
        };
    }

    return {
        normalize: normalize
    };
});