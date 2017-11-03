define([
    'knockout-plus',
    'jquery',
    'kb_common/html',
    '../utils'
], function (
    ko,
    $,
    html,
    utils
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        a = t('a'),
        p = t('p');

    var styles = html.makeStyles({
        component: {
            flex: '1 1 0px',
            display: 'flex',
            flexDirection: 'column'
        },
        header: {
            flex: '0 0 50px'
        },
        body: {
            flex: '1 1 0px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start'
        },
        headerRow: {
            flex: '0 0 35px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'gray',
            color: 'white'
        },
        itemRow: {
            css: {
                flex: '0 0 35px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center'
            },
            pseudo: {
                hover: {
                    backgroundColor: '#CCC',
                    cursor: 'pointer'
                }
            }
        },
        itemRowActive: {
            backgroundColor: '#DDD'
        },
        searchLink: {
            css: {
                textDecoration: 'underline'
            },
            pseudo: {
                hover: {
                    textDecoration: 'underline',
                    backgroundColor: '#EEE',
                    cursor: 'pointer'
                }
            }
        },
        cell: {
            flex: '0 0 0px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            border: '1px silver solid',
            height: '35px',
            padding: '2px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
        },
        headerCell: {
            flex: '0 0 0px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            border: '1px silver solid',
            height: '35px',
            padding: '2px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center'
        },
        innerCell: {
            flex: '1 1 0px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis'
        },

        cellLink: {
            pseudo: {
                hover: {
                    textDecoration: 'underline',
                    backgroundColor: '#EEE',
                    cursor: 'pointer'
                }
            }
        },
        // Columns
        // narrative name, object name, type, date, owner, share level
        narrativeCell: {
            flexBasis: '33%'
        },
        objectNameCell: {
            css: {
                flexBasis: '32%'
            }
        },
        typeCell: {
            flexBasis: '10%'
        },
        dateCell: {
            flexBasis: '10%'
        },
        ownerCell: {
            flexBasis: '10%'
        },
        shareLevelCell: {
            flexBasis: '5%',
            textAlign: 'center'
        },
        sectionHeader: {
            padding: '4px',
            fontWeight: 'bold',
            color: '#FFF',
            backgroundColor: '#888'
        },
        selected: {
            backgroundColor: '#CCC'
        },
        private: {
            backgroundColor: 'green'
        },
        miniButton: {
            css: {
                padding: '2px',
                border: '2px transparent solid',
                cursor: 'pointer'
            },
            pseudo: {
                hover: {
                    border: '2px white solid'
                },
                active: {
                    border: '2px white solid',
                    backgroundColor: '#555',
                    color: '#FFF'
                }
            }
        }
    });

    function viewModel(params, componentInfo) {
        var search = params.search;
        var searchResults = search.searchResults;
        var searching = search.searching;

        var infoTopics = {
            fromFile: {
                tip: 'The information below identifies the file you will be copying into your Staging Area.',
            },
            toStaging: {
                tip: 'Your Staging Area is your personal file folder into which you may copy files, and from which you may import files to database objects.'
            }
        };

        // Auto Sizing:

        // we hinge upon the height, which is updated when we start and when the ...
        var height = ko.observable();

        height.subscribe(function (newValue) {
            search.availableRowHeight(newValue);
        });

        var resizerTimeout = 200;
        var resizerTimer = null;

        function calcHeight() {
            var tableHeight = componentInfo.element.querySelector('.' + styles.classes.body).clientHeight;
            return tableHeight;
        }

        // A cheap delay to avoid excessive resizing.
        function resizer() {
            if (resizerTimer) {
                return;
            }
            window.setTimeout(function () {
                resizerTimer = null;
                height(calcHeight());
            }, resizerTimeout);
        }
        window.addEventListener('resize', resizer, false);
        height(calcHeight());

        console.log('heights?', calcHeight(), styles.classes.body, componentInfo.element.querySelector('.' + styles.classes.body));


        return {
            search: params.search,
            searchResults: searchResults,
            searching: searching
        };
    }


    function buildIcon(arg) {
        var klasses = ['fa'],
            style = { verticalAlign: 'middle' };
        klasses.push('fa-' + arg.name);
        if (arg.rotate) {
            klasses.push('fa-rotate-' + String(arg.rotate));
        }
        if (arg.flip) {
            klasses.push('fa-flip-' + arg.flip);
        }
        if (arg.size) {
            if (typeof arg.size === 'number') {
                klasses.push('fa-' + String(arg.size) + 'x');
            } else {
                klasses.push('fa-' + arg.size);
            }
        }
        if (arg.classes) {
            arg.classes.forEach(function (klass) {
                klasses.push(klass);
            });
        }
        if (arg.style) {
            Object.keys(arg.style).forEach(function (key) {
                style[key] = arg.style[key];
            });
        }
        if (arg.color) {
            style.color = arg.color;
        }

        return span({
            dataElement: 'icon',
            style: style,
            class: klasses.join(' ')
        });
    }

    function buildResult() {
        var rowClass = {};
        // rowClass[styles.classes.selected] = 'selected()';
        return div({
            dataBind: {
                click: '$component.doShowInfo',
                css: rowClass,
                with: 'simpleBrowse'
            },
            class: styles.classes.itemRow
        }, [
            div({
                class: [styles.classes.cell, styles.classes.narrativeCell]
            }, 
            div({                
                class: [styles.classes.innerCell]
            }, [
                '<!-- ko if: $data.narrativeUrl -->',
                a({
                    dataBind: {
                        attr: {
                            href: 'narrativeUrl'
                        },
                        text: 'narrativeTitle'
                    },
                    target: '_blank'
                }),
                '<!-- /ko -->',
                '<!-- ko ifnot: $data.narrativeUrl -->',
                '<!-- ko if: $data.narrativeTitle -->',
                span({
                    dataBind: {
                        text: 'narrativeTitle'
                    }
                }),
                '<!-- /ko -->',
                '<!-- ko ifnot: $data.narrativeTitle -->',
                '-',
                '<!-- /ko -->',
                '<!-- /ko -->'
            ])),
            div({
                class: [styles.classes.cell, styles.classes.objectNameCell]
            }, 
            div({                
                class: [styles.classes.innerCell]
            }, [
                '<!-- ko if: $data.objectRef -->',
                a({
                    dataBind: {
                        attr: {
                            href: '"#dataview/" + objectRef'
                        },
                        text: 'objectName'
                    },
                    target: '_blank'
                }),
                '<!-- /ko -->',
                '<!-- ko ifnot: $data.objectRef -->',
                '<!-- ko if: $data.objectName -->',
                span({
                    dataBind: {
                        text: 'objectName'
                    }
                }),
                '<!-- /ko -->',
                '<!-- ko ifnot: $data.objectName -->',
                '-',
                '<!-- /ko -->',
                '<!-- /ko -->'
            ])),
            // div({
            //     class: [styles.classes.cell, styles.classes.objectNameCell]
            // }, div({
            //     dataBind: {
            //         text: 'objectName'
            //     },
            //     class: [styles.classes.innerCell]
            // })),
            div({
                class: [styles.classes.cell, styles.classes.typeCell]
            }, div({
                dataBind: {
                    text: 'type'
                },
                class: [styles.classes.innerCell]
            })),
            div({
                class: [styles.classes.cell, styles.classes.dateCell]
            }, div({
                dataBind: {
                    typedText: {
                        value: 'date',
                        type: '"date"',
                        format: '"YYYY-MM-DD"'
                    }
                },
                class: [styles.classes.innerCell]
            })),
            div({
                class: [styles.classes.cell, styles.classes.ownerCell]
            }, div({
                dataBind: {
                    text: 'owner'
                },
                class: [styles.classes.innerCell]
            })),
            div({
                class: [styles.classes.cell, styles.classes.shareLevelCell]
            }, div({
                // dataBind: {
                //     text: 'shareLevel'
                // },
                class: [styles.classes.innerCell]
            }, [
                '<!-- ko if: isOwner -->',
                span({class: 'fa fa-key'}),
                '<!-- /ko -->',
                
                '<!-- ko ifnot: isOwner -->',
                
                '<!-- ko if: isShared -->',
                span({class: 'fa fa-share-alt'}),
                '<!-- /ko -->',
                
                '<!-- ko ifnot: isShared -->',
                '<!-- ko if: isPublic -->',
                span({class: 'fa fa-globe'}),
                '<!-- /ko -->',
                '<!-- /ko -->',

                '<!-- /ko -->'
            ]))
        ]);
    }

    function buildSortControl() {
        return span({
            class: 'fa fa-sort',
            style: {
                marginRight: '2px'
            }
        });
    }


    function buildNoActiveSearch() {
        return div({
            style: {
                textAlign: 'left',
                maxWidth: '50em',
                margin: '0 auto'
            }
        }, [
            p({style: {textAlign: 'center'}}, 'PLACEHOLDER - for search instructions')
        ]);
    }

    function template() {
        return div({
            class: styles.classes.component
        }, [
            styles.sheet,
            div({
                class: styles.classes.headerRow
            }, [
                div({
                    class: [styles.classes.headerCell, styles.classes.narrativeCell]
                }, [buildSortControl('narrative'), 'Narrative']),
                div({
                    class: [styles.classes.headerCell, styles.classes.objectNameCell],
                    title: 'Object Name'
                }, [buildSortControl('object'), 'Object']),
                div({
                    class: [styles.classes.headerCell, styles.classes.typeCell]
                }, [buildSortControl('type'), 'Type']),
                div({
                    class: [styles.classes.headerCell, styles.classes.dateCell],
                    title: 'Last saved date'
                }, [buildSortControl('date'), 'Date']),
                div({
                    class: [styles.classes.headerCell, styles.classes.ownerCell]
                }, [buildSortControl('owner'), 'Owner']),
                div({
                    class: [styles.classes.headerCell, styles.classes.shareLevelCell]
                }, [buildSortControl('shareLevel'), 'Sharing'])
            ]),
            div({
                class: styles.classes.body
            }, [
                '<!-- ko if: searchResults().length > 0 -->',
                '<!-- ko foreach: searchResults -->',
                buildResult(),
                '<!-- /ko -->',
                '<!-- /ko -->',
                '<!-- ko if: searchResults().length === 0 -->',
                '<!-- ko if: search.searchState() === "inprogress" -->',
                div({
                    style: {
                        margin: '10px',
                        border: '1px silver solid',
                        padding: '8px',
                        backgroundColor: 'silver',
                        textAlign: 'center'
                    }
                }, html.loading('Searching...')),
                '<!-- /ko -->',
                '<!-- ko if: search.searchState() === "notfound" -->',
                div({
                    style: {
                        margin: '10px',
                        border: '1px silver solid',
                        padding: '8px',
                        backgroundColor: 'silver',
                        textAlign: 'center'
                    }
                }, 'no results, keep trying!'),
                '<!-- /ko -->',
                '<!-- ko if: search.searchState() === "none" -->',
                div({
                    style: {
                        // margin: '10px',
                        border: '1px silver solid',
                        padding: '8px',
                        backgroundColor: 'silver',
                        textAlign: 'center'
                    }
                }, buildNoActiveSearch()),
                '<!-- /ko -->',
                '<!-- /ko -->'
            ])
        ]);
    }

    function component() {
        return {
            viewModel: {
                createViewModel: viewModel
            },
            template: template()
        };
    }

    return component;
});
