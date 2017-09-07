define([
    'knockout-plus',
    'kb_common/html'
], function (
    ko,
    html
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        a = t('a'),
        span = t('span'),
        table = t('table'),
        tr = t('tr'),
        td = t('td'),
        th = t('th'),
        thead = t('thead'),
        tbody = t('tbody');

    function viewModel(params) {

        function doOpenNarrative(data) {
            var url = params.search.runtime.config('services.narrative.url');
            window.open(url + '/narrative/' + data.narrativeId, '_blank');
        }

        var columns = [{
            name: 'rowNumber',
            label: '#',
            type: 'integer',
            width: '5%'
        }, {
            name: 'title',
            label: 'Title',
            type: 'string',
            width: '50%',
            sort: {
                keyName: 'title',
                direction: 'ascending'
            },
            action: doOpenNarrative
        }, {
            name: 'timestamp',
            label: 'Timestamp',
            type: 'string',
            width: '15%',
            sort: {
                keyName: 'timestamp',
                isTimestamp: true,
                direction: 'descending'
            }
        }, {
            name: 'owner',
            label: 'Owner',
            type: 'string',
            width: '15%'
        }, {
            name: 'creator',
            label: 'Creator',
            type: 'string',
            width: '15%',
            sort: {
                keyName: 'creator',
                isTimestamp: false,
                direction: 'ascending'
            }
        }];
        var columnsMap = columns.reduce(function (map, column) {
            map[column.name] = column;
            return map;
        }, {});

        var sortColumn = ko.observable('timestamp');

        var sortDirection = ko.observable('descending');

        function doSort(data) {
            var columnName = data.name;
            if (columnName === sortColumn()) {
                if (sortDirection() === 'ascending') {
                    sortDirection('descending');
                } else {
                    sortDirection('ascending');
                }
            } else {
                sortColumn(columnName);
                sortDirection(columnsMap[columnName].sort.direction);
            }

            var column = columnsMap[columnName];

            // Maybe do this through a subscription to the individual 
            // observables...
            var sortRule = {
                is_timestamp: column.sort.isTimestamp ? 1 : 0,
                is_object_name: column.sort.isObjectName ? 1 : 0,
                key_name: column.sort.keyName,
                descending: sortDirection() === 'descending' ? 1 : 0
            };
            params.search.sortingRules.removeAll();
            params.search.sortingRules.push(sortRule);
        }

        return {
            search: params.search,
            columns: columns,
            doSort: doSort,
            doOpenNarrative: doOpenNarrative,
            sortColumn: sortColumn,
            sortDirection: sortDirection
        };
    }

    function buildResultsTable() {
        return table({
            class: 'table table-striped'
        }, [
            thead({},
                tr({
                    dataBind: {
                        foreach: {
                            data: '$component.columns',
                            as: '"column"'
                        }
                    }
                }, [
                    th({
                        dataBind: {
                            style: {
                                width: 'column.width',
                            }
                        }
                    }, [
                        '<!-- ko if: column.sort -->',
                        span({
                            dataBind: {
                                text: 'column.label',
                                click: '$component.doSort'
                            },
                            style: {
                                cursor: 'pointer'
                            }
                        }),
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
                    ])
                ])
            ),
            tbody({
                dataBind: {
                    foreach: {
                        data: 'search.searchResults',
                        as: '"item"'
                    }
                }
            }, [
                tr({
                    dataBind: {
                        foreach: {
                            data: '$component.columns',
                            as: '"column"'
                        }
                    }
                }, [
                    td([
                        '<!-- ko if: column.action -->',
                        a({
                            dataBind: {
                                text: 'item[column.name]',
                                click: 'function () {column.action(item);}'
                            },
                            style: {
                                cursor: 'pointer'
                            }
                        }),
                        '<!-- /ko -->',
                        '<!-- ko ifnot: column.action -->',
                        span({
                            dataBind: {
                                text: 'item[column.name]'
                            }
                        }),
                        '<!-- /ko -->'
                    ])
                ])
            ])
        ]);
    }

    function template() {
        return div({
            class: 'container-fluid'
        }, [
            buildResultsTable()
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