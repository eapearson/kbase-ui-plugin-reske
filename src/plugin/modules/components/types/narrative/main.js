define([
    'knockout-plus',
    'marked',
    './browse'
], function (
    ko,
    marked
) {
    'use strict';

    function renderMarkdown(source) {
        try {
            var html = marked(source);
            // just in case this is a "code cell" we need to escape out any script tags 
            // (but regular tags need to be there -- this is markdown after all)
            var scripty = /<script/;
            if (scripty.test(html)) {
                html = 'markdown blocked due to script';
            }
            return html;
        } catch (ex) {
            return 'Error rendering markdown: ' + ex.message;
        }
    }

    // TODO prepare it for prettifyig??
    function renderCode(source) {
        try {
            var html = source.replace(/</, '&lt;').replace(/>/, '&gt;');
            return html;
        } catch (ex) {
            return 'Error rendering code: ' + ex.message;
        }
    }

    function normalizeToNarrative(object) {
        // try to suss out interesting narrative bits.
        var cells = object.data.cells.map(function (cell) {
            if (Object.keys(cell.metadata).length > 0) {
                if (cell.metadata.kbase.appCell) {
                    var appCell = cell.metadata.kbase.appCell;
                    // console.log('app', appCell);
                    var app = {
                        name: null,
                        method: null,
                        module: null,
                        description: null
                    };
                    if (appCell.app.spec && 'info' in appCell.app.spec) {
                        app.name = appCell.app.spec.info.name;
                        app.method = appCell.app.spec.info.id.split('/')[1];
                        app.module = appCell.app.spec.info.module_name;
                        app.description = appCell.app.spec.info.subtitle;
                    }
                    return {
                        type: 'app',
                        params: cell.metadata.kbase.appCell.params,
                        spec: cell.metadata.kbase.appCell.app.spec,
                        app: app
                    };
                } else if (cell.metadata.kbase.outputCell) {
                    return {
                        type: 'output'

                    };
                } else if (cell.metadata.kbase.dataCell) {
                    return {
                        type: 'data'
                    };
                } else {
                    if (Object.keys(cell.metadata.kbase).length === 0) {
                        if (cell.outputs) {
                            // is a code cell that has been run. 
                            // a code cell not run?
                            return {
                                type: 'code',
                                source: cell.source,
                                code: renderCode(cell.source)
                            };
                        } else if (cell.source.match(/kb-cell-out/)) {
                            var m = cell.source.match(/kbaseNarrativeOutputCell\((.*)\)/);
                            if (m) {
                                try {
                                    return {
                                        type: 'output-widget',
                                        param: JSON.parse([m[1]])
                                    };
                                } catch (ex) {
                                    return {
                                        type: 'output-widget',
                                        error: 'Error parsing output widget param: ' + ex.error
                                    };
                                }
                            } else {
                                return {
                                    type: 'output-widget',
                                    error: 'Cannot find widget in output cell source'
                                };
                            }
                        } else {
                            // this is a plain Jupyter cell.
                            // any way to differentiate between code and markdown???

                            return {
                                type: 'markdown',
                                markdown: cell.source,
                                html: renderMarkdown(cell.source)
                            };
                        }
                    } else {
                        return {
                            type: 'kbase-unknown',
                            text: 'Unknown kbase cell type: '
                        };
                    }
                }
            } else {
                // Empty metadata - jupyter native
                if (cell.outputs) {
                    // is a code cell that has been run. 
                    // a code cell not run?
                    return {
                        type: 'code',
                        source: cell.source,
                        code: renderCode(cell.source)
                    };
                }
                return {
                    type: 'markdown',
                    markdown: cell.source,
                    html: renderMarkdown(cell.source)
                };
            }

        });

        object['narrative'] = {
            title: object.data.metadata.name,
            description: 'narrative description here...',
            cells: {
                show: ko.observable(false),
                doToggleShow: function (data) {
                    data.show(!data.show());
                },
                cells: cells
            },
            markdownCells: {
                show: ko.observable(false),
                doToggleShow: function (data) {
                    data.show(!data.show());
                },
                cells: cells.filter(function (cell) {
                    return (cell.type === 'markdown');
                })
            }
        };
    }

    function normalize(object) {
        normalizeToNarrative(object);
    }

    return {
        normalize: normalize
    };
});