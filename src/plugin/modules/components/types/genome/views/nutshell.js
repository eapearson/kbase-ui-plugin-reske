define([
    'bluebird',
    'knockout-plus',
    'kb_common/html',
    'kb_common/jsonRpc/dynamicServiceClient',
    '../../common',
    'bootstrap',
    'css!font_awesome'
], function (
    Promise,
    ko,
    html,
    DynamicServiceClient,
    common
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        table = t('table'),
        select = t('select'),
        option = t('option'),
        thead = t('thead'),
        tbody = t('tbody'),
        tr = t('tr'),
        th = t('th'),
        td = t('td');

    function viewModel(params) {
        var runtime = params.runtime;

        var kbaseGenomeId = ko.observable();
        var dnaLength = ko.observable();
        var contigCount = ko.observable();
        var gcContent = ko.observable();
        // var featureCounts = ko.observable();
        var featureCount = ko.observable();
        var taxonomy = ko.observableArray();

        var fetching = ko.observable(false);

        // OOPS get summary is only support for GenomeAnnotation not Genome.
        // function fetchData() {
        //     fetching(true);
        //     var client = new DynamicServiceClient({
        //         url: runtime.config('services.service_wizard.url'),
        //         token: runtime.service('session').getAuthToken(),
        //         module: 'GenomeAnnotationAPI'
        //     });
        //     client.callFunc('get_summary', [{
        //             ref: params.item.meta.ids.ref
        //                 // genomes: [{ ref: params.item.meta.ids.ref }],
        //                 // included_fields: ['id', 'dna_size', 'contig_lengths', 'gc_content', 'features']
        //         }])
        //         .spread(function (data) {
        //             // var genome = result.genomes[0];
        //             // console.log('result', genome);
        //             dnaLength(data.dna_size);
        //             contigCount(data.num_contigs);
        //             gcContent(data.gc_content);
        //             featureCounts(Object.keys(data.feature_type_counts).map(function (type) {
        //                 return {
        //                     type: type,
        //                     count: data.feature_type_counts[type]
        //                 };
        //             }));
        //             // kbaseGenomeId(data.id);
        //         })
        //         .finally(function () {
        //             fetching(false);
        //         });
        // }

        function fetchData() {
            fetching(true);
            return Promise.try(function () {
                    featureCount(params.item.genome.featureCount);
                    taxonomy(params.item.genome.taxonomy);
                })
                .finally(function () {
                    fetching(false);
                });
        }

        fetchData();

        return {
            kbaseGenomeId: kbaseGenomeId,
            // dnaLength: dnaLength,
            // contigCount: contigCount,
            // gcContent: gcContent,
            // featureCounts: featureCounts,
            taxonomy: taxonomy,
            featureCount: featureCount,
            fetching: fetching
        };
    }

    function buildNutshell() {
        return table({
            class: '-table '
        }, [
            // tr([
            //     th('KBase Genome Id'),
            //     td({
            //         dataBind: {
            //             text: 'kbaseGenomeId'
            //         }
            //     })
            // ]),
            // tr([
            //     th('DNA Length'),
            //     td({
            //         dataBind: {
            //             typedText: {
            //                 value: 'dnaLength',
            //                 type: '"number"',
            //                 format: '"0,0"'
            //             }
            //         }
            //     })
            // ]),
            // tr([
            //     th('Contig Count '),
            //     td({
            //         dataBind: {
            //             typedText: {
            //                 value: 'contigCount',
            //                 type: '"number"',
            //                 format: '"0,0"'
            //             }
            //         }
            //     })
            // ]),
            // tr([
            //     th('GC Content'),
            //     td({
            //         dataBind: {
            //             typedText: {
            //                 value: 'gcContent',
            //                 type: '"number"',
            //                 format: '"0%"'
            //             }
            //         }
            //     })
            // ]),
            tr([
                th('Feature Count'),
                td({
                    dataBind: {
                        typedText: {
                            value: 'featureCount',
                            type: '"number"',
                            format: '"0,0"'
                        }
                    }
                })
            ]),
            tr([
                th('Taxonomy'),
                td(
                    [
                        '<!-- ko if: taxonomy().length === 0 -->',
                        '-',
                        '<!-- /ko -->',
                        '<!-- ko if: taxonomy().length > 0 -->',
                        select({
                            class: 'form-control',
                            style: {
                                backgroundColor: 'transparent',
                                backgroundImage: 'none',
                                '-webkit-appearance': 'none',
                                disabled: true,
                                readonly: true
                            },
                            dataBind: {
                                foreach: 'taxonomy'
                            }
                        }, option({
                            disabled: true,
                            dataBind: {
                                value: '$data',
                                text: '$data',
                                attr: {
                                    selected: '$index() === 0 ? "selected" : false'
                                }
                            }
                        })),
                        '<!-- /ko -->'
                    ]
                )
            ]),
            // td(table({
            //     type: 'table'
            // }, [
            //     thead(tr([
            //         th('type'),
            //         th('count')
            //     ])),
            //     tbody({
            //         dataBind: {
            //             foreach: 'featureCounts'
            //         }
            //     }, tr([
            //         td({
            //             dataBind: {
            //                 text: 'type'
            //             }
            //         }),
            //         td({
            //             dataBind: {
            //                 text: 'count'
            //             }
            //         })
            //     ]))
            // ]))
        ]);
    }

    function template() {
        return div([
            '<!-- ko if: fetching -->',
            html.loading('Loading genome stats...'),
            '<!-- /ko -->',
            '<!-- ko ifnot: fetching -->',
            buildNutshell(),
            '<!-- /ko -->'
        ]);
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }

    return component;
});