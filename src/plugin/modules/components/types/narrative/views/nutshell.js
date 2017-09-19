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
        tr = t('tr'),
        th = t('th'),
        td = t('td');

    function viewModel(params) {
        var runtime = params.runtime;

        var cellCount = ko.observable();
        var appCellCount = ko.observable();
        var markdownCellCount = ko.observable();
        var codeCellCount = ko.observable();
        var dataObjectCount = ko.observable();

        var fetching = ko.observable(false);

        function fetchData() {
            fetching(true);
            return Promise.try(function () {
                    cellCount(params.item.narrative.cellCount);
                    appCellCount(params.item.narrative.appCellCount);
                    markdownCellCount(params.item.narrative.markdownCellCount);
                    codeCellCount(params.item.narrative.codeCellCount);
                    dataObjectCount(params.item.narrative.dataObjectCount);
                })
                .finally(function () {
                    fetching(false);
                });
            // var client = new DynamicServiceClient({
            //     url: runtime.config('services.service_wizard.url'),
            //     token: runtime.service('session').getAuthToken(),
            //     module: 'AssemblyAPI'
            // });
            // Promise.all([
            //         client.callFunc('get_stats', [
            //             params.item.meta.ids.ref
            //         ]).spread(function (stats) {
            //             return stats;
            //         }),
            //         client.callFunc('get_external_source_info', [
            //             params.item.meta.ids.ref
            //         ]).spread(function (result) {
            //             return result;
            //         })
            //     ])
            //     .spread(function (stats, sourceInfo) {
            //         dnaLength(stats.dna_size);
            //         contigCount(stats.num_contigs);
            //         gcContent(stats.gc_content);
            //         externalSource(sourceInfo.external_source);
            //         externalSourceId(sourceInfo.external_source_id);
            //         externalSourceOriginationDate(sourceInfo.external_source_origination_date);
            //     })
            //     .finally(function () {
            //         fetching(false);
            //     });
        }

        var error = ko.observable();

        fetchData()
            .catch(function (err) {
                error(err.message);
            });

        return {
            error: error,
            fetching: fetching,
            cellCount: cellCount,
            appCellCount: appCellCount,
            markdownCellCount: markdownCellCount,
            codeCellCount: codeCellCount,
            dataObjectCount: dataObjectCount
        };
    }

    function buildNutshell() {
        return table({
            class: '-table '
        }, [
            tr([
                th('App Cells'),
                td({
                    dataBind: {
                        numberText: 'appCellCount',
                        numberFormat: '"0,0"'
                    }
                })
            ]),
            tr([
                th('Code Cells'),
                td({
                    dataBind: {
                        numberText: 'codeCellCount',
                        numberFormat: '"0,0"'
                    }
                })
            ]),
            tr([
                th('Markdown Cells'),
                td({
                    dataBind: {
                        numberText: 'markdownCellCount',
                        numberFormat: '"0,0"'
                    }
                })
            ]),
            tr([
                th('Data Objects'),
                td({
                    dataBind: {
                        text: 'dataObjectCount() || "-"'
                    }
                })
            ])
        ]);
    }

    function template() {
        return div([
            '<!-- ko if: fetching -->',
            html.loading('Loading narrative stats...'),
            '<!-- /ko -->',
            '<!-- ko ifnot: fetching() || error() -->',
            buildNutshell(),
            '<!-- /ko -->',
            '<!-- ko if: error -->',
            div({
                dataBind: {
                    text: 'error'
                },
                style: {
                    color: 'red'
                }
            }),
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