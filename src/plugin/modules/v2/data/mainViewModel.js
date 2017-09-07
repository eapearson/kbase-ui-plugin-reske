/*
    Top level view model
    Reponsible for the search controls and the tabset, but
    not the individual searches, which are done by the components
    in the respective tabs.
*/
define([
    'bluebird',
    'knockout-plus',
    'numeral',
    'kb_common/bootstrapUtils',
    'kb_common/jsonRpc/genericClient',
    '../../types',
    '../../nanoBus'
], function (
    Promise,
    ko,
    numeral,
    bs,
    GenericClient,
    Types,
    NanoBus
) {
    'use strict';

    function ViewModel(params) {
        var runtime = params.runtime;
        var query = params.query;

        // Top level query engine object threaded through all data-centric components

        // VIEW ELEMENTS
        var searchInput = ko.observable().extend({
            throttle: 150
        });

        var searchError = ko.observable();

        var status = ko.observable();

        // Little message bus for decoupled comm between components.

        // This one is for talking to the tabset component.
        var tabsetBus = NanoBus();

        // ACTIONS
        searchInput.subscribe(function () {
            // This supports the logic of just one search at a time.
            // If we caught the search in time the cancel will 
            // cause an abort in the request, which will inhibit the onload
            // from running.
            // Note, cancel call is synchronous, but the onCancel call in the 
            // promise is async. This means that the promise will immediately honor
            // the cancel and not invoke any methods on the promise (other than finally)
            // but in this case the connection will not be aborted until the async
            // handling of onCancel is called.
            // TODO: currently we have some cancellation login in here just to make 
            // sure this "promise" by bluebird is correct. A warning will be issued
            // to console if the "then" method is ever called after the promise was
            // cancelled.
            // doSearch();
        });

        var withPublicData = ko.observable(false);

        var withPrivateData = ko.observable(true);

        var searching = ko.observable(false);

        var resultsColumnLabel = ko.pureComputed(function () {
            if (searching()) {
                return 'Searching...';
            }
            if (!searchInput() || searchInput().length === 0) {
                return 'No Search';
            }
            return 'Found';
        });

        var searchResultsTabLabel = ko.pureComputed(function () {
            if (searching()) {
                return 'Searching...';
            }
            if (!searchInput() || searchInput().length === 0) {
                return 'No Active Search';
            }
            return 'Search Results';
        });

        function doHelp() {
            var tab = {
                label: 'Help',
                closable: true,
                component: {
                    name: 'reske/help',
                    // NB these params are bound here, not in the tabset.
                    params: {
                        title: 'Some Title',
                        text: 'Some text...'
                    }
                }
            };
            tabsetBus.send('add-tab', {
                tab: tab
            });
        }

        function doSearchDetails(data) {
            // just for now ...
            var query = {
                search: searchInput(),
                type: data.type
            };
            var url = '/#reske/object-search?' + Object.keys(query).map(function (key) {
                return [key, query[key]].map(encodeURIComponent).join('=');
            }).join('&');
            window.location = url;
        }

        // Data Cart

        // TODO maybe index by guid
        var cart = (function () {
            var items = ko.observableArray();

            function removeItem(item) {
                items.remove(item);
                runtime.send('notification', 'notify', {
                    type: 'success',
                    icon: 'thumbs-up',
                    message: 'Successfuly removed data item from cart',
                    autodismiss: 2000
                });
            }

            function addItem(item) {
                items.push(item);
                runtime.send('notification', 'notify', {
                    type: 'success',
                    icon: 'thumbs-up',
                    message: 'Successfuly added data item to cart',
                    autodismiss: 2000
                });
            }

            function hasItem(item) {
                return items.some(function (it) {
                    return (it.guid === item.guid);
                });
            }

            return {
                items: items,
                removeItem: removeItem,
                addItem: addItem,
                hasItem: hasItem
            };
        }());
        // CALLED AFTER LOADED AND READY...

        // The ready message is called when the tabset has loaded and is ready to 
        // interact. We use it here to add the initial tab for search results.
        tabsetBus.on('ready', function () {
            tabsetBus.send('add-tab', {
                tab: {
                    name: 'summary',
                    label: 'Search across all types',
                    component: {
                        name: 'reske/data/search/summary',
                        // NB these params are bound here, not in the tabset.
                        params: {}
                    }
                }
            });
            tabsetBus.send('add-tab', {
                tab: {
                    name: 'cart',
                    label: 'Data Cart',
                    component: {
                        name: 'reske/data/search/cart',
                        // NB these params are bound here, not in the tabset.
                        params: {
                            cart: cart,
                            runtime: runtime
                        }
                    }
                }
            });
            tabsetBus.send('select-tab', 0);
        });


        // Tabs and higher level ui.
        /*
            Tabs are ko-centric.
            Each tab is configured with a label and a component. The 
            component populates the body.
            And a vm function, which maps from the current vm to the vm
            for the body component. 
            Best to prove the body components in separate files to keep the filesize
            here down, and also to decrease the chance of coupling the body
            components to this module.
            TODO: everything, but figure out how to call a disposer on a component;
            a component's vm may need to set up timers, non-dom listeners, etc.
        */

        return {
            // INTERFACE
            runtime: runtime,
            query: query,

            // UI 
            searchInput: searchInput,
            withPublicData: withPublicData,
            withPrivateData: withPrivateData,

            // COMPUTED
            searchResultsTabLabel: searchResultsTabLabel,
            resultsColumnLabel: resultsColumnLabel,
            searchError: searchError,
            isSearching: searching,

            // DATA CART
            cart: cart,

            // ACTIONS
            doSearchDetails: doSearchDetails,
            doHelp: doHelp,

            // BUS
            tabsetBus: tabsetBus
        };
    }

    return ViewModel;
});