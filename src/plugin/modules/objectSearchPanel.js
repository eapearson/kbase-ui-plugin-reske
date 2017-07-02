define([
    'knockout-plus',
    'kb_common/html',

    './components/object-search'
], function (
    ko,
    html
) {
    var t = html.tag,
        div = t('div');

    function factory(config) {
        var hostNode, container, runtime = config.runtime;

        function render(params) {
            container.innerHTML = div({
                dataBind: {
                    component: {
                        name: '"reske-object-search"',
                        params: {
                            runtime: 'runtime',
                            search: 'search',
                            type: 'type'
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