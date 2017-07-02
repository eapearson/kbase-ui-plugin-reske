define([

], function () {
    'use strict';

    var objectTypes = [{
        id: 'narrative',
        resultId: 'Narrative',
        label: 'Narrative',
        typeKeys: ['cells', 'metadata'],
        searchKeys: [{
                key: 'title',
                label: 'Title',
                type: 'string'
            },
            {
                key: 'source',
                label: 'Source',
                type: 'string'
            },
            {
                key: 'code_output',
                label: 'Code Output',
                type: 'string'
            },
            {
                key: 'app_output',
                label: 'App Output',
                type: 'string'
            },
            {
                key: 'app_info',
                label: 'App Info',
                type: 'string'
            },
            {
                key: 'app_input',
                label: 'App Input',
                type: 'string'
            },
            {
                key: 'job_ids',
                label: 'Job Ids',
                type: 'string'
            },
        ]
    }, {
        id: 'genome',
        resultId: 'Genome',
        label: 'Genome',
        typeKeys: ['domain', 'features', 'id', 'scientific_name', 'taxonomy?'],
        searchKeys: [{
                key: 'id',
                label: 'ID',
                type: 'string'
            },
            {
                key: 'domain',
                label: 'Domain',
                type: 'string'
            },
            {
                key: 'taxonomy',
                label: 'Taxonomy',
                type: 'string'
            },
            {
                key: 'scientific_name',
                label: 'Scientific Name',
                type: 'string'
            },
            {
                key: 'features',
                label: 'Feature Count',
                type: 'integer'
            },
            // not sure about this, there are three indexing rules,
            // with different types...
            {
                key: 'assembly_guid',
                label: 'Assembly GUID',
                type: 'string'
            },
        ]
    }, {
        id: 'genomefeature',
        resultId: 'GenomeFeature',
        label: 'Genome Feature',
        typeKeys: ['aliases?', 'function?', 'id', 'location', 'protein_translation?', 'type'],
        searchKeys: [{
                key: 'id',
                label: 'ID',
                type: 'string'
            },
            {
                key: 'function',
                label: 'Function',
                type: 'string'
            },
            {
                key: 'aliases',
                label: 'Aliases',
                comment: 'list of string',
                type: 'string'
            },
            {
                key: 'contig_id',
                label: 'Contig ID',
                type: 'string'
            },
            // contig_guid is hidden
            {
                key: 'start',
                label: 'Start',
                type: 'integer'
            },
            {
                key: 'stop',
                label: 'Stop',
                type: 'integer'
            },
            {
                key: 'strand',
                label: 'Strand',
                type: 'string',
            },
            {
                key: 'feature_type',
                label: 'Feature Type',
                type: 'string'
            },
            {
                key: 'ontology_terms',
                label: 'Ontology Terms',
                type: 'string'
            },

            {
                key: 'genome_domain',
                label: 'Genome Domain',
                type: 'string'
            },
            {
                key: 'genome_taxonomy',
                label: 'Genome Taxonomy',
                type: 'string'
            },
            {
                key: 'genome_scientific_name',
                label: 'Genome Scientific Name',
                type: 'string'
            }
            // assembly_guid hidden
        ]
    }, {
        id: 'assembly',
        resultId: 'Assembly',
        label: 'Assembly',
        typeKeys: ['contigs', 'dna_size', 'external_source_id', 'gc_content', 'name'],
        searchKeys: [{
            key: 'contigs',
            label: 'Contigs',
            type: 'integer'
        }, {
            key: 'dna_size',
            label: 'DNA Size',
            type: 'integer'
        }, {
            key: 'external_source_id',
            label: 'External Source ID',
            type: 'string'
        }, {
            key: 'gc_content',
            label: 'GC Content',
            type: 'float'
        }, {
            key: 'name',
            label: 'Name',
            type: 'string'
        }]
    }, {
        id: 'assemblycontig',
        resultId: 'AssemblyContig',
        label: 'Assembly Contig',
        typeKeys: ['contig_id', 'description', 'gc_content', 'length'],
        searchKeys: [{
                key: 'contig_id',
                label: 'Contig Id',
                type: 'string'
            },
            {
                key: 'description',
                label: 'Description',
                type: 'string'
            },
            {
                key: 'gc_content',
                label: 'GC Content',
                type: 'float'
            },
            {
                key: 'length',
                label: 'Length',
                type: 'integer'
            }
        ]
    }, {
        id: 'pairedendlibrary',
        resultId: 'PairedEndLibrary',
        label: 'Paired End Library',
        typeKeys: ['insert_size_mean', 'lib1', 'sequencing_tech'],
        searchKeys: [{
                key: 'technology',
                label: 'Sequencing Technology',
                type: 'string'
            },
            {
                key: 'files',
                label: 'Files',
                type: 'string'
            },
            {
                key: 'phred_type',
                label: 'Phred Type',
                type: 'string'
            },
            {
                key: 'read_count',
                label: 'Read Count',
                type: 'integer'
            },
            {
                key: 'read_length',
                label: 'Mean Read Length',
                type: 'integer'
            },
            {
                key: 'insert_size',
                label: 'Mean Insert Size',
                type: 'integer'
            },
            {
                key: 'quality',
                label: 'float',
                type: 'Quality'
            },
            {
                key: 'gc_content',
                label: 'GC Content',
                type: 'float'
            }
        ]
    }, {
        id: 'singleendlibrary',
        resultId: 'SingleEndlibrary',
        label: 'Single End Library',
        searchKeys: [{
                key: 'technology',
                label: 'Sequencing Technology',
                type: 'string'
            },
            {
                key: 'files',
                label: 'Files',
                type: 'string'
            },
            {
                key: 'phred_type',
                label: 'Phred Type',
                type: 'string'
            },
            {
                key: 'read_count',
                label: 'Read Count',
                type: 'integer'
            },
            {
                key: 'read_length',
                label: 'Mean Read Length',
                type: 'integer'
            },
            {
                key: 'quality',
                label: 'float',
                type: 'Quality'
            },
            {
                key: 'gc_content',
                label: 'GC Content',
                type: 'float'
            }
        ]
    }];
    var objectTypeMap = {};
    objectTypes.forEach(function (type) {

        var searchKeysMap = {};
        type.searchKeys.forEach(function (searchKey) {
            searchKeysMap[searchKey.key] = searchKey;
        });
        type.searchKeysMap = searchKeysMap;

        objectTypeMap[type.id] = type;
    });

    return {
        types: objectTypes,
        typesMap: objectTypeMap
    };
});