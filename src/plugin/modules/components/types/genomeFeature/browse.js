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
            var url = '/narrative/' + data.item.context.narrativeId;
            window.open(url, '_blank');
        }
        // ?sub=Feature&subid=kb|g.220339.CDS.1139
        function doOpenDataview(data) {
            var url = '#dataview/' + data.item.meta.ids.dataviewId;
            window.open(url, '_blank');
        }

        function doKeep(data) {
            console.log('keeping...', data);
        }

        return {
            item: params.item,
            doOpenNarrative: doOpenNarrative,
            doOpenDataview: doOpenDataview,
            doKeep: doKeep
        };
    }

    function template() {
        return div({
            class: 'component-reske-genomefeature-browse -row'
        }, [
            div([
                div({
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '5%'
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
                    div({
                        class: '-title'
                    }, [
                        common.buildTypeIcon(),
                        a({
                            dataBind: {
                                attr: {
                                    href: '"#dataview/" + item.meta.ids.dataviewId'
                                },
                                text: 'item.genomeFeature.title'
                            },
                            target: '_blank',
                            style: {
                                verticalAlign: 'middle',
                                marginLeft: '4px'
                            }
                        })
                    ]),
                    common.buildMetaInfo(),

                    table({
                        class: '-table '
                    }, [
                        tr([
                            th('Type'),
                            td({
                                dataBind: {
                                    text: 'item.genomeFeature.featureType'
                                },
                                class: '-feature-type'
                            })
                        ]),
                        tr([
                            th('Function'),
                            td({
                                dataBind: {
                                    text: 'item.genomeFeature.function'
                                },
                                class: '-function'
                            })
                        ]),

                        tr([
                            th('Location '),
                            td({
                                class: '-location'
                            }, div({
                                style: {
                                    display: 'inline-block'
                                },
                                dataBind: {
                                    foreach: 'item.genomeFeature.location'
                                }
                            }, [
                                // span({
                                //     class: '-genome',
                                //     dataBind: {
                                //         text: 'item.genomeFeature.location.genome'
                                //     }
                                // }),
                                // ' : ',
                                span({
                                    class: '-start',
                                    dataBind: {
                                        text: 'start'
                                    }
                                }),
                                ' - ',
                                span({
                                    class: '-end',
                                    dataBind: {
                                        text: 'end'
                                    }
                                }),
                                ' ',
                                '<!-- ko if: direction === "+" -->',
                                span({
                                    class: 'fa fa-plus-circle',
                                    style: {
                                        color: '#AAA'
                                    }
                                }),
                                '<!-- /ko -->',
                                '<!-- ko if: direction === "-" -->',
                                span({
                                    class: 'fa fa-minus-circle',
                                    style: {
                                        color: '#AAA'
                                    }
                                }),
                                '<!-- /ko -->',
                            ]))
                        ]),

                        tr([
                            th('Scientific name'),
                            td({
                                dataBind: {
                                    text: 'item.genomeFeature.genome.scientificName'
                                },
                                class: '-scientific-name'
                            })
                        ])
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