define([
    'knockout-plus',
    'kb_common/html',
    '../common',
    'bootstrap',
    'css!font_awesome'
], function (
    ko,
    html,
    common
) {
    'use strict';

    var t = html.tag,
        span = t('span'),
        div = t('div');

    function viewModel(params) {
        var showDetailAll = ko.observable(false);

        function doShowDetailAll() {
            showDetailAll(!showDetailAll());
        }

        showDetailAll.subscribe(function (newValue) {
            params.searchResults().forEach(function (item) {
                item.showDetail(showDetailAll());
            });
        });

        return {
            doShowDetailAll: doShowDetailAll,
            showDetailAll: showDetailAll,
        };
    }

    function template() {
        return div({
            class: 'component-reske-genome-header -header -row'
        }, [
            // div({
            //     style: {
            //         display: 'inline-block',
            //         verticalAlign: 'top',
            //         width: '5%',
            //     }
            // }),
            div({
                style: {
                    display: 'inline-block',
                    verticalAlign: 'top',
                    width: '5%',
                }
            }, span({
                dataBind: {
                    css: {
                        'fa-chevron-right': '!showDetailAll()',
                        'fa-chevron-down': 'showDetailAll()'
                    },
                    click: 'doShowDetailAll'
                },
                class: '-detail-toggle fa',
                style: {
                    cursor: 'pointer'
                }
            })),
            div({
                style: {
                    display: 'inline-block',
                    verticalAlign: 'top',
                    width: '70%'
                }
            }, [
                div({
                    dataBind: {
                        component: {
                            name: '"reske-search/data/type/genome/view/header"',
                            params: {

                            }
                        }
                    }
                })
            ]),
            div({
                class: '-field -sharing',
                style: {
                    width: '10%'
                }
            }, 'Sharing'),
            div({
                style: {
                    width: '15%'
                },
                class: '-field -actions'
            }, 'Actions')
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