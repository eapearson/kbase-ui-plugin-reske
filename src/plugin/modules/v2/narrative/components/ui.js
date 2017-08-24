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
            searchVM: params.searchVM
        };
    }

    function template() {
        return div({}, [
            div([
                div({
                    dataBind: {
                        component: {
                            name: '"reske/narrative/search/controls"',
                            params: {
                                searchVM: 'searchVM'
                            }
                        }
                    }
                })
            ]),
            div([
                div({
                    dataBind: {
                        component: {
                            name: '"reske/narrative/search/browser"',
                            params: {
                                searchVM: 'searchVM'
                            }
                        }
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