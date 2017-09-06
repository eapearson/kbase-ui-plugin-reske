define([
    'kb_common/html'
], function (
    html
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        button = t('button'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td');

    function viewModel(params) {

        function doRemove(data) {
            params.cart.removeItem(data);
        }

        return {
            cart: params.cart,
            doRemove: doRemove
        };
    }

    function buildCartDisplay() {
        return div({}, [
            table({

                class: 'table table-striped'
            }, [
                tr([
                    th('Guid'),
                    th('Type'),
                    th('Object name'),
                    th('In Narrative'),
                    th('')
                ]),
                '<!-- ko foreach: cart.items -->',
                tr([
                    td({
                        dataBind: {
                            text: 'guid'
                        }
                    }),
                    td({
                        dataBind: {
                            text: 'type'
                        }
                    }),
                    td({
                        dataBind: {
                            text: 'object_name'
                        }
                    }),
                    td({
                        dataBind: {
                            text: 'meta.narrativeTitle'
                        }
                    }),
                    td(button({
                        class: 'btn btn-danger',
                        dataBind: {
                            click: '$component.doRemove'
                        }
                    }, 'Remove from Cart'))
                ]),
                '<!-- /ko -->'
            ])
        ]);
    }

    function template() {
        return div([
            '<!-- ko if: cart.items().length === 0 -->',
            'nothing in your cart!',
            '<!-- /ko -->',
            '<!-- ko if: cart.items().length > 0 -->',
            buildCartDisplay(),
            '<!-- /ko -->',
        ]);
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }

    return component;
});