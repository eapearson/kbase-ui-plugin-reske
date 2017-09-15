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
        span = t('span'),
        div = t('div');

    function viewModel(params) {
        return {};
    }

    function buildSortLabelx(fieldName, fieldLabel) {
        return [
            '<!-- ko with: ' + fieldName + ' -->',
            span({
                dataBind: {
                    click: '$component.doSort'
                },
                style: {
                    cursor: 'pointer',
                    textDecoration: 'underline'
                }
            }, fieldLabel),
            '<!-- ko if: $component.sortColumn() === column.name -->',
            '<!-- ko if: $component.sortDirection() === "descending" -->',
            span({
                class: 'fa fa-sort-desc'
            }),
            '<!-- /ko -->',
            '<!-- ko if: $component.sortDirection() === "ascending" -->',
            span({
                class: 'fa fa-sort-asc'
            }),
            '<!-- /ko -->',
            '<!-- /ko -->',
            '<!-- /ko -->',
            '<!-- ko if: !column.sort -->',
            span({
                dataBind: {
                    text: 'column.label'
                }
            }),
            '<!-- /ko -->'
        ];
    }

    function buildSortLabel(fieldName, fieldLabel) {
        return fieldLabel;
    }

    function template() {
        return div({}, [
            div({
                class: ' -field -title',
                style: {
                    width: '40%'
                }
            }, 'Scientific name'),

            div({
                class: '-field -domain',
                style: {
                    width: '20%'
                }
            }, 'Domain'),
            div({
                class: '-field -feature-count',
                style: {
                    width: '10%'
                }
            }, buildSortLabel('features', 'Features')),
            div({
                class: '-field -created',
                style: {
                    width: '15%'
                }
            }, 'Created'),
            div({
                class: '-field -owner',
                style: {
                    width: '15%'
                }
            }, 'Owner')
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