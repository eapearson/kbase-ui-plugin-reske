define([
    'bluebird',
    'kb_common/jsonRpc/genericClient',
    './rpc',
    './types',
    '../query/main'
], function (
    Promise,
    GenericClient,
    Rpc,
    Types,
    QueryEngine
) {
    'use strict';

    function factory (config) {

        var runtime = config.runtime;

        var rpc = Rpc.make({
            runtime: runtime
        });

        function objectSearch(param) {
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
                    hits.objects.forEach(function (object, index) {
                        var type = Types.typeIt(object);
                        object.type = type;
                        var typeDef = Types.typesMap[type];

                        // get the ref for this object from the guid.
                        var reference = typeDef.methods.guidToReference(object.guid);

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

                        object.meta = {
                            workspace: reference,
                            ids: reference,
                            resultNumber: index + hits.pagination.start + 1
                        };
                    });

                    // We have just updated the objects inside of hits, so we just return hits itself.
                    return hits;
                });
        }

        var filter = {
            object_type: null,
            match_filter: {
                full_text_in_all: null,
                lookupInKeys: {}
            }
        };

        var currentSearch = {
            search: null,
            cancelled: false
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



        // function clearSearch() {
        //     if (currentSearch.search) {
        //         currentSearch.search.cancel();
        //         currentSearch.cancelled = true;
        //     }
        //     searchResults.removeAll();
        //     searchTotal(0);
        //     actualSearchTotal(0);
        //     currentSearch = {
        //         search: null,
        //         cancelled: false
        //     };
        // }

        /*
        arg is a vm:
        status()
        pageStart()
        pageSize()


        return is
        status:
        total:
        error: 
        message:
        */
        function doSearch(arg) {
            // Search cancellation
            if (currentSearch.search) {
                console.warn('cancelling search...');
                currentSearch.search.cancel();
                currentSearch.cancelled = true;
            }
            currentSearch = {
                search: null,
                cancelled: false
            };
            var thisSearch = currentSearch;

            arg.status('setup');

            var param = {
                // object_type: 'narrative',
                // match_filter: {
                //     full_text_in_all: searchInput(),
                // },
                match_filter: {},
                pagination: {
                    start: (arg.page() - 1) * arg.pageSize() || 0,
                    count: arg.pageSize()
                },
                post_processing: {
                    ids_only: 0,
                    skip_info: 0,
                    skip_keys: 0,
                    skip_data: 0
                },
                access_filter: {
                    with_private: arg.withPrivateData() ? 1 : 0, 
                    with_public: arg.withPublicData() ? 1 : 0
                }
            };
            var newFilter = {
                object_type: null,
                match_filter: {
                    full_text_in_all: null,
                }
            };

            if (arg.typeFilter().length > 0) {
                newFilter.object_type = arg.typeFilter()[0];
            }

            // Free text search
            var freeTextTerm = arg.searchInput();
            var allowMatchAll = false;
            if (freeTextTerm && freeTextTerm.length > 0) {
                if (freeTextTerm.length < 3) {
                    if (freeTextTerm === '*') {
                        newFilter.match_filter.full_text_in_all = null;
                        allowMatchAll = true;
                    } else {
                        // todo this message should be beneath the free text search input
                        arg.message('Sorry, the search term must be > 2 characters');
                    }
                } else {
                    newFilter.match_filter.full_text_in_all = freeTextTerm;
                }
            }

            // KEY SEARCHES DISABLED FOR NOW
            // Key search
            // one search term per key
            // keys derived from the type
            // can only search on keys when there is an object type
            var keySearchTerm = {};
            var error;
            // if (objectType()) {
            //     newFilter.object_type = objectType();
            //     if (keySearches().length > 0) {
            //         keySearches().forEach(function (keySearch, index) {
            //             // Need to inspect each one based on the type... wow.
            //             switch (keySearch.type) {
            //             case 'string':
            //                 var error = addStringSearch(keySearch, keySearchTerm);
            //                 if (error) {
            //                     message(error);
            //                 }
            //                 break;
            //             case 'integer':
            //                 error = addIntegerSearch(keySearch, keySearchTerm);
            //                 if (error) {
            //                     message(error);
            //                 }
            //                 break;
            //             case 'float':
            //                 error = addFloatSearch(keySearch, keySearchTerm);
            //                 if (error) {
            //                     message(error);
            //                 }
            //                 break;
            //                 // TODO: implement the other types!
            //             }
            //
            //         });
            //         newFilter.match_filter.lookupInKeys = keySearchTerm;
            //     }
            // }

            // If there are no search terms at all, we just reset
            // the search.
            // if (!newFilter.match_filter.full_text_in_all &&
            //     Object.keys(newFilter.match_filter.lookupInKeys).length === 0) {
            if (!newFilter.match_filter.full_text_in_all ) {                    
                if (newFilter.match_filter.full_text_in_all === null &&
              allowMatchAll) {
                    // let it pass
                } else {                   
                    arg.searchTotal(0);
                    arg.actualSearchTotal(0);
                    arg.status('needinput');
                    arg.message('No input');
                    return;
                }
            }

            // Compare old and new filter.
            // If we have a filter change, we need to reset the page start.
            // if (JSON.stringify(filter) !== JSON.stringify(newFilter)) {
            //     arg.pageStart(0);
            // }

            filter = newFilter;
            param.object_type = filter.object_type;
            param.match_filter = filter.match_filter;

            arg.status('searching');
            arg.message('Searching...');

            currentSearch.search = objectSearch(param)
                .then(function (result) {
                    return slatherFromWorkspace(result);
                })                
                .then(function (hits) {
                    if (thisSearch.cancelled) {
                        console.warn('ignoring cancelled request');
                        return null;
                    }

                    arg.searchResults.removeAll();

                    if (hits.objects.length === 0) {
                        status('noresults');
                        arg.searchTotal(0);
                        arg.actualSearchTotal(0);
                        arg.message('Found nothing');
                        return;
                    }
                    arg.message('Found ' + hits.total + ' items');

                    hits.objects.forEach(function (object, index) {
                        arg.searchResults.push(object);
                    });
                    arg.status('haveresults');
                    arg.actualSearchTotal(hits.total);
                    if (hits.total > 10000) {
                        arg.searchTotal(10000);
                    } else {
                        arg.searchTotal(hits.total);
                    }
                })
                .catch(function (err) {
                    console.error('error', err);
                    arg.message(err.message);
                })
                .finally(function () {
                    if (thisSearch && thisSearch.search.isCancelled()) {
                        console.warn('search cancelled');
                    }
                    thisSearch = null;
                    currentSearch = {
                        search: null,
                        cancelled: false
                    };
                    //searching(false);
                });
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

        function normalizeToType(object, runtime) {
            var typeDef = Types.typesMap[object.type];
            if (typeDef.methods && typeDef.methods.normalize) {
                return typeDef.methods.normalize(object, { runtime: runtime });
            }
        }

        function getTypeIcon(object, options) {
            var typeId = object.currentObjectInfo.type;
            var type = options.runtime.service('type').parseTypeId(typeId);
            return options.runtime.service('type').getIcon({ type: type });
        }

        function slatherFromWorkspace(searchResult) {
            var queryEngine = QueryEngine.make({
                runtime: runtime
            });
            return queryEngine.start()
                .then(function () {
                    var foundObjects = searchResult.objects;
                    if (foundObjects.length === 0) {
                        return [searchResult];
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
                            var username = runtime.service('session').getUsername();

                            // back to a map!
                            var allObjectsInfoMap = {};
                            allObjectsInfo.forEach(function (objectInfo) {
                                allObjectsInfoMap[objectInfo.ref] = objectInfo;
                            });

                            foundObjects.forEach(function (object, i) {
                            // for (var i = 0; i < foundObjects.length; i += 1) {
                                // var object = foundObjects[i];

                                object.originalObjectInfo = allObjectsInfoMap[originalObjectSpecs[i].ref];
                                object.currentObjectInfo = allObjectsInfoMap[currentObjectSpecs[i].ref];

                                // Incorporate workspace info                                

                                // NB workspaceQuery returns a map of String(workspaceId) -> workspaceInfo
                                // This is not symmetric with the input, but it is only used here, and we 
                                // do eventually need a map, and internally workspaceQuery accumulates the
                                // results into a map, so ...
                                object.workspaceInfo = workspacesInfo[String(object.meta.workspace.workspaceId)];
                                // also patch up the narrative object...
                                object.meta.owner = object.workspaceInfo.owner;                            
                                
                                object.meta.isPublic = (object.workspaceInfo.globalread === 'r');
                                object.meta.isOwner = (object.meta.owner === username);
                                // set sharing info.
                                if (!object.meta.isOwner && !object.meta.isPublic) {
                                    object.meta.isShared = true;
                                } else {
                                    object.meta.isShared = false;
                                }
                                object.meta.canRead = canRead(object.workspaceInfo.user_permission);
                                object.meta.canWrite = canWrite(object.workspaceInfo.user_permission);
                                object.meta.canShare = canShare(object.workspaceInfo.user_permission);

                                
                                // Using object info now, so we special case for "notfound" objects.
                                if (object.currentObjectInfo.notfound) {
                                    var narrativeTitle;
                                    if (object.workspaceInfo.metadata.narrative) {
                                        if (!object.workspaceInfo.metadata.narrative_nice_name) {
                                            if (object.workspaceInfo.metadata.is_temporary === 'true') {
                                                narrativeTitle = '* TEMPORARY *';
                                            } else {
                                                narrativeTitle = '* MISSING *';
                                                console.log('MISSING NICE', object);
                                            }                                    
                                        } else {
                                            narrativeTitle = object.workspaceInfo.metadata.narrative_nice_name;
                                        }
                                    }
                                    object.simpleBrowse = {
                                        narrativeTitle: narrativeTitle,
                                        objectName: '* DELETED *',
                                        type: object.type,
                                        date: object.timestamp,
                                        owner: object.meta.owner,
                                        shareLevel: 'tbd',
                                        isOwner: object.meta.isOwner,
                                        isShared: object.meta.isShared,
                                        isPublic: object.meta.isPublic
                                    };
                                    return;
                                }

                                object.meta.updated = {
                                    by: object.currentObjectInfo.saved_by,
                                    at: dateString(object.currentObjectInfo.saveDate)
                                };
                                object.meta.created = {
                                    by: object.originalObjectInfo.saved_by,
                                    at: dateString(object.originalObjectInfo.saveDate)
                                };

                                // This may be a narrative or a reference workspace.
                                // We get this from the metadata.
                                if (object.workspaceInfo.metadata.narrative) {
                                // object.meta.narrativeTitle = object.workspaceInfo.metadata.narrative_nice_name;
                                // object.context.narrativeId = 'ws.' + object.workspaceInfo.id +
                                //     '.obj.' + object.workspaceInfo.metadata.narrative;
                                // object.meta.workspaceType = 'narrative';
                                    var narrativeTitle = undefined;
                                    var narrativeId = undefined;
                                    var narrativeUrl = undefined;
                                    if (!object.workspaceInfo.metadata.narrative_nice_name) {
                                        if (object.workspaceInfo.metadata.is_temporary === 'true') {
                                            narrativeTitle = '* TEMPORARY *';
                                        } else {
                                            narrativeTitle = '* MISSING *';
                                            console.log('MISSING NICE', object);
                                        }           
                                    } else {
                                        narrativeTitle = object.workspaceInfo.metadata.narrative_nice_name;
                                        narrativeId = 'ws.' + object.workspaceInfo.id +
                                        '.obj.' + object.workspaceInfo.metadata.narrative;
                                        narrativeUrl = runtime.config('services.narrative.url') + '/narrative/' + narrativeId;
                                    }
                                   
                                    object.context = {
                                        type: 'narrative',
                                        narrativeTitle: narrativeTitle,
                                        narrativeId: narrativeId,
                                        narrativeUrl: narrativeUrl
                                    };
                                } else if (object.workspaceInfo.name === 'KBaseExampleData') {
                                    object.context = {
                                        type: 'exampleData'
                                    };
                                } else if (object.originalObjectInfo.metadata.Source) {
                                    object.context = {
                                        type: 'reference',
                                        workspaceName: object.workspaceInfo.name,
                                        source: object.currentObjectInfo.metadata.Source,
                                        sourceId: object.currentObjectInfo.metadata['Source ID'],
                                        accession: object.currentObjectInfo.metadata.accession
                                    };
                                // TODO: don't reference workspaces have some metadata to describe
                                } else {
                                    object.context = {
                                        type: 'unknown',
                                        workspaceName: object.workspaceInfo.name
                                    };
                                }

                                object.typeIcon = getTypeIcon(object, { runtime: runtime });

                                var objectName, objectRef;
                                if (object.type !== 'narrative') {
                                    objectName = object.currentObjectInfo.name;
                                    objectRef = object.currentObjectInfo.ref;
                                } 

                                normalizeToType(object, runtime);

                                // very hacky, but create the new top level stuff here...
                                object.simpleBrowse = {
                                    narrativeId: object.context.narrativeId,
                                    narrativeUrl: object.context.narrativeUrl,
                                    narrativeTitle: object.context.narrativeTitle || '-',
                                    objectName: objectName,
                                    objectRef: objectRef,
                                    type: object.type,
                                    date: object.timestamp,
                                    owner: object.meta.owner,
                                    shareLevel: 'tbd',
                                    isOwner: object.meta.isOwner,
                                    isShared: object.meta.isShared,
                                    isPublic: object.meta.isPublic
                                };
                            });
                        })
                        .then(function () {
                            return searchResult;
                        });
                });
        }

        return {
            doSearch: doSearch,
            slatherFromWorkspace: slatherFromWorkspace
        };
    }

    return {
        make: factory
    };
});
