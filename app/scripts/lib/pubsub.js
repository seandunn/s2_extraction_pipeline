//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
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
    },

    removeAll:function(topic){
      delete topics[topic];
    }

  };
});
