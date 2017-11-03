/*
Top level panel for  search
*/
define([
    // global deps
    'bluebird',
    'knockout-plus',
    'numeral',
    'marked',
    // kbase deps
    'kb_common/html',
    // local deps
    '../../errorWidget',
    '../utils',
    '../../lib/objectSearch'
], function (
    Promise,
    ko,
    numeral,
    marked,
    html,
    ErrorWidget,
    utils,
    ObjectSearch
) {
    'use strict';

    var t = html.tag,
        div = t('div');


    function viewModel(params) {
        var runtime = params.runtime;
        
        var objectSearch = ObjectSearch.make({
            runtime: runtime
        });

            // Primary user input.
        var searchInput = ko.observable();
        searchInput.extend({
            rateLimit: {
                timeout: 300,
                method: 'notifyWhenChangesStop'
            }
        });

        // Set of object types to show
        var typeFilter = ko.observableArray();
        var typeFilterOptions = [{
            label: 'Narrative',
            value: 'narrative'
        }, {
            label: 'Genome',
            value: 'genome'
        }, {
            label: 'Assembly',
            value: 'assembly'
        }, {
            label: 'Paired-End Read',
            value: 'pairedendlibrary'
        }, {
            label: 'Single-End Read',
            value: 'singleendlibrary'
        }].map(function (item) {
            item.enabled = ko.pureComputed(function () {
                return typeFilter().indexOf(item.value) === -1;
            });
            return item;
        });

        var searchResults = ko.observableArray();
        var searchTotal = ko.observable();
        var actualSearchTotal = ko.observable();
        var searchElapsed = ko.observable();
        var searching = ko.observable();
        var userSearch = ko.observable();
        var availableRowHeight = ko.observable();

        // Note this is tied to the actual row height in the browser.
        var rowHeight = 35;

        var page = ko.observable();


        // Page size, the number of rows to show, is calcuated dynamically
        var pageSize = ko.pureComputed(function () {
            var totalHeight = availableRowHeight();

            if (!totalHeight) {
                return null;
            }

            var rows = Math.floor(totalHeight / rowHeight);
            return rows;
        });

            // The search expression is computed dynamically from subscriptions
            // to search inputs. We do this because auto-searching is triggered
            // by actual changes to the search expression and not simply user
            // interaction with controls. The primary use case is new user input
            // which does not actually change the meaning of the input, e.g.
            // adding spaces, or an ignored term.
        var searchExpression = ko.observable({
            query: null
        });

        searchInput.subscribe(function (newValue) {
            var newExpression = {
                query: newValue
            };
            // var newExpression = utils.parseSearchExpression(searchInput());
            if (utils.isEqual(newExpression, searchExpression())) {
                return;
            }
            searchExpression(newExpression);
        });

        var withPrivateData = ko.observable(true);
        var withPublicData = ko.observable(true);

        // UI BITS
        var message = ko.observable();
        var status = ko.observable();

        function doSearch() {
            objectSearch.doSearch({
                status: status,
                pageSize: pageSize,
                page: page,
                searchInput: searchInput,
                searchExpression: searchExpression,
                message: message,
                searchTotal: searchTotal,
                actualSearchTotal: actualSearchTotal,
                searchResults: searchResults,
                withPrivateData: withPrivateData,
                withPublicData: withPublicData,
                typeFilter: typeFilter
            });
        }


        // Search and state automation.
        // Here is where we listen for key values to change, and trigger a new
        // search.
        // EXPLICIT LISTENERS
        page.subscribe(function () {
            doSearch();
        });

        pageSize.subscribe(function () {
            doSearch();
        });

        withPrivateData.subscribe(function () {
            doSearch();
        });

        withPublicData.subscribe(function () {
            doSearch();
        });

        typeFilter.subscribe(function () {
            doSearch();
        });

        var searchQuery = ko.pureComputed(function () {
            var query = searchInput();

            return {
                query: query
            };
        });

        searchQuery.subscribe(function () {
            // reset the page back to 1 because we do not konw if the
            // new search will extend this far.
            if (!page()) {
                page(1);
            } else if (page() > 1) {
                page(1);
            }
            doSearch();
        });

        // TRY COMPUTING UBER-STATE
        var searchState = ko.pureComputed(function () {
            // TODO: error

            // console.log('state change triggered', searching(), searchQuery(), searchResults().length, pageSize());

            if (searching()) {
                return 'inprogress';
            }

            if (searchQuery().query) {
                if (!pageSize()) {
                    return 'pending';
                }
                if (searchResults().length === 0) {
                    return 'notfound';
                } else {
                    return 'success';
                }
            } else {
                return 'none';
            }
        });

       

        var vm = {
            search: {
                // INPUTS
                searchInput: searchInput,
                // typeFilterInput: typeFilterInput,
                typeFilter: typeFilter,
                typeFilterOptions: typeFilterOptions,
                withPrivateData: withPrivateData,
                withPublicData: withPublicData,

                // SYNTHESIZED INPUTS
                searchQuery: searchQuery,
                searchState: searchState,

                // RESULTS
                searchResults: searchResults,
                searchTotal: searchTotal,
                actualSearchTotal: actualSearchTotal,
                searchElapsed: searchElapsed,
                searching: searching,
                userSearch: userSearch,
                status: status,

                // computed
                availableRowHeight: availableRowHeight,
                pageSize: pageSize,
                // Note, starts with 1.
                page: page,

                // errors: errors,
                // messages: messages,
                // doRemoveError: doRemoveError,
                // doRemoveMessage: doRemoveMessage,
                // addMessage: addMessage,

                doSearch: doSearch
            }
        };
        
        return vm;
    }

    function template() {
        return div({
            style: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column',
                paddingRight: '12px',
                paddingLeft: '12px'
            }
        }, [
            utils.komponent({
                name: 'reske-search/v3/search',
                params: {
                    search: 'search'
                }
            })
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
