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

            '<!-- ko if: item.meta.public -->',
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
            '<!-- ko ifnot: item.meta.public -->',
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
            '<!-- ko if: item.meta.isOwner -->',
            '<!-- /ko -->',
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
            span({
                class: '-mini-button',
                dataToggle: 'tooltip',
                dataPlacement: 'left',
                title: 'Click here to save this search result in your search shopping cart',
                dataBind: {
                    click: '$component.doKeep'
                }
            }, span({
                class: 'fa fa-cart-plus',
                style: {
                    margin: '0 4px'
                }
            }))
        ]);
    }

    function buildMetaInfo(_options) {
        var options = _options || {};
        return table({
            class: '-table'
        }, [
            tr([
                th('Created'),
                td(span({
                    dataBind: {
                        text: 'item.meta.created.at'
                    },
                    class: '-created-at'
                }))
            ]),

            tr([
                th('In Narrative'),
                td((function () {
                    if (options.showNarrative === false) {
                        return;
                    }
                    // Narrative context
                    return div([
                        a({
                            dataBind: {
                                attr: {
                                    href: '"/narrative/" + item.meta.narrativeId'
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
                                    text: 'item.meta.narrativeTitle'
                                },
                                class: '-narrative-title',
                                style: {
                                    marginLeft: '4px'
                                }
                            })
                        ])
                    ]);
                }()))
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
            ])
        ]);
    }

    function buildMetaInfox(_options) {
        var options = _options || {};
        return div({
            style: {
                marginLeft: '5px'
            }
        }, [
            (function () {
                if (options.showNarrative === false) {
                    return;
                }
                // Narrative context
                return div([
                    a({
                        dataBind: {
                            attr: {
                                href: '"/narrative/" + item.meta.narrativeId'
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
                                text: 'item.meta.narrativeTitle'
                            },
                            class: '-narrative-title',
                            style: {
                                marginLeft: '4px'
                            }
                        })
                    ])
                ]);
            }()),
            // Owner and creation/modification dates
            div({
                style: {
                    maxWidth: '40em'
                }
            }, [
                div({
                    style: {
                        display: 'inline-block',
                        width: '50%'
                    }
                }, [
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
                ]),
                div({
                    style: {
                        display: 'inline-block',
                        width: '50%',
                        textAlign: 'right'
                    }
                }, [
                    span({
                        dataBind: {
                            text: 'item.meta.created.at'
                        },
                        class: '-created-at'
                    }),
                    '<!-- ko if: item.meta.created.at !== item.meta.updated.at -->',
                    ' (last updated ',
                    span({
                        dataBind: {
                            text: 'item.meta.updated.at'
                        },
                        class: '-updated-at'
                    }),
                    ')',
                    '<!-- /ko -->'
                ])
            ])
        ]);
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