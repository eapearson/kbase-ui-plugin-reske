define([
    'knockout-plus',
    'bluebird',
    'kb_common/html',
    'kb_common/ui',
    '../utils',
    'yaml!../helpData.yml'
], function (
    ko,
    Promise,
    html,
    ui,
    utils,
    helpData
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        button = t('button'),
        input = t('input'),
        label = t('label');

    function buildHelpDialog(title) {
        return div({
            class: 'modal fade',
            tabindex: '-1',
            role: 'dialog'
        }, [
            div({ class: 'modal-dialog' }, [
                div({ class: 'modal-content' }, [
                    div({ class: 'modal-header' }, [
                        button({
                            type: 'button',
                            class: 'close',
                            // dataDismiss: 'modal',
                            ariaLabel: 'Done',
                            dataBind: {
                                click: 'close'
                            }
                        }, [
                            span({ ariaHidden: 'true' }, '&times;')
                        ]),
                        span({ class: 'modal-title' }, title)
                    ]),
                    div({ class: 'modal-body' }, [
                        div({
                            dataBind: {
                                component: {
                                    name: '"help"',
                                    params: {
                                        helpDb: 'helpDb'
                                    }
                                }
                            }
                        })
                    ]),
                    div({ class: 'modal-footer' }, [
                        button({
                            type: 'button',
                            class: 'btn btn-default',
                            // dataDismiss: 'modal',
                            // dataElement: 'ok',
                            dataBind: {
                                click: 'close'
                            }
                        }, 'Done')
                    ])
                ])
            ])
        ]);
    }

    function helpVM(node) {
        // var helpTopics = helpData.topics.map(function(topic) {
        //     return {
        //         id: topic.id,
        //         title: topic.title,
        //         content: topic.content
        //             // content: topic.content.map(function(paragraph) {
        //             //     return p(paragraph);
        //             // }).join('\n')
        //     };
        // });

        function close() {
            var backdrop = document.querySelector('.modal-backdrop');
            backdrop.parentElement.removeChild(backdrop);
            node.parentElement.removeChild(node);
        }

        return {
            helpDb: helpData,
            close: close
        };
    }

    function showHelpDialog() {
        var dialog = buildHelpDialog('Search Help'),
            dialogId = html.genId(),
            helpNode = document.createElement('div'),
            kbaseNode, modalNode, modalDialogNode;

        helpNode.id = dialogId;
        helpNode.innerHTML = dialog;

        // top level element for kbase usage
        kbaseNode = document.querySelector('[data-element="kbase"]');
        if (!kbaseNode) {
            kbaseNode = document.createElement('div');
            kbaseNode.setAttribute('data-element', 'kbase');
            document.body.appendChild(kbaseNode);
        }

        // a node upon which to place Bootstrap modals.
        modalNode = kbaseNode.querySelector('[data-element="modal"]');
        if (!modalNode) {
            modalNode = document.createElement('div');
            modalNode.setAttribute('data-element', 'modal');
            kbaseNode.appendChild(modalNode);
        }

        modalNode.appendChild(helpNode);

        var backdropNode = document.createElement('div');
        backdropNode.classList.add('modal-backdrop', 'fade', 'in');
        document.body.appendChild(backdropNode);

        ko.applyBindings(helpVM(modalNode), helpNode);
        modalDialogNode = modalNode.querySelector('.modal');
        modalDialogNode.classList.add('in');
        modalDialogNode.style.display = 'block';
    }

    /*
    This view model establishes the primary search context, including the
    search inputs
    search state
    paging controls
    search results

    sub components will be composed with direct references to any of these vm pieces
    they need to modify or use.
     */
    function viewModel(params) {

        // Unpack the Search VM.
        var searchInput = params.search.searchInput;
        var searchResults = params.search.searchResults;
        var searchTotal = params.search.searchTotal;
        var searching = params.search.searching;
        var pageSize = params.search.pageSize;
        var page = params.search.page;

       
        function doHelp() {
            showHelpDialog();
        }

       
        // console.log('hmm', params.search.withPrivateData(), params.search.withPublicData());

        return {
            // The top level search is included so that it can be
            // propagated.
            search: params.search,
            // And we break out fields here for more natural usage (or not??)
            searchInput: searchInput,
            searchResults: searchResults,
            searchTotal: searchTotal,
            searching: searching,
            pageSize: pageSize,
            page: page,

            // ACTIONS
            doHelp: doHelp,
            doSearch: params.search.doSearch,
        };
    }

    /*
        Builds the search input area using bootstrap styling and layout.
    */
    function buildInputArea() {
        return div({
            class: 'form'
        }, div({
            class: 'input-group'
        }, [
            input({
                class: 'form-control',
                style: {
                    margin: '0 4px'
                },
                dataBind: {
                    textInput: 'searchInput',
                    hasFocus: true
                },
                placeholder: 'Search KBase Data'
            }),
            div({
                class: 'input-group-addon',
                style: {
                    cursor: 'pointer'
                },
                dataBind: {
                    click: 'doSearch'
                }
            }, span({
                class: 'fa',
                style: {
                    fontSize: '125%',
                    color: '#000',
                    width: '2em'
                },
                dataBind: {
                    // style: {
                    //     color: 'searching() ? "green" : "#000"'
                    // }
                    css: {
                        'fa-search': '!searching()',
                        'fa-spinner fa-pulse': 'searching()',
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
                class: 'fa fa-info'
            }))
        ]));
    }

    function buildSearchFilters() {
        return div({
            style: {
                textAlign: 'center',
                margin: '6px auto'
            }
        }, [
            // 'Search in ',
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
                        checked: '$component.search.withPrivateData'
                    }
                }),
                ' Own Data'
            ])),
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
                    // dataBind: {
                    //     checked: '$component.search.withPrivateData'
                    // }
                }),
                ' Shared with you'
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
                        checked: '$component.search.withPublicData'
                    }
                }),
                ' Public'
            ]))
        ]);
    }

    
    function buildFilterArea() {
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
            buildSearchFilters()
            // buildSeqProjectFilter()
        ]);
    }

    function buildResultsArea() {
        return utils.komponent({
            name: 'reske-search/v3/browser',
            params: {
                search: 'search'
            }
        });
    }

    var styles = html.makeStyles({
        component: {
            flex: '1 1 0px',
            display: 'flex',
            flexDirection: 'column'
        },
        searchArea: {
            flex: '0 0 50px',
            // border: '1px red solid'
        },
        filterArea: {
            flex: '0 0 50px',
            // border: '1px blue dashed'
        },
        resultArea: {
            flex: '1 1 0px',
            // border: '1px green dotted',
            display: 'flex',
            flexDirection: 'column'
        }
    });


    function template() {
        return div({
            class: styles.classes.component
        }, [
            styles.sheet,
            // The search input area
            div({
                class: styles.classes.searchArea
            }, buildInputArea()),
            // The search filter area
            div({
                class: styles.classes.filterArea
            }, buildFilterArea()),
            // The search results / error / message area
            div({
                class: styles.classes.resultArea
            }, [
                buildResultsArea(),
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
