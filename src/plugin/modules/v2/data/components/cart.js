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

    function fetchNarratives(runtime) {
        var param = {
            object_type: 'narrative',
            // TODO: this should accept a filter eventually.
            match_filter: {
                full_text_in_all: null
            },
            pagination: {
                start: 0,
                count: 1000 // can ask for unlimited?
            },
            post_processing: {
                ids_only: 0,
                skip_info: 0,
                skip_keys: 0,
                skip_data: 0
            },
            // TODO: also need with permissions...
            // Unless we should use the narrative service for this...
            access_filter: {
                with_private: 1,
                with_public: 0
            }
            // sorting_rules: sortingRules()
        };

        var client = new GenericClient({
            url: runtime.config('services.reske.url'),
            module: 'KBaseRelationEngine',
            token: runtime.service('session').getAuthToken()
        });
        return client.callFunc('search_objects', [param])
            .spread(function (hits) {
                // console.log('returning;', hits);
                return hits;
            });
    }

    function viewModel(params) {
        var runtime = params.runtime;

        function doRemove(data) {
            params.cart.removeItem(data);
        }

        var writableNarratives = ko.observableArray();
        var selectedNarrative = ko.observable();

        fetchNarratives(runtime)
            .then(function (result) {
                // console.log('result', result);
                var narratives = result.objects;
                narratives.forEach(function (narrative) {
                    var m = /^WS:(.*)\/(.*)\/(.*)$/.exec(narrative.guid);
                    var ref = m.slice(1).join('/');
                    var title = narrative.key_props.title;
                    writableNarratives.push({
                        value: ref,
                        label: title
                    });
                });
                // console.log('narratives', narratives)
            });


        return {
            cart: params.cart,
            narratives: writableNarratives,
            selectedNarrative: selectedNarrative,
            doRemove: doRemove
        };
    }

    function buildCartDisplay() {
        return div({}, [
            table({

                class: 'table table-striped'
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
                            text: 'meta.narrativeTitle'
                        }
                    }),
                    td(button({
                        class: 'btn btn-danger',
                        dataBind: {
                            click: '$component.doRemove'
                        }
                    }, 'X'))
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
            class: 'form-group'
        }, [
            label('Create a new Narrative: '),
            div({
                class: 'input-group'
            }, [
                input({
                    class: 'form-control'
                }),
                span({
                    class: 'input-group-btn'
                }, button({
                    class: 'btn btn-primary'
                }, 'Create'))
            ])
        ]);
    }

    function buildCopyDisplay() {
        return div([
            p([
                buildNarrativeSelector(),
                '(' + span({
                    dataBind: {
                        text: 'selectedNarrative'
                    }
                }),
                ')'
            ]),
            p([
                buildNewNarrativeForm()
            ]),

            button({
                class: 'btn btn-primary',
                dataBind: {
                    disable: '!selectedNarrative() || selectedNarrative().length === 0'
                }
            }, 'Copy')
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
                        title: 'Copy to A Narrative',
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

        return;
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }

    return component;
});