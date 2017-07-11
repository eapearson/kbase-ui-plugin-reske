define([
    'bluebird',
    'knockout-plus',
    'numeral',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'kb_common/jsonRpc/genericClient',
    '../types',
    './tabset',
    'css!./type-search.css'
], function (
    Promise,
    ko,
    numeral,
    html,
    bs,
    GenericClient,
    Types,
    Tabs
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
        button = t('button'),
        label = t('label'),
        form = t('form'),
        input = t('input');

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
                title: type.label,
                hitCount: hitCount,
                count: count,
                totalAvailable: totalAvailable,
                available: available
            };
            searchResultsMap[type.id] = searchResult;
            return searchResult;
        }));

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

        // Get initial available types...
        function doSearchAll() {
            matchAllTypes(runtime, searchPublicData(), searchPrivateData())
                .then(function (result) {
                    result.hits.forEach(function (result) {
                        var searchResult = searchResultsMap[result.type];
                        searchResult.totalAvailable(result.hitCount);
                    });
                    return null;
                });
        }
        doSearchAll();


        // ACTIONS
        var currentSearch;
        searchInput.subscribe(function () {
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
            doSearch();
        });

        var searching = ko.observable(false);

        var resultsColumnLabel = ko.pureComputed(function () {
            if (searching()) {
                return 'Searching...';
            }
            if (!searchInput() || searchInput().length === 0) {
                return 'No Search';
            }
            return 'Found';
        });

        var searchResultsTabLabel = ko.pureComputed(function () {
            if (searching()) {
                return 'Searching...';
            }
            if (!searchInput() || searchInput().length === 0) {
                return 'No Active Search';
            }
            return 'Search Results';
        });

        function doSearch() {
            searching(true);
            if (currentSearch) {
                currentSearch.cancelled = true;
                currentSearch.search.cancel();
            }
            currentSearch = {
                cancelled: false,
                search: null
            };
            var thisSearch = currentSearch;

            // Do not run a search with an empty input?

            currentSearch.search = searchTypes(runtime, searchInput(), searchPublicData(), searchPrivateData())
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
                    searching(false);
                });
        }

        function doSearchAgain() {
            doSearch();
        }

        function doSearchDetails(data) {
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


        // Tabs and higher level ui.
        /*
            Tabs are ko-centric.
            Each tab is configured with a label and a component. The 
            component populates the body.
            And a vm function, which maps from the current vm to the vm
            for the body component. 
            Best to prove the body components in separate files to keep the filesize
            here down, and also to decrease the chance of coupling the body
            components to this module.
            TODO: everything, but figure out how to call a disposer on a component;
            a component's vm may need to set up timers, non-dom listeners, etc.
        */

        function searchTab() {
            return {
                name: 'searchresults',
                label: span({
                    dataBind: {
                        text: 'searchResultsTabLabel'
                    }
                }),
                body: buildSearchResultsTable()
            };
        }


        var tabset = {
            selectedTab: ko.observable(),
            tabs: ko.observableArray()
        };

        tabset.selectedTab.subscribe(function (newValue) {

        });

        tabset.tabs.push(searchTab);
        tabset.selectedTab(0);




        return {
            searchInput: searchInput,
            searchPublicData: searchPublicData,
            searchPrivateData: searchPrivateData,
            searchResults: searchResults,
            searchResultsTabLabel: searchResultsTabLabel,
            resultsColumnLabel: resultsColumnLabel,
            searchError: searchError,
            searching: searching,
            doSearchDetails: doSearchDetails,
            doSearchAgain: doSearchAgain
        };
    }

    function buildSearchResultsTable() {
        return table({}, [
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
        ]);
    }


    function template() {
        var tabs = bs.buildTabs({
            tabs: [{
                name: 'searchresults',
                label: span({
                    dataBind: {
                        text: 'searchResultsTabLabel'
                    }
                }),
                body: buildSearchResultsTable()
            }]
        });
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
                    }, [
                        div({
                            class: 'input-group'
                        }, [
                            input({
                                dataBind: {
                                    textInput: 'searchInput'
                                },
                                placeholder: 'Search KBase Data with RESKE Search!',
                                class: 'form-control'
                            }),
                            div({
                                class: 'input-group-addon',
                                style: {
                                    cursor: 'pointer'
                                },
                                dataBind: {
                                    click: 'doSearchAgain'
                                }
                            }, span({
                                class: 'fa fa-search',
                                style: {
                                    fontSize: '125%'
                                },
                                dataBind: {
                                    style: {
                                        color: 'searching() ? "green" : "black"'
                                    }
                                }
                            }))
                        ])
                    ])
                ])
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-8 col-md-offset-2'
                }, [
                    div({
                        style: {
                            textAlign: 'center',
                            margin: '6px auto'
                        }
                    }, [
                        'Search in ',
                        span({
                            // class: 'ckeckbox'
                        }, label({
                            style: {
                                fontWeight: 'normal',
                                marginRight: '4px'
                            }
                        }, [
                            input({
                                type: 'checkbox',
                                dataBind: {
                                    checked: 'searchPublicData'
                                }
                            }),
                            ' data shared publicly'
                        ])),
                        span({
                            // class: 'checkbox'
                        }, label({
                            style: {
                                fontWeight: 'normal',
                                marginRight: '4px'
                            }
                        }, [
                            input({
                                type: 'checkbox',
                                dataBind: {
                                    checked: 'searchPrivateData'
                                }
                            }),
                            ' your data and data shared with you'
                        ]))
                    ])
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
                }, tabs.content),
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