define([
    'knockout-plus',
    'highlight',
    'kb_common/html',
    '../common',

    'css!./browse.css'
], function (
    ko,
    highlight,
    html,
    common
) {
    'use strict';

    var t = html.tag,
        a = t('a'),
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
            class: '-table'
        }, [
            tr([
                th('Sequenced with'),
                td({
                    dataBind: {
                        html: 'item.singleEndLibrary.sequencingTechnology'
                    },
                    class: '-sequence-tehcnology'
                })
            ]),
            tr([
                th('GC content (%)'),
                td(div({
                    dataBind: {
                        html: 'item.singleEndLibrary.gcContent.formatted'
                    },
                    class: '-gc-content -number'
                }))
            ]),
            tr([
                th('Read count'),
                td(div({
                    dataBind: {
                        html: 'item.singleEndLibrary.readCount.formatted'
                    },
                    class: '-read-count -number'
                }))
            ]),
            tr([
                th('Mean read length'),
                td(div({
                    dataBind: {
                        html: 'item.singleEndLibrary.meanReadLength.formatted'
                    },
                    class: '-mean-read-length -number'
                }))
            ])
        ]);
    }

    function template() {
        return div({
            class: 'component-reske-single-end-library-browse -row'
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
                                    text: 'item.singleEndLibrary.title'
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
                    class: '-features'
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