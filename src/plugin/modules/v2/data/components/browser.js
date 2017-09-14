define([
    'bluebird',
    'knockout-plus',
    'marked',
    'kb_common/html',
    'kb_common/jsonRpc/genericClient',
    'kb_service/utils',
    '../../../types',
    'css!./browser.css'
], function (
    Promise,
    ko,
    marked,
    html,
    GenericClient,
    serviceUtils,
    Types
) {
    'use strict';

    var t = html.tag,
        span = t('span'),
        div = t('div'),
        button = t('button'),
        label = t('label'),
        select = t('select');

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

    /*
        Compact date is: MM/DD/YY HH:MMpm (local time)
    */
    function compactDate(date) {
        return [
            [date.getMonth() + 1, date.getDay(), date.getFullYear()].join('/'), [date.getHours(), date.getMinutes()].join(':')
        ].join(' ');
        // return date.toLocaleString();
    }

    function dateString(date) {
        return [date.getMonth() + 1, date.getDate(), date.getFullYear()].join('/');
        // return date.toLocaleString();
    }

    function canRead(perm) {
        return (perm !== 'n');
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

    function getTypeIcon(object, options) {
        var typeId = object.currentObjectInfo.type;
        var type = options.runtime.service('type').parseTypeId(typeId);
        return options.runtime.service('type').getIcon({ type: type });
    }

    function normalizeToType(object, runtime) {
        var typeDef = Types.typesMap[object.type];
        if (typeDef.methods && typeDef.methods.normalize) {
            return typeDef.methods.normalize(object, { runtime: runtime });
        }
    }

    // Simplifed over the generic object search.
    // TODO: may add back in features after the basic display and paging is sorted out.
    function searchObjects(runtime, type, searchTerm, withPublicData, withPrivateData, sortField, sortDescending, pageStart, pageSize) {
        var typeDef = Types.typesMap[type];

        var perf = {
            prepare: {
                start: new Date().getTime(),
                elapsed: null
            },
            search: {
                start: null,
                elapsed: null
            },
            results: {
                start: null,
                elapsed: null
            },
            finished: {
                start: null
            }
        };

        // With an empty search term, we simply reset the current search results.
        // The default behaviour would be to return all available items.
        if (!searchTerm || searchTerm.length === 0) {
            return Promise.try(function () {
                // emit a fake search result.
                return [{
                    objects: [],
                    elapsed: 0
                }, null];
            });
        }

        // Separate out the pure filtering parameters so we can compare the previous and current
        // filter. Search UI logic depends on this.
        var filter = {
            match_filter: {
                full_text_in_all: searchTerm,
            },
            access_filter: {
                with_private: withPrivateData ? 1 : 0,
                with_public: withPublicData ? 1 : 0
            }
        };

        if (searchTerm === '*') {
            filter.match_filter.full_text_in_all = null;
        }

        // for now just apply one at a time.
        var sortingRules = [];
        if (sortField !== null) {
            sortingRules = [{
                is_timestamp: sortField.isTimestamp ? 1 : 0,
                is_object_name: sortField.isObjectName ? 1 : 0,
                key_name: sortField.key,
                descending: sortDescending ? 1 : 0
            }];
        }

        var param = {
            object_type: type,
            pagination: {
                start: pageStart || 0,
                count: pageSize
            },
            sorting_rules: sortingRules,
            post_processing: {
                ids_only: 0,
                skip_info: 0,
                skip_keys: 0,
                skip_data: 0
            }
        };

        // lighweight merge.
        param.match_filter = filter.match_filter;
        param.access_filter = filter.access_filter;

        // var newFilter = {
        //     object_type: null,
        //     match_filter: {
        //         full_text_in_all: null,
        //         lookupInKeys: {}
        //     }
        // };

        var reske = new GenericClient({
            url: runtime.config('services.reske.url'),
            module: 'KBaseRelationEngine',
            token: runtime.service('session').getAuthToken()
        });

        perf.search.start = new Date().getTime();
        return reske.callFunc('search_objects', [param])
            .then(function (result) {
                perf.results.start = new Date().getTime();
                console.log('got', result);

                // We have the results, now we munge it around to make it more readily displayable.
                var hits = result[0];
                if (hits.objects.length === 0) {
                    return [hits, filter];
                }

                hits.objects.forEach(function (object, index) {
                    // get the narrative id.
                    var reference = typeDef.methods.guidToReference(object.guid);
                    // var workspaceId = guidToWorkspaceId(object.guid);

                    // keep the object typing for now
                    object.type = type;

                    // to allow for template switching - browse/detail.
                    // TODO: not used ?? !!
                    object.template = 'reske/' + type + '/browse-row';

                    object.datestring = dateString(new Date(object.timestamp));

                    // Data is in an object, we want it in a list (array)
                    object.dataList = Object.keys(object.data || {}).map(function (key) {
                        return {
                            key: key,
                            type: typeof object.data[key],
                            value: object.data[key]
                        };
                    });

                    // Some types have parent data, also in an object
                    object.parentDataList = Object.keys(object.parent_data || {}).map(function (key) {
                        return {
                            key: key,
                            type: typeof object.data[key],
                            value: object.data[key]
                        };
                    });

                    // Key level data is also in an object.
                    object.keyList = Object.keys(object.key_props || {}).map(function (key) {
                        return {
                            key: key,
                            type: typeof object.key_props[key],
                            value: object.key_props[key]
                        };
                    });

                    // TODO: get this from the type-specific object / vm creator

                    normalizeToType(object, runtime);
                    object.meta = {
                        workspace: reference,
                        ids: reference,
                        resultNumber: index + hits.pagination.start + 1
                    };
                });
                perf.finished.start = new Date().getTime();
                perf.prepare.elapsed = perf.search.start - perf.prepare.start;
                perf.search.elapsed = perf.results.start - perf.search.start;
                perf.results.elapsed = perf.finished.start - perf.results.start;
                console.log('search_objects perf: prepare: ' + perf.prepare.elapsed + ', search: ' + perf.search.elapsed + ', process results: ' + perf.results.elapsed);
                return [hits, filter];
            });
    }


    // NB: hmm, it looks like the params are those active in the tab which spawned
    // this component...
    function viewModel(params) {

        // var searchResults = params.hostedVM.searchResults;

        // The original search user interface vm is passed into the tabset and preserved as hostVM.
        // We translate that back to searchVM here.
        // TODO must be a better way.
        var searchVM = params.hostVM;
        // var tabVM = params.tabVM;

        var queryEngine = searchVM.query;
        var bus = searchVM.tabsetBus;

        var type = params.type;

        // get the whole type definition.
        var typeDef = Types.typesMap[type];

        var runtime = searchVM.runtime;

        var searchInput = searchVM.searchInput;
        var withPublicData = searchVM.withPublicData;
        var withPrivateData = searchVM.withPrivateData;

        var searchResults = ko.observableArray();

        // SORTING
        var sortBy = ko.observable();

        // TODO: these need to come from the type
        var sortFields = typeDef.searchKeys;
        var sortFieldsMap = {};
        sortFields.forEach(function (sortField) {
            sortFieldsMap[sortField.key] = sortField;
        });
        var currentSortField = ko.pureComputed(function () {
            // The "natural" sort order is simply an empty string which we translate
            // into a null.
            var sortKey = sortBy();
            if (!sortKey || sortKey.length === 0) {
                return null;
            }
            return sortFieldsMap[sortBy()];
        });
        currentSortField.subscribe(function () {
            doSearch();
        });

        var sortDirection = ko.observable('ascending');
        var sortDirections = [{
            value: 'ascending',
            label: 'Ascending'
        }, {
            value: 'descending',
            label: 'Descending'
        }];
        var sortDescending = ko.pureComputed(function () {
            return (sortDirection() === 'descending');
        });
        sortDescending.subscribe(function () {
            doSearch();
        });

        // PAGING
        var totalCount = ko.observable();
        var pageSize = ko.observable(searchVM.pageSize || 10).extend({
            parsed: function (value) {
                return parseInt(value);
            }
        });
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

        pageSize.subscribe(function () {
            if (searchResults().length > 0) {
                doSearch();
            }
        });

        pageStart.subscribe(function () {
            if (searchResults().length > 0) {
                doSearch();
            }
        });

        var searching = ko.observable(false);

        var currentSearch = {
            filter: 'null',
            cancelled: false,
            search: null
        };

        function doSearch() {
            searching(true);
            if (currentSearch.search) {
                currentSearch.cancelled = true;
                currentSearch.search.cancel();
            }

            var perf = {
                search: {
                    start: new Date().getTime(),
                    elapsed: null
                },
                prepare: {
                    start: null,
                    elapsed: null
                },
                workspace: {
                    start: null,
                    elapsed: null
                },
                results: {
                    start: null,
                    elapsed: null
                },
                finished: {
                    start: null,
                    elapsed: null
                }
            };
            currentSearch.search = searchObjects(runtime, type, searchInput(), withPublicData(), withPrivateData(), currentSortField(), sortDescending(), pageStart(), pageSize())
                .spread(function (searchResult, filter) {
                    perf.prepare.start = new Date().getTime();
                    var foundObjects = searchResult.objects;
                    if (foundObjects.length === 0) {
                        return [searchResult, filter];
                    }

                    // wrap in a workspace call to get workspace and object info for each narrative.                   

                    var originalObjectSpecs = foundObjects.map(function (object) {
                        var spec = {
                            wsid: object.meta.workspace.workspaceId,
                            objid: object.meta.workspace.objectId,
                            ver: 1
                        };
                        var ref = [spec.wsid, spec.objid, spec.ver].join('/');
                        return {
                            spec: spec,
                            ref: ref
                        };
                    });

                    var currentObjectSpecs = foundObjects.map(function (object) {
                        var spec = {
                            wsid: object.meta.workspace.workspaceId,
                            objid: object.meta.workspace.objectId,
                            ver: object.meta.workspace.objectVersion
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

                    var uniqueWorkspaces = Object.keys(foundObjects.reduce(function (acc, object) {
                        var workspaceId = object.meta.workspace.workspaceId;
                        acc[String(workspaceId)] = true;
                        return acc;
                    }, {})).map(function (id) {
                        return parseInt(id);
                    });

                    // TODO: combine original and current objec specs -- for some objects they will
                    // be the same. This is not just for efficiency, but because the object queries
                    // with otherwise trip over each other. After the objectquery, the results can 
                    // be distributed back to the original and current object groups.

                    perf.workspace.start = new Date().getTime();
                    return queryEngine.query({
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
                            perf.results.start = new Date().getTime();
                            for (var i = 0; i < foundObjects.length; i += 1) {
                                var object = foundObjects[i];

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
                                object.workspaceInfo = workspacesInfo[String(object.meta.workspace.workspaceId)];

                                // also patch up the narrative object...
                                object.meta.owner = object.workspaceInfo.owner;
                                object.meta.updated = {
                                    by: object.currentObjectInfo.saved_by,
                                    at: dateString(object.currentObjectInfo.saveDate)
                                };
                                object.meta.created = {
                                    by: object.originalObjectInfo.saved_by,
                                    at: dateString(object.originalObjectInfo.saveDate)
                                };
                                object.meta.public = object.workspaceInfo.globalread === 'y';
                                object.meta.isOwner = (object.meta.owner === runtime.service('session').getUsername());
                                // set sharing info.
                                if (!object.meta.isOwner) {
                                    object.meta.isShared = true;
                                }
                                object.meta.canRead = canRead(object.workspaceInfo.user_permission);
                                object.meta.canWrite = canWrite(object.workspaceInfo.user_permission);
                                object.meta.canShare = canShare(object.workspaceInfo.user_permission);

                                // This may be a narrative or a reference workspace.
                                // We get this from the metadata.
                                if (object.workspaceInfo.metadata.narrative) {
                                    object.meta.narrativeTitle = object.workspaceInfo.metadata.narrative_nice_name;
                                    object.meta.narrativeId = 'ws.' + object.workspaceInfo.id +
                                        '.obj.' + object.workspaceInfo.metadata.narrative;
                                    object.meta.workspaceType = 'narrative';
                                    object.context = {
                                        type: 'narrative',
                                        narrativeTitle: object.workspaceInfo.metadata.narrative_nice_name,
                                        narrativeId: 'ws.' + object.workspaceInfo.id +
                                            '.obj.' + object.workspaceInfo.metadata.narrative
                                    };
                                } else {
                                    object.meta.workspaceType = 'reference';
                                    object.meta.referenceWorkspaceName = object.workspaceInfo.name;
                                    object.context = {
                                        type: 'reference',
                                        workspaceName: object.workspaceInfo.name,
                                        source: object.originalObjectInfo.metadata.Source,
                                        sourceId: object.originalObjectInfo.metadata['Source ID']
                                    };
                                    // TODO: don't reference workspaces have some metadata to describe
                                }

                                object.typeIcon = getTypeIcon(object, { runtime: runtime });
                            }
                        }).then(function () {
                            return [searchResult, filter];
                        });
                })
                .spread(function (searchResult, filter) {
                    totalCount(searchResult.total);
                    searchResults.removeAll();

                    // Compare old and new filter.
                    // If we have a filter change, we need to reset the page start.
                    if (JSON.stringify(currentSearch.filter) !== JSON.stringify(filter)) {
                        pageStart(0);
                    }

                    currentSearch.filter = filter;
                    searchResult.objects.forEach(function (object) {
                        searchResults.push(object);
                    });
                })
                .catch(function (err) {
                    bus.send('add-tab', {
                        tab: {
                            label: 'Search Error',
                            closable: true,
                            component: {
                                name: 'reske/error',
                                params: {
                                    title: 'Search Error',
                                    message: err.message
                                }
                            }
                        }
                    });
                    console.error('ERROR', err);
                })
                .finally(function () {
                    perf.finished.start = new Date().getTime();
                    perf.search.elapsed = perf.prepare.start - perf.search.start;
                    perf.prepare.elapsed = perf.workspace.start - perf.prepare.start;
                    perf.workspace.elapsed = perf.results.start - perf.workspace.start;
                    perf.results.elapsed = perf.finished.start - perf.results.start;
                    console.log('search perf: object search: ' + perf.search.elapsed + ', prepare for ws calls: ' + perf.prepare.elapsed + ', workspace calls: ' + perf.workspace.elapsed + ', process results: ' + perf.results.elapsed);
                    // console.log('cache: ', objectCache.size(), workspaceCache.size());
                    searching(false);
                });
        }
        doSearch();
        var subscriptions = [];
        subscriptions.push(searchInput.subscribe(function () {
            doSearch();
        }));
        subscriptions.push(withPrivateData.subscribe(function () {
            doSearch();
        }));
        subscriptions.push(withPublicData.subscribe(function () {
            doSearch();
        }));

        function dispose() {
            subscriptions.forEach(function (subscription) {
                subscription.dispose();
            });
        }

        function doKeep(item) {
            searchVM.cart.push(item);
        }

        return {
            QE: queryEngine,
            searchVM: searchVM,
            type: type,
            typeDef: typeDef,

            searchInput: searchInput,
            searchResults: searchResults,

            // Paging
            totalCount: totalCount,
            pageSize: pageSize,
            pageSizes: pageSizes,
            pageStart: pageStart,
            pageEnd: pageEnd,
            doFirst: doFirst,
            doLast: doLast,
            doPrevPage: doPrevPage,
            doNextPage: doNextPage,

            // Sorting
            sortBy: sortBy,
            sortFields: sortFields,
            sortDirection: sortDirection,
            sortDirections: sortDirections,

            doSearch: doSearch,
            searching: searching,

            doKeep: doKeep,

            dispose: dispose
        };
    }

    function buildIcon(type) {
        return span({
            class: 'fa fa-' + type
        });
    }

    function buildPagingControls() {
        return div({
            class: 'btn-toolbar -toolbar'
        }, [
            div({
                style: {
                    display: 'inline-block',
                    width: '25%',
                    verticalAlign: 'top'
                }
            }, [
                div({
                    class: 'btn-group form-inline',
                    style: {
                        // width: '350px'
                        // marginRight: '12px'
                        margin: '0'
                    }
                }, [
                    button({
                        dataBind: {
                            click: 'doFirst',
                            disable: 'pageStart() === 0 || searching()'
                        },
                        class: 'btn btn-default'
                    }, buildIcon('step-backward')),
                    button({
                        dataBind: {
                            click: 'doPrevPage',
                            disable: 'pageStart() === 0 || searching()'
                        },
                        class: 'btn btn-default'
                    }, buildIcon('backward')),
                    button({
                        dataBind: {
                            click: 'doNextPage',
                            disable: 'pageEnd() + 1 === totalCount() || searching()'
                        },
                        class: 'btn btn-default'
                    }, buildIcon('forward')),
                    button({
                        dataBind: {
                            click: 'doLast',
                            disable: 'pageEnd() + 1 === totalCount() || searching()'
                        },
                        class: 'btn btn-default'
                    }, buildIcon('step-forward')),
                    '<br>',
                    span({
                        style: {
                            // why not work??
                            display: 'inline-block',
                            verticalAlign: 'middle',
                            textAlign: 'center',
                            margin: '6px 0 0 4px',
                            float: 'none',
                            width: '100%'
                        },
                        dataBind: {
                            ifnot: 'isNaN(pageEnd())'
                        }
                    }, [
                        '<!-- ko ifnot: isNaN(pageEnd()) -->',
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
                        }),
                        '<!-- /ko -->',
                        '<!-- ko if: isNaN(pageEnd()) -->',
                        span({
                            style: {
                                fontSize: '50%',
                            }
                        }, html.loading()),
                        '<!-- /ko -->',
                    ])
                ]),

            ]),
            div({
                class: 'btn-group form-inline',
                style: {
                    width: '20%',
                    margin: '0',
                    textAlign: 'center',
                    float: 'none',
                    verticalAlign: 'top'
                }
            }, [
                label({
                    style: {
                        // for bootstrap
                        marginBottom: '0',
                        fontWeight: 'normal'
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
                    ' items per page'
                ])
            ]),
            div({
                class: 'btn-group form-inline',
                style: {
                    width: '55%',
                    margin: '0',
                    textAlign: 'right',
                    float: 'none',
                    verticalAlign: 'top'
                }
            }, [
                label({
                    style: {
                        // for bootstrap
                        marginBottom: '0',
                        fontWeight: 'normal'
                    }
                }, [
                    'Sort by ',
                    select({
                        dataBind: {
                            value: 'sortBy',
                            options: 'sortFields',
                            optionsText: '"label"',
                            optionsValue: '"key"',
                            optionsCaption: '"Natural"'
                        },
                        class: 'form-control'
                    }),
                    select({
                        dataBind: {
                            value: 'sortDirection',
                            options: 'sortDirections',
                            optionsText: '"label"',
                            optionsValue: '"value"',
                            disable: '!sortBy()'
                        },
                        class: 'form-control'
                    }),
                ])
            ])
        ]);
    }

    function template() {
        return div({
            class: 'component-reske-browser'
        }, [
            div({
                style: {
                    padding: '4px',
                    marginTop: '10px'
                }
            }, buildPagingControls()),
            div({
                dataBind: {
                    foreach: 'searchResults'
                }
            }, div({
                dataBind: {
                    component: {
                        // NB we use the "uiId" here rather than type. This lets us
                        // a. abstract away from the type name requirements to ui name requirements 

                        name: '"reske/" + $component.typeDef.uiId + "/browse"',
                        params: {
                            QE: '$component.QE',
                            item: '$data',
                            // new: shopping cart support.
                            cart: '$component.searchVM.cart'
                        }
                    }
                }
            }))
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