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
        h2 = t('h2'),
        label = t('label'),
        span = t('span'),
        input = t('input');

    function viewModel(params) {
        function doHelp() {
            alert('help!');
        }
        return {
            search: params.searchVM,
            doHelp: doHelp
        };
    }

    function buildSearchFilters() {
        return div({
            style: {
                textAlign: 'center',
                margin: '6px auto'
            }
        }, [
            'Search in ',
            span({
                // class: 'checkbox'
            }, label({
                style: {
                    fontWeight: 'normal',
                    marginRight: '4px',
                    marginLeft: '6px'
                }
            }, [
                input({
                    type: 'checkbox',
                    dataBind: {
                        checked: '$component.search.searchPrivateData'
                    }
                }),
                ' your Narratives and those shared with you'
            ])),
            span({
                // class: 'ckeckbox'
            }, label({
                style: {
                    fontWeight: 'normal',
                    marginRight: '4px',
                    marginLeft: '6px'
                }
            }, [
                input({
                    type: 'checkbox',
                    dataBind: {
                        checked: '$component.search.searchPublicData'
                    }
                }),
                ' Narratives shared publicly'
            ]))
        ]);
    }

    function buildSearchInput() {
        return div({
            class: 'form'
        }, [
            div({
                class: 'input-group'
            }, [
                input({
                    dataBind: {
                        textInput: 'search.searchInput',
                        hasFocus: true
                    },
                    placeholder: 'Search KBase Narratives!',
                    class: 'form-control'
                }),
                div({
                    class: 'input-group-addon',
                    style: {
                        cursor: 'pointer'
                    },
                    dataBind: {
                        click: 'search.doSearch'
                    }
                }, span({
                    class: 'fa fa-search',
                    style: {
                        fontSize: '125%'
                    },
                    dataBind: {
                        style: {
                            color: 'search.isSearching() ? "green" : "black"'
                        }
                    }
                })),
                div({
                    class: 'input-group-addon',
                    style: {
                        cursor: 'pointer'
                    },
                    dataBind: {
                        click: 'doHelp'
                    }
                }, span({
                    class: 'fa fa-info',
                    style: {
                        fontSize: '125%'
                    }
                }))
            ])
        ]);
    }

    function template() {
        return div({
            class: 'container-fluid component-type-search'
        }, [
            // div({
            //     class: 'row'
            // }, [
            //     div({
            //         class: 'col-md-8 col-md-offset-2'
            //     }, [
            //         h2({
            //             style: {
            //                 textAlign: 'center'
            //             }
            //         }, 'RESKE Narratives')
            //     ])
            // ]),

            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-8 col-md-offset-2'
                }, [
                    buildSearchInput()
                ])
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-8 col-md-offset-2'
                }, [
                    buildSearchFilters()
                ])
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