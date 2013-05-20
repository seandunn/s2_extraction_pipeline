define([
], function () {
  'use strict';

  var topics = {};

  return {

    publish:function(topic, source, args){
      if(topics[topic]){
        topics[topic].fire(topic, source, args);
      }
    },

    subscribe:function(topic, callback){
      topics = topics || {};
      topics[topic] = topics[topic] || $.Callbacks();
      topics[topic].add(callback);
    },

    remove:function(topic, callback){
      if (topics[topic]){
        topics[topic].remove(callback);
      }
    }

  };
});