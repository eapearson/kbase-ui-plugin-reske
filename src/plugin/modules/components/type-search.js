define([
    'knockout-plus',
    'numeral',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'kb_common/jsonRpc/genericClient',
    '../types',
    'css!./type-search.css'
], function (
    ko,
    numeral,
    html,
    bs,
    GenericClient,
    Types
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
        h2 = t('h2'),
        a = t('a'),
        form = t('form'),
        input = t('input');

    function searchTypes(runtime, searchTerm) {
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
                with_private: 1,
                with_public: 1
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

    function matchAllTypes(runtime) {
        var client = new GenericClient({
            url: runtime.config('services.reske.url'),
            module: 'KBaseRelationEngine',
            token: runtime.service('session').getAuthToken()
        });

        var param = self.searchTypesInput = {
            match_filter: {},
            access_filter: {
                with_private: 1,
                with_public: 1
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

    function searchResult(param) {
        return {
            type: param.type,
            title: param.title,
            hitCount: param.hitCount,
            count: param.count
        };
    }

    function viewModel(params) {
        var runtime = params.runtime;

        // VIEW ELEMENTS
        var searchInput = ko.observable().extend({
            throttle: 150
        });

        var searchError = ko.observable();

        var status = ko.observable();

        // populate the array with all types first.
        var searchResultsMap = {};
        var searchResults = ko.observableArray(Types.types.map(function (type) {
            var hitCount = ko.observable(0);
            var count = ko.pureComputed(function () {
                if (hitCount() > 0) {
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
        matchAllTypes(runtime)
            .then(function (result) {
                result.hits.forEach(function (result) {
                    var searchResult = searchResultsMap[result.type];
                    searchResult.totalAvailable(result.hitCount);
                });
                return null;
            });

        // ACTIONS
        var currentSearch;
        searchInput.subscribe(function (newValue) {
            // This supports the logic of just one search at a time.
            // If we caught the search in time the cancel will 
            // cause an abort in the request, which will inhibit the onload
            // from running.
            // Note, cancel call is synchronous, but the onCancel call in the 
            // promise is async. This means that the promise will immediately honor
            // the cancel and not invoke any methods on the promise (other than finally)
            // but in this case the connection will not be aborted until the async
            // handling of onCancel is called.
            // TODO: currently we have some cancellation login in here just to make 
            // sure this "promise" by bluebird is correct. A warning will be issued
            // to console if the "then" method is ever called after the promise was
            // cancelled.
            (function () {
                if (currentSearch) {
                    currentSearch.cancelled = true;
                    currentSearch.search.cancel();
                }
                currentSearch = {
                    cancelled: false,
                    search: null
                };
                var thisSearch = currentSearch;
                currentSearch.search = searchTypes(runtime, newValue)
                    .then(function (result) {
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
                    });
            }());

        });

        function doSearchDetails(data) {
            // console.log('show details for ', data);
            // just for now ...
            var query = {
                search: searchInput(),
                type: data.type
            };
            var url = '/#reske/object-search?' + Object.keys(query).map(function (key) {
                return [key, query[key]].map(encodeURIComponent).join('=');
            }).join('&');
            window.location = url;
        }

        return {
            searchInput: searchInput,
            searchResults: searchResults,
            searchError: searchError,
            doSearchDetails: doSearchDetails
        };
    }

    function template() {
        return div({
            class: 'container-fluid component-type-search'
        }, [
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-8 col-md-offset-2'
                }, [
                    h2({
                        style: {
                            textAlign: 'center'
                        }
                    }, 'RESKE Search')
                ])
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-8 col-md-offset-2'
                }, [
                    form({
                        class: 'form'
                    }, input({
                        dataBind: {
                            textInput: 'searchInput'
                        },
                        placeholder: 'Search KBase Data with RESKE Search!',
                        class: 'form-control'
                    }))
                ])
            ]),
            div({
                class: 'row'
            }, [

                div({
                    class: 'col-md-8 col-md-offset-2'
                }, [
                    div({
                        dataBind: {
                            text: 'searchError'
                        }
                    })
                ]),
                div({
                    class: 'col-md-8 col-md-offset-2'
                }, [
                    table({}, [
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
                            //'<!-- ko if: $data.hitCount() > 0 -->',
                            tr({
                                dataBind: {
                                    // style: {
                                    //     // fontWeight: '$data.hitCount > 0 ? "bold" : "normal"',
                                    //     color: '$data.hitCount > 0 ? "#000" : "#CCC"',
                                    //     backgroundColor: '$data.hitCount > 0 ? "#DDD" : "#FFF"'
                                    // },
                                    css: {
                                        'has-hits': '$data.hitCount() > 0'
                                    }
                                }
                            }, [
                                td({
                                    dataBind: {
                                        text: 'title'
                                    }
                                }),
                                td(div({
                                    style: {
                                        width: '10em',
                                        textAlign: 'right'
                                    }
                                }, [
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
                                            fontFamily: 'monospace',
                                            fontWeight: 'bold'
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
                            // '<!-- /ko -->',
                            '<!-- /ko -->'
                        ])
                    ])
                ]),
            ])
        ]);
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }
    ko.components.register('reske-type-search', component());
});