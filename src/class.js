/*!
 * Copyright (C) 2017 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-writer/graphs/contributors
 * @url http://glayzzle.com/php-writer
 */

var filter = require('./helpers/filter');
var serialize = require('./helpers/serializer');
var Method = require('./method');
var Property = require('./property');

/**
 * @constructor
 */
var Class = function Class(ast) {
    this.ast = ast;
};

/**
 * Sets the class name
 */
Class.prototype.setName = function(name) {
    this.ast.name = name;
    return this;
};

/**
 * Extends with the specified classname
 */
Class.prototype.setExtends = function(name) {
    if(name) {
        var ast = parser.parseEval('class a extends '+name+' {}');
        this.ast.extends = ast.children[0].extends;
    } else {
        this.ast.extends = null;
    }
    return this;
};

/**
 * Sets a list of implementation classes
 */
Class.prototype.setImplements = function(names) {
    if (Array.isArray(names)) names = names.join(', ');
    if(names) {
        var ast = parser.parseEval('class a implements '+names+' {}');
        this.ast.implements = ast.children[0].implements;
    } else {
        this.ast.implements = null;
    }
    return this;
};

/**
 * Gets a list of implemented classes
 */
Class.prototype.getImplements = function() {
    var result = [];
    if (this.ast.implements) {
        for (var i = 0; i < this.ast.implements.length; i++) {
            result.push(
                this.ast.implements[i].resolution === 'rn' ?
                'namespace\\' + this.ast.implements[i].name :
                this.ast.implements[i].name
            );
        }
    }
}

/**
 * Adds a new class implement (if not already defined)
 */
Class.prototype.addImplements = function(name) {
    var list = this.getImplements();
    if (list.indexOf(name) === -1) {
        list.push(name);
        this.setImplements(list);
    }
    return this;
};

Class.prototype.setTraits = function(names) {
    // @todo
};

Class.prototype.getTraits = function() {
    // @todo
};


Class.prototype.addTrait = function(name) {
    var list = this.getTraits();
    if (list.indexOf(name) === -1) {
        list.push(name);
        this.setTraits(list);
    }
    return this;
};

/**
 * Retrieves a class property
 */
Class.prototype.getProperty = function(name) {
    return Property.locate(this.ast.body, name);
};

/**
 * Sets a property value
 */
Class.prototype.setProperty = function(name, value, flags) {

    var property = this.getProperty(name);
    if (!property) {
        // append the function
        var ast = parser.parseEval('class a { \n' +
            flags + ' $' + name + (
                value ? ' = ' + value : ''
            ) + ';\n' +
        ' }');
        this.ast.body.unshift(
            ast.children[0].body[0]
        );
    } else {
        if (typeof flags !== 'undefined') property.setFlags(flags);
        if (typeof value !== 'undefined') property.setValue(value);
    }

};

/**
 * Sets a constant value
 */
Class.prototype.getConstant = function(name, value) {
}

/**
 * Sets a constant value
 */
Class.prototype.setConstant = function(name, value) {

  // scan for update existing constant
  for(var i = 0; i < this.ast[5].constants; i++) {
    var c = this.ast[5].constants[i];
    if (c[0] === 'position') {
      c = c[3];
    }
    if (c[0] === 'doc') {
      c = c[2];
    }
    if (c[1] === name) {
      c[2] = serialize(value);
      return this;
    }
  }

  // set a new constant
  this.ast[5].constants.push([
    'const', name, serialize(value)
  ]);
  return this;
};

/**
 * Lookup for a function
 */
Class.prototype.getMethod = function(name) {
    return Method.locate(this.ast.body, name);
};

/**
 * Appends or update an function
 */
Class.prototype.setMethod = function(name, args, body, flags) {
    var method = this.getMethod(name);
    if (!method) {
        // append the function
        var ast = parser.parseEval('class a { \n' +
            flags + ' function ' + name + '(' + args +  ') {\n' +
                body + '\n' +
            '}\n' +
        ' }');
        this.ast.body.push(
            ast.children[0].body[0]
        );
    } else {
        // update the function
        if (typeof flags !== 'undefined') method.setFlags(flags);
        if (typeof args !== 'undefined') method.setArgs(args);
        if (typeof body !== 'undefined') method.setCode(body);
    }
    return this;
};

/**
 * Locate the node in the specified ast
 */
Class.locate = function(ast, name) {
  return filter(ast, 'class', function(node) {
    if (node.name === name) {
      return new Class(node);
    }
  });
};

module.exports = Class;
