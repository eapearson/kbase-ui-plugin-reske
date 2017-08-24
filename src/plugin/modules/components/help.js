define([
    'knockout-plus',
    'kb_common/html'
], function (
    ko,
    html
) {
    'use strict';
    var t = html.tag,
        div = t('div'),
        a = t('a'),
        ul = t('ul'),
        li = t('li'),
        p = t('p');

    function helpTopics() {
        return [{
            id: 'overview',
            title: 'Overview',
            content: div([
                p('This is RESKE search, which allows you to search through many KBase data objects to which you have access.'),
                p([
                    'To get started, simply type your search terms into the search box.'
                ])
            ])
        }, {
            id: 'how-indexed',
            title: 'What data is indexed?',
            content: div([
                p([
                    'Your data, data shared with you, and publicly available data.'
                ])
            ])
        }];
    }

    function viewModel(params) {
        var topics = helpTopics();

        var topicsIndex = {};
        topics.forEach(function (topic) {
            topicsIndex[topic.id] = topic;
        });

        var currentTopicId = ko.observable();

        var currentTopic = ko.observable();

        currentTopicId.subscribe(function () {
            currentTopic(topicsIndex[currentTopicId()]);
        });

        // ACTIONS
        function doSelectTopic(topic) {
            currentTopicId(topic.id);
        }

        currentTopicId(params.topic || 'overview');

        return {
            topics: topics,
            currentTopicId: currentTopicId,
            doSelectTopic: doSelectTopic,
            currentTopic: currentTopic
        };
    }

    function template() {
        return div({
            class: 'component-reske-help'
        }, [
            div({
                class: '-index'
            }, [
                div({
                    style: {
                        fontWeight: 'bold'
                    }
                }),
                ul({
                    dataBind: {
                        foreach: 'topics'
                    }
                }, li(a({
                    dataBind: {
                        text: 'title',
                        click: '$component.doSelectTopic',
                        css: {
                            '-active': 'id === $component.currentTopicId()'
                        }
                    },
                    class: '-item'
                })))
            ]),
            div({
                dataBind: {
                    with: 'currentTopic'
                },
                class: '-body'
            }, [
                div({
                    dataBind: {
                        text: 'title'
                    },
                    class: '-title'
                }),
                div({
                    dataBind: {
                        html: 'content'
                    },
                    class: '-content'
                })
            ])
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