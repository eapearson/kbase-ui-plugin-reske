define([
    'knockout-plus',
    'kb_common/html',
    '../../common',
    'bootstrap',
    'css!font_awesome'
], function (
    ko,
    html,
    common
) {
    'use strict';

    var t = html.tag,
        a = t('a'),
        select = t('select'),
        option = t('option'),
        span = t('span'),
        div = t('div'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td');

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

        return {
            item: params.item,
            doOpenNarrative: doOpenNarrative,
            doOpenDataview: doOpenDataview,
            doKeep: doKeep,
            isInCart: isInCart,
            runtime: params.runtime
        };
    }

    function buildTypeView() {
        return table({
            class: '-table '
        }, [
            tr([
                th('Scientific name'),
                td({
                    dataBind: {
                        text: 'item.genome.scientificName'
                    },
                    class: '-scientific-name'
                })
            ]),
            tr([
                th('Taxonomy'),
                td(
                    [
                        '<!-- ko if: item.genome.taxonomy.length === 0 -->',
                        '-',
                        '<!-- /ko -->',
                        '<!-- ko if: item.genome.taxonomy.length > 0 -->',

                        select({
                            class: 'form-control',
                            style: {
                                backgroundColor: 'transparent',
                                backgroundImage: 'none',
                                '-webkit-appearance': 'none',
                                disabled: true,
                                readonly: true
                            },
                            dataBind: {
                                foreach: 'item.genome.taxonomy'
                            }
                        }, option({
                            disabled: true,
                            dataBind: {
                                value: '$data',
                                text: '$data',
                                attr: {
                                    selected: '$index() === 0 ? "selected" : false'
                                }
                            }
                        })),
                        '<!-- /ko -->'
                    ]
                )
            ]),
            tr([
                th('Features '),
                td(div({
                    dataBind: {
                        numberText: 'item.genome.featureCount',
                        numberFormat: '"0,0"'
                    },
                    class: '-feature-count'
                }))
            ])
        ]);
    }

    function template() {
        return div({
            class: '-detail'
        }, [
            div([
                div({
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '50%',
                        padding: '4px',
                        boxSizing: 'border-box'
                    }
                }, div({
                    dataBind: {
                        component: {
                            name: '"reske/search/data/type/genome/view/nutshell"',
                            params: {
                                runtime: 'runtime',
                                item: 'item'
                            }
                        }
                    }
                })),
                div({
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '50%',
                        padding: '4px',
                        boxSizing: 'border-box'
                    }
                }, common.buildMetaInfo())
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