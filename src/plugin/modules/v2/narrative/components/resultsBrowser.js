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
        span = t('span'),
        button = t('button'),
        label = t('label'),
        select = t('select');

    function viewModel(params) {

        // View (which way to view the results)
        var views = [{
                name: 'list',
                label: 'List'
            },
            {
                name: 'detail',
                label: 'Detail'
            }
        ];

        var view = ko.observable('list');

        function doSelectView(newView) {
            view(newView);
        }

        // Paging through results
        var pageStart = params.searchVM.pageStart;
        var pageSize = params.searchVM.pageSize;
        var totalCount = params.searchVM.totalCount;


        var pageEnd = ko.pureComputed(function () {
            return Math.min(pageStart() + pageSize.parsed, totalCount()) - 1;
        });

        function doFirst() {
            pageStart(0);
        }

        function disableFirst() {
            return (pageStart() === 0);
        }

        function doLast() {
            pageStart(Math.max(totalCount() - pageSize.parsed, 0));
        }

        function disableLast() {
            if (typeof totalCount() !== 'number') {
                return true;
            }
            return (pageEnd() + 1 === totalCount());
        }

        function doPrevPage() {
            if (pageStart() > pageSize.parsed) {
                pageStart(pageStart() - pageSize.parsed);
            } else {
                doFirst();
            }
        }

        function disablePrevPage() {
            return (pageStart() === 0);
        }

        function doNextPage() {
            if (pageEnd() < totalCount() - pageSize.parsed) {
                pageStart(pageStart() + pageSize.parsed);
            } else {
                doLast();
            }
        }

        function disableNextPage() {
            if (typeof totalCount() !== 'number') {
                return true;
            }
            return (pageEnd() + 1 === totalCount());
        }

        var pageSizes = [5, 10, 20, 50, 100].map(function (value) {
            return {
                label: String(value),
                value: String(value)
            };
        });

        return {
            search: params.searchVM,
            // View
            views: views,
            view: view,
            doSelectView: doSelectView,
            // Paging
            totalCount: totalCount,
            pageStart: pageStart,
            pageEnd: pageEnd,
            pageSize: pageSize,

            doFirst: doFirst,
            doLast: doLast,
            doPrevPage: doPrevPage,
            doNextPage: doNextPage,
            disableFirst: disableFirst,
            disableLast: disableLast,
            disablePrevPage: disablePrevPage,
            disableNextPage: disableNextPage,
            pageSizes: pageSizes

        };
    }

    function icon(type) {
        return span({
            class: 'fa fa-' + type
        });
    }

    function buildButton(iconClass, name, tooltip) {
        return button({
            dataBind: {
                click: 'do' + name,
                disable: 'disable' + name + '()'
            },
            class: 'btn btn-default'
        }, icon(iconClass));
    }


    function buildPagingControl() {
        return div({
            class: 'btn-toolbar',
            style: {
                display: 'inline-block',
                textAlign: 'left'
            }
        }, [
            div({
                class: 'btn-group form-inline',
                style: {
                    width: '350px'
                }
            }, [
                buildButton('step-backward', 'First', 'Go to first page of search results'),
                buildButton('backward', 'PrevPage'),
                buildButton('forward', 'NextPage'),
                buildButton('step-forward', 'Last'),
                span({
                    style: {
                        // why not work??
                        display: 'inline-block',
                        verticalAlign: 'middle',
                        margin: '6px 0 0 4px'
                    }
                }, [
                    span({
                        dataBind: {
                            text: 'pageStart() + 1'
                        }
                    }),
                    ' to ',
                    span({
                        dataBind: {
                            text: 'pageEnd() + 1'
                        }
                    }),
                    ' of ',
                    span({
                        dataBind: {
                            text: 'totalCount()'
                        },
                        style: {
                            marginRight: '10px',
                            verticalAlign: 'middle'
                        }
                    })
                ])
            ])
        ]);
    }

    function buildPageSizeControl() {
        return div({
            class: 'btn-toolbar',
            style: {
                display: 'inline-block',
                textAlign: 'left'
            }
        }, [
            div({ class: 'btn-group form-inline' }, [
                label({
                    style: {
                        // for bootstrap
                        marginBottom: '0'
                    }
                }, [
                    select({
                        dataBind: {
                            value: 'pageSize',
                            options: 'pageSizes',
                            optionsText: '"label"',
                            optionsValue: '"value"'
                        },
                        class: 'form-control'
                    }),
                    ' rows per page'
                ])
            ])
        ]);
    }

    function buildViewControl() {
        return div({
            style: {
                display: 'inline-block'
            }
        }, [
            button({
                class: 'btn btn-default',
                dataBind: {
                    click: 'function () {doSelectView("list");}',
                    css: {
                        active: '$component.view() === "list"'
                    }
                }
            }, span({
                class: 'fa fa-list-ol'
            })),
            button({
                class: 'btn btn-default',
                dataBind: {
                    click: 'function () {doSelectView("detail");}',
                    css: {
                        active: '$component.view() === "detail"'
                    }
                }
            }, span({
                class: 'fa fa-list-alt'
            })),
        ]);
    }

    function template() {
        return div({
            class: 'container-fluid'
        }, [
            div({
                class: 'row',
                style: {
                    marginTop: '14px'
                }
            }, [
                div({
                    class: 'col col-sm-4',
                    style: {
                        textAlign: 'center'
                    }
                }, buildViewControl()),
                div({
                    class: 'col col-sm-4',
                    style: {
                        textAlign: 'center'
                    }
                }, buildPagingControl()),
                div({
                    class: 'col col-sm-4',
                    style: {
                        textAlign: 'center'
                    }
                }, buildPageSizeControl())
            ]),
            div({
                dataBind: {
                    component: {
                        name: '"reske-search/narrative/search/results/" + view()',
                        params: {
                            search: 'search'
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