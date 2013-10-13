define([
  "text!app-components/pipeline-graph/_component.html",
  "text!pipeline_config.json",

  // Global config
  "d3"
], function(graphPartial, pipelineConfig){
  "use strict";

  var pipelineJSON = JSON.parse(pipelineConfig);

  function createHtml(){
    var template = _.compose($, _.template(graphPartial));

    var width = 960,
       height = 500;

    var color = d3.scale.category20();

    var force = d3.layout.force()
    .charge(-120)
    .linkDistance(30)
    .size([width, height]);

    var svg = d3.select("#content").append("svg")
    .attr("width", width)
    .attr("height", height);

    var nonStepControllers = _.chain(pipelineJSON.workflows)
    .select(function(wrk){
      return wrk.output !== undefined;
    })
    .map(function(wrk){
      return {
        source:    wrk.accepts[0],
        target:  wrk.output[0].role
      }
    })
    .value();

    var stepControllers = _.chain(pipelineJSON.workflows)
    .select(function(wrk){
      return wrk.output === undefined;
    })
    .map(function(wrk){
      var outRole = _.chain(wrk.controllers)
      .pluck("output")
      .compact()
      .flatten()
      .map(function(out){
        if (out.role === undefined) { return undefined; }

        return {
          source: wrk.accepts[0],
          target: out.role
        }
      })
      .compact()
      .value();

      return outRole
    })
    .flatten()
    .value();


    var links = _.chain(nonStepControllers.concat(stepControllers))
    .map(function(edge){

      return {
        source: _.indexOf(pipelineJSON.role_priority, edge.source),
        target: _.indexOf(pipelineJSON.role_priority, edge.target),
        value:  1
      }
    })
    .reject(function(link){
      return link.target === -1 || link.source === -1;
    })
    .value();

    var nodes = _.map(pipelineJSON.role_priority, function(role){
      return {
        name: role,
        group: 0
      };
    });

    force
    .nodes(nodes)
    .links(links)
    .start();

    var link = svg.selectAll(".link")
    .data(links)
    .enter().append("line")
    .attr("class", "link")
    .style("stroke-width", function(d) { return Math.sqrt(d.value); });

    var node = svg.selectAll(".node")
    .data(nodes)
    .enter().append("circle")
    .attr("class", "node")
    .attr("r", 5)
    .style("fill", function(d) { return color(d.group); })
    .call(force.drag);

    node.append("title")
    .text(function(d) { return d.name; });


    force.on("tick", function() {
      link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

      node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
    });

    return template;
  }

  return function(context){
    return {
      view: createHtml(),
      events: {}
    };
  };
});
