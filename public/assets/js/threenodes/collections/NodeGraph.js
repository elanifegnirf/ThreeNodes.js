var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

define(['jQuery', 'Underscore', 'Backbone', 'order!threenodes/core/Node', 'order!threenodes/views/NodeView', 'order!threenodes/nodes/Base', 'order!threenodes/nodes/Conditional', 'order!threenodes/nodes/Geometry', 'order!threenodes/nodes/Lights', 'order!threenodes/nodes/Materials', 'order!threenodes/nodes/Math', 'order!threenodes/nodes/PostProcessing', 'order!threenodes/nodes/Three', 'order!threenodes/nodes/Utils', 'order!threenodes/nodes/Spread', 'order!threenodes/nodes/Particle', 'order!threenodes/collections/ConnectionsCollection'], function($, _, Backbone) {
  "use strict";  return ThreeNodes.NodeGraph = (function(_super) {

    __extends(NodeGraph, _super);

    function NodeGraph() {
      this.get_node = __bind(this.get_node, this);
      this.renderAllConnections = __bind(this.renderAllConnections, this);
      this.createConnectionFromObject = __bind(this.createConnectionFromObject, this);
      this.render = __bind(this.render, this);
      this.create_node = __bind(this.create_node, this);
      this.initialize = __bind(this.initialize, this);
      NodeGraph.__super__.constructor.apply(this, arguments);
    }

    NodeGraph.prototype.initialize = function(models, options) {
      this.nodes_by_nid = {};
      this.fields_by_fid = {};
      this.connections = new ThreeNodes.ConnectionsCollection();
      this.connections.bind("add", function(connection) {
        var view;
        return view = new ThreeNodes.ConnectionView({
          model: connection
        });
      });
      this.types = false;
      return this.bind("add", function(node) {
        var template, tmpl, view;
        template = ThreeNodes.NodeView.template;
        tmpl = _.template(template, node);
        view = new ThreeNodes.NodeView({
          model: node,
          el: $(tmpl)
        });
        return $("#container").append(view.el);
      });
    };

    NodeGraph.prototype.create_node = function(nodename, x, y, inXML, inJSON) {
      var n;
      if (inXML == null) inXML = false;
      if (inJSON == null) inJSON = false;
      if (!ThreeNodes.nodes[nodename]) {
        console.error("Node type doesn't exists: " + nodename);
      }
      n = new ThreeNodes.nodes[nodename]({
        x: x,
        y: y,
        context: this.context,
        inXML: inXML,
        inJSON: inJSON
      });
      n.load(inXML, inJSON);
      this.add(n);
      this.nodes_by_nid[n.get("nid")] = n;
      return n;
    };

    NodeGraph.prototype.render = function() {
      var evaluateSubGraph, invalidNodes, nid, node, terminalNodes, _i, _len, _ref;
      invalidNodes = {};
      terminalNodes = {};
      _ref = this.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        if (node.has_out_connection() === false || node.auto_evaluate || node.delays_output) {
          terminalNodes[node.get("nid")] = node;
        }
        invalidNodes[node.get("nid")] = node;
      }
      evaluateSubGraph = function(node) {
        var upnode, upstreamNodes, _j, _len2;
        upstreamNodes = node.getUpstreamNodes();
        for (_j = 0, _len2 = upstreamNodes.length; _j < _len2; _j++) {
          upnode = upstreamNodes[_j];
          if (invalidNodes[upnode.get("nid")] && !upnode.delays_output) {
            evaluateSubGraph(upnode);
          }
        }
        if (node.dirty || node.auto_evaluate) {
          node.update();
          node.dirty = false;
          node.rack.setFieldInputUnchanged();
        }
        delete invalidNodes[node.get("nid")];
        return true;
      };
      for (nid in terminalNodes) {
        if (invalidNodes[nid]) evaluateSubGraph(terminalNodes[nid]);
      }
      return true;
    };

    NodeGraph.prototype.createConnectionFromObject = function(connection) {
      var c, from, from_node, to, to_node;
      from_node = this.get_node(connection.from_node.toString());
      from = from_node.rack.node_fields_by_name.outputs[connection.from.toString()];
      to_node = this.get_node(connection.to_node.toString());
      to = to_node.rack.node_fields_by_name.inputs[connection.to.toString()];
      c = this.connections.create({
        from_field: from,
        to_field: to,
        cid: connection.id
      });
      return c;
    };

    NodeGraph.prototype.renderAllConnections = function() {
      return this.connections.render();
    };

    NodeGraph.prototype.removeNode = function(n) {
      this.remove(n);
      if (this.nodes_by_nid[n.get("nid")]) {
        return delete this.nodes_by_nid[n.get("nid")];
      }
    };

    NodeGraph.prototype.removeConnection = function(c) {
      return this.connections.remove(c);
    };

    NodeGraph.prototype.get_node = function(nid) {
      return this.nodes_by_nid[nid];
    };

    NodeGraph.prototype.remove_all_nodes = function() {
      $("#tab-attribute").html("");
      this.reset([]);
      return true;
    };

    NodeGraph.prototype.remove_all_connections = function() {
      return this.connections.removeAll();
    };

    return NodeGraph;

  })(Backbone.Collection);
});