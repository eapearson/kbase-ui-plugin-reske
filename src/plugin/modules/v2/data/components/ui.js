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
        return div({
            class: 'component-reske-data-search'
        }, [
            div([
                div({
                    dataBind: {
                        component: {
                            name: '"reske-search/data/search/controls"',
                            params: {
                                search: 'search'
                            }
                        }
                    }
                })
            ]),
            div({
                dataBind: {
                    component: {
                        name: '"tabset2"',
                        params: {
                            vm: 'search'
                        }
                    }
                }
            })
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