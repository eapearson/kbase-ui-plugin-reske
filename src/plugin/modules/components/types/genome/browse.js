define([
    'knockout-plus',
    'highlight',
    'kb_common/html',

    'css!./browse.css'
], function (
    ko,
    highlight,
    html
) {
    'use strict';

    var t = html.tag,
        a = t('a'),
        span = t('span'),
        div = t('div');

    function viewModel(params) {
        function doOpenNarrative(data) {
            var url = '/narrative/' + data.item.meta.narrativeId;
            window.open(url, '_blank');
        }

        function doOpenDataview(data) {
            var url = '#dataview/' + data.item.meta.workspace.ref;
            window.open(url, '_blank');
        }

        function doKeep(data) {
            console.log('keeping...', data);
        }

        return {
            item: params.item,
            doOpenNarrative: doOpenNarrative,
            doOpenDataview: doOpenDataview,
            doKeep: doKeep
        };
    }



    function template() {
        return div({
            class: 'component-reske-genome-browse -row'
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
                        text: 'item.meta.resultNumber'
                    }
                })),
                div({
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '70%'
                    }
                }, [
                    div({
                        class: '-title'
                    }, [
                        a({
                            dataBind: {
                                attr: {
                                    href: '"#dataview/" + item.meta.workspace.ref'
                                },
                                text: 'item.genome.title'
                            },
                            target: '_blank'
                        })
                    ]),
                    div({}, [
                        a({
                            dataBind: {
                                attr: {
                                    href: '"#people/" + item.meta.owner'
                                }
                            },
                            target: '_blank'
                        }, span({
                            dataBind: {
                                text: 'item.meta.owner'
                            },
                            class: '-owner'
                        })),
                        ' - ',
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
                    ]),
                    // div({
                    //     class: '-domain',
                    //     dataBind: {
                    //         text: 'item.genome.domain'
                    //     }
                    // }),
                    div({
                        class: '-taxonomy',
                        dataBind: {
                            foreach: 'item.genome.taxonomy'
                        }
                    }, [
                        span({
                            dataBind: {
                                text: '$data'
                            }
                        }),
                        '<!-- ko if: $index() < $parent.item.genome.taxonomy.length - 1 -->',
                        ' &gt; ',
                        '<!-- /ko -->'
                    ]),
                    div({
                        class: '-featureCount',

                    }, [
                        span({
                            dataBind: {
                                text: 'item.genome.featureCount'
                            }
                        }),
                        ' features'
                    ])
                ]),
                div({
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'top',
                        width: '25%',
                        textAlign: 'right'
                    }
                }, div({
                    class: '-features'
                }, [
                    // buildButton('globe', 'Public'),
                    div({
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
                            title: 'This genome is shared publicly'
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
                            title: 'This genome is not shared publicly'
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
                            title: 'This genome object has been shared with you'
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
                            title: 'This genome object has not been shared with you'
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
                            title: 'You are the owner of this genome data object'
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
                            title: 'You are not the owner of this genome data object'
                        }),
                        '<!-- /ko -->',
                    ]),

                    div({
                        style: {
                            display: 'inline-block',
                            marginRight: '10px'
                        }
                    }, [
                        span({
                            class: 'mini-button',
                            dataToggle: 'tooltip',
                            dataPlacement: 'left',
                            title: 'Click here to open the Narrative this genome object is embedded in',
                            dataBind: {
                                click: '$component.doOpenNarrative'
                            }
                        }, span({
                            class: 'fa fa-file-o',
                            style: {
                                margin: '0 4px'
                            }
                        })),
                        span({
                            class: 'mini-button',
                            dataToggle: 'tooltip',
                            dataPlacement: 'left',
                            title: 'Click here to open a detailed viewer page for this genome data object',
                            dataBind: {
                                click: '$component.doOpenDataview'
                            }
                        }, span({
                            class: 'fa fa-binoculars',
                            style: {
                                margin: '0 4px'
                            }
                        })),
                        span({
                            class: 'mini-button',
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
                    ]),
                ]))
            ])
        ]);
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }

    ko.components.register('reske/genome/browse', component());

});