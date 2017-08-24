define([
    'knockout-plus',
    'kb_common/html',
    './components/tabset'
], function (
    ko,
    html
) {
    'use strict';

    var t = html.tag,
        button = t('button'),
        div = t('div');

    // sample compontnes
    function component1() {
        return {
            viewModel: function (params) {
                return {
                    param1: 'the size',
                    param2: 'is',
                    param3: params.size,
                    dispose: function () {
                        console.log('disposing...');
                    },
                    doAddTab: function (data, event, tab) {
                        tab.addTab({
                            label: 'My New Tab',
                            closable: true,
                            content: 'hi, close me now'
                        });
                    }
                };
            },
            template: div([
                'This is template 1: ',
                div({
                    dataBind: {
                        text: 'param1'
                    }
                }),
                ' ',
                div({
                    dataBind: {
                        text: 'param2'
                    }
                }),
                ' ',
                div({
                    dataBind: {
                        text: 'param3'
                    }
                }),
                div([
                    button({
                        dataBind: {
                            click: 'function (data, event) {doAddTab(data, event, $parents[1]);}'
                        }
                    }, 'Add Tab')
                ])
            ])
        };
    }
    ko.components.register('test/component1', component1());

    function component2() {
        function ViewModel(params) {
            this.param1 = 'Hello';
            this.param2 = 'There';
            this.param3 = params.name;
        }
        ViewModel.prototype.dispose = function () {
            console.log('Disposing...');
        };
        return {
            // viewModel: function (params) {
            //     return {
            //         param1: 'hi',
            //         param2: 'there',
            //         param3: params.name,
            //         dispose: function () {
            //             console.log('disposing...')
            //         }
            //     };
            // },
            viewModel: ViewModel,
            template: div([
                'This is template 1: ',
                div({
                    dataBind: {
                        text: 'param1'
                    }
                }),
                ' ',
                div({
                    dataBind: {
                        text: 'param2'
                    }
                }),
                ' ',
                div({
                    dataBind: {
                        text: 'param3'
                    }
                })
            ])
        };
    }
    ko.components.register('test_component2', component2());

    function factory(config) {
        var hostNode, container, runtime = config;

        function attach(node) {
            hostNode = node;
            container = node.appendChild(document.createElement('div'));
        }

        function start(params) {
            container.innerHTML = div({
                dataBind: {
                    component: {
                        name: '"tabset"',
                        params: {
                            tabs: 'tabs'
                        }
                    }
                }
            });
            ko.applyBindings({
                tabs: [{
                    label: 'First',
                    content: 'This is my first tab!'
                }, {
                    label: 'Second',
                    content: 'This is my second tab...'
                }, {
                    label: 'Third',
                    component: {
                        name: 'test_component2',
                        params: {
                            name: 'Erik'
                        }
                    }
                }, {
                    label: 'Fourth',
                    closable: true,
                    component: {
                        name: 'test/component1',
                        params: {
                            size: 42
                        }
                    }
                }]
            }, container);
        }

        function stop() {

        }

        function detach() {
            if (hostNode && container) {
                hostNode.removeChild(container);
            }
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