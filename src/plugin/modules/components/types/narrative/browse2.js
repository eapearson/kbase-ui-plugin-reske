define([
    'knockout-plus',
    'highlight',
    'kb_common/html',

    'css!./browse2.css'
], function (
    ko,
    highlight,
    html
) {
    'use strict';

    var t = html.tag,
        a = t('a'),
        button = t('button'),
        span = t('span'),
        pre = t('pre'),
        code = t('code'),
        div = t('div'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td');

    function viewModel(params) {
        return {
            item: params.item
        };
    }

    function buildMarkdown() {
        // TODO okay, maybe we do need a separate list of markdown cells; we want to
        // detect that there are any before inserting the collapsible panel.
        // manual panel, start closed
        return [
            '<!-- ko if: item.narrative.markdownCells.cells.length > 0 -->',
            '<!-- ko with: item.narrative.markdownCells -->',
            div({
                dataBind: {
                    css: {
                        '-active': 'show()'
                    }
                },
                class: '-markdown'
            }, [
                div({
                    style: {
                        display: 'inline-block',
                        width: '5%'
                    }
                }),
                div({
                    style: {
                        display: 'inline-block',
                        width: '95%'
                    }
                }, [
                    // title and collapse control
                    div({
                        class: '-toggler'
                    }, [
                        span({
                            dataBind: {
                                click: 'doToggleShow',
                                css: {
                                    showing: 'show'
                                }
                            },
                            style: {
                                cursor: 'pointer'
                            }
                        }, [
                            'view markdown',
                            span({
                                dataBind: {
                                    css: {
                                        'fa-arrow-right -deg45': '!show()',
                                        'fa-arrow-down': 'show()'
                                    }
                                },
                                class: 'fa',
                                style: {
                                    marginLeft: '4px'
                                }
                            })
                        ])
                    ]),
                    // body
                    div({
                        dataBind: {
                            visible: 'show'
                        },
                        class: '-content'
                    }, [
                        // div({
                        //     style: {
                        //         padding: '4px 0',
                        //         fontWeight: 'bold'
                        //     }
                        // }, 'Markdown cells'),
                        div({
                            style: {
                                border: '1px silver solid',
                                padding: '6px;'
                            }
                        }, [
                            '<!-- ko foreach: cells -->',
                            div({
                                class: '-item'
                            }, [

                                div({
                                    dataBind: {
                                        html: 'html'
                                    },
                                    class: '-html',
                                    style: {
                                        display: 'inline-block',
                                        verticalAlign: 'top',
                                        width: '100%'
                                    }
                                })
                            ]),
                            '<!-- /ko -->'
                        ])
                    ])
                ])
            ]),
            '<!-- /ko -->',
            '<!-- /ko -->'
        ];
    }

    function buildCellsPreview() {
        // TODO okay, maybe we do need a separate list of markdown cells; we want to
        // detect that there are any before inserting the collapsible panel.
        // manual panel, start closed
        return [
            '<!-- ko if: item.narrative.cells.cells.length > 0 -->',
            '<!-- ko with: item.narrative.cells -->',
            div({
                dataBind: {
                    css: {
                        '-active': 'show()'
                    }
                },
                class: '-markdown'
            }, [
                div({
                    style: {
                        display: 'inline-block',
                        width: '5%'
                    }
                }),
                div({
                    style: {
                        display: 'inline-block',
                        width: '95%'
                    }
                }, [
                    // title and collapse control
                    div({
                        class: '-toggler'
                    }, [
                        span({
                            dataBind: {
                                click: 'doToggleShow',
                                css: {
                                    showing: 'show'
                                }
                            },
                            style: {
                                cursor: 'pointer'
                            }
                        }, [
                            'preview',
                            span({
                                dataBind: {
                                    css: {
                                        'fa-arrow-right -deg45': '!show()',
                                        'fa-arrow-down': 'show()'
                                    }
                                },
                                class: 'fa',
                                style: {
                                    marginLeft: '4px'
                                }
                            })
                        ])
                    ]),
                    // body
                    div({
                        dataBind: {
                            visible: 'show'
                        },
                        class: '-content'
                    }, [
                        // div({
                        //     style: {
                        //         padding: '4px 0',
                        //         fontWeight: 'bold'
                        //     }
                        // }, 'Markdown cells'),
                        div({
                            style: {
                                border: '1px silver solid',
                                padding: '6px;'
                            }
                        }, [
                            '<!-- ko foreach: cells -->',
                            div({
                                class: '-item'
                            }, [
                                div({}, div({
                                    dataBind: {
                                        text: 'type'
                                    },
                                    style: {
                                        // backgroundColor: '#EEE',
                                        display: 'inline-block',
                                        width: 'auto',
                                        color: '#AAA',
                                        padding: '3px 3px 3px 3px',
                                        marginLeft: '-4px',
                                        marginBottom: '6px',
                                        border: '1px #CCC solid',
                                        // borderTop: 'none',
                                        backgroundColor: 'rgb(253, 253, 240)'
                                    }
                                })),
                                '<!-- ko if: type === "markdown" -->',
                                div({
                                    dataBind: {
                                        html: 'html'
                                    },
                                    class: '-html',
                                    style: {
                                        display: 'inline-block',
                                        verticalAlign: 'top',
                                        width: '100%'
                                    }
                                }),
                                '<!-- /ko -->',
                                '<!-- ko if: type === "code" -->',
                                pre(code({
                                    dataBind: {
                                        text: 'source'
                                    }
                                })),
                                '<!-- /ko -->',
                                '<!-- ko if: type === "app" -->',
                                '<!-- ko if: $data.app && $data.app.name -->',
                                table({
                                    class: 'table table-bordered'
                                }, [
                                    tr([
                                        th('name'),
                                        td({
                                            dataBind: {
                                                text: '$data.app.name'
                                            }
                                        })
                                    ]),
                                    tr([
                                        th('module'),
                                        td({
                                            dataBind: {
                                                text: '$data.app.module'
                                            }
                                        })
                                    ]),
                                    tr([
                                        th('method'),
                                        td({
                                            dataBind: {
                                                text: '$data.app.method'
                                            }
                                        })
                                    ]),
                                    tr([
                                        th('description'),
                                        td({
                                            dataBind: {
                                                text: '$data.app.description'
                                            }
                                        })
                                    ])
                                ]),

                                '<!-- /ko -->',
                                '<!-- ko if: ! $data.spec -->',
                                div('No information about this app'),
                                '<!-- /ko -->',


                                '<!-- /ko -->',
                                '<!-- ko if: type === "data" -->',
                                div('no preview for data cell'),
                                '<!-- /ko -->',
                                '<!-- ko if: type === "output" -->',
                                div('no preview for output cell'),
                                '<!-- /ko -->',
                                '<!-- ko if: type === "unknown" -->',
                                div('no preview for unknown cell type'),
                                '<!-- /ko -->'
                            ]),
                            '<!-- /ko -->'
                        ])
                    ])
                ])
            ]),
            '<!-- /ko -->',
            '<!-- /ko -->'
        ];
    }

    function template() {
        return div({
            class: 'component-reske-narrative-browse -row'
        }, [
            div([
                div({
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '5%',
                        // textAlign: 'center',
                        // color: '#FFF',
                        // backgroundColor: '#AAA'
                    },
                    class: '-field -resultNumber'
                }, span({
                    dataBind: {
                        // text: '$index() + $component.pageStart() + 1'
                        text: 'item.narrative.resultNumber'
                    }
                })),
                div({
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '75%'
                    }
                }, [
                    div({
                        class: '-title'
                    }, [
                        a({
                            dataBind: {
                                attr: {
                                    href: '"/narrative/" + item.narrative.workspace.narrid'
                                },
                                text: 'item.narrative.title'
                            },
                            target: '_blank'
                        })
                    ]),
                    div({}, [
                        span({
                            dataBind: {
                                text: 'item.narrative.owner'
                            },
                            class: '-owner'
                        }),
                        ' - ',
                        span({
                            dataBind: {
                                text: 'item.narrative.created.at'
                            },
                            class: '-created-at'
                        }),
                        '<!-- ko if: item.narrative.created.at !== item.narrative.updated.at -->',
                        ' (last updated ',
                        span({
                            dataBind: {
                                text: 'item.narrative.updated.at'
                            },
                            class: '-updated-at'
                        }),
                        ')',
                        '<!-- /ko -->'
                    ])
                ]),
                div({
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '20%'
                    }
                }, div({
                    class: '-features'
                }, [
                    span({
                        type: 'button',
                        class: 'btn btn-default'
                    }, 'keep +'),
                ]))
            ]),
            buildCellsPreview()
            // div([
            //     div({
            //         dataBind: {
            //             text: 'item.narrative.description'
            //         },
            //         style: {
            //             display: 'inline-block',
            //             width: '100%'
            //         }
            //     })
            // ]),

            //buildMarkdown()
        ]);
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }

    ko.components.register('reske/narrative/browse', component());

});