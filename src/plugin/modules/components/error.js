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
        div = t('div');


    function viewModel(params) {
        var title = params.title;
        var message = params.message;
        var details = params.details || null;
        var references = params.references || [];

        return {
            title: title,
            message: message,
            details: details,
            references: references
        };
    }

    function template() {
        return div({
            class: 'component-reske-error'
        }, [
            // div({
            //     class: '-title',
            //     dataBind: {
            //         text: 'title'
            //     }
            // }),
            // div({
            //     class: '-message',
            //     dataBind: {
            //         text: 'message'
            //     }
            // }),
            BS.buildPanel({
                title: span({ dataBind: { text: 'title' } }),
                type: 'danger',
                classes: 'kb-panel-light',
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
                        classes: 'kb-panel-help',
                        collapsed: true,
                        body: 'details here if provided by the exception object ... or maybe synthesized by catching a specific exception and creating good text'
                    }),
                    BS.buildCollapsiblePanel({
                        title: 'References',
                        type: 'default',
                        classes: 'kb-panel-help',
                        collapsed: true,
                        body: 'references here... these are link + label to point the user to helpful resources, probably at kbase.us'
                    }),
                    BS.buildCollapsiblePanel({
                        title: 'Data',
                        type: 'default',
                        classes: 'kb-panel-help',
                        collapsed: true,
                        body: 'raw data provided by the error, if available, is here.'
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
    ko.components.register('reske/error', component());
});