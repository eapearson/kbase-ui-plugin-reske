define([
    'knockout-plus',
    'kb_common/html',
    'kb_common/props'
], function (
    ko,
    html,
    Props
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

        var item = params.item;

        function doOpenNarrative() {
            var url = '/narrative/' + item.context.narrativeId;
            window.open(url, '_blank');
        }

        function doOpenDataview() {
            var url = '#dataview/' + item.meta.ids.dataviewId;
            window.open(url, '_blank');
        }

        function getProp(obj, props, defaultValue) {
            if (typeof props === 'string') {
                props = props.split('.');
            } else if (props instanceof Array) {
                throw new TypeError('Invalid type for key: ' + (typeof props));
            }
            var i, temp = obj;
            for (i = 0; i < props.length; i += 1) {
                if ((temp === undefined) ||
                    (typeof temp !== 'object') ||
                    (temp === null)) {
                    return defaultValue;
                }
                temp = temp[props[i]];
            }
            if (temp === undefined) {
                return defaultValue;
            }
            return temp;
        }

        var columns = [{
            path: 'genome.scientificName',
            label: 'Scientific name',
            type: 'string',
            width: '40%',
            action: doOpenDataview,
            value: ko.pureComputed(function () {
                return item.genome.scientificName;
            })
        }, {
            path: 'genome.domain',
            label: 'Domain',
            type: 'string',
            width: '20%',
            value: ko.pureComputed(function () {
                return item.genome.domain;
            })
        }, {
            path: 'genome.featureCount',
            label: 'Feature count',
            type: 'number',
            format: '0,0',
            width: '10%',
            sort: {
                keyName: 'features',
                isTimestamp: false,
                direction: 'descending'
            },
            style: {
                'text-align': 'right',
                'padding-right': '20px',
                'font-family': 'monospace'
            },
            value: ko.pureComputed(function () {
                return item.genome.featureCount;
            })
        }, {
            path: 'meta.created.at',
            label: 'Created at',
            type: 'string',
            format: '',
            width: '15%',
            style: {
                'text-align': 'right',
                'padding-right': '20px',
            },
            value: ko.pureComputed(function () {
                return item.meta.created.at;
            })
        }, {
            path: 'meta.owner',
            label: 'Owner',
            type: 'string',
            width: '15%',
            value: ko.pureComputed(function () {
                return item.meta.owner;
            })
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
            // params.search.sortingRules.removeAll();
            // params.search.sortingRules.push(sortRule);
        }

        return {
            item: item,
            columns: columns,
            doSort: doSort,
            doOpenNarrative: doOpenNarrative,
            sortColumn: sortColumn,
            sortDirection: sortDirection,
            getProp: getProp
        };
    }

    // humm... not here...
    function buildHeader() {
        return div({
            class: '-row',
            dataBind: {
                foreach: {
                    data: 'columns',
                    as: '"column"'
                }
            }
        }, div({
            dataBind: {
                style: {
                    width: 'column.width'
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
        ]));
    }

    function buildRow() {
        return div({
            class: '',
            dataBind: {
                foreach: {
                    data: 'columns',
                    as: '"column"'
                }
            }
        }, div({
            dataBind: {
                style: {
                    width: 'column.width'
                }
            },
            style: {
                display: 'inline-block',
                verticalAlign: 'top'
            }
        }, [
            '<!-- ko if: column.action -->',
            a({
                dataBind: {
                    text: 'column.value',
                    click: 'function () {column.action($component.item);}',
                    style: 'column.style'
                },
                style: {
                    display: 'block',
                    cursor: 'pointer'
                }
            }),
            '<!-- /ko -->',
            '<!-- ko ifnot: column.action -->',
            // TODO: needs number and date bindings here if need by ... or just have a
            // more multipurpose text binding here which looks for number and date bindings.
            div({
                dataBind: {
                    typedText: {
                        value: 'column.value',
                        type: 'column.type',
                        format: 'column.format'
                    },
                    style: 'column.style'
                }
            }),
            '<!-- /ko -->'
        ]));
    }

    // function buildResultsTable() {
    //     return table({
    //         class: 'table table-striped'
    //     }, [
    //         thead({},
    //             tr({
    //                 dataBind: {
    //                     foreach: {
    //                         data: '$component.columns',
    //                         as: '"column"'
    //                     }
    //                 }
    //             }, [
    //                 th({
    //                     dataBind: {
    //                         style: {
    //                             width: 'column.width',
    //                         }
    //                     }
    //                 }, [
    //                     '<!-- ko if: column.sort -->',
    //                     span({
    //                         dataBind: {
    //                             text: 'column.label',
    //                             click: '$component.doSort'
    //                         },
    //                         style: {
    //                             cursor: 'pointer'
    //                         }
    //                     }),
    //                     '<!-- ko if: $component.sortColumn() === column.name -->',
    //                     '<!-- ko if: $component.sortDirection() === "descending" -->',
    //                     span({
    //                         class: 'fa fa-sort-desc'
    //                     }),
    //                     '<!-- /ko -->',
    //                     '<!-- ko if: $component.sortDirection() === "ascending" -->',
    //                     span({
    //                         class: 'fa fa-sort-asc'
    //                     }),
    //                     '<!-- /ko -->',
    //                     '<!-- /ko -->',
    //                     '<!-- /ko -->',
    //                     '<!-- ko if: !column.sort -->',
    //                     span({
    //                         dataBind: {
    //                             text: 'column.label'
    //                         }
    //                     }),
    //                     '<!-- /ko -->'
    //                 ])
    //             ])
    //         ),
    //         tbody({
    //             dataBind: {
    //                 foreach: {
    //                     data: 'search.searchResults',
    //                     as: '"item"'
    //                 }
    //             }
    //         }, [
    //             tr({
    //                 dataBind: {
    //                     foreach: {
    //                         data: '$component.columns',
    //                         as: '"column"'
    //                     }
    //                 }
    //             }, [
    //                 td([
    //                     '<!-- ko if: column.action -->',
    //                     a({
    //                         dataBind: {
    //                             text: 'item[column.name]',
    //                             click: 'function () {column.action(item);}'
    //                         },
    //                         style: {
    //                             cursor: 'pointer'
    //                         }
    //                     }),
    //                     '<!-- /ko -->',
    //                     '<!-- ko ifnot: column.action -->',
    //                     span({
    //                         dataBind: {
    //                             text: 'item[column.name]'
    //                         }
    //                     }),
    //                     '<!-- /ko -->'
    //                 ])
    //             ])
    //         ])
    //     ]);
    // }

    function template() {
        return buildRow();
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }
    return component;
});