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
        div = t('div');

    function viewModel(params) {
        function doOpenNarrative(data) {
            var url = '/narrative/' + data.item.context.narrativeId;
            window.open(url, '_blank');
        }

        function doOpenDataview(data) {
            var url = '#dataview/' + data.item.meta.ids.dataviewId;
            window.open(url);
        }

        return {
            item: params.item,
            doOpenNarrative: doOpenNarrative,
            doOpenDataview: doOpenDataview
        };
    }

    function template() {
        return div({
            class: '-summary'
        }, [
            div([
                div({
                    class: '-field -scientific-name',
                    style: {

                        width: '40%'
                    }
                }, [
                    a({
                        dataBind: {
                            attr: {
                                href: '"#dataview/" + item.meta.ids.dataviewId'
                            },
                            text: 'item.genome.scientificName'
                        },
                        target: '_blank'
                    })
                ]),
                div({
                    dataBind: {
                        text: 'item.genome.domain'
                    },
                    class: '-field -domain',
                    style: {
                        width: '20%'
                    }
                }),
                div({
                    dataBind: {
                        numberText: 'item.genome.featureCount',
                        numberFormat: '"0,0"'
                    },
                    class: '-field -feature-count',
                    style: {
                        width: '10%'
                    }
                }),

                div({
                    dataBind: {
                        text: 'item.meta.created.at'
                    },
                    class: '-field -created',
                    style: {
                        width: '15%'
                    }
                }),
                div({
                    dataBind: {
                        text: 'item.meta.owner'
                    },
                    class: '-field -owner',
                    style: {
                        width: '15%'
                    }
                })
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