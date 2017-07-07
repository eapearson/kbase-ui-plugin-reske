define([
    'knockout-plus',
    'kb_common/html',

    'css!./tabset.css'
], function (
    ko,
    html
) {
    'use strict';

    var t = html.tag,
        ul = t('ul'),
        li = t('li'),
        a = t('a'),
        span = t('span'),
        div = t('div');

    // bootstrap tabs implemeneted in knockout.
    function makeTab(params) {
        return {
            label: params.label,
            component: params.component,
            content: params.content,
            active: ko.observable(false),
            closable: ko.observable(params.closable || false)
        };
    }

    function viewModel(params) {
        var tabsetId = html.genId();
        var tabs = ko.observableArray();
        var tabClasses = ko.observableArray(['nav', 'nav-tabs']);
        var activeTab = ko.observable();

        var hostedVM = params.vm;

        params.tabs.forEach(function (tab) {
            tabs.push(makeTab(tab));
        });

        if (!('active' in params)) {
            if (tabs().length > 0) {
                tabs()[0].active(true);
                activeTab(tabs()[0]);
            }
        }

        function doCloseTab(tab) {
            var index = tabs.indexOf(tab);
            tabs.remove(tab);
            if (index === 0) {
                return;
            }
            var currentTab = tabs()[index - 1];
            activateTab(currentTab);
            currentTab.active(true);
        }

        function addTab(tab) {
            //console.log('adding tab, my hosted vm is', ko.toJSON(hostedVM));
            var newTab = makeTab(tab);
            tabs.push(newTab);
            deactivateCurrentTab();
            activateTab(newTab);
        }

        function activateTab(tab) {
            tab.active(true);
            activeTab(tab);
        }

        function deactivateCurrentTab() {
            if (activeTab()) {
                activeTab().active(false);
            }
        }

        function doSelectTab(tab) {
            deactivateCurrentTab();
            activateTab(tab);
        }

        return {
            tabs: tabs,
            tabClasses: tabClasses,
            tabsetId: tabsetId,
            doCloseTab: doCloseTab,
            doSelectTab: doSelectTab,
            addTab: addTab,
            hostedVM: hostedVM
        };
    }

    function template() {
        return div({
            class: 'component-tabset'
        }, [
            ul({
                dataBind: {
                    attr: {
                        id: 'tabsetId'
                    },
                    foreach: 'tabs'
                },
                // class: 'nav nav-tabs',
                class: 'kb-tabs',
                role: 'tablist'
            }, li({
                role: 'presentation',
                class: 'tabs',
                dataBind: {
                    css: {
                        active: 'active'
                    }
                }
            }, [
                a({
                    dataBind: {
                        // attr: {
                        //     ariaControls: 'panelId'
                        // },
                        click: '$component.doSelectTab'
                    },
                    role: 'tab',
                    style: {
                        display: 'inline-block'
                    }
                }, [
                    span({
                        dataBind: {
                            text: 'label'
                        }
                    }),
                    '<!-- ko if: closable -->',
                    span({
                        class: '-button',
                        dataBind: {
                            click: '$component.doCloseTab'
                        }
                    }, span({
                        class: 'fa fa-times',
                    })),
                    '<!-- /ko -->'
                ]),
            ])),
            div({
                class: 'tab-content',
                dataBind: {
                    foreach: 'tabs'
                }
            }, div({
                dataBind: {
                    attr: {
                        active: 'active'
                    },
                    css: { in: 'active',
                        active: 'active'
                    }
                },
                class: 'tab-pane fade',
                role: 'tabpanel'
            }, [
                '<!-- ko if: $data.component -->',
                div({
                    dataBind: {
                        component: {
                            name: 'component.name',
                            params: '$component.hostedVM'
                        }
                    }
                }),
                '<!-- /ko -->',
                '<!-- ko if: $data.content -->',
                div({
                    dataBind: {
                        html: '$data.content'
                    }
                }),
                '<!-- /ko -->',
            ]))
        ]);
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }

    ko.components.register('tabset', component());
});