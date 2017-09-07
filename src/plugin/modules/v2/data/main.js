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
        div = t('div');

    function factory(config) {
        var hostNode, container, runtime = config.runtime;

        var query = Query.make({
            runtime: runtime
        });

        function render(params) {
            var viewModel = MainViewModel(params);
            container.innerHTML = div({
                class: 'container-fluid'
            }, [

                div({
                    dataBind: {
                        component: {
                            name: '"reske/data/search/ui"',
                            params: {
                                search: 'searchVM'
                            }
                        }
                    }
                })

            ]);
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
            runtime.send('ui', 'setTitle', 'RESKE Data Search Prototype');
            query.start()
                .then(function () {
                    return render({
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