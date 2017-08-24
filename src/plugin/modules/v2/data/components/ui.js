/*
    Overall UI for the RESKE Narrative Search
*/
define([
    'knockout-plus',
    'kb_common/html'
], function (
    ko,
    html
) {
    'use strict';

    var t = html.tag,
        div = t('div');

    function viewModel(params) {

        return {
            search: params.search
        };
    }

    function template() {
        return div({}, [
            div([
                div({
                    dataBind: {
                        component: {
                            name: '"reske/data/search/controls"',
                            params: {
                                search: 'search'
                            }
                        }
                    }
                })
            ]),
            // div([
            //     div({
            //         dataBind: {
            //             component: {
            //                 name: '"reske/data/search/results"',
            //                 params: {
            //                     search: 'search'
            //                 }
            //             }
            //         }
            //     })
            // ])
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