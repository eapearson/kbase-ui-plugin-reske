define([
    'knockout-plus',
    'kb_common/html',
    './mainViewModel'
], function (
    ko,
    html,
    MainViewModel
) {
    var t = html.tag,
        div = t('div');

    function factory(config) {
        var hostNode, container, runtime = config.runtime;

        function render(params) {
            var viewModel = MainViewModel(params);
            container.innerHTML = div({
                dataBind: {
                    component: {
                        name: '"reske/data/search/ui"',
                        params: {
                            search: 'searchVM'
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
            runtime.send('ui', 'setTitle', 'RESKE Data Search Prototype');
            render({
                runtime: runtime,
                search: params.search || null,
                type: params.type || null
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