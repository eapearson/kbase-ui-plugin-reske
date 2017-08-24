define([
    'bluebird',
    'knockout-plus',
    'numeral',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'kb_common/jsonRpc/genericClient',
    '../../../types',
    './browser'
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


    function searchTypes(runtime, searchTerm, withPublic, withPrivate) {

        // With an empty search term, we simply reset the current search results.
        // The default behaviour would be to return all available items.
        if (!searchTerm || searchTerm.length === 0) {
            return Promise.try(function () {
                var hits = Types.types.map(function (type) {
                    return {
                        type: type.id,
                        title: type.label,
                        hitCount: null
                    };
                });
                return {
                    hits: hits,
                    elapsed: 0
                };
            });
        }

        var client = new GenericClient({
            url: runtime.config('services.reske.url'),
            module: 'KBaseRelationEngine',
            token: runtime.service('session').getAuthToken()
        });

        var param = self.searchTypesInput = {
            match_filter: {
                full_text_in_all: searchTerm
            },
            access_filter: {
                with_private: withPrivate ? 1 : 0,
                with_public: withPublic ? 1 : 0
            }
        };

        return client.callFunc('search_types', [param])
            .then(function (result) {
                var searchResult = result[0];
                var hits = Types.types.map(function (type) {
                    var hitCount = searchResult.type_to_count[type.resultId] || 0;
                    return {
                        type: type.id,
                        title: type.label,
                        hitCount: hitCount
                    };
                });
                return {
                    hits: hits,
                    elapsed: searchResult.search_time
                };
            });
    }

    function matchAllTypes(runtime, withPublic, withPrivate) {
        var client = new GenericClient({
            url: runtime.config('services.reske.url'),
            module: 'KBaseRelationEngine',
            token: runtime.service('session').getAuthToken()
        });

        var param = self.searchTypesInput = {
            match_filter: {},
            access_filter: {
                with_private: withPrivate ? 1 : 0,
                with_public: withPublic ? 1 : 0
            }
        };

        return client.callFunc('search_types', [param])
            .then(function (result) {
                var searchResult = result[0];
                var hits = Types.types.map(function (type) {
                    var hitCount = searchResult.type_to_count[type.resultId] || 0;
                    return {
                        type: type.id,
                        title: type.label,
                        hitCount: hitCount
                    };
                });
                return {
                    hits: hits,
                    elapsed: searchResult.search_time
                };
            });
    }

    function viewModel(params1) {
        var searchVM = params1.hostVM;
        var queryEngine = searchVM.QE;

        // var searchResults = params.searchResults;
        var searching = searchVM.searching;
        var searchInput = searchVM.searchInput;
        var withPrivateData = searchVM.withPrivateData;
        var withPublicData = searchVM.withPublicData;
        var bus = searchVM.bus;


        // populate the array with all types first.
        var searchResultsMap = {};
        var searchResults = ko.observableArray(Types.types.map(function (type) {
            var hitCount = ko.observable(null);
            var count = ko.pureComputed(function () {
                //if (hitCount() > 0) {
                if (typeof hitCount() === 'number') {
                    return numeral(hitCount()).format(0, 0);
                }
                return '-';
            });
            var totalAvailable = ko.observable();
            var available = ko.pureComputed(function () {
                if (totalAvailable() === undefined) {
                    return span({
                        style: {
                            fontSize: '50%'
                        }
                    }, html.loading());
                }
                return numeral(totalAvailable()).format(0, 0);
            });
            var searchResult = {
                type: type.id,
                uiId: type.uiId,
                title: type.label,
                hitCount: hitCount,
                count: count,
                totalAvailable: totalAvailable,
                available: available
            };
            searchResultsMap[type.id] = searchResult;
            return searchResult;
        }));

        // Get initial available types...
        function doSearchAll() {
            matchAllTypes(searchVM.runtime, searchPublicData(), searchPrivateData())
                .then(function (result) {
                    result.hits.forEach(function (result) {
                        var searchResult = searchResultsMap[result.type];
                        searchResult.totalAvailable(result.hitCount);
                    });
                    return null;
                });
        }
        doSearchAll();

        var currentSearch;

        function doSearch() {
            searching(true);
            // event('search-begin', 1);
            if (currentSearch) {
                currentSearch.cancelled = true;
                currentSearch.search.cancel();
                // event('auto-cancel', searchInput()); // TODO old input is what was cancelled
            }
            currentSearch = {
                cancelled: false,
                search: null
            };
            var thisSearch = currentSearch;

            // Do not run a search with an empty input?
            // event('search-starting', 1);
            // var start = new Date().getTime();
            currentSearch.search = searchTypes(runtime, searchInput(), searchPublicData(), searchPrivateData())
                .then(function (result) {
                    // timing('search-over-types', new Date().getTime() - start);
                    if (thisSearch.cancelled) {
                        console.warn('ignoring cancelled request');
                        return null;
                    }
                    result.hits.forEach(function (result) {
                        var searchResult = searchResultsMap[result.type];
                        searchResult.hitCount(result.hitCount);
                    });
                    return null;
                })
                .catch(function (err) {
                    status('error');
                    searchError(err.message);
                })
                .finally(function () {
                    if (thisSearch && thisSearch.search.isCancelled()) {
                        console.warn('search cancelled');
                    }
                    thisSearch = null;
                    currentSearch = null;
                    searching(false);
                });
        }

        function doSearchAgain() {
            doSearch();
        }


        // Flags for selecting public and private data
        // Each will also trigger a new search for all objects and for the 
        // current search (if any).
        var searchPublicData = ko.observable(true);
        searchPublicData.subscribe(function () {
            doSearchAll();
            doSearch();
        });

        var searchPrivateData = ko.observable(true);
        searchPrivateData.subscribe(function () {
            doSearchAll();
            doSearch();
        });


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
                        // hostedVM: 'hostedVM',
                        // tabVM: {
                        //     type: data.type
                        // }
                        type: data.type
                    }
                }
            };
            context.addTab(tabDef);
        }

        return {
            QE: queryEngine,
            searchInput: searchInput,
            withPublicData: withPublicData,
            withPrivatData: withPrivateData,
            searchResults: searchResults,
            resultsColumnLabel: resultsColumnLabel,
            searching: searching,
            doShowDetail: doShowDetail,
            bus: bus
        };
    }

    function template() {
        return div({
            class: 'component-type-search-summary',
            style: {
                width: '40em',
                margin: 'auto'
            }
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
    return component;
});