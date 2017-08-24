define([
    'knockout-plus',
    'kb_common/html'
], function (
    ko,
    html
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        a = t('a'),
        span = t('span');

    function viewModel(params) {
        function doOpenNarrative(data) {
            var url = params.search.runtime.config('services.narrative.url');
            window.open(url + '/narrative/' + data.narrativeId, '_blank');
        }
        var columns = [{
                name: 'rowNumber',
                label: '#',
                type: 'integer',
                width: '5%',
                sort: {
                    direction: 'ascending'
                }
            },
            {
                name: 'title',
                label: 'Title',
                type: 'string',
                width: '50%',
                sort: {
                    direction: 'ascending'
                },
                action: doOpenNarrative
            },
            {
                name: 'timestamp',
                label: 'Timestamp',
                type: 'string',
                width: '25%',
                sort: {
                    direction: 'descending'
                }
            },
            // {
            //     name: 'cellCount',
            //     type: 'integer',
            //     width: '25%'
            // },
            {
                name: 'owner',
                label: 'Owner',
                type: 'string',
                width: '25%'
            }
        ];

        return {
            search: params.search,
            columns: columns,
            doOpenNarrative: doOpenNarrative
        };
    }

    function buildResultsTable() {
        return div({
            dataBind: {
                foreach: 'search.searchResults'
            }
        }, div({
            style: {
                border: '1px silver solid',
                padding: '4px'
            },
        }, [

            div({
                style: {
                    fontWeight: 'bold'
                }
            }, a({
                dataBind: {
                    text: 'title',
                    click: '$component.doOpenNarrative'
                }
            })),
            div({
                style: {
                    fontStyle: 'italic'
                },
                dataBind: {
                    text: 'timestamp'
                }
            }),
            div([
                '<!-- ko if: appCells.length > 0 -->',
                // 'app cells: ',
                span({
                    dataBind: {
                        foreach: 'appCells'
                    }
                }, [
                    span({
                        style: {
                            display: 'inline-block',
                            border: '1px silver solid',
                            backgroundColor: '#EEE',
                            padding: '6px',
                            margin: '3px'
                        },
                        dataBind: {
                            text: 'title'
                        }
                    }),
                    '<!-- ko if: $index() + 1 < $parent.appCells.length -->',
                    span({
                        class: 'fa fa-arrow-right'
                    }),
                    '<!-- /ko -->'
                ]),
                '<!-- /ko -->',
                '<!-- ko if: appCells.length === 0 -->',
                div({
                    style: {
                        fontStyle: 'italic',
                        color: '#DDD'
                    }
                }, 'no apps'),
                '<!-- /ko -->'
            ])
        ]));
    }

    function template() {
        return div({
            class: 'container-fluid'
        }, [
            buildResultsTable()
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