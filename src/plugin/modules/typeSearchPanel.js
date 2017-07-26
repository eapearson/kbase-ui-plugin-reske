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

        function render(params) {
            container.innerHTML = div({
                dataBind: {
                    component: {
                        name: '"reske-type-search"',
                        params: {
                            runtime: 'runtime',
                            search: 'search',
                            query: 'query'
                        }
                    }
                }
            });
            ko.applyBindings(params, container);
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
                    render({
                        runtime: runtime,
                        search: params.search || null,
                        query: query
                    });
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