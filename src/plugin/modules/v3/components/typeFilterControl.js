define([
    'knockout-plus',
    'kb_common/html'
], function (
    ko,
    html
) {
    'use strict';

    var t = html.tag,
        select = t('select'),
        option = t('option'),
        div = t('div'),
        span = t('span'),
        label = t('label');

    function viewModel(params) {

        var typeFilterOptions = params.search.typeFilterOptions.map(function (option) {
            return option;
        });
        typeFilterOptions.unshift({
            label: 'Select a Type',
            value: '_select_',
            enabled: true
        });

        function doRemoveTypeFilter(data) {
            params.search.typeFilter.remove(data);
        }

        function doSelectTypeFilter(data) {
            if (data.typeFilterInput() === '_select_') {
                return;
            }
            params.search.typeFilter.push(data.typeFilterInput());
            data.typeFilterInput('_select_');
        }

        return {
            search: params.search,
            // Type filter
            typeFilterInput: ko.observable('_select_'),
            typeFilterOptions: typeFilterOptions,
            doRemoveTypeFilter: doRemoveTypeFilter,
            doSelectTypeFilter: doSelectTypeFilter            
        };
    }

    function buildTypeFilter() {
        return div({
            class: 'form-group',
            style: {
                margin: '0 4px'
            }
        }, [
            label('Type'),
            '<!-- ko if: search.typeFilter().length === 0 -->',
            select({
                dataBind: {
                    value: 'typeFilterInput',
                    event: {
                        change: '$component.doSelectTypeFilter'
                    },
                    foreach: 'typeFilterOptions'
                },
                class: 'form-control',
                style: {
                    margin: '0 4px'
                }
            }, [
                '<!-- ko if: enabled -->',
                option({
                    dataBind: {
                        value: 'value',
                        text: 'label',
                        enable: 'enabled'
                    }
                }),
                '<!-- /ko -->'
            ]),
            '<!-- /ko -->',

            // selected types
            div({
                dataBind: {
                    foreach: 'search.typeFilter'
                },
                style: {
                    display: 'inline-block'
                }
            }, [
                span({
                    style: {
                        border: '1px silver solid',
                        borderRadius: '3px',
                        padding: '3px'
                    }
                }, [
                    span(({
                        dataBind: {
                            text: '$data'
                        },
                        style: {
                            padding: '3px'
                        }
                    })),
                    span({
                        dataBind: {
                            click: '$component.doRemoveTypeFilter'
                        },
                        class: 'kb-btn-mini'
                    }, 'x')
                ])
            ])
        ]);
    }


    function template() {
        return div({
            class: 'form-inline',
            style: {

            }
        }, [
            span({
                style: {
                    fontWeight: 'bold',
                    color: 'gray',
                    marginTop: '8px',
                    fontSize: '80%'
                }
            }),
            buildTypeFilter()
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