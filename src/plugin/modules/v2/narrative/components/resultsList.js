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
        div = t('div'),
        p = t('p'),
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

        var columns = [
            // {
            //     name: 'rowNumber',
            //     label: '#',
            //     type: 'integer',
            //     style: {
            //         width: '5%'
            //     }
            // }, 
            {
                name: 'title',
                label: 'Title',
                type: 'string',
                sort: {
                    keyName: 'title',
                    direction: 'ascending'
                },
                style: {
                    width: '35%'
                },
                action: doOpenNarrative
            },
            // {
            //     name: 'created',
            //     label: 'Created',
            //     type: 'string',
            //     style: {
            //         width: '15%',
            //         // 'text-align': 'right',
            //         // 'font-family': 'monospace'
            //     }
            // },
            {
                name: 'cellCount',
                label: 'Cells',
                type: 'number',
                style: {
                    width: '5%'
                }
            },
            {
                name: 'objectCount',
                label: 'Objects',
                type: 'number',
                style: {
                    width: '5%'
                }
            },
            {
                name: 'updated',
                label: 'Last updated',
                type: 'string',
                sort: {
                    keyName: 'timestamp',
                    isTimestamp: true,
                    direction: 'descending'
                },
                style: {
                    width: '15%',
                    // 'text-align': 'right',
                    // 'font-family': 'monospace'
                }
            },
            // {
            //     name: 'owner',
            //     label: 'Owner',
            //     type: 'string',
            //     style: {
            //         width: '20%'
            //     }
            // },
            {
                name: 'owner',
                label: 'Owner',
                type: 'string',
                style: {
                    width: '10%'
                }
            },
            {
                name: 'permission',
                label: 'Permission',
                type: 'string',
                style: {
                    width: '5%',
                    'text-align': 'center'
                }
            },
            {
                name: 'public',
                label: 'Public?',
                type: 'string',
                style: {
                    width: '5%',
                    'text-align': 'center'
                }
            },

            {
                name: 'creator',
                label: 'Created by',
                type: 'string',
                style: {
                    width: '10%'
                }
                // sort: {
                //     keyName: 'creator',
                //     isTimestamp: false,
                //     direction: 'ascending'
                // }
            }
        ];
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

    function buildResultsHeader() {
        return thead({},
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
                        style: 'column.style'
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
        );
    }

    function buildResultsRows() {
        return tbody({
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
                td({
                    dataBind: {
                        style: 'column.style'
                    }
                }, [
                    '<!-- ko if: column.action -->',
                    a({
                        dataBind: {
                            html: 'item[column.name]',
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
                            html: 'item[column.name]'
                        }
                    }),
                    '<!-- /ko -->'
                ])
            ])
        ]);
    }

    function buildLoading() {
        return tbody({}, [
            tr([
                td({
                    dataBind: {
                        attr: {
                            colspan: 'columns.length'
                        }
                    }
                }, html.loading())
            ])
        ]);
    }

    function buildError() {
        return tbody({}, [
            tr([
                td({
                    dataBind: {
                        attr: {
                            colspan: 'columns.length'
                        }
                    }
                }, BS.buildPanel({
                    title: 'Error',
                    type: 'danger',
                    classes: ['kb-panel-light'],
                    body: div([
                        p('There was an error fetching the data for this search results page:'),
                        p({
                            dataBind: {
                                text: 'search.error'
                            }
                        }),
                        p('You may continue to browse through search results.')
                    ])
                }))
            ])
        ]);
    }

    function buildResultsTable() {
        return table({
            class: 'table table-striped'
        }, [
            buildResultsHeader(),
            '<!-- ko if: search.isSearching -->',
            buildLoading(),
            '<!-- /ko -->',
            '<!-- ko if: search.isError -->',
            buildError(),
            '<!-- /ko -->',
            '<!-- ko ifnot: search.isSearching() || search.isError() -->',
            buildResultsRows(),
            '<!-- /ko -->'
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