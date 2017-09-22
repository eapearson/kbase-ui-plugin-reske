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
    'moment',
    'kb_common/jsonRpc/genericClient',
    'kb_common/props',
    'kb_common/html',
    '../../types'
], function (
    ko,
    Uuid,
    moment,
    GenericClient,
    Props,
    html,
    Types
) {
    'use strict';

    var t = html.tag,
        span = t('span');

    function niceRelativeTimestamp(timestamp) {
        var date = new Date(timestamp);

        // var now = moment(new Date());

        // var today = moment(new Date()).startOf('day');

        return moment(date).calendar();

    }

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

        var owner;

        if (object.meta.isOwner) {
            owner = span([
                span({
                    class: 'fa fa-key'
                }),
                ' ',
                span({
                    style: {
                        fontStyle: 'italic'
                    }
                }, 'you')
            ]);
        } else {
            owner = span([
                span({
                    class: 'fa fa-share-alt'
                }),
                ' ',
                span({

                }, object.meta.owner)
            ]);
        }

        var permission;
        var permissions = [];
        if (object.meta.canShare) {
            permissions.push(span([
                span({
                    class: 'fa fa-share'
                })
            ]));
        } else if (object.meta.canWrite) {
            permissions.push(span([
                span({
                    class: 'fa fa-pencil'
                })
            ]));
        } else if (object.meta.canRead) {
            permissions.push(span([
                span({
                    class: 'fa fa-eye'
                })
            ]));
        } else {
            permissions.push(span([
                span({
                    class: 'fa fa-ban'
                })
            ]));
        }
        permission = permissions.join(' ');

        return {
            narrativeId: narrativeId,
            objectRef: objectRef,
            title: object.key_props.title,
            updated: niceRelativeTimestamp(object.timestamp),
            updatedBy: object.meta.updated.by,
            cellCount: object.data.cells ? object.data.cells.length : 0,
            objectCount: object.workspaceInfo.object_count - 1,
            appCellCount: appCells.length,
            // owner: object.meta.owner,
            creator: object.object_props.creator || '-',
            appCells: appCells,
            owner: owner,
            permission: permission,
            public: object.meta.isPublic ? span({ class: 'fa fa-check' }) : '',
            created: niceRelativeTimestamp(object.meta.created.at),
            createdBy: object.meta.created.by
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

        var query = params.query;

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
        var error = ko.observable();

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
            if (status() === 'haveresults' || status() === 'error') {
                doSearch('pagesize');
            }
        });
        pageStart.subscribe(function () {
            if (status() === 'haveresults' || status() === 'error') {
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
        var isError = ko.observable(false);

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



        function slatherOnTheWorkspace(objects) {

            function dateString(date) {
                return [date.getMonth() + 1, date.getDate(), date.getFullYear()].join('/');
                // return date.toLocaleString();
            }

            function canRead(workspaceInfo) {
                return (workspaceInfo.user_permission !== 'n' || workspaceInfo.globalread === 'r');
            }

            function canWrite(perm) {
                switch (perm) {
                case 'w':
                case 'a':
                    return true;
                }
                return false;
            }

            function canShare(perm) {
                return (perm === 'a');
            }

            // function getTypeIcon(object, options) {
            //     var typeId = object.currentObjectInfo.type;
            //     var type = options.runtime.service('type').parseTypeId(typeId);
            //     return options.runtime.service('type').getIcon({ type: type });
            // }

            var originalObjectSpecs = objects.map(function (object) {
                object.meta = {
                    ids: guidToReference(object.guid)
                };
                var spec = {
                    wsid: object.meta.ids.workspaceId,
                    objid: object.meta.ids.objectId,
                    ver: 1
                };
                var ref = [spec.wsid, spec.objid, spec.ver].join('/');
                return {
                    spec: spec,
                    ref: ref
                };
            });

            var currentObjectSpecs = objects.map(function (object) {
                var spec = {
                    wsid: object.meta.ids.workspaceId,
                    objid: object.meta.ids.objectId,
                    ver: object.meta.ids.objectVersion
                };
                var ref = [spec.wsid, spec.objid, spec.ver].join('/');
                return {
                    spec: spec,
                    ref: ref
                };
            });

            var allObjectSpecs = {};
            originalObjectSpecs.forEach(function (spec) {
                allObjectSpecs[spec.ref] = spec;
            });
            currentObjectSpecs.forEach(function (spec) {
                allObjectSpecs[spec.ref] = spec;
            });

            var uniqueWorkspaces = Object.keys(objects.reduce(function (acc, object) {
                var workspaceId = object.meta.ids.workspaceId;
                acc[String(workspaceId)] = true;
                return acc;
            }, {})).map(function (id) {
                return parseInt(id);
            });

            // TODO: combine original and current objec specs -- for some objects they will
            // be the same. This is not just for efficiency, but because the object queries
            // with otherwise trip over each other. After the objectquery, the results can 
            // be distributed back to the original and current object groups.

            // console.log('slatering...', objects);

            return query.query({
                    workspace: {
                        query: {
                            objectInfo: Object.keys(allObjectSpecs).map(function (key) { return allObjectSpecs[key]; }),
                            workspaceInfo: uniqueWorkspaces
                        }
                    }
                })
                .then(function (result) {
                    var allObjectsInfo = result.workspace.objectInfo;
                    var workspacesInfo = result.workspace.workspaceInfo;
                    for (var i = 0; i < objects.length; i += 1) {
                        var object = objects[i];

                        // back to a map!
                        var allObjectsInfoMap = {};
                        allObjectsInfo.forEach(function (objectInfo) {
                            allObjectsInfoMap[objectInfo.ref] = objectInfo;
                        });

                        object.originalObjectInfo = allObjectsInfoMap[originalObjectSpecs[i].ref];
                        object.currentObjectInfo = allObjectsInfoMap[currentObjectSpecs[i].ref];

                        // NB workspaceQuery returns a map of String(workspaceId) -> workspaceInfo
                        // This is not symmetric with the input, but it is only used here, and we 
                        // do eventually need a map, and internally workspaceQuery accumulates the
                        // results into a map, so ...
                        object.workspaceInfo = workspacesInfo[String(object.meta.ids.workspaceId)];

                        // also patch up the narrative object...
                        object.meta.owner = object.workspaceInfo.owner;
                        object.meta.updated = {
                            by: object.currentObjectInfo.saved_by,
                            at: object.currentObjectInfo.saveDate
                        };
                        object.meta.created = {
                            by: object.originalObjectInfo.saved_by,
                            at: object.originalObjectInfo.saveDate
                        };
                        object.meta.isPublic = (object.workspaceInfo.globalread === 'r');
                        object.meta.isOwner = (object.meta.owner === runtime.service('session').getUsername());

                        object.meta.narrativeTitle = object.workspaceInfo.metadata.narrative_nice_name;

                        // set sharing info.
                        if (!object.meta.isOwner && !object.meta.isPublic) {
                            object.meta.isShared = true;
                        }
                        object.meta.canRead = canRead(object.workspaceInfo);
                        object.meta.canWrite = canWrite(object.workspaceInfo.user_permission);
                        object.meta.canShare = canShare(object.workspaceInfo.user_permission);


                    }
                    return objects;
                });
        }

        function guidToReference(guid) {
            var m = guid.match(/^WS:(\d+)\/(\d+)\/(\d+)$/);
            var objectRef = m.slice(1, 4).join('/');
            return {
                workspaceId: m[1],
                objectId: m[2],
                objectVersion: m[3],
                ref: objectRef,
                dataviewId: objectRef
            };
        }

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
            isError(false);
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

                    var start = new Date().getTime();
                    return slatherOnTheWorkspace(hits.objects)
                        .then(function () {
                            var elapsed = new Date().getTime() - start;
                            console.log('slathering took', elapsed);
                            return hits;
                        });
                })
                .then(function (hits) {

                    // first level massage...
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
                    status('error');
                    message(err.message);
                    error(err.message);
                    isError(true);
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
            error: error,

            // machine state
            status: status,

            isSearching: isSearching,
            isError: isError,

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