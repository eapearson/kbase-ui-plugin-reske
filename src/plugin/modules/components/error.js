define([
    'knockout-plus',
    'kb_common/html',
    'kb_common/bootstrapUtils'
], function (
    ko,
    html,
    BS
) {
    'use strict';
    var t = html.tag,
        span = t('span'),
        a = t('a'),
        ul = t('ul'),
        li = t('li'),
        div = t('div');

    function viewModel(params) {
        var title = params.title;
        var message = params.error.message;
        var details = params.error.details || null;
        var references = params.error.references || [];
        var data = params.error.data;
        var renderedData = BS.buildPresentableJson(data);

        return {
            title: title,
            message: message,
            details: details,
            references: references,
            data: data,
            renderedData: renderedData
        };
    }

    function template() {
        return div({
            class: 'component-reske-error'
        }, [
            BS.buildPanel({
                title: span({ dataBind: { text: 'title' } }),
                type: 'danger',
                // classes: 'kb-panel-light',
                collapsed: true,
                body: div([
                    div({
                        class: '-message',
                        dataBind: {
                            text: 'message'
                        }
                    }),
                    BS.buildCollapsiblePanel({
                        title: 'Details',
                        type: 'default',
                        classes: 'kb-panel-error',
                        collapsed: true,
                        body: div({
                            dataBind: {
                                html: 'details'
                            }
                        })
                    }),
                    BS.buildCollapsiblePanel({
                        title: 'References',
                        type: 'default',
                        classes: 'kb-panel-error',
                        collapsed: true,
                        body: ul({
                            dataBind: {
                                foreach: 'references'
                            }
                        }, li([
                            a({
                                dataBind: {
                                    attr: {
                                        href: 'url'
                                    },
                                    text: 'label'
                                },
                                target: '_blank'
                            })
                        ]))
                    }),
                    BS.buildCollapsiblePanel({
                        title: 'Data',
                        type: 'default',
                        classes: 'kb-panel-error',
                        collapsed: true,
                        body: div({
                            dataBind: {
                                html: 'renderedData'
                            }
                        })
                    })
                ])
            }),

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