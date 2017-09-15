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
        function doOpenNarrative(data) {
            var url = '/narrative/' + data.item.context.narrativeId;
            window.open(url, '_blank');
        }

        function doOpenDataview(data) {
            var url = '#dataview/' + data.item.meta.ids.dataviewId;
            window.open(url, '_blank');
        }

        function doKeep(data) {
            if (isInCart()) {
                params.cart.removeItem(data.item);
            } else {
                params.cart.addItem(data.item);
            }
        }

        var isInCart = ko.pureComputed(function () {
            // return params.cart.hasItem(params.item);
            return params.cart.items().some(function (item) {
                return item.guid === params.item.guid;
            });
        });

        function doToggleDetail() {
            params.item.showDetail(!params.item.showDetail());
        }

        return {
            runtime: params.runtime,
            item: params.item,
            doOpenNarrative: doOpenNarrative,
            doOpenDataview: doOpenDataview,
            doKeep: doKeep,
            doToggleDetail: doToggleDetail,
            isInCart: isInCart
        };
    }

    function template() {
        return div({
            class: 'component-reske-genome-browse -row'
        }, [
            // first the summary row.

            div({
                // dataBind: {
                //     click: 'doToggleDetail',
                //     clickBubble: false
                // }
            }, [
                // div({
                //     style: {
                //         display: 'inline-block',
                //         verticalAlign: 'top',
                //         width: '5%',
                //     },
                //     class: '-field -resultNumber'
                // }, span({
                //     dataBind: {
                //         text: 'item.meta.resultNumber'
                //     }
                // })),
                div({
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '5%',
                    },
                    class: '-field -viewToggle'
                }, span({
                    dataBind: {
                        css: {
                            'fa-chevron-right': '!item.showDetail()',
                            'fa-chevron-down': 'item.showDetail()'
                        },
                        click: 'doToggleDetail',
                        clickBubble: false
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
                                name: '"reske/search/data/type/genome/view/summary"',
                                params: {
                                    item: 'item'
                                }
                            }
                        }
                    })
                ]),
                div({
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '10%',
                        textAlign: 'right'
                    }
                }, div({
                    xclass: '-features'
                }, [
                    common.buildSharingInfo()
                ])),
                div({
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '15%',
                        textAlign: 'right'
                    }
                }, div({
                    xclass: '-features'
                }, [
                    common.buildActions()
                ]))
            ]),
            // then detail
            '<!-- ko if: item.showDetail -->',
            div([
                div({
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '5%',
                    },
                    class: '-field -resultNumber'
                }),
                div({
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '95%'
                    }
                }, [
                    div({
                        dataBind: {
                            component: {
                                name: '"reske/search/data/type/genome/view/detail"',
                                params: {
                                    item: 'item',
                                    runtime: 'runtime'
                                }
                            }
                        }
                    })
                ])
            ]),
            '<!-- /ko -->'
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