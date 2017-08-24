/*
    mainViewModel
    The top level view model for the Narrative Search.
    It contains:
    - search input paramters
    - search api interface functions
    - search results array

    Additional attributes of the search ui can be 
    found in the respective componets.

*/
define([
    'knockout-plus',
    'uuid',
    'kb_common/jsonRpc/genericClient',
    'kb_common/props',
    '../../types'
], function (
    ko,
    Uuid,
    GenericClient,
    Props,
    Types
) {
    function objectToNarrative(object) {

        var appCells;
        if (!(object.data.cells instanceof Array)) {
            appCells = [];
        } else {
            appCells = object.data.cells.reduce(function (accum, cell) {
                var item = Props.make({ data: cell });
                var appCell = item.hasItem('metadata.kbase.appCell');
                if (!appCell) {
                    return accum;
                }

                accum.push({
                    id: item.getItem('metadata.kbase.appCell.app.spec.info.id'),
                    title: item.getItem('metadata.kbase.appCell.app.spec.info.name')
                });
                return accum;
            }, []);
        }

        var m = /^WS:(.*)\/(.*)\/(.*)$/.exec(object.guid);
        var workspaceId = m[1];
        var objectId = m[2];
        var version = m[3];

        var narrativeId = ['ws', workspaceId, 'obj', objectId].join('.');
        var objectRef = [workspaceId, objectId, version].join('/');

        return {
            narrativeId: narrativeId,
            objectRef: objectRef,
            title: object.key_props.title,
            timestamp: new Date(object.timestamp).toLocaleString(),
            cellCount: object.data.cells ? object.data.cells.length : 0,
            appCellCount: appCells.length,
            owner: 'not indexable',
            creator: object.key_props.creator || 'not indexed',
            appCells: appCells
        };
    }

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
                    // var type = Types.typeIt(object);
                    object.type = 'narrative';
                    var view = ko.observable('small');
                    object.view = view;
                    // object.template = ko.pureComputed(function () {
                    //     if (type === 'narrative') {
                    //         return type + '-' + view() + '-row';
                    //     } else {
                    //         return 'default-' + view() + '-row';
                    //     }
                    // });
                    // object.datestring = new Date(object.timestamp).toLocaleString();
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

    function ViewModel(params) {
        // INCOMING PARAMS
        var runtime = params.runtime;

        // SEARCH INPUT (CONTROLS)

        // Search terms
        var searchInput = ko.observable()
            .extend({
                throttle: 100
            });

        var searchPublicData = ko.observable(false);
        var searchPrivateData = ko.observable(true);

        // Items per page
        var pageSize = ko.observable(params.pageSize || 10).extend({
            parsed: function (value) {
                return parseInt(value);
            }
        });

        var objectType = Types.getType('narrative');

        // Search Results
        var totalCount = ko.observable();
        var searchResults = ko.observableArray();
        var showingCount = ko.pureComputed(function () {
            return searchResults().length;
        });

        // Message emitted during the search process, for display in the ui
        var message = ko.observable();

        // Status of the search process...
        var status = ko.observable('setup');

        // Paging Control

        // The current result item index (0 based). The RESKE search is based on a starting
        // position and the # of items to return. We use paging for results, so the 
        // language we employ recognizes that this is the first, or starting, item of the
        // current page.
        var pageStart = ko.observable(0);

        searchInput.subscribe(function () {
            doSearch('freetextinput');
        });
        pageSize.subscribe(function () {
            if (status() === 'haveresults') {
                doSearch('pagesize');
            }
        });
        pageStart.subscribe(function () {
            if (status() === 'haveresults') {
                doSearch('pagestart');
            }
        });

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

        var currentSearch = null;

        var isSearching = ko.observable(false);

        var sortKey = ko.observable();

        var sortField = ko.observable(null);

        sortKey.subscribe(function (newValue) {
            var f = objectType.searchFieldsMap[newValue];
            if (!f) {
                console.error('Sorry, no search by this type...');
            }
            sortField(f);
            doSearch('sort');
        });

        var sortDirection = ko.observable();

        var sortingRules = ko.observableArray();

        // if (sortField() !== null) {
        //     sortingRules.removeAll();
        //     sortingRules.push({
        //         is_timestamp: sortField().isTimestamp ? 1 : 0,
        //         is_object_name: sortField().isObjectName ? 1 : 0,
        //         key_name: sortField().key,
        //         descending: sortField().isDescending ? 1 : 0
        //     });
        // } else {
        // sortingRules.removeAll();
        objectType.defaultSortingRules.forEach(function (rule) {
            sortingRules.push(rule);
        });
        //}

        function doSearch() {
            // Make sure we have all the right conditions for a search, and if 
            // not, reset the search results.

            if (currentSearch) {
                // Cancel the current search, which will continue is an orphaned
                // promise. It should encouter the cancellation via the cancelled
                // flag and bypass any ui updates.
                console.warn('cancelling search...', currentSearch);
                currentSearch.cancelled = true;
                if (currentSearch.search) {
                    currentSearch.search.cancel();
                }
            }
            currentSearch = {
                cancelled: false,
                search: null,
                id: new Uuid(4).format()
            };
            console.info('new search', currentSearch);
            var thisSearch = currentSearch;

            status('setup');
            searchResults.removeAll();

            var param = {
                object_type: 'narrative',
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
                    with_private: searchPrivateData() ? 1 : 0,
                    with_public: searchPublicData() ? 1 : 0
                },
                sorting_rules: sortingRules()
            };


            var newFilter = {
                object_type: 'narrative',
                match_filter: {
                    full_text_in_all: null,
                    lookupInKeys: {}
                }
            };

            // can search either by key term or by full text term.

            // Free text search
            var freeTextTerm = searchInput();
            var allowMatchAll = false;
            if (!freeTextTerm || freeTextTerm.length == 0 || freeTextTerm === '*') {
                newFilter.match_filter.full_text_in_all = null;
                allowMatchAll = true;
            } else if (freeTextTerm.length < 3) {
                // todo this message should be beneath the free text search input
                message('Sorry, the search term must be > 2 characters');
                return;
            } else {
                newFilter.match_filter.full_text_in_all = freeTextTerm;
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

            isSearching(true);
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

                    hits.objects.forEach(function (object, index) {
                        var narrative = objectToNarrative(object);
                        narrative.rowNumber = hits.pagination.start + index + 1;
                        searchResults.push(narrative);
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
                        console.warn('search cancelled', thisSearch);
                    }
                    thisSearch = null;
                    currentSearch = null;
                    isSearching(false);
                });
        }

        sortingRules.subscribe(function (newValue) {
            doSearch('sort');
        });

        searchPublicData.subscribe(function () {
            doSearch();
        });

        searchPrivateData.subscribe(function () {
            doSearch();
        });

        // INIT

        status('needinput');
        searchInput(params.search);

        return {
            runtime: runtime,
            // Search input and controls
            searchInput: searchInput,
            searchPrivateData: searchPrivateData,
            searchPublicData: searchPublicData,

            pageSize: pageSize,
            objectType: objectType,
            sortKey: sortKey,
            sortingRules: sortingRules,

            // Basic ui info
            message: message,

            // machine state
            status: status,

            isSearching: isSearching,

            // Search results
            searchResults: searchResults,
            totalCount: totalCount,
            showingCount: showingCount,
            searchMessage: searchMessage,

            // Paging
            pageStart: pageStart,

            // Select data sources
            objectTypes: Types.getLookup(),

            // Action handlers
            doSearch: doSearch
        };
    }

    return ViewModel;
});