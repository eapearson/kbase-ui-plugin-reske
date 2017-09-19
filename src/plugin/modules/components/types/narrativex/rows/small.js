define([
    'kb_common/html',
], function (
    html
) {
    'use strict';

    var t = html.tag,
        div = t('div');

    function viewModel(params) {
        return params;
    }

    function template() {
        return div([
            div({
                style: {
                    display: 'inline-block',
                    verticalAlign: 'top',
                    width: '15%'
                }
            }, [
                // span({
                //     class: 'fa fa-file-o fa-2x'
                // }),
                div({
                    dataBind: {
                        text: 'type'
                    },
                    style: {
                        fontStyle: 'italic'
                    }
                })
            ]),
            div({
                dataBind: {
                    text: 'object_name'
                },
                style: {
                    display: 'inline-block',
                    verticalAlign: 'top',
                    width: '60%'
                }
            }),
            div({
                dataBind: {
                    text: 'datestring'
                },
                style: {
                    display: 'inline-block',
                    verticalAlign: 'top',
                    width: '25%'
                }
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