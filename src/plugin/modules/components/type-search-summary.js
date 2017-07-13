define([
    'bluebird',
    'knockout-plus',
    'numeral',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'kb_common/jsonRpc/genericClient',
    '../types',
    './browser',
    'css!./type-search-summary.css'
], function (
    Promise,
    ko,
    numeral,
    html,
    bs,
    GenericClient,
    Types,
    Browser
) {
    'use strict';
    var t = html.tag,
        div = t('div'),
        span = t('span'),
        table = t('table'),
        colgroup = t('colgroup'),
        col = t('col'),
        thead = t('thead'),
        tbody = t('tbody'),
        tr = t('tr'),
        th = t('th'),
        td = t('td'),
        a = t('a');

    function viewModel(params1) {
        // var runtime = params.runtime;

        // var searchResultsMap = params.searchResultsMap;

        var params = params1.searchVM;

        var searchResults = params.searchResults;
        var searching = params.searching;
        var searchInput = params.searchInput;
        var withPrivateData = params.withPrivateData;
        var withPublicData = params.withPublicData;

        var resultsColumnLabel = ko.pureComputed(function () {
            if (searching()) {
                return 'Searching...';
            }
            if (!searchInput() || searchInput().length === 0) {
                return 'No Search';
            }
            return 'Found';
        });

        function doShowDetail(data, event, context) {
            var typeDef = Types.typesMap[data.type];
            var tabDef = {
                label: typeDef.label,
                closable: true,
                active: true,
                component: {
                    name: 'reske/browser',
                    params: {
                        hostedVM: 'hostedVM',
                        tabVM: {
                            type: data.type
                        }
                    }
                }
            };
            context.addTab(tabDef);
        }

        return {
            searchInput: searchInput,
            withPublicData: withPublicData,
            withPrivatData: withPrivateData,
            searchResults: searchResults,
            resultsColumnLabel: resultsColumnLabel,
            searching: searching,
            doShowDetail: doShowDetail
        };
    }

    function template() {
        return div({
            class: 'component-type-search-summary'
        }, table({}, [
            colgroup([
                col({
                    style: {
                        width: '80%',
                        textAlign: 'left'
                    }
                }),
                col({
                    style: {
                        width: '10%',
                    }
                }),
                col({
                    style: {
                        width: '10%',
                    }
                })
            ]),
            thead([
                tr([
                    th('Type'),
                    th(div({
                        style: {
                            width: '10em',
                            textAlign: 'right'
                        },
                        dataBind: {
                            text: 'resultsColumnLabel'
                        }
                    }, 'Found')),
                    th(div({
                        style: {
                            width: '10em',
                            textAlign: 'right'
                        }
                    }, 'Available'))
                ])
            ]),
            tbody([
                '<!-- ko foreach: searchResults -->',
                tr({
                    dataBind: {
                        css: {
                            'has-hits': '$data.hitCount() > 0'
                        },
                        click: 'function (data, event) {if ($data.hitCount() > 0) {$component.doShowDetail(data, event, $parents[2]);}}'
                    }
                }, [
                    td(span({
                        dataBind: {
                            text: 'title',
                        }
                    })),
                    td(div({
                        style: {
                            width: '10em',
                            textAlign: 'right'
                        }
                    }, [
                        '<!-- ko if: hitCount() === null -->',
                        span({
                            dataBind: {
                                text: 'count'
                            },
                            style: {
                                fontFamily: 'monospace'
                            }
                        }),
                        '<!-- /ko -->',
                        '<!-- ko if: hitCount() > 0 -->',
                        a({
                            dataBind: {
                                click: '$component.doSearchDetails'
                            }
                        }, span({
                            dataBind: {
                                text: 'count'
                            },
                            style: {
                                fontFamily: 'monospace',
                                fontWeight: 'bold'
                            }
                        })),
                        '<!-- /ko -->',
                        '<!-- ko if: hitCount() === 0 -->',
                        span({
                            dataBind: {
                                text: 'count'
                            },
                            style: {
                                fontFamily: 'monospace'
                            }
                        }),
                        '<!-- /ko -->'
                    ])),
                    td([
                        div({
                            style: {
                                width: '10em',
                                textAlign: 'right'
                            }
                        }, span({
                            dataBind: {
                                html: 'available'
                            },
                            style: {
                                fontFamily: 'monospace'
                            }
                        }))
                    ])
                ]),
                '<!-- /ko -->'
            ])
        ]));
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }
    ko.components.register('reske/type-search/summary', component());
});