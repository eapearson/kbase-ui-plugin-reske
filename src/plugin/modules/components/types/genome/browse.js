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
        a = t('a'),
        select = t('select'),
        span = t('span'),
        div = t('div'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td');

    function viewModel(params) {
        function doOpenNarrative(data) {
            var url = '/narrative/' + data.item.meta.narrativeId;
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
            isInCart: isInCart
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
                                // border: 'none',
                                // outline: 'none',
                                '-webkit-appearance': 'none'

                            },
                            dataBind: {
                                options: 'item.genome.taxonomy',
                                optionsText: '$data',
                                optionsValue: '$data'
                            }
                        }),
                        // div({
                        //     class: '-taxonomy',
                        //     dataBind: {
                        //         foreach: 'item.genome.taxonomy'
                        //     }
                        // }, span([
                        //     span({
                        //         dataBind: {
                        //             text: '$data'
                        //         }
                        //     }),
                        //     '<!-- ko if: $index() < $parent.item.genome.taxonomy.length - 1 -->',
                        //     span({
                        //         class: 'fa fa-angle-right',
                        //         style: {
                        //             margin: '0 4px'
                        //         }
                        //     }),
                        //     '<!-- /ko -->'
                        // ])),
                        '<!-- /ko -->'
                    ]
                )
            ]),
            tr([
                th('Features '),
                td(div({
                    dataBind: {
                        html: 'item.genome.featureCount.formatted'
                    },
                    class: '-feature-count'
                }))
            ])
        ]);
    }

    function template() {
        return div({
            class: 'component-reske-genome-browse -row'
        }, [
            div([
                div({
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '5%',
                    },
                    class: '-field -resultNumber'
                }, span({
                    dataBind: {
                        text: 'item.meta.resultNumber'
                    }
                })),
                div({
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '70%'
                    }
                }, [
                    div([
                        div({
                            class: '-title'
                        }, [
                            common.buildTypeIcon(),
                            a({
                                dataBind: {
                                    attr: {
                                        href: '"#dataview/" + item.meta.ids.dataviewId'
                                    },
                                    text: 'item.genome.title'
                                },
                                target: '_blank',
                                style: {
                                    verticalAlign: 'middle',
                                    marginLeft: '4px'
                                }
                            })
                        ]),
                    ]),
                    div([
                        div({
                            style: {
                                display: 'inline-block',
                                verticalAlign: 'top',
                                width: '50%',
                                padding: '4px',
                                boxSizing: 'border-box'
                            }
                        }, buildTypeView()),
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
                ]),


                div({
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '25%',
                        textAlign: 'right'
                    }
                }, div({
                    xclass: '-features'
                }, [
                    common.buildSharingInfo(),
                    common.buildActions()
                ]))
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