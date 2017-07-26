define([
    'knockout-plus',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'kb_common/jsonRpc/genericClient',
    '../types'
], function (
    ko,
    html,
    BS,
    GenericClient,
    Types
) {
    var t = html.tag,
        h1 = t('h1'),
        div = t('div'),
        span = t('span'),
        input = t('input'),
        label = t('label'),
        select = t('select'),
        button = t('button'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td');

    ko.extenders.parsed = function (target, parseFun) {
        function parseit(newValue) {
            try {
                target.parsed = parseFun(newValue);
            } catch (ex) {
                console.error('Error parsing : ' + ex.message);
            }
        }
        target.subscribe(function (newValue) {
            parseit(newValue);
        });
        parseit(target());
        return target;
    };

    function objectSearch(runtime, param) {
        var client = new GenericClient({
            url: runtime.config('services.reske.url'),
            module: 'KBaseRelationEngine',
            token: runtime.service('session').getAuthToken()
        });
        return client.callFunc('search_objects', [param])
            .then(function (result) {
                var hits = result[0];

                // Here we modify each object result, essentially normalizing 
                // some properties and adding ui-specific properties.
                hits.objects.forEach(function (object) {
                    var type = Types.typeIt(object);
                    object.type = type;
                    var view = ko.observable('small');
                    object.view = view;
                    object.template = ko.pureComputed(function () {
                        if (type === 'narrative') {
                            return type + '-' + view() + '-row';
                        } else {
                            return 'default-' + view() + '-row';
                        }
                    });
                    object.datestring = new Date(object.timestamp).toLocaleString();
                    object.dataList = Object.keys(object.data || {}).map(function (key) {
                        return {
                            key: key,
                            type: typeof object.data[key],
                            value: object.data[key]
                        };
                    });
                    object.parentDataList = Object.keys(object.parent_data || {}).map(function (key) {
                        return {
                            key: key,
                            type: typeof object.data[key],
                            value: object.data[key]
                        };
                    });
                    object.keyList = Object.keys(object.key_props || {}).map(function (key) {
                        return {
                            key: key,
                            type: typeof object.key_props[key],
                            value: object.key_props[key]
                        };
                    });
                });
                return hits;
            });
    }

    function narrativeSmallRow() {
        function viewModel(params) {
            return params;
        }

        function template() {
            return div([
                div({
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '15%'
                    }
                }, [
                    // span({
                    //     class: 'fa fa-file-o fa-2x'
                    // }),
                    div({
                        dataBind: {
                            text: 'type'
                        },
                        style: {
                            fontStyle: 'italic'
                        }
                    })
                ]),
                div({
                    dataBind: {
                        text: 'object_name'
                    },
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '60%'
                    }
                }),
                div({
                    dataBind: {
                        text: 'datestring'
                    },
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '25%'
                    }
                }),
            ]);
        }
        return {
            viewModel: viewModel,
            template: template()
        };
    }
    ko.components.register('narrative-small-row', narrativeSmallRow());


    function narrativeMediumRow() {
        function viewModel(params) {
            return params;
        }

        function template() {
            return div({
                style: {
                    border: '2px blue solid',
                    padding: '4px'
                }
            }, [
                div({
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '15%'
                    }
                }, [
                    // span({
                    //     class: 'fa fa-file-o fa-2x'
                    // }),
                    div({
                        dataBind: {
                            text: 'type'
                        },
                        style: {
                            fontStyle: 'italic'
                        }
                    })
                ]),
                div({
                    dataBind: {
                        text: 'object_name'
                    },
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '30%'
                    }
                }),
                div({
                    dataBind: {
                        text: 'guid'
                    },
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '30%'
                    }
                }),
                div({
                    dataBind: {
                        text: 'datestring'
                    },
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '25%'
                    }
                }),
            ]);
        }
        return {
            viewModel: viewModel,
            template: template()
        };
    }
    ko.components.register('narrative-medium-row', narrativeMediumRow());

    function narrativeLargeRow() {
        function viewModel(params) {
            return params;
        }

        function template() {
            return div({
                style: {
                    border: '2px blue solid',
                    padding: '4px'
                }
            }, table({
                class: 'table table-striped'
            }, [
                tr([
                    th('Type'),
                    td({
                        dataBind: {
                            text: 'type'
                        }
                    })
                ]),
                tr([
                    th('Name'),
                    td({
                        dataBind: {
                            text: 'object_name'
                        }
                    })
                ]),
                tr([
                    th('GUID'),
                    td({
                        dataBind: {
                            text: 'guid'
                        }
                    })
                ]),
                tr([
                    th('Date'),
                    td({
                        dataBind: {
                            text: 'datestring'
                        }
                    })
                ]),
                tr([
                    th('Data'),
                    td(
                        table({
                            class: 'table table-lined',
                            dataBind: {
                                foreach: 'dataList'
                            }
                        }, tr([
                            th({
                                dataBind: {
                                    text: 'key'
                                }
                            }),
                            td({
                                dataBind: {
                                    text: 'type'
                                }
                            }),
                            td({
                                dataBind: {
                                    text: 'value'
                                }
                            })
                        ]))
                    )
                ]),
                '<!-- ko if: parentDataList.length > 0 -->',
                tr([
                    th('Parent Data'),
                    td(
                        table({
                            class: 'table table-lined',
                            dataBind: {
                                foreach: 'parentDataList'
                            }
                        }, tr([
                            th({
                                dataBind: {
                                    text: 'key'
                                }
                            }),
                            td({
                                dataBind: {
                                    text: 'type'
                                }
                            }),
                            td({
                                dataBind: {
                                    text: 'value'
                                }
                            })
                        ]))
                    )
                ]),
                '<!-- /ko -->',
                tr([
                    th('Keys'),
                    td(
                        table({
                            class: 'table table-lined',
                            dataBind: {
                                foreach: 'keyList'
                            }
                        }, tr([
                            th({
                                dataBind: {
                                    text: 'key'
                                }
                            }),
                            td({
                                dataBind: {
                                    text: 'type'
                                }
                            }),
                            td({
                                dataBind: {
                                    text: 'value'
                                }
                            })
                        ]))
                    )
                ])
            ]));
        }
        return {
            viewModel: viewModel,
            template: template()
        };
    }
    ko.components.register('narrative-large-row', narrativeLargeRow());

    function defaultSmallRow() {
        function viewModel(params) {
            return params;
        }

        function template() {
            return div({}, [
                div({
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '15%'
                    }
                }, [
                    // span({
                    //     class: 'fa fa-question fa-2x'
                    // }),
                    div({
                        dataBind: {
                            text: 'type'
                        },
                        style: {
                            fontStyle: 'italic'
                        }
                    })
                ]),
                div({
                    dataBind: {
                        text: 'object_name'
                    },
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '60%'
                    }
                }),
                div({
                    dataBind: {
                        text: 'datestring'
                    },
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '25%'
                    }
                }),
            ]);
        }
        return {
            viewModel: viewModel,
            template: template()
        };
    }
    ko.components.register('default-small-row', defaultSmallRow());


    function defaultMediumRow() {
        function viewModel(params) {
            return params;
        }

        function template() {
            return div({
                style: {
                    border: '2px blue solid',
                    padding: '4px'
                }
            }, [
                div({
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '15%'
                    }
                }, [
                    // span({
                    //     class: 'fa fa-question fa-2x'
                    // }),
                    div({
                        dataBind: {
                            text: 'type'
                        },
                        style: {
                            fontStyle: 'italic'
                        }
                    })
                ]),
                div({
                    dataBind: {
                        text: 'object_name'
                    },
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '30%'
                    }
                }),
                div({
                    dataBind: {
                        text: 'guid'
                    },
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '30%'
                    }
                }),

                div({
                    dataBind: {
                        text: 'datestring'
                    },
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '25%'
                    }
                }),
            ]);
        }
        return {
            viewModel: viewModel,
            template: template()
        };
    }
    ko.components.register('default-medium-row', defaultMediumRow());

    function defaultLargeRow() {
        function viewModel(params) {
            return params;
        }

        function template() {
            return div({
                style: {
                    border: '2px blue solid',
                    padding: '4px'
                }
            }, table({
                class: 'table table-striped'
            }, [
                tr([
                    th('Type'),
                    td({
                        dataBind: {
                            text: 'type'
                        }
                    })
                ]),
                tr([
                    th('Name'),
                    td({
                        dataBind: {
                            text: 'object_name'
                        }
                    })
                ]),
                tr([
                    th('GUID'),
                    td({
                        dataBind: {
                            text: 'guid'
                        }
                    })
                ]),
                tr([
                    th('Date'),
                    td({
                        dataBind: {
                            text: 'datestring'
                        }
                    })
                ]),
                tr([
                    th('Data'),
                    td(
                        table({
                            class: 'table table-lined',
                            dataBind: {
                                foreach: 'dataList'
                            }
                        }, tr([
                            th({
                                dataBind: {
                                    text: 'key'
                                }
                            }),
                            td({
                                dataBind: {
                                    text: 'type'
                                }
                            }),
                            td({
                                dataBind: {
                                    text: 'value'
                                }
                            })
                        ]))
                    )
                ]),
                '<!-- ko if: parentDataList.length > 0 -->',
                tr([
                    th('Parent Data'),
                    td(
                        table({
                            class: 'table table-lined',
                            dataBind: {
                                foreach: 'parentDataList'
                            }
                        }, tr([
                            th({
                                dataBind: {
                                    text: 'key'
                                }
                            }),
                            td({
                                dataBind: {
                                    text: 'type'
                                }
                            }),
                            td({
                                dataBind: {
                                    text: 'value'
                                }
                            })
                        ]))
                    )
                ]),
                '<!-- /ko -->',
                tr([
                    th('Keys'),
                    td(
                        table({
                            class: 'table table-lined',
                            dataBind: {
                                foreach: 'keyList'
                            }
                        }, tr([
                            th({
                                dataBind: {
                                    text: 'key'
                                }
                            }),
                            td({
                                dataBind: {
                                    text: 'type'
                                }
                            }),
                            td({
                                dataBind: {
                                    text: 'value'
                                }
                            })
                        ]))
                    )
                ])
            ]));
        }
        return {
            viewModel: viewModel,
            template: template()
        };
    }
    ko.components.register('default-large-row', defaultLargeRow());

    function component() {
        function viewModel(params) {
            var runtime = params.runtime;
            var searchInput = ko.observable()
                .extend({
                    throttle: 100
                });

            var pageSize = ko.observable(params.pageSize || 10).extend({
                parsed: function (value) {
                    return parseInt(value);
                }
            });

            var objectType = ko.observable();
            var totalCount = ko.observable();
            var searchResults = ko.observableArray();
            var showingCount = ko.pureComputed(function () {
                return searchResults().length;
            });
            var message = ko.observable();
            var status = ko.observable('setup');

            var viewTypes = [{
                value: 'small',
                label: 'Small'
            }, {
                value: 'medium',
                label: 'Medium'
            }, {
                value: 'large',
                label: 'Large'
            }];

            // Paging Control


            var pageStart = ko.observable(0);
            var pageEnd = ko.pureComputed(function () {
                return Math.min(pageStart() + pageSize.parsed, totalCount()) - 1;
            });

            function doFirst() {
                pageStart(0);
            }

            function doLast() {
                pageStart(Math.max(totalCount() - pageSize.parsed, 0));
            }

            function doPrevPage() {
                if (pageStart() > pageSize.parsed) {
                    pageStart(pageStart() - pageSize.parsed);
                } else {
                    doFirst();
                }
            }

            function doNextPage() {
                if (pageEnd() < totalCount() - pageSize.parsed) {
                    pageStart(pageStart() + pageSize.parsed);
                } else {
                    doLast();
                }
            }

            var pageSizes = [5, 10, 20, 50, 100].map(function (value) {
                return {
                    label: String(value),
                    value: String(value)
                };
            });

            searchInput.subscribe(function () {
                doSearch('freetextinput');
            });
            pageSize.subscribe(function () {
                if (status() === 'haveresults') {
                    doSearch('pagesize');
                }
            });
            objectType.subscribe(function () {
                doSearch('objecttype');
            });
            pageStart.subscribe(function () {
                if (status() === 'haveresults') {
                    doSearch('pagestart');
                }
            });

            // search by key 
            var keySearchKeys = ko.pureComputed(function () {
                if (!objectType()) {
                    return [];
                }
                return Types.getType(objectType()).searchKeys;
            });
            var keySearchKey = ko.observable();
            var keySearchValue = ko.observable();

            var keySearches = ko.observableArray();

            keySearches.subscribe(function () {
                doSearch('keysearchchanged');
            });

            // TODO: expand this to create observables for each
            // input type.
            function fieldObservable() {
                return ko.observable()
                    .extend({
                        throttle: 100
                    });
            }

            function makeKeySearchField(type) {
                switch (type) {
                case 'string':
                    return {
                        string_value: fieldObservable()
                    };
                case 'integer':
                    return {
                        int_value: fieldObservable(),
                        max_int: fieldObservable(),
                        min_int: fieldObservable()
                    };
                case 'float':
                    return {
                        float_value: fieldObservable(),
                        min_float: fieldObservable(),
                        max_float: fieldObservable()
                    };
                case 'date':
                    return {
                        min_date: fieldObservable(),
                        max_date: fieldObservable()
                    };
                case 'boolean':
                    return {
                        bool_value: fieldObservable()
                    };
                default:
                    throw new Error('Field type not recognized: ' + type);
                }
            }

            // okay, we need to be able to have the key search controls 
            // switch to text, min/max int, min/max float, min/max date
            // based on the type string.
            // we can switch components, for sure, and they can have their
            // own vm structure,

            // AAH, so we need a structure which matches the matchValue structure
            // in the spec
            /*
                 typedef structure {
        string value;
        int int_value;
        float double_value;
        boolean bool_value;
        int min_int;
        int max_int;
        int min_date;
        int max_date;
        float min_double;
        float max_double;
    } MatchValue;
                */
            function doAddKeySearch() {
                // objectType being the currently selected object type and
                // keySearchKey beig the currently selected key for key searching.
                var keySearchSpec = Types.getType(objectType()).searchKeysMap[keySearchKey()];

                var keySearchFields = makeKeySearchField(keySearchSpec.type);

                // Updates to each search key trigger a new search
                Object.keys(keySearchFields).forEach(function (key) {
                    keySearchFields[key].subscribe(function (key) {
                        doSearch('keysearchmodified', key);
                    });
                });

                var keySearch = {
                    key: keySearchKey(),
                    type: keySearchSpec.type,
                    fields: keySearchFields
                };
                keySearches.push(keySearch);
            }

            function doRemoveKeySearch(data) {
                keySearches.remove(data);
            }

            var searchMessage = ko.pureComputed(function () {
                switch (status()) {
                case 'needinput':
                    return 'Provide either free text search, or type-based key-searches above';
                case 'searching':
                    return 'Searching...';
                case 'noresults':
                    return 'No search results for this query';
                }
            });

            /*
            A request for a search can come in the following contexts:
            - a. no previous or previous and empty or previous and removed search
            - b. inputs have changed and are non-zero
            - c. inputs have changed and are empty
                 1. free text
                 2. search key set changed
                 3. search key value changed
                 4. object type changed
            - d. page has changed
            - e. page size has changed
            - f. sort has changed


            for a we set the page start to 0 and proceed

            for b we set the page start to 0, empty the results array, and proceed

            for c we set the page start to null, empty the results array, and proceed

            for d we empty the results array and proceed

            for e we empty the results array and proceed

            for f we set the page start to 0, empty the results array, and proceed
            
            */
            var filter = {
                object_type: null,
                match_filter: {
                    full_text_in_all: null,
                    lookupInKeys: {}
                }
            };

            function addStringSearch(keySearch, keySearchTerm) {
                var value = keySearch.fields.string_value();
                if (value) {
                    if (value.length < 3) {
                        // todo  this should be in the search keys list
                        return 'Sorry, the search term ' + keySearch.key + ' must be > 2 characters';
                    } else {
                        // TODO: ensure only one instance of a key search term
                        // TODO: we must type the keys ... 
                        //   ... value is just for strings
                        keySearchTerm[keySearch.key] = {
                            value: value
                        };
                    }
                }
            }

            function isEmpty(value) {
                return (value === undefined || value.length === 0);
            }

            // Note that RESKE uses "double" in the api, but otherwise refers to them as floats.
            function addFloatSearch(keySearch, keySearchTerm) {
                var value = keySearch.fields.float_value();
                var minValue = keySearch.fields.min_float();
                var maxValue = keySearch.fields.max_float();
                if (isEmpty(value) && isEmpty(minValue) && isEmpty(maxValue)) {
                    return;
                }
                try {
                    var searchTerm = {};
                    var termSet = false;
                    if (!isEmpty(value)) {
                        var floatValue = parseFloat(value);
                        if (isNaN(floatValue)) {
                            return 'Invalid exact float entry: ' + value;
                        }
                        searchTerm.double_value = floatValue;
                        termSet = true;
                    }

                    if (!(isEmpty(minValue))) {
                        var minFloatValue = parseFloat(minValue);
                        if (isNaN(minFloatValue)) {
                            return 'Invalid min float entry: ' + minValue;
                        }
                        searchTerm.min_double = minFloatValue;
                        termSet = true;
                    }

                    if (!isEmpty(maxValue)) {
                        var maxFloatValue = parseFloat(maxValue);
                        if (isNaN(maxFloatValue)) {
                            return 'Invalid max float entry: ' + value;
                        }
                        searchTerm.max_double = maxFloatValue;
                        termSet = true;
                    }
                    if (termSet) {
                        keySearchTerm[keySearch.key] = searchTerm;
                    }
                } catch (ex) {
                    return ex.message;
                }
            }

            function addIntegerSearch(keySearch, keySearchTerm) {
                var value = keySearch.fields.int_value();
                var minValue = keySearch.fields.min_int();
                var maxValue = keySearch.fields.max_int();
                if (isEmpty(value) && isEmpty(minValue) && isEmpty(maxValue)) {
                    return;
                }
                try {
                    var searchTerm = {};
                    var termSet = false;
                    if (!isEmpty(value)) {
                        var intValue = parseInt(value);
                        if (isNaN(intValue)) {
                            return 'Invalid exact integer entry: ' + value;
                        }
                        searchTerm.int_value = intValue;
                        termSet = true;
                    }

                    if (!(isEmpty(minValue))) {
                        var minIntValue = parseInt(minValue);
                        if (isNaN(minIntValue)) {
                            return 'Invalid min integer entry: ' + minValue;
                        }
                        searchTerm.min_int = minIntValue;
                        termSet = true;
                    }

                    if (!isEmpty(maxValue)) {
                        var maxIntValue = parseInt(maxValue);
                        if (isNaN(maxIntValue)) {
                            return 'Invalid max integer entry: ' + maxValue;
                        }
                        searchTerm.max_int = maxIntValue;
                        termSet = true;
                    }
                    if (termSet) {
                        keySearchTerm[keySearch.key] = searchTerm;
                    }
                } catch (ex) {
                    return ex.message;
                }
            }

            var currentSearch = null;

            function doSearch(source) {
                // Make sure we have all the right conditions for a search, and if 
                // not, reset the search results.

                if (currentSearch) {
                    currentSearch.cancelled = true;
                    if (currentSearch.search) {
                        currentSearch.search.cancel();
                    }
                }
                currentSearch = {
                    cancelled: false,
                    search: null
                };
                var thisSearch = currentSearch;

                // var originalStatus = status();
                // switch (originalStatus) {
                // case 'needinput':
                // case 'haveresults':
                // case 'noresults':
                //     // continue;
                //     break;
                // default:
                //     return;
                // }

                status('setup');
                searchResults.removeAll();

                var param = {
                    // object_type: 'narrative',
                    // match_filter: {
                    //     full_text_in_all: searchInput(),
                    // },
                    match_filter: {},
                    pagination: {
                        start: pageStart() || 0,
                        count: pageSize.parsed
                    },
                    post_processing: {
                        ids_only: 0,
                        skip_info: 0,
                        skip_keys: 0,
                        skip_data: 0
                    },
                    access_filter: {
                        with_private: 1
                    }
                };
                var newFilter = {
                    object_type: null,
                    match_filter: {
                        full_text_in_all: null,
                        lookupInKeys: {}
                    }
                };

                // can search either by key term or by full text term.

                // Free text search
                var freeTextTerm = searchInput();
                var allowMatchAll = false;
                if (freeTextTerm && freeTextTerm.length > 0) {
                    if (freeTextTerm.length < 3) {
                        if (freeTextTerm === '*') {
                            newFilter.match_filter.full_text_in_all = null;
                            allowMatchAll = true;
                        } else {
                            // todo this message should be beneath the free text search input
                            message('Sorry, the search term must be > 2 characters');
                        }
                    } else {
                        newFilter.match_filter.full_text_in_all = freeTextTerm;
                    }
                }

                // Key search
                // one search term per key
                // keys derived from the type
                // can only search on keys when there is an object type
                var keySearchTerm = {};
                var error;
                if (objectType()) {
                    newFilter.object_type = objectType();
                    if (keySearches().length > 0) {
                        keySearches().forEach(function (keySearch, index) {
                            // Need to inspect each one based on the type... wow.
                            switch (keySearch.type) {
                            case 'string':
                                var error = addStringSearch(keySearch, keySearchTerm);
                                if (error) {
                                    message(error);
                                }
                                break;
                            case 'integer':
                                error = addIntegerSearch(keySearch, keySearchTerm);
                                if (error) {
                                    message(error);
                                }
                                break;
                            case 'float':
                                error = addFloatSearch(keySearch, keySearchTerm);
                                if (error) {
                                    message(error);
                                }
                                break;
                                // TODO: implement the other types!
                            }

                        });
                        newFilter.match_filter.lookupInKeys = keySearchTerm;
                    }
                }

                // If there are no search terms at all, we just reset
                // the search.
                if (!newFilter.match_filter.full_text_in_all &&
                    Object.keys(newFilter.match_filter.lookupInKeys).length === 0) {
                    if (newFilter.match_filter.full_text_in_all === null &&
                        allowMatchAll) {
                        // let it pass
                    } else {
                        totalCount(0);
                        status('needinput');
                        message('No input');
                        return;
                    }
                }

                // Compare old and new filter.
                // If we have a filter change, we need to reset the page start.
                if (JSON.stringify(filter) !== JSON.stringify(newFilter)) {
                    pageStart(0);
                }

                filter = newFilter;
                param.object_type = filter.object_type;
                param.match_filter = filter.match_filter;

                status('searching');
                message('Searching...');

                currentSearch.search = objectSearch(runtime, param)
                    .then(function (hits) {
                        if (thisSearch.cancelled) {
                            console.warn('ignoring cancelled request');
                            return null;
                        }
                        if (hits.objects.length === 0) {
                            status('noresults');
                            totalCount(0);
                            message('Found nothing');
                            return;
                        }
                        message('Found ' + hits.total + ' items');

                        hits.objects.forEach(function (object) {
                            searchResults.push(object);
                        });
                        status('haveresults');
                        totalCount(hits.total);
                    })
                    .catch(function (err) {
                        console.error('error', err);
                        message(err.message);
                    })
                    .finally(function () {
                        if (thisSearch && thisSearch.search.isCancelled()) {
                            console.warn('search cancelled');
                        }
                        thisSearch = null;
                        currentSearch = null;
                        //searching(false);
                    });
            }

            function calcRow(data) {
                return 'default-row';
            }

            // INIT

            status('needinput');
            searchInput(params.search);
            objectType(params.type);

            return {
                // Search input and controls
                searchInput: searchInput,
                pageSize: pageSize,
                objectType: objectType,

                // key searches
                keySearchKeys: keySearchKeys,
                keySearchKey: keySearchKey,
                keySearchValue: keySearchValue,
                keySearches: keySearches,
                doAddKeySearch: doAddKeySearch,
                doRemoveKeySearch: doRemoveKeySearch,

                // Basic ui info
                message: message,

                // machine state
                status: status,

                // Search results
                searchResults: searchResults,
                totalCount: totalCount,
                showingCount: showingCount,
                searchMessage: searchMessage,

                // Paging
                pageStart: pageStart,
                pageEnd: pageEnd,
                doFirst: doFirst,
                doLast: doLast,
                doPrevPage: doPrevPage,
                doNextPage: doNextPage,

                // Select data sources
                pageSizes: pageSizes,
                objectTypes: Types.getLookup(),
                viewTypes: viewTypes,

                calcRow: calcRow,

                // Action handlers
                doSearch: doSearch
            };
        }

        function icon(type) {
            return span({
                class: 'fa fa-' + type
            });
        }

        function buildButton(iconClass, func, tooltip) {
            return button({
                dataBind: {
                    click: func
                },
                class: 'btn btn-default'
            }, icon(iconClass));
        }

        function buildPagingControls() {
            return div({
                style: {
                    //border: '1px red dashed'
                    margin: '0 0 4px 0'
                }
            }, div({ class: 'btn-toolbar' }, [
                div({
                    class: 'btn-group form-inline',
                    style: {
                        width: '350px'
                    }
                }, [
                    buildButton('step-backward', 'doFirst'),
                    buildButton('backward', 'doPrevPage'),
                    buildButton('forward', 'doNextPage'),
                    buildButton('step-forward', 'doLast'),
                    span({
                        style: {
                            // why not work??
                            display: 'inline-block',
                            verticalAlign: 'middle',
                            margin: '6px 0 0 4px'
                        }
                    }, [
                        span({
                            dataBind: {
                                text: 'pageStart() + 1'
                            }
                        }),
                        ' to ',
                        span({
                            dataBind: {
                                text: 'pageEnd() + 1'
                            }
                        }),
                        ' of ',
                        span({
                            dataBind: {
                                text: 'totalCount()'
                            },
                            style: {
                                marginRight: '10px',
                                verticalAlign: 'middle'
                            }
                        })
                    ])
                ]),
                div({ class: 'btn-group form-inline' }, [
                    label({
                        style: {
                            // for bootstrap
                            marginBottom: '0'
                        }
                    }, [
                        select({
                            dataBind: {
                                value: 'pageSize',
                                options: 'pageSizes',
                                optionsText: '"label"',
                                optionsValue: '"value"'
                            },
                            class: 'form-control'
                        }),
                        ' rows per page'
                    ])
                ])
            ]));
        }

        function buildSearchControl() {
            return BS.buildCollapsiblePanel({
                title: 'Search',
                type: 'default',
                name: 'search',
                body: div({}, [
                    div({
                        class: 'form'
                    }, [
                        div({
                            class: 'row',
                        }, [
                            div({
                                class: 'col-md-12'
                            }, [
                                div({
                                    style: {
                                        display: 'inline-block',
                                        marginRight: '6px'
                                    }
                                }, label([
                                    'Free Text Search',
                                    input({
                                        dataBind: {
                                            textInput: 'searchInput'
                                        },
                                        class: 'form-control'
                                    })
                                ]))
                            ])
                        ]),
                        div({
                            class: 'row',
                        }, [
                            div({
                                class: 'col-md-6'
                            }, [
                                div({
                                    style: {
                                        display: 'inline-block',
                                        marginRight: '6px'
                                    }
                                }, label([
                                    'Object Type',
                                    select({
                                        name: 'objectType',
                                        class: 'form-control',
                                        dataBind: {
                                            value: 'objectType',
                                            options: 'objectTypes',
                                            optionsText: '"label"',
                                            optionsValue: '"id"',
                                            optionsCaption: '"- any -"'
                                        }
                                    })
                                ])),
                                '<!-- ko if: keySearchKeys().length === 0 -->',
                                div({
                                    style: {
                                        display: 'inline-block',
                                        border: '1px silver dashed',
                                        padding: '10px',
                                        fontStyle: 'italic'
                                    }
                                }, 'Select an object type to enable search keys'),
                                '<!-- /ko -->',

                                '<!-- ko if: keySearchKeys().length > 0 -->',
                                div({
                                    class: 'form-inline',
                                    style: {
                                        display: 'inline-block',
                                        marginRight: '6px'
                                    }
                                }, [
                                    // input({
                                    //     dataBind: {
                                    //         value: 'keySearchValue'
                                    //     },
                                    //     class: 'form-control'
                                    // }), 
                                    select({
                                        dataBind: {
                                            value: 'keySearchKey',
                                            options: 'keySearchKeys',
                                            optionsValue: '"key"',
                                            optionsText: '"label"',
                                            optionsCaption: '"- choose a search key -"'
                                        },
                                        class: 'form-control'
                                    }),
                                    button({
                                        dataBind: {
                                            click: 'doAddKeySearch'
                                        },
                                        type: 'button',
                                        class: 'btn btn-primary'
                                    }, 'Add Search Key')
                                ]),
                                '<!-- /ko -->'
                            ]),
                            div({
                                class: 'col-md-6'
                            }, [
                                div({
                                    style: {
                                        fontWeight: 'bold'
                                    }
                                }, 'Search Keys'),
                                div({
                                    style: {
                                        border: '1px silver dashed'
                                    }
                                }, [
                                    '<!-- ko if: keySearches().length === 0 -->',
                                    div({
                                        style: {
                                            fontStyle: 'italic',
                                            textAlign: 'center',
                                            padding: '10px'
                                        }
                                    }, 'Add search keys to search by keys'),
                                    '<!-- /ko -->',
                                    '<!-- ko if: keySearches().length > 0 -->',
                                    div({
                                        dataBind: {
                                            foreach: 'keySearches'
                                        }
                                    }, div({
                                        class: 'form-group'
                                    }, [
                                        label({
                                            dataBind: {
                                                text: '$data.key'
                                            }
                                        }),
                                        div({
                                            class: 'input-group xform-inline'
                                        }, [
                                            // We need to build a control based on the type 
                                            // of the key input.
                                            '<!-- ko switch: $data.type -->',
                                            '<!-- ko case: "string" -->',
                                            div({
                                                class: 'form-inline'
                                            }, [
                                                div({
                                                    class: 'form-group'
                                                }, [
                                                    label({
                                                        style: {
                                                            display: 'inline'
                                                        }
                                                    }, 'Exact match:'),
                                                    input({
                                                        dataBind: {
                                                            textInput: '$data.fields.string_value'
                                                        },
                                                        class: 'form-control',
                                                        style: {
                                                            display: 'inline',
                                                            float: 'none',
                                                            width: '10em'
                                                        }
                                                    })
                                                ])
                                            ]),
                                            '<!-- /ko -->',
                                            '<!-- ko case: "integer" -->',
                                            div({
                                                class: 'input-group form-inline'
                                            }, [
                                                label({
                                                    style: {
                                                        display: 'inline'
                                                    }
                                                }, 'Exact match:'),
                                                input({
                                                    dataBind: {
                                                        textInput: '$data.fields.int_value'
                                                    },
                                                    class: 'form-control',
                                                    style: {
                                                        display: 'inline',
                                                        float: 'none',
                                                        width: '7em'
                                                    }
                                                }),
                                                label({
                                                    style: {
                                                        display: 'inline'
                                                    }
                                                }, 'Min:'),
                                                input({
                                                    dataBind: {
                                                        textInput: '$data.fields.min_int'
                                                    },
                                                    class: 'form-control',
                                                    style: {
                                                        display: 'inline',
                                                        float: 'none',
                                                        width: '7em'
                                                    }
                                                }),
                                                label({
                                                    style: {
                                                        display: 'inline'
                                                    }
                                                }, 'Max:'),
                                                input({
                                                    dataBind: {
                                                        textInput: '$data.fields.max_int'
                                                    },
                                                    class: 'form-control',
                                                    style: {
                                                        display: 'inline',
                                                        float: 'none',
                                                        width: '7em'
                                                    }
                                                }),
                                            ]),
                                            '<!-- /ko -->',
                                            '<!-- ko case: "float" -->',
                                            div({
                                                class: 'input-group form-inline'
                                            }, [
                                                label({
                                                    style: {
                                                        display: 'inline'
                                                    }
                                                }, 'Exact match:'),
                                                input({
                                                    dataBind: {
                                                        textInput: '$data.fields.float_value'
                                                    },
                                                    class: 'form-control',
                                                    style: {
                                                        display: 'inline',
                                                        float: 'none',
                                                        width: '7em'
                                                    }
                                                }),
                                                label({
                                                    style: {
                                                        display: 'inline'
                                                    }
                                                }, 'Min:'),
                                                input({
                                                    dataBind: {
                                                        textInput: '$data.fields.min_float'
                                                    },
                                                    class: 'form-control',
                                                    style: {
                                                        display: 'inline',
                                                        float: 'none',
                                                        width: '7em'
                                                    }
                                                }),
                                                label({
                                                    style: {
                                                        display: 'inline'
                                                    }
                                                }, 'Max:'),
                                                input({
                                                    dataBind: {
                                                        textInput: '$data.fields.max_float'
                                                    },
                                                    class: 'form-control',
                                                    style: {
                                                        display: 'inline',
                                                        float: 'none',
                                                        width: '7em'
                                                    }
                                                }),
                                            ]),
                                            '<!-- /ko -->',
                                            '<!-- ko case: $default -->',
                                            'unknown type',
                                            span({
                                                dataBind: {
                                                    text: '$data.type'
                                                }
                                            }),
                                            '<!-- /ko -->',
                                            '<!-- /ko -->',
                                            div({
                                                class: 'input-group-addon'
                                            }, button({
                                                dataBind: {
                                                    click: '$component.doRemoveKeySearch'
                                                },
                                                type: 'button',
                                                class: 'btn btn-danger btn-xs',
                                                style: {
                                                    border: '0'
                                                }
                                            }, span({
                                                class: 'fa fa-times'
                                            }))),
                                        ])
                                    ])),
                                    '<!-- /ko -->'
                                ])
                            ])
                        ]),
                        div({
                            class: 'row',
                        }, [
                            div({
                                class: 'col-md-12'
                            }, [

                                div({
                                    style: {
                                        display: 'inline-block',
                                        marginRight: '6px'
                                    }
                                }, button({
                                    dataBind: {
                                        click: 'doSearch'
                                    },
                                    type: 'button',
                                    class: 'btn btn-primary'
                                }, 'Search')),
                                div({
                                    style: {
                                        display: 'inline-block',
                                        marginRight: '6px'
                                    }
                                }, span({
                                    dataBind: {
                                        text: 'status'
                                    }
                                }))
                            ])
                        ])
                    ])
                ])
            });
        }

        function buildSearchResultsHeader() {
            return div({
                style: {
                    fontWeight: 'bold'
                }
            }, [
                div({
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '15%'
                    }
                }, 'Type'),
                // div({
                //     style: {
                //         display: 'inline-block',
                //         verticalAlign: 'top',
                //         width: '35%'
                //     }
                // }, 'GUID'),
                div({
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '60%'
                    }
                }, 'Name'),
                div({
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '25%'
                    }
                }, 'Timestamp'),
            ]);
        }

        function buildSearchResults() {
            return BS.buildCollapsiblePanel({
                title: 'Results',
                type: 'default',
                name: 'results',
                body: [
                    div({
                        dataBind: {
                            html: 'message'
                        },
                        style: {
                            borderBottom: '1px green dashed',
                            marginBottom: '6px'
                        }
                    }),
                    '<!-- ko if: searchMessage -->',
                    div({
                        dataBind: {
                            text: 'searchMessage'
                        },
                        style: {
                            fontStyle: 'italic',
                        }
                    }),
                    '<!-- /ko -->',
                    '<!-- ko if: searchResults().length > 0 -->',
                    div({
                        style: {
                            borderBottom: '1px blue dotted',
                            marginBottom: '6px'
                        }
                    }, buildPagingControls()),
                    div([
                        div({
                            style: {
                                borderBottom: '2px silver dashed',
                                paddingBottom: '4px',
                                marginBottom: '4px'
                            }
                        }, [
                            div({
                                style: {
                                    display: 'inline-block',
                                    width: '5%'
                                }
                            }, '#'),
                            div({
                                style: {
                                    display: 'inline-block',
                                    width: '10%'
                                }
                            }, 'view'),
                            div({
                                style: {
                                    display: 'inline-block',
                                    width: '85%'
                                }
                            }, buildSearchResultsHeader())
                        ]),
                        div({
                            dataBind: {
                                foreach: 'searchResults'
                            }
                        }, div({
                            style: {
                                borderBottom: '1px silver solid',
                                marginBottom: '6px'
                            }
                        }, [
                            div({
                                style: {
                                    display: 'inline-block',
                                    verticalAlign: 'top',
                                    width: '5%'
                                }
                            }, span({
                                dataBind: {
                                    text: '$index() + $component.pageStart() + 1'
                                }
                            })),
                            div({
                                style: {
                                    display: 'inline-block',
                                    verticalAlign: 'top',
                                    width: '10%'
                                }
                            }, select({
                                dataBind: {
                                    value: 'view',
                                    options: '$component.viewTypes',
                                    optionsText: '"label"',
                                    optionsValue: '"value"'
                                }
                            })),
                            div({
                                dataBind: {
                                    component: {
                                        name: 'template',
                                        // name: '"default-small-row"',
                                        params: '$data'
                                    }
                                    // text: 'template()'
                                },
                                style: {
                                    display: 'inline-block',
                                    width: '85%'
                                }
                            })
                        ]))
                    ]),
                    '<!-- /ko -->'
                ]
            });
        }

        function template() {
            return div({
                dataWidget: 'search-panel',
                class: 'container-fluid'
            }, [
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-12'
                    }, h1('RESKE Search'))
                ]),
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-12'
                    }, buildSearchControl())
                ]),
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-12'
                    }, buildSearchResults())
                ])
            ]);
        }

        return {
            viewModel: viewModel,
            template: template()
        };
    }
    ko.components.register('reske-object-search', component());
});