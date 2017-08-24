define([
    'knockout-plus',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'kb_common/jsonRpc/genericClient'
], function (
    ko,
    html,
    BS,
    GenericClient
) {
    var t = html.tag,
        h1 = t('h1'),
        div = t('div'),
        hr = t('hr'),
        span = t('span'),
        input = t('input'),
        label = t('label'),
        select = t('select'),
        option = t('option'),
        button = t('button');

    function component() {
        function viewModel(params) {
            var searchInput = ko.observable(params.searchInput);

            var pageSize = ko.observable(params.pageSize);

            var searchResults = ko.observableArray();
        }

        function template() {

        }

        return {
            viewModel: viewModel,
            template: template()
        };
    }
    ko.components.register('search2', component());

    function factory(config) {
        var hostNode, container, runtime = config.runtime;

        // model
        var searchInput;
        var searchResults;
        var pageSize = 10;



        // todo: dynamically load?
        // but: we need to tie to display objects.

        var header = {
            small: function () {
                return div({
                    style: {
                        fontWeight: 'bold'
                    }
                }, [
                    div({
                        style: {
                            display: 'inline-block',
                            width: '20%'
                        }
                    }, 'Type'),
                    div({
                        style: {
                            display: 'inline-block',
                            width: '30%'
                        }
                    }, 'GUID'),
                    div({
                        style: {
                            display: 'inline-block',
                            width: '30%'
                        }
                    }, 'Name'),
                    div({
                        style: {
                            display: 'inline-block',
                            width: '20%'
                        }
                    }, 'Timestamp'),
                ]);
            },
            medium: function (value) {
                div([
                    value.object_name,
                    ', type: ',
                    value.type
                ]);
            },
            large: function (value) {
                div([
                    value.object_name,
                    ', type: ',
                    value.type
                ]);
            }
        }
        var defaultRender = {
            small: function (value) {
                return div([
                    div({
                        style: {
                            display: 'inline-block',
                            width: '10%'
                        }
                    }, span({
                        class: 'fa fa-question fa-2x'
                    })),
                    div({
                        style: {
                            display: 'inline-block',
                            width: '10%'
                        }
                    }, value.type),
                    div({
                        style: {
                            display: 'inline-block',
                            width: '30%'
                        }
                    }, value.guid),
                    div({
                        style: {
                            display: 'inline-block',
                            width: '30%'
                        }
                    }, value.object_name),
                    div({
                        style: {
                            display: 'inline-block',
                            width: '20%'
                        }
                    }, new Date(value.timestamp).toISOString()),
                ]);
            },
            medium: function (value) {
                div([
                    value.object_name,
                    ', type: ',
                    value.type
                ]);
            },
            large: function (value) {
                div([
                    value.object_name,
                    ', type: ',
                    value.type
                ]);
            }
        }

        var objectTypes = [{
            id: 'narrative',
            label: 'Narrative',
            render: {
                small: function (value) {
                    // used for a single row of results.
                    return div([
                        div({
                            style: {
                                display: 'inline-block',
                                width: '10%'
                            }
                        }, span({
                            class: 'fa fa-file-o fa-2x'
                        })),
                        div({
                            style: {
                                display: 'inline-block',
                                width: '10%'
                            }
                        }, value.type),
                        div({
                            style: {
                                display: 'inline-block',
                                width: '30%'
                            }
                        }, value.guid),
                        div({
                            style: {
                                display: 'inline-block',
                                width: '30%'
                            }
                        }, value.object_name),
                        div({
                            style: {
                                display: 'inline-block',
                                width: '20%'
                            }
                        }, new Date(value.timestamp).toISOString()),
                    ]);
                },
                medium: function (value) {

                },
                large: function (value) {

                }
            }
        }, {
            id: 'genome',
            label: 'Genome'
        }, {
            id: 'genomefeature',
            label: 'Genome Feature'
        }, {
            id: 'assembly',
            label: 'Assembly'
        }, {
            id: 'assemblycontig',
            label: 'Assembly Contig'
        }, {
            id: 'pairedendlibrary',
            label: 'Paired End Library'
        }, {
            id: 'singleendlibrary',
            label: 'Single End Library'
        }];
        var objectTypeMap = {};
        objectTypes.forEach(function (type) {
            objectTypeMap[type.id] = type;
        });

        var pageSizes = [{
            value: '5',
            label: '5'
        }, {
            value: '10',
            label: '10'
        }, {
            value: '25',
            label: '25'
        }, {
            value: '50',
            label: '50'
        }, {
            value: '100',
            label: '100'
        }];



        // RENDERING

        function DeferUI() {
            var deferred = [];

            function defer(fun) {
                var id = html.genId();
                deferred.push({
                    id: id,
                    fun: fun
                });
                return id;
            }

            function resolve() {
                deferred.forEach(function (defer) {
                    var node = document.getElementById(defer.id);
                    try {
                        defer.fun(node);
                    } catch (ex) {
                        console.error('ERROR resolving deferred ', ex);
                    }
                });
            }
            return {
                defer: defer,
                resolve: resolve
            };
        }

        function renderResults() {
            container.querySelector('[data-element="results"] [data-element="output"]').innerText = searchResults;
        }



        function doSearch() {
            searchInput = container.querySelector('[data-element="search"] [name="searchInput"]').value;
            var newPageSize = container.querySelector('[data-element="search"] [name="pageSize"]').value;
            pageSize = parseInt(newPageSize);
            doSearchObjects();
        }

        function buildSearchControl(defer) {
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
                                    'Search Input',
                                    input({
                                        name: 'searchInput',
                                        dataElement: 'searchInput',
                                        class: 'form-control'
                                    })
                                ])),
                                div({
                                    style: {
                                        display: 'inline-block',
                                        marginRight: '6px'
                                    }
                                }, label([
                                    'Object Type',
                                    select({
                                        name: 'searchType',
                                        class: 'form-control'
                                    }, [
                                        option({
                                            value: '',
                                        }, '- any -')
                                    ].concat(objectTypes.map(function (type) {
                                        return option({
                                            value: type.id
                                        }, type.label);
                                    })))
                                ])),
                                div({
                                    style: {
                                        display: 'inline-block',
                                        marginRight: '6px'
                                    }
                                }, label([
                                    'Page Size',
                                    select({
                                        name: 'pageSize',
                                        class: 'form-control'
                                    }, pageSizes.map(function (type) {
                                        var selected = (pageSize === parseInt(type.value));
                                        return option({
                                            value: type.value,
                                            selected: selected
                                        }, type.label);
                                    }))
                                ])),
                                div({
                                    style: {
                                        display: 'inline-block',
                                        marginRight: '6px'
                                    }
                                }, button({
                                    type: 'button',
                                    class: 'btn btn-primary',
                                    id: defer.defer(function (node) {
                                        node.addEventListener('click', function () {
                                            doSearch();
                                        });
                                    })
                                }, 'Search'))
                            ])
                        ])

                    ])
                ])
            });
        }

        function setContent(panel, element, content) {
            var node = container.querySelector('[data-element="' + panel + '"] [data-element="' + element + '"]');
            if (!node) {
                console.error('Cannot find node: ' + panel + ', ' + element);
                throw new Error('Cannot find node: ' + panel + ', ' + element);
            }
            node.innerHTML = content;
        }

        function setValue(panel, element, value) {
            var node = container.querySelector('[data-element="' + panel + '"] [data-element="' + element + '"]');
            if (!node) {
                console.error('Cannot find node: ' + panel + ', ' + element);
                throw new Error('Cannot find node: ' + panel + ', ' + element);
            }
            node.value = value;
        }


        function buildSearchResults(defer) {
            return BS.buildCollapsiblePanel({
                title: 'Results',
                type: 'default',
                name: 'results',
                body: [
                    div({
                        dataElement: 'status',
                        style: {
                            borderBottom: '1px green dashed',
                            marginBottom: '6px'
                        }
                    }),
                    div({
                        dataElement: 'control',
                        style: {
                            borderBottom: '1px blue dotted',
                            marginBottom: '6px'
                        }
                    }, 'control bar here: nav controls, page size (again), view (small, medium, large)'),
                    div({
                        dataElement: 'output'
                    }, 'results here...')
                ]
            });
        }

        function buildLayout(defer) {
            return div({
                dataWidget: 'search-panel',
                class: 'container-fluid'
            }, [
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-12'
                    }, h1('Search Two'))
                ]),
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-12'
                    }, buildSearchControl(defer))
                ]),
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-12'
                    }, buildSearchResults(defer))
                ])
            ]);
        }

        // DATA

        function searchTypes() {
            var client = new GenericClient({
                url: runtime.config('services.reske.url'),
                module: 'KBaseRelationEngine',
                token: runtime.service('session').getAuthToken()
            });

            var param = self.searchTypesInput = {
                match_filter: {
                    full_text_in_all: '*'
                },
                access_filter: {
                    with_private: 1
                }
            };
            container.innerHTMl = buildLayout();

            // container.innerHTML = html.loading('Searching...');


            // return client.callFunc('search_types', [param])
            //     .then(function(result) {
            //         container.innerHTML = 'ok, see console';
            //         console.log('GOT IT!!', result);
            //     });
        }



        function buildObjectSearch() {
            var query = {
                object_type: "kbase.1.narrative",
                match_filter: {
                    full_text_in_all: "test",
                    access_group_id: 123,
                    object_name: "name",
                    parent_guid: 234234,
                    timestamp: {},
                    lookupInKeys: {}
                },
                sorting_rules: [],
                access_filter: {},
                pagination: {
                    start: 0,
                    count: 0
                },
                post_processing: {
                    ids_only: false,
                    skip_info: false,
                    skip_keys: false,
                    skip_data: false,
                    data_includes: []
                }
            };
        }

        function renderSearchResults(result) {
            return div({
                style: {
                    //border: '1px red solid'
                }
            }, [
                header.small(),
                hr({
                    style: {
                        margin: '6px auto'
                    }
                }),
                result.objects.map(function (object) {
                    // var renderer = objectTypes
                    var renderer = objectTypeMap[object.type].render || defaultRender;
                    try {
                        return renderer.small(object);
                    } catch (err) {
                        return err.error;
                    }
                })
            ]);
        }

        var typeKeys = {
            genome: ['domain', 'features', 'id', 'scientific_name', 'taxonomy'],
            genomefeature: ['aliases?', 'function?', 'id', 'location', 'protein_translation?', 'type'],
            narrative: ['cells', 'metadata'],
            assembly: ['domain', 'features', 'id', 'scientific_name']
        };

        function typeIt(value) {
            // duck typing for now...
            // loop through all types (as defined above)
            // NB use loop because .find is not suppported on any IE.
            var types = Object.keys(typeKeys);
            for (var i = 0; i < types.length; i += 1) {
                var type = types[i];
                // loop through each key and see if in the current values data property.
                var keys = typeKeys[type];
                if (keys.every(function (key) {
                        var optional = false;
                        if (key.substr(-1) === '?') {
                            optional = true;
                            key = key.substr(0, -1);
                        }
                        var found = (key in value.data);
                        if (!found && optional) {
                            return true;
                        }
                        return found;
                    })) {
                    return type;
                }
            }
            console.log(value);
            return 'unknown';
        }

        function doSearchObjects() {
            var client = new GenericClient({
                url: runtime.config('services.reske.url'),
                module: 'KBaseRelationEngine',
                token: runtime.service('session').getAuthToken()
            });

            var param = self.searchTypesInput = {
                // object_type: 'narrative',
                match_filter: {
                    full_text_in_all: searchInput,
                },
                pagination: {
                    start: 0,
                    count: pageSize
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
            setContent('results', 'status', 'Searching...');
            return client.callFunc('search_objects', [param])
                .then(function (result) {
                    var searchResults = result[0];
                    searchResults.objects.forEach(function (object) {
                        var type = typeIt(object);
                        object.type = type;
                    });
                    setContent('results', 'status', 'Found ' + searchResults.total + ' items');
                    setContent('results', 'output', renderSearchResults(searchResults));
                    console.log('GOT IT!!', result);
                });
        }


        // WIDGET API

        function attach(node) {
            hostNode = node;
            container = hostNode.appendChild(document.createElement('div'));
        }

        function start(params) {
            var defer = DeferUI();
            searchInput = params.search;
            container.innerHTML = buildLayout(defer);
            defer.resolve();
            if (searchInput) {
                setValue('search', 'searchInput', searchInput);
                doSearch();
            }
        }

        function stop() {}

        function detach() {

        }

        return {
            attach: attach,
            start: start,
            stop: stop,
            detach: detach
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});