define([
    'bluebird',
    'knockout-plus',
    'marked',
    'kb_common/html',
    'kb_common/jsonRpc/genericClient',
    'kb_service/utils',
    'css!./browse-narratives.css',

    './types/narrative/browse2'
], function (
    Promise,
    ko,
    marked,
    html,
    GenericClient,
    serviceUtils
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

    function guidToNarrativeId(guid) {
        var m = guid.match(/^WS:(\d+)\/(\d+)\/(\d+)$/);
        return {
            workspaceId: m[1],
            objectId: m[2],
            objectVersion: m[3],
            ref: m.slice(1).join('/'),
            narrid: 'ws.' + m[1] + '.obj.' + m[2]
        };
    }

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

    function renderMarkdown(source) {
        try {
            var html = marked(source);
            // just in case this is a "code cell" we need to escape out any script tags 
            // (but regular tags need to be there -- this is markdown after all)
            var scripty = /<script/;
            if (scripty.test(html)) {
                html = 'markdown blocked due to script';
            }
            return html;
        } catch (ex) {
            return 'Error rendering markdown: ' + ex.message;
        }
    }

    // TODO prepare it for prettifyig??
    function renderCode(source) {
        try {
            var html = source.replace(/</, '&lt;').replace(/>/, '&gt;');
            return html;
        } catch (ex) {
            return 'Error rendering code: ' + ex.message;
        }
    }


    // Simplifed over the generic object search.
    // TODO: may add back in features after the basic display and paging is sorted out.
    function searchObjects(runtime, type, searchTerm, withPublicData, withPrivateData, pageStart, pageSize) {

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

        var sortingRules = [{
            is_timestamp: 0,
            is_object_name: 0,
            key_name: 'title',
            descending: 0
        }];

        var param = {
            object_type: type,
            pagination: {
                start: pageStart || 0,
                count: pageSize
            },
            // sorting_rules: sortingRules,
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

        return reske.callFunc('search_objects', [param])
            .then(function (result) {
                // We have the results, now we munge it around to make it more readily displayable.
                var hits = result[0];
                if (hits.objects.length === 0) {
                    return [hits, filter];
                }

                hits.objects.forEach(function (object, index) {

                    // get the narrative id.
                    var narrativeId = guidToNarrativeId(object.guid);

                    // keep the object typing for now
                    object.type = type;

                    // to allow for template switching - browse/detail.
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

                    // try to suss out interesting narrative bits.
                    var cells = object.data.cells.map(function (cell) {
                        if (Object.keys(cell.metadata).length > 0) {
                            if (cell.metadata.kbase.appCell) {
                                var appCell = cell.metadata.kbase.appCell;
                                // console.log('app', appCell);
                                var app = {
                                    name: null,
                                    method: null,
                                    module: null,
                                    description: null
                                };
                                if (appCell.app.spec && 'info' in appCell.app.spec) {
                                    app.name = appCell.app.spec.info.name;
                                    app.method = appCell.app.spec.info.id.split('/')[1];
                                    app.module = appCell.app.spec.info.module_name;
                                    app.description = appCell.app.spec.info.subtitle;
                                }
                                return {
                                    type: 'app',
                                    params: cell.metadata.kbase.appCell.params,
                                    spec: cell.metadata.kbase.appCell.app.spec,
                                    app: app
                                };
                            } else if (cell.metadata.kbase.outputCell) {
                                return {
                                    type: 'output'

                                };
                            } else if (cell.metadata.kbase.dataCell) {
                                return {
                                    type: 'data'
                                };
                            } else {
                                if (Object.keys(cell.metadata.kbase).length === 0) {
                                    if (cell.outputs) {
                                        // is a code cell that has been run. 
                                        // a code cell not run?
                                        return {
                                            type: 'code',
                                            source: cell.source,
                                            code: renderCode(cell.source)
                                        };
                                    } else if (cell.source.match(/kb-cell-out/)) {
                                        var m = cell.source.match(/kbaseNarrativeOutputCell\((.*)\)/);
                                        if (m) {
                                            try {
                                                return {
                                                    type: 'output-widget',
                                                    param: JSON.parse([m[1]])
                                                };
                                            } catch (ex) {
                                                return {
                                                    type: 'output-widget',
                                                    error: 'Error parsing output widget param: ' + ex.error
                                                };
                                            }
                                        } else {
                                            return {
                                                type: 'output-widget',
                                                error: 'Cannot find widget in output cell source'
                                            };
                                        }
                                    } else {
                                        // this is a plain Jupyter cell.
                                        // any way to differentiate between code and markdown???

                                        return {
                                            type: 'markdown',
                                            markdown: cell.source,
                                            html: renderMarkdown(cell.source)
                                        };
                                    }
                                } else {
                                    return {
                                        type: 'kbase-unknown',
                                        text: 'Unknown kbase cell type: '
                                    };
                                }
                            }
                        } else {
                            // Empty metadata - jupyter native
                            if (cell.outputs) {
                                // is a code cell that has been run. 
                                // a code cell not run?
                                return {
                                    type: 'code',
                                    source: cell.source,
                                    code: renderCode(cell.source)
                                };
                            }
                            return {
                                type: 'markdown',
                                markdown: cell.source,
                                html: renderMarkdown(cell.source)
                            };
                        }

                    });

                    var narrative = {
                        workspace: narrativeId,
                        resultNumber: index + hits.pagination.start + 1,
                        title: object.data.metadata.name,
                        description: 'narrative description here...',
                        cells: {
                            show: ko.observable(false),
                            doToggleShow: function (data) {
                                data.show(!data.show());
                            },
                            cells: cells
                        },
                        markdownCells: {
                            show: ko.observable(false),
                            doToggleShow: function (data) {
                                data.show(!data.show());
                            },
                            cells: cells.filter(function (cell) {
                                return (cell.type === 'markdown');
                            })
                        }
                    };
                    object.narrative = narrative;
                });
                return [hits, filter];
            });
    }


    // NB: hmm, it looks like the params are those active in the tab which spawned
    // this component...
    function viewModel(params) {
        // var searchResults = params.hostedVM.searchResults;

        var runtime = params.runtime;

        var searchInput = params.searchInput;
        var withPublicData = params.withPublicData;
        var withPrivateData = params.withPrivateData;

        var searchResults = ko.observableArray();

        // SORTING
        var sortBy = ko.observable();
        var sortFields = [{
            value: 'title',
            label: 'Title'
        }, {
            value: 'created',
            label: 'Created'
        }, {
            value: 'updated',
            label: 'Updated'
        }, {
            value: 'owner',
            label: 'Owner'
        }];

        var sortDirection = ko.observable('ascending');
        var sortDirections = [{
            value: 'ascending',
            label: 'Ascending'
        }, {
            value: 'descending',
            label: 'Descending'
        }];



        // PAGING
        var totalCount = ko.observable();
        var pageSize = ko.observable(params.pageSize || 10).extend({
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

        searchInput.subscribe(function () {
            doSearch();
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

            currentSearch.search = searchObjects(runtime, 'narrative', searchInput(), withPublicData(), withPrivateData(), pageStart(), pageSize())
                .spread(function (result, filter) {
                    if (result.objects.length === 0) {
                        return [result, filter];
                    }

                    // wrap in a workspace call to get workspace and object info for each narrative.                   
                    var originalObjectSpecs = result.objects.map(function (object) {
                        return {
                            wsid: object.narrative.workspace.workspaceId,
                            objid: object.narrative.workspace.objectId,
                            ver: 1
                        };
                    });

                    var currentObjectSpecs = result.objects.map(function (object) {
                        return {
                            wsid: object.narrative.workspace.workspaceId,
                            objid: object.narrative.workspace.objectId,
                            ver: object.narrative.workspace.objectVersion
                        };
                    });

                    var workspace = new GenericClient({
                        url: runtime.config('services.workspace.url'),
                        module: 'Workspace',
                        token: runtime.service('session').getAuthToken()
                    });

                    return Promise.all([
                        // array of object info, converted to object form.
                        workspace.callFunc('get_object_info3', [{
                            objects: originalObjectSpecs,
                            includeMetadata: 1
                        }]).spread(function (result) {
                            return result.infos.map(function (info) {
                                return serviceUtils.objectInfoToObject(info);
                            });
                        }),
                        workspace.callFunc('get_object_info3', [{
                            objects: currentObjectSpecs,
                            includeMetadata: 1
                        }]).spread(function (result) {
                            return result.infos.map(function (info) {
                                return serviceUtils.objectInfoToObject(info);
                            });
                        }),
                        // array of workspace info, converted to object form.
                        Promise.all(result.objects.map(function (object) {
                            return workspace.callFunc('get_workspace_info', [{
                                id: object.narrative.workspace.workspaceId
                            }]).spread(function (result) {
                                return serviceUtils.workspaceInfoToObject(result);
                            });
                        }))
                    ]).spread(function (originalObjectsInfo, currentObjectsInfo, workspacesInfo) {
                        for (var i = 0; i < result.objects.length; i += 1) {
                            var object = result.objects[i];
                            object.originalObjectInfo = originalObjectsInfo[i];
                            object.currentObjectInfo = currentObjectsInfo[i];
                            object.workspaceInfo = workspacesInfo[i];

                            // also patch up the narrative object...
                            object.narrative.owner = object.workspaceInfo.owner;
                            object.narrative.updated = {
                                by: object.currentObjectInfo.saved_by,
                                at: dateString(object.currentObjectInfo.saveDate)
                            };
                            object.narrative.created = {
                                by: object.originalObjectInfo.saved_by,
                                at: dateString(object.originalObjectInfo.saveDate)
                            };
                            object.narrative.global = object.workspaceInfo.globalread === 'y';
                        }
                    }).then(function () {
                        return [result, filter];
                    });
                })
                .spread(function (result, filter) {
                    totalCount(result.total);
                    searchResults.removeAll();

                    // Compare old and new filter.
                    // If we have a filter change, we need to reset the page start.
                    if (JSON.stringify(currentSearch.filter) !== JSON.stringify(filter)) {
                        pageStart(0);
                    }

                    currentSearch.filter = filter;
                    result.objects.forEach(function (object) {
                        searchResults.push(object);
                    });
                })
                .catch(function (err) {
                    console.error('ERROR', err);
                })
                .finally(function () {
                    searching(false);
                });
        }
        doSearch();
        searchInput.subscribe(function () {
            doSearch();
        });

        return {
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
            searching: searching
        };
    }

    function buildIcon(type) {
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
        }, buildIcon(iconClass));
    }

    function buildPagingControls() {
        return div({
            class: 'btn-toolbar -toolbar'
        }, [
            div({
                style: {
                    display: 'inline-block',
                    width: '40%',
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
                    ' per page'
                ])
            ]),
            div({
                class: 'btn-group form-inline',
                style: {
                    width: '40%',
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
                            optionsValue: '"value"'
                        },
                        class: 'form-control'
                    }),
                    select({
                        dataBind: {
                            value: 'sortDirection',
                            options: 'sortDirections',
                            optionsText: '"label"',
                            optionsValue: '"value"'
                        },
                        class: 'form-control'
                    }),
                ])
            ])
        ]);
    }

    function template() {
        return div({
            class: 'component-reske-browse-narratives'
        }, [
            div({
                style: {
                    //  border: '1px silver dashed',
                    padding: '4px',
                    marginTop: '10px'
                }
            }, buildPagingControls()),
            // div({
            //     style: {
            //         border: '1px silver solid',
            //         padding: '4px',
            //         margin: '4px'
            //     }
            // }, [
            //     div({
            //         style: {
            //             display: 'inline-block',
            //             width: '5%',
            //             textAlign: 'center'
            //         }
            //     }, '#'),
            //     div({
            //         style: {
            //             display: 'inline-block',
            //             width: '95%'
            //         }
            //     }, [
            //         div({
            //             style: {
            //                 display: 'inline-block',
            //                 width: '65%'
            //             }
            //         }, 'Title'),
            //         div({
            //             style: {
            //                 display: 'inline-block',
            //                 width: '15%'
            //             }
            //         }, 'Owner'),
            //         div({
            //             style: {
            //                 display: 'inline-block',
            //                 width: '10%'
            //             }
            //         }, 'Created'),
            //         div({
            //             style: {
            //                 display: 'inline-block',
            //                 width: '10%'
            //             }
            //         }, 'Updated')
            //     ])
            // ]),
            div({
                dataBind: {
                    foreach: 'searchResults'
                }
            }, div({
                dataBind: {
                    component: {
                        name: '"reske/narrative/browse"',
                        params: {
                            item: '$data'
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
    ko.components.register('reske/browse-narratives', component());
});