define([
    'knockout-plus',
    'kb_common/html',
    './mainViewModel',
    '../../query/main'
], function (
    ko,
    html,
    MainViewModel,
    Query
) {
    var t = html.tag,
        div = t('div'),
        p = t('p');

    function factory(config) {
        var hostNode, container, runtime = config.runtime;

        var query = Query.make({
            runtime: runtime
        });

        function render(params) {
            var viewModel = MainViewModel(params);
            container.innerHTML = div({
                dataBind: {
                    component: {
                        name: '"reske-search/narrative/search/ui"',
                        params: {
                            searchVM: 'searchVM'
                        }
                    }
                }
            });
            ko.applyBindings({
                searchVM: viewModel
            }, container);
        }

        // WIDGET API

        function attach(node) {
            hostNode = node;
            container = hostNode.appendChild(document.createElement('div'));
        }

        function start(params) {
            runtime.send('ui', 'setTitle', 'Browse and Search Narratives');
            query.start()
                .then(function () {
                    render({
                        runtime: runtime,
                        query: query,
                        search: params.search || null,
                        type: params.type || null
                    });
                });
        }

        function stop() {}

        function detach() {

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