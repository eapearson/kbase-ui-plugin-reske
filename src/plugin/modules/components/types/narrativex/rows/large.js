define([
    'kb_common/html',
], function (
    html
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td');

    function viewModel(params) {
        return params;
    }

    function template() {
        return div({
            style: {
                border: '2px blue solid',
                padding: '4px'
            }
        }, table({
            class: 'table table-striped'
        }, [
            tr([
                th('Type'),
                td({
                    dataBind: {
                        text: 'type'
                    }
                })
            ]),
            tr([
                th('Name'),
                td({
                    dataBind: {
                        text: 'object_name'
                    }
                })
            ]),
            tr([
                th('GUID'),
                td({
                    dataBind: {
                        text: 'guid'
                    }
                })
            ]),
            tr([
                th('Date'),
                td({
                    dataBind: {
                        text: 'datestring'
                    }
                })
            ]),
            tr([
                th('Data'),
                td(
                    table({
                        class: 'table table-lined',
                        dataBind: {
                            foreach: 'dataList'
                        }
                    }, tr([
                        th({
                            dataBind: {
                                text: 'key'
                            }
                        }),
                        td({
                            dataBind: {
                                text: 'type'
                            }
                        }),
                        td({
                            dataBind: {
                                text: 'value'
                            }
                        })
                    ]))
                )
            ]),
            '<!-- ko if: parentDataList.length > 0 -->',
            tr([
                th('Parent Data'),
                td(
                    table({
                        class: 'table table-lined',
                        dataBind: {
                            foreach: 'parentDataList'
                        }
                    }, tr([
                        th({
                            dataBind: {
                                text: 'key'
                            }
                        }),
                        td({
                            dataBind: {
                                text: 'type'
                            }
                        }),
                        td({
                            dataBind: {
                                text: 'value'
                            }
                        })
                    ]))
                )
            ]),
            '<!-- /ko -->',
            tr([
                th('Keys'),
                td(
                    table({
                        class: 'table table-lined',
                        dataBind: {
                            foreach: 'keyList'
                        }
                    }, tr([
                        th({
                            dataBind: {
                                text: 'key'
                            }
                        }),
                        td({
                            dataBind: {
                                text: 'type'
                            }
                        }),
                        td({
                            dataBind: {
                                text: 'value'
                            }
                        })
                    ]))
                )
            ])
        ]));
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }

    return component;
});