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
        return div({
            style: {
                border: '2px blue solid',
                padding: '4px'
            }
        }, [
            div({
                style: {
                    display: 'inline-block',
                    verticalAlign: 'top',
                    width: '15%'
                }
            }, [
                // span({
                //     class: 'fa fa-question fa-2x'
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
                    width: '30%'
                }
            }),
            div({
                dataBind: {
                    text: 'guid'
                },
                style: {
                    display: 'inline-block',
                    verticalAlign: 'top',
                    width: '30%'
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