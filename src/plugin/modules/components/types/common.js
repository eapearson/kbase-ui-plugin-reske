define([
    'kb_common/html'
], function (
    html
) {
    'use strict';

    var t = html.tag,
        span = t('span'),
        div = t('div'),
        a = t('a'),
        table = t('table'),
        tbody = t('tbody'),
        tr = t('tr'),
        th = t('th'),
        td = t('td');

    function buildSharingInfo() {
        return div({
            style: {
                display: 'inline-block',
                marginRight: '10px'
            }
        }, [
            '<!-- ko if: item.meta.isOwner -->',
            span({
                class: 'fa fa-key',
                style: {
                    margin: '0 4px'
                },
                dataToggle: 'tooltip',
                dataPlacement: 'left',
                title: 'You are the owner of this data object'
            }),
            '<!-- /ko -->',
            '<!-- ko ifnot: item.meta.isOwner -->',
            span({
                class: 'fa fa-key',
                style: {
                    margin: '0 4px',
                    color: '#CCC'
                },
                dataToggle: 'tooltip',
                dataPlacement: 'left',
                title: 'You are not the owner of this data object'
            }),
            '<!-- /ko -->',

            '<!-- ko if: item.meta.isShared -->',
            span({
                class: 'fa fa-share-alt',
                style: {
                    margin: '0 4px'
                },
                dataToggle: 'tooltip',
                dataPlacement: 'left',
                title: 'This object has been shared with you'
            }),
            '<!-- /ko -->',
            '<!-- ko ifnot: item.meta.isShared -->',
            span({
                class: 'fa fa-share-alt',
                style: {
                    margin: '0 4px',
                    color: '#CCC'
                },
                dataToggle: 'tooltip',
                dataPlacement: 'left',
                title: 'This assembly object has not been shared with you'
            }),
            '<!-- /ko -->',


            '<!-- ko if: item.meta.isPublic -->',
            span({
                class: 'fa fa-globe',
                style: {
                    margin: '0 4px'
                },
                dataToggle: 'tooltip',
                dataPlacement: 'left',
                title: 'This object is shared publicly'
            }),
            '<!-- /ko -->',
            '<!-- ko ifnot: item.meta.isPublic -->',
            span({
                class: 'fa fa-globe',
                style: {
                    margin: '0 4px',
                    color: '#CCC'
                },
                dataToggle: 'tooltip',
                dataPlacement: 'left',
                title: 'This object is not shared publicly'
            }),
            '<!-- /ko -->',
        ]);
    }

    function buildActions(_options) {
        var options = _options || {};
        return div({
            style: {
                display: 'inline-block',
                marginRight: '10px'
            }
        }, [
            span({
                class: '-mini-button',
                dataToggle: 'tooltip',
                dataPlacement: 'left',
                title: 'Click here to open the Narrative this object is embedded in',
                dataBind: {
                    click: '$component.doOpenNarrative'
                }
            }, span({
                class: 'fa fa-file-o',
                style: {
                    margin: '0 4px'
                }
            })),
            (function () {
                if (options.dataview !== false) {
                    return span({
                        class: '-mini-button',
                        dataToggle: 'tooltip',
                        dataPlacement: 'left',
                        title: 'Click here to open a detailed viewer page for this data object',
                        dataBind: {
                            click: '$component.doOpenDataview'
                        }
                    }, span({
                        class: 'fa fa-binoculars',
                        style: {
                            margin: '0 4px'
                        }
                    }));
                }
            }()),
            (function () {
                if (options.cart === false) {
                    return;
                }
                return span({
                        class: '-mini-button',
                        dataToggle: 'tooltip',
                        dataPlacement: 'left',
                        title: 'Click here to save this search result in your search shopping cart',
                        dataBind: {
                            click: '$component.doKeep'
                        }
                    }, [
                        '<!-- ko if: isInCart -->',
                        span({
                            class: 'fa fa-shopping-cart',
                            style: {
                                margin: '0 4px',
                                color: 'red'
                            }
                        }),
                        '<!-- /ko -->',
                        '<!-- ko ifnot: isInCart -->',
                        span({
                            class: 'fa fa-cart-plus',
                            style: {
                                margin: '0 4px'
                            }
                        }),
                        '<!-- /ko -->'
                    ]

                );
            }())
        ]);
    }

    function buildNarrativeMeta(options) {
        if (options.showNarrative === false) {
            return;
        }
        // Narrative context
        return div([
            a({
                dataBind: {
                    attr: {
                        href: '"/narrative/" + item.context.narrativeId'
                    }
                },
                target: '_blank',
                dataToggle: 'tooltip',
                dataPlacement: 'left',
                title: 'Open the Narrative this object is embedded in'
            }, [
                span({
                    class: 'fa fa-file-o'
                }),
                span({
                    dataBind: {
                        text: 'item.context.narrativeTitle'
                    },
                    class: '-narrative-title',
                    style: {
                        marginLeft: '4px'
                    }
                })
            ])
        ]);
    }

    function buildOwnerMeta(options) {
        return a({
            dataBind: {
                attr: {
                    href: '"#people/" + item.meta.owner'
                }
            },
            target: '_blank',
            dataToggle: 'tooltip',
            dataPlacement: 'left',
            title: 'This is the owner of the Narrative this object is embedded in; click here to view their profile.'
        }, [
            span({
                class: 'fa fa-user-o'
            }),
            span({
                dataBind: {
                    text: 'item.meta.owner'
                },
                class: '-owner',
                style: {
                    marginLeft: '4px'
                }
            })
        ]);
    }

    function buildMetaLastUpdated(options) {
        return [
            '<!-- ko if: item.meta.created.at !== item.meta.updated.at -->',
            span({
                dataBind: {
                    text: 'item.meta.updated.at'
                },
                class: '-updated-at'
            }),
            '<!-- /ko -->',
            '<!-- ko if: item.meta.created.at === item.meta.updated.at -->',
            '-',
            '<!-- /ko -->'
        ];
    }

    function buildMetaInfo(_options) {
        var options = _options || {};
        return table({
            class: '-table'
        }, tbody([

            '<!-- ko if: item.context.type === "narrative" -->',
            tr([
                th('Container'),
                td('Narrative')
            ]),
            tr([
                th('Narrative'),
                td(buildNarrativeMeta(options))
            ]),
            tr([
                th('Owner'),
                td(buildOwnerMeta(options))
            ]),
            // tr([
            //     th('Last updated'),
            //     td(buildMetaLastUpdated(options))
            // ]),
            '<!-- /ko -->',
            '<!-- ko if: item.context.type === "reference" -->',
            tr([
                th('Container'),
                td('Reference Data Workspace')
            ]),
            tr([
                th('Name'),
                td({
                    dataBind: {
                        text: 'item.context.workspaceName'
                    }
                })
            ]),
            tr([
                th('Source'),
                td({
                    dataBind: {
                        text: 'item.context.source'
                    }
                })
            ]),
            tr([
                th('Source Id'),
                td({
                    dataBind: {
                        text: 'item.context.sourceId'
                    }
                })
            ]),
            '<!-- /ko -->',
            '<!-- ko if: item.context.type === "unknown" -->',
            tr([
                th('Container'),
                td('Workspace')
            ]),
            tr([
                th('Workspace'),
                td({
                    dataBind: {
                        text: 'item.context.workspaceName'
                    }
                })
            ]),
            tr([
                th('Comment'),
                td('The type of this workspace cannot be determined; it may be an obsolete narrative')
            ]),
            tr([
                th('Owner'),
                td(
                    a({
                        dataBind: {
                            attr: {
                                href: '"#people/" + item.meta.owner'
                            }
                        },
                        target: '_blank',
                        dataToggle: 'tooltip',
                        dataPlacement: 'left',
                        title: 'This is the owner of the Narrative this object is embedded in; click here to view their profile.'
                    }, [
                        span({
                            class: 'fa fa-user-o'
                        }),
                        span({
                            dataBind: {
                                text: 'item.meta.owner'
                            },
                            class: '-owner',
                            style: {
                                marginLeft: '4px'
                            }
                        })
                    ])

                )
            ]),
            tr([
                th('Last updated'),
                td([
                    '<!-- ko if: item.meta.created.at !== item.meta.updated.at -->',
                    span({
                        dataBind: {
                            text: 'item.meta.updated.at'
                        },
                        class: '-updated-at'
                    }),
                    '<!-- /ko -->',
                    '<!-- ko if: item.meta.created.at === item.meta.updated.at -->',
                    '-',
                    '<!-- /ko -->'
                ])
            ]),
            '<!-- /ko -->',
            '<!-- ko if: item.context.type === "exampleData" -->',
            tr([
                th('Type'),
                td('KBase Example Data')
            ]),
            tr([
                th('Comment'),
                td('A special workspace which contains example data objects. Also available under "Example" in the Narrative data panel.')
            ]),
            '<!-- /ko -->',
        ]));
    }



    function buildTypeIcon() {
        return;
    }

    // function buildTypeIcon() {
    //     return span({
    //         style: {
    //             // fontSize: '30%',
    //             verticalAlign: 'middle'
    //         }
    //     }, [
    //         span({
    //             dataBind: {
    //                 css: 'item.typeIcon.classes.join(" ")',
    //                 style: {
    //                     color: 'item.typeIcon.color'
    //                 }
    //             }
    //         })
    //     ]);
    // }

    //  function buildTypeIcon() {
    //     return span({
    //         style: {
    //             fontSize: '30%',
    //             verticalAlign: 'middle'
    //         }
    //     }, [
    //         span({
    //             class: 'fa-stack fa-2x'
    //         }, [
    //             span({
    //                 dataBind: {
    //                     style: {
    //                         color: 'item.typeIcon.color'
    //                     }
    //                 },
    //                 class: 'fa fa-circle fa-stack-2x'
    //             }),
    //             span({
    //                 dataBind: {
    //                     css: 'item.typeIcon.classes.join(" ")'
    //                 },
    //                 class: 'fa-inverse fa-stack-1x'
    //             })
    //         ])
    //     ]);
    // }

    return {
        buildSharingInfo: buildSharingInfo,
        buildActions: buildActions,
        buildMetaInfo: buildMetaInfo,
        buildTypeIcon: buildTypeIcon
    };
});