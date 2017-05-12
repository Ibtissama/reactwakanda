var extensionFolder = studio.extension.getFolder();
var fs = require("studio/filesystem");
var tools = require(normalizePath(extensionFolder.path + '/js/tools')).tools;
var Mustache = require(normalizePath(extensionFolder.path + '/js/mustache'));

function Solution(params) {
  this.solPath = normalizePath(params.solPath);
  this.name = params.name;
  this.extensionPath = studio.extension.getFolder().path;
  this.isCreation = params.isCreation;

  if(this.isCreation) {
    this._components = params.components || [];
  } else {
    this._components = [];
    var content = this.readAppJsonFile();
    this.name = content.name;
    this.components = content.components;
  }
}

Solution.prototype.readAppJsonFile = function() {
  var path = normalizePath(this.solPath + '/.wakanda/app.json');
  if(! tools.checkExistFile(path)) {
    throw Error(path + " didn't exist");
  }

  return JSON.parse(tools.readFile(normalizePath(this.solPath + '/.wakanda/app.json')));
};

Solution.prototype.createSolutionFolder = function() {
  tools.createFolder(this.solPath);
  tools.copyFolder(normalizePath(this.getTemplatePath({ type: 'solution', name: 'solution' })), this.solPath);
};

Solution.prototype.createComponents = function() {
  var that = this;
  this._components.forEach(function (component) {
    that.createComponent(component);
  });
  this._components = [];
};

Solution.prototype.createComponent = function(_component) {
  var component = {
    type: _component.type,
    template: _component.template,
    name: _component.name,
    path: './' + _component.name
  };

  if(! this.components) {
    this.components = [];
  }

  this.components.push(component);

  tools.copyFolder(this.getTemplatePath({ type: component.type, name: component.template }), this.getComponentFullPath(component.path));

  this.updatePackageDotJsonFile(component.path,component.name);

  return normalizePath( this.getComponentFullPath(component.path) + '/app.waProject');
};

Solution.prototype.removeComponent = function (component) {
  if (!component) {
    return;
  }
  this.components = this.components.filter(function (_component) {
    return component.name !== _component.name;
  });

  this.updateAppFile();
  this.updateWaSolutionFile();
};

Solution.prototype.updatePackageDotJsonFile = function (path, name) {

  var template = tools.readFile(normalizePath(this.getComponentFullPath(path) + '/package.json'));
  if (!template) {
    return;
  }

  var render = Mustache.render(template, { name: name });
  tools.createFile(this.getComponentFullPath(path) + '/package.json', render);
};

Solution.prototype.updateAppFile = function() {
  var template = tools.readFile(normalizePath(this.extensionPath + '/templates/solution/.wakanda/app.json'));
  var components = this.components;

  var lastComponent = components.slice(-1)[0];
  lastComponent && (lastComponent.last = true);

  var render = Mustache.render(template, { name: this.name, components: components });
  tools.createFile(normalizePath(this.solPath + '/.wakanda/app.json'), render);

  lastComponent && (delete lastComponent.last);
};

Solution.prototype.updateWaSolutionFile = function() {
  var template = tools.readFile(normalizePath(this.extensionPath + '/templates/app.waSolution'));
  var render = Mustache.render(template, { components: this.components, componentPath: function () { return this.path + '/app.waProject'; } });
  tools.createFile(this.solPath + 'app.waSolution', render);
};

Solution.prototype.getTemplatePath = function(template) {
  var path;
  switch(template.type) {
    case 'backend':
    case 'mobile':
    case 'web':
      path = normalizePath(this.extensionPath + '/templates/' + template.type + '/' + template.name);
      break;
    case 'solution':
      path = normalizePath(this.extensionPath + '/templates/' + template.name);
      break;
    default:
      new Error('Unknown template type : ' + template.type);
  }
  return path;
};

Solution.prototype.getComponentFromFullPath = function (fullPath) {
  if (!fullPath) {
    return;
  }

  fullPath = normalizePath(fullPath);

  var component,
    that = this;
  this.components.some(function (_component) {
    var _componentFullPath = normalizePath(that.solPath + _component.path + '/app.json');
    if (fullPath === _componentFullPath) {
      component = _component;
    }
  });

  return component;
};

Solution.prototype.getComponentFullPath = function(path) {
  return normalizePath(this.solPath + path);
};

Solution.prototype.openSolution = function() {
  studio.openSolution(normalizePath(this.solPath + '/app.waSolution'));
};

function normalizePath(path) {
  return fs.normalizePath(path);
}

exports.Solution = Solution;
