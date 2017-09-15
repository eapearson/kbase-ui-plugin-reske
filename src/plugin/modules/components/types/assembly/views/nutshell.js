define([
    'knockout-plus',
    'kb_common/html',
    'kb_common/jsonRpc/dynamicServiceClient',
    '../../common',
    'bootstrap',
    'css!font_awesome'
], function (
    ko,
    html,
    DynamicServiceClient,
    common
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td');

    function viewModel(params) {
        var runtime = params.runtime;

        var kbaseGenomeId = ko.observable();
        var dnaLength = ko.observable();
        var contigCount = ko.observable();
        var gcContent = ko.observable();
        var featureCount = ko.observable();

        var fetching = ko.observable(false);

        function fetchData() {
            fetching(true);
            var client = new DynamicServiceClient({
                url: runtime.config('services.service_wizard.url'),
                token: runtime.service('session').getAuthToken(),
                module: 'GenomeAnnotationAPI'
            });
            client.callFunc('get_genome_v1', [{
                    genomes: [{ ref: params.item.meta.ids.ref }],
                    included_fields: ['id', 'dna_size', 'contig_lengths', 'gc_content', 'features']
                }])
                .spread(function (result) {
                    var genome = result.genomes[0];
                    // console.log('result', genome);
                    dnaLength(genome.data.dna_size);
                    contigCount(genome.data.contig_lengths.length);
                    gcContent(genome.data.gc_content);
                    featureCount(genome.data.features.length);
                    kbaseGenomeId(genome.data.id);
                })
                .finally(function () {
                    fetching(false);
                });
        }

        fetchData();

        return {
            kbaseGenomeId: kbaseGenomeId,
            dnaLength: dnaLength,
            contigCount: contigCount,
            gcContent: gcContent,
            featureCount: featureCount,
            fetching: fetching
        };
    }

    function buildNutshell() {
        return table({
            class: '-table '
        }, [
            tr([
                th('KBase Genome Id'),
                td({
                    dataBind: {
                        text: 'kbaseGenomeId'
                    }
                })
            ]),
            tr([
                th('DNA Length'),
                td({
                    dataBind: {
                        numberText: 'dnaLength',
                        numberFormat: '"0,0"'
                    }
                })
            ]),
            tr([
                th('Contig Count '),
                td({
                    dataBind: {
                        numberText: 'contigCount',
                        numberFormat: '"0,0"'
                    }
                })
            ]),
            tr([
                th('GC Content'),
                td({
                    dataBind: {
                        numberText: 'gcContent',
                        numberFormat: '"0%"'
                    }
                })
            ]),
            tr([
                th('Feature Count'),
                td({
                    dataBind: {
                        numberText: 'featureCount',
                        numberFormat: '"0,0"'
                    }
                })
            ])
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