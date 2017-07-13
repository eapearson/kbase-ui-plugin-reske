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
            class: 'component-reske-assembly-contig-browse -row'
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
                                text: 'item.assemblyContig.title'
                            },
                            target: '_blank',
                            style: {
                                verticalAlign: 'middle',
                                marginLeft: '4px'
                            }
                        })
                    ]),
                    common.buildMetaInfo(),
                    div([
                        'ID: ',
                        span({
                            class: '-contig-id',
                            dataBind: {
                                text: 'item.assemblyContig.contigId'
                            }
                        })
                    ]),
                    table({
                        class: '-table '
                    }, [
                        tr([
                            th('Length (bp)'),
                            td(div({
                                dataBind: {
                                    html: 'item.assemblyContig.length.formatted'
                                },
                                class: '-length -number'
                            }))
                        ]),
                        tr([
                            th('GC content (%)'),
                            td(div({
                                dataBind: {
                                    html: 'item.assemblyContig.gcContent.formatted'
                                },
                                class: '-gc-content -number'
                            }))
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

    ko.components.register('reske/assemblyContig/browse', component());
});