define([
    'knockout-plus',
    'kb_common/html',
    './query/main',

    './components/type-search'
], function (
    ko,
    html,
    Query
) {
    var t = html.tag,
        div = t('div');

    function factory(config) {
        var hostNode, container, runtime = config.runtime;
        var query = Query.make({
            runtime: runtime
        });

        function renderError(params) {
            container.innerHTML = '';
            var node = container.appendChild(document.createElement('div'));
            node.innerHTML = div({
                class: 'container-fluid'
            }, [
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-sm-12'
                    }, [
                        div({
                            dataBind: {
                                component: {
                                    name: '"reske/error"',
                                    params: {
                                        title: '"Search Error"',
                                        error: 'error'
                                    }
                                }
                            }
                        })
                    ])
                ])
            ]);
            ko.applyBindings(params, node);
        }

        function render(params) {
            var node = container.appendChild(document.createElement('div'));
            node.innerHTML = div({
                dataBind: {
                    component: {
                        name: '"reske/type-search"',
                        params: {
                            runtime: 'runtime',
                            search: 'search',
                            query: 'query',
                            error: 'error'
                        }
                    }
                }
            });
            ko.applyBindings(params, node);
        }

        function viewModel(params) {
            var error = ko.observable();
            error.subscribe(function (newValue) {
                renderError({
                    error: newValue
                });
            });
            var vm = {
                runtime: params.runtime,
                search: params.search,
                query: params.query,
                error: error
            };
            return vm;
        }

        // WIDGET API

        function attach(node) {
            hostNode = node;
            container = hostNode.appendChild(document.createElement('div'));
        }

        function start(params) {
            runtime.send('ui', 'setTitle', 'RESKE Search Prototype');
            query.start()
                .then(function () {
                    render(viewModel({
                        runtime: runtime,
                        search: params.search || null,
                        query: query
                    }));
                });
        }

        function stop() {}

        function detach() {
            if (hostNode && container) {
                hostNode.removeChild(container);
            }
        }

        return {
            attach: attach,
            start: start,
            stop: stop,
            detach: detach
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});