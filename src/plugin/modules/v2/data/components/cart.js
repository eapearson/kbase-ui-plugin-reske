define([
    'bluebird',
    'knockout-plus',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'kb_common/jsonRpc/genericClient',
    'kb_common/jsonRpc/dynamicServiceClient',
    'kb_service/utils'
], function (
    Promise,
    ko,
    html,
    BS,
    GenericClient,
    DynamicServiceClient,
    serviceUtil
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        p = t('p'),
        label = t('label'),
        select = t('select'),
        option = t('option'),
        input = t('input'),
        button = t('button'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td');



    function viewModel(params) {
        var runtime = params.runtime;

        // SUPPORT FUNCTIONS

        function serviceCall(moduleName, functionName, params) {
            var override = runtime.config(['services', moduleName, 'url'].join('.'));
            var token = runtime.service('session').getAuthToken();
            var client;
            if (override) {
                client = new GenericClient({
                    module: moduleName,
                    url: override,
                    token: token
                });
            } else {
                client = new DynamicServiceClient({
                    url: runtime.config('services.service_wizard.url'),
                    token: token,
                    module: moduleName
                });
            }
            return client.callFunc(functionName, params);
        }

        function getWritableNarratives(params) {
            var workspaceClient = new GenericClient({
                url: runtime.config('services.workspace.url'),
                module: 'Workspace',
                token: runtime.service('session').getAuthToken()
            });
            return workspaceClient.callFunc('list_workspace_info', [{
                    perm: 'w'
                }])
                .spread(function (data) {
                    var objects = data.map(function (workspaceInfo) {
                        return serviceUtil.workspaceInfoToObject(workspaceInfo);
                    });
                    return objects.filter(function (obj) {
                        if (obj.metadata.narrative && (!isNaN(parseInt(obj.metadata.narrative, 10))) &&
                            obj.metadata.narrative_nice_name &&
                            obj.metadata.is_temporary && obj.metadata.is_temporary !== 'true') {
                            return true;
                        }
                        return false;
                    }).map(function (workspaceInfo) {
                        return {
                            ref: workspaceInfo.id + '/' + workspaceInfo.metadata.narrative,
                            title: workspaceInfo.metadata.narrative_nice_name
                        };
                    });
                });
        }

        // function fetchNarratives() {
        //     var param = {
        //         object_type: 'narrative',
        //         // TODO: this should accept a filter eventually.
        //         match_filter: {
        //             full_text_in_all: null
        //         },
        //         pagination: {
        //             start: 0,
        //             count: 1000 // can ask for unlimited?
        //         },
        //         post_processing: {
        //             ids_only: 0,
        //             skip_info: 0,
        //             skip_keys: 0,
        //             skip_data: 0
        //         },
        //         // TODO: also need with permissions...
        //         // Unless we should use the narrative service for this...
        //         access_filter: {
        //             with_private: 1,
        //             with_public: 0
        //         }
        //         // sorting_rules: sortingRules()
        //     };

        //     var client = new GenericClient({
        //         url: runtime.config('services.reske.url'),
        //         module: 'KBaseRelationEngine',
        //         token: runtime.service('session').getAuthToken()
        //     });
        //     return client.callFunc('search_objects', [param])
        //         .spread(function (hits) {
        //             return hits;
        //         });
        // }
        // THE MODEL

        function doRemove(data) {
            params.cart.removeItem(data);
        }

        var writableNarratives = ko.observableArray();
        var selectedNarrative = ko.observable();

        function updateWritableNarratives() {

            return getWritableNarratives()
                .then(function (narratives) {
                    // var narratives = result.objects;
                    writableNarratives(narratives.map(function (narrative) {
                        // // var m = /^WS:(.*)\/(.*)\/(.*)$/.exec(narrative.guid);
                        // // var ref = m.slice(1).join('/');
                        // // var title = narrative.key_props.title;
                        // // writableNarratives.push({
                        // //     value: ref,
                        // //     label: title
                        // // });
                        // var selected = false;
                        // if (selectedNarrative === narrative.ref) {
                        //     selected = true;
                        // }
                        return {
                            value: narrative.ref,
                            label: narrative.title
                        };
                    }));
                });
        }
        updateWritableNarratives();

        function NewNarrative() {
            var newName = ko.observable();
            var error = ko.observable();
            var isValid = ko.observable(false);

            newName.subscribe(function () {
                checkName();
            });

            function checkName() {
                var name = newName();
                error('');
                if (name === undefined) {
                    isValid(false);
                    return;
                }
                if (name.length < 3) {
                    error('Narrative name must be 3 characters or longer.');
                    isValid(false);
                    return;
                }
                // otherwise check if valid...
                // must start with letter and only contain...
                // var re = /[a-zA-Z][a-zA-Z0-9]+/;
                // if (re.test(name)) {
                //     isValid(true);
                //     return;
                // }
                // error('Narrative name must contain only letters and numbers and start with a letter');
                isValid(true);
            }

            function doCreateNewNarrative() {
                var name = newName();
                serviceCall('NarrativeService', 'create_new_narrative', [{
                        markdown: '# Data Copy Example\n\nThis narrative created by the RESKE search data cart!',
                        title: name
                    }])
                    .spread(function (result) {
                        runtime.send('notification', 'notify', {
                            type: 'success',
                            icon: 'thumbs-up',
                            message: 'Successfuly created a new narrative and named it ' + name,
                            autodismiss: 2000
                        });
                        return updateWritableNarratives()
                            .then(function () {
                                selectedNarrative([result.workspaceInfo.id, result.narrativeInfo.id].join('/'));
                            });
                    })
                    .catch(function (err) {
                        runtime.send('notification', 'notify', {
                            type: 'error',
                            icon: 'frown-o',
                            message: 'Error creating new narrative ' + err.message
                        });
                    });
            }
            // function doCreateNewNarrative() {
            //     alert('We need support from NarrativeService to enable this feature.');
            // }
            return {
                newName: newName,
                isValid: isValid,
                error: error,
                doCreate: doCreateNewNarrative
            };
        }

        // SUBSCRIPTIONS
        // selectedNarrative.subscribe(function () {
        //     serviceCall('Workspace', 'get_object_info3', [{
        //             objects: [{
        //                 ref: selectedNarrative()
        //             }],
        //             includeMetadata: 1
        //         }])
        //         .spread(function (result) {
        //             var info = serviceUtil.objectInfoToObject(result.infos[0]);
        //             console.log('object info', info);
        //             return serviceCall('Workspace', 'get_workspace_info', [{
        //                 id: info.wsid
        //             }]);
        //         })
        //         .spread(function (workspaceInfo) {
        //             console.log('workspaceInfo', workspaceInfo);
        //         })
        //         .catch(function (err) {
        //             console.error('OOPS', err);
        //         });
        // });

        function Copy() {
            var message = ko.observable();
            var error = ko.observable();
            var isCopying = ko.observable(false);

            function doCopy() {
                message('Copying...');
                Promise.all(params.cart.items().map(function (item) {
                        var ref = item.meta.ids.ref;
                        // var m = /^(\d+?)\/(\d+?)\/(\d+?)$/.exec(selectedNarrative());
                        // NB this is derived just from the workspace, so we don't have
                        // the version, plus we don't really need it, plus we really
                        // DO mean -- the most recent version of the narrative.
                        var m = /^(\d+?)\/(\d+?)$/.exec(selectedNarrative());
                        var workspaceId = parseInt(m[1]);
                        return serviceCall('NarrativeService', 'copy_object', [{
                                ref: ref,
                                target_ws_id: workspaceId
                            }])
                            .spread(function (result) {
                                return result.info;
                            });
                    }))
                    .then(function () {
                        message('Successfully copied ' + params.cart.items().length + ' objects');
                    })
                    .catch(function (err) {
                        message('Error copying: ' + err.message);
                    });

            }

            return {
                doCopy: doCopy,
                message: message,
                error: error,
                isCopying: isCopying
            };
        }

        return {
            cart: params.cart,
            narratives: writableNarratives,
            selectedNarrative: selectedNarrative,
            newNarrative: NewNarrative(),
            doRemove: doRemove,
            copy: Copy()
        };
    }

    function buildCartDisplay() {
        return div({}, [
            table({
                class: 'table table-striped data-cart'
            }, [
                tr([
                    // th('Guid'),
                    th('Type'),
                    th('Object name'),
                    th('In Narrative'),
                    th('')
                ]),
                '<!-- ko foreach: cart.items -->',
                tr([
                    // td({
                    //     dataBind: {
                    //         text: 'guid'
                    //     }
                    // }),
                    td({
                        dataBind: {
                            text: 'type'
                        }
                    }),
                    td({
                        dataBind: {
                            text: 'object_name'
                        }
                    }),
                    td({
                        dataBind: {
                            text: 'context.narrativeTitle'
                        }
                    }),
                    td(button({
                        class: 'btn btn-danger btn-xs',
                        dataBind: {
                            click: '$component.doRemove'
                        }
                    }, span({
                        class: 'fa fa-trash-o'
                    })))
                ]),
                '<!-- /ko -->'
            ])
        ]);
    }

    function buildNarrativeSelector() {
        return div({
            class: 'form-group'
        }, [
            label('Select an existing Narrative: '),
            select({
                class: 'form-control',
                dataBind: {
                    options: 'narratives',
                    optionsText: '"label"',
                    optionsValue: '"value"',
                    optionsCaption: '"- select a narrative or create one below -"',
                    value: 'selectedNarrative'
                }
            }, [
                option({
                    value: 'test'
                }, 'My Narrative')
            ])
        ]);
    }

    function buildNewNarrativeForm() {
        return div({
            class: 'form-group',
            dataBind: {
                with: 'newNarrative'
            }
        }, [
            label('Create a new Narrative: '),
            div({
                class: 'input-group'
            }, [
                input({
                    class: 'form-control',
                    dataBind: {
                        textInput: 'newName'
                    }
                }),
                span({
                    class: 'input-group-btn'
                }, button({
                    class: 'btn btn-primary',
                    dataBind: {
                        click: 'doCreate',
                        disable: '!isValid()'
                    }
                }, 'Create')),
            ]),
            div({
                dataBind: {
                    text: 'error'
                }
            })
        ]);
    }

    function buildCopyDisplay() {
        return div([
            p([
                buildNarrativeSelector()
                // '(' + span({
                //     dataBind: {
                //         text: 'selectedNarrative'
                //     }
                // }),
                // ')'
            ]),
            p([
                buildNewNarrativeForm()
            ]),

            button({
                class: 'btn btn-primary',
                dataBind: {
                    disable: '!selectedNarrative() || selectedNarrative().length === 0',
                    click: 'copy.doCopy',
                    text: 'copy.isCopying() ? "Copying..." : "Copy"'
                }
            }),
            div({
                dataBind: {
                    text: 'copy.message'
                }
            })
        ]);
    }

    function template() {
        return div({
            class: 'container-fluid'
        }, [
            div({
                class: 'row',
                style: {
                    marginTop: '10px'
                }
            }, [
                div({
                    class: 'col-sm-6'
                }, [
                    BS.buildPanel({
                        title: 'Your Data Cart',
                        body: div([
                            '<!-- ko if: cart.items().length === 0 -->',
                            'nothing in your cart!',
                            '<!-- /ko -->',
                            '<!-- ko if: cart.items().length > 0 -->',
                            buildCartDisplay(),
                            '<!-- /ko -->',
                        ])
                    })
                ]),
                div({
                    class: 'col-sm-6'
                }, [
                    BS.buildPanel({
                        title: 'Copy to a Narrative',
                        body: div([
                            '<!-- ko if: cart.items().length === 0 -->',
                            'When you have items in your cart, you may transfer them to an existing or new Narrative in this space',
                            '<!-- /ko -->',
                            '<!-- ko if: cart.items().length > 0 -->',
                            buildCopyDisplay(),
                            '<!-- /ko -->',
                        ])
                    })
                ])
            ])
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