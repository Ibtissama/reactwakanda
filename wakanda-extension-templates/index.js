var extensionFolder = studio.extension.getFolder();
var SolutionCreator = require(extensionFolder.path + 'js/solution').Solution;
var Task = require('studio/task');
var fs = require('studio/filesystem');
var Solution = require('studio/solution');
var StudioEvents = require('studio/events').StudioEvents;
StudioEvents.init(this, 'wakanda-extension-templates');

var actions = {};

function getDefaultSolutionFolder() {
  var wakandaFolder = Folder('WAKANDA_FOLDER');
  if (!wakandaFolder.exists) {
    var extensionFolder = Folder('EXTENSIONS_USER');
    wakandaFolder = Folder(extensionFolder.path).parent;
  }
  var solutionsFolderPath = wakandaFolder.path + 'solutions';
  var createSolutionFolder = Folder(solutionsFolderPath).create();
  if (createSolutionFolder) {
    return Folder(solutionsFolderPath);
  }
  return wakandaFolder;
}

function getNextFolderName(folderPath, name) {
  name = name || 'Untitled';
  var counter = 0,
    regex = new RegExp('(' + name + ')(\\d+)');

  studio.Folder(folderPath).forEachFolder(function (folder) {
    var checkFolderName = regex.exec(folder.name);
    if (checkFolderName) {
      var nameNumber = parseInt(checkFolderName[2]);
      if (nameNumber > counter) {
        counter = nameNumber;
      }
    }
  });
  counter++;
  name += counter;

  return name;
}

actions.createFrameworkElement = function(params) {

  var solution = Solution.getCurrent();

  if (!solution) {
    return;
  }

  var projectFolder = studio.currentSolution.getSelectedItems()[0].path;
  var componentInfo = solution.getComponentInfoFromChildPath(projectFolder);

  if(!componentInfo){
    studio.alert("A fatal error occured, please declare an issue.");

    return;
  }

  var projectWakandaPath = componentInfo.wakandaFolderPath;
  var frameworkFilePath = fs.normalizePath(projectWakandaPath + '/framework.json');

  if(! fs.checkExistFile(frameworkFilePath)){
    studio.alert("This framework CLI is not supported yet");

    return;
  }

  studio.extension.showModalDialog(
    "framework.html",
    {
      templatePath: frameworkFilePath
    },
    {
      title: "New Framework Element",
      width: 640,
      height: 260,
    },
    'execTask'
  );
};

function createCommand(cmdSpec, optRes) {
  var solution = Solution.getCurrent();

  var boolToStr = function (bool) {
    return bool ? "true" : "false";
  };
  var options = cmdSpec.options
    .map(function (option, i) {
      if (option.command) {
        return option.command.replace("{{value}}", optRes[i]);
      }
      if (option.values) {
        for (var ii = 0; ii < option.values.length; ii++) {
          var command = option.values[ii].command;
          var value = option.values[ii].value;
          if (value == boolToStr(optRes[i])) {
            return command;
          }
        }
      }
    })
    .join(' ');

  var projectFolder = studio.currentSolution.getSelectedItems()[0].path;
  var componentInfo = solution.getComponentInfoFromChildPath(projectFolder);

  var cmd = "cd " + componentInfo.fullPath + " && ";
  cmd += cmdSpec.command.replace("{{options}}", options);
  return cmd;
}
actions.execTask = function (params) {
  params = params || studio.extension.storage.returnValue;

  if (!params || !params.json || !params.componentType) {
    return false;
  }

  var json = params.json,
    optionsRes = params.options;
    compoType = params.componentType;

  var jsonElements = json.elements;
  var commandSpec;
  for (var i = 0; i < jsonElements.length; i++) {
    if (jsonElements[i].title == compoType) {
      commandSpec = jsonElements[i];
      break;
    }
  }

  var command = createCommand(commandSpec, optionsRes);
  printConsole({
    message : command
  });

  var task = new Task(command, "Creating " + compoType);
  task.onMessage(function (message) {
    printConsole({
      message : message
    });
  });
  task.onError(function (message) {
    printConsole({
      type : "ERROR",
      message : message
    });
  });
  task.onTerminated(function (event) {
    if(event.exitCode !== 0){
      printConsole({
        type : "ERROR",
        message : 'Couldn\'t generate the requested element, please check your project dependencies using the {%a href="#" onclick="studio.sendCommand(\'wakanda-extension-trouble-shooting.getTroubleshootingPage\')"%}troubleshooting wizard{%/a%}.'
      });
    } else {
      printConsole({
        message : "Framework element generation completed."
      });
    }
  });
}

actions.showCreateSolutionDialog = function(params) {
  // reset returnValue object
  studio.extension.storage.returnValue = {};

  var wakandaSolutionsFolder = getDefaultSolutionFolder();

  var solutionName = getNextFolderName(wakandaSolutionsFolder.path);

  studio.extension.showModalDialog(
    // dialog template
    "solutionDialog.html",
    // options
    {
      name: solutionName,
      path: wakandaSolutionsFolder.path,
      mobile: true,
      web: true,
      templatesPath: extensionFolder.path + 'templates/'
    },
    // dialog config
    {
      title: "New solution",
      width: 805,
      height: 662,
      resizable: false
    },
    // callback function
    'createSolution'
  );

  return false;
};

actions.showAddProjectDialog = function(params) {
  // reset returnValue object
  studio.extension.storage.returnValue = {};

  var solutionFile = studio.currentSolution.getSolutionFile();
  var solutionFolder = solutionFile.parent.parent;
  var projectName = getNextFolderName(solutionFile.parent.path);

  studio.extension.showModalDialog(
    // dialog template
    "projectDialog.html",
    // options
    {
      name: projectName,
      path: solutionFolder.path,
      mobile: true,
      web: true,
      templatesPath: extensionFolder.path + 'templates/',
      currentSolutionPath: solutionFile.parent.path,
      projectCreation: true
    },
    // dialog config
    {
      title: "New project",
      width: 805,
      height: 662,
      resizable: false
    },
    //   callback function
    'createProject'
  );

  return false;
};

exports.handleMessage = function handleMessage(message) {
  "use strict";

  var actionName = message.action;
  var params = message.params;

  if (!actions.hasOwnProperty(actionName)) {
    studio.alert("Unknown command: " + actionName);
    return false;
  }
  actions[actionName](params);
};

actions.createSolution = function(params) {
  params = params || studio.extension.storage.returnValue;
  if (!params || !params.name) {
    return false;
  }

  var solution = new SolutionCreator({
    name: params.name,
    solPath: params.path + '/' + params.name + '/',
    components: params.components,
    isCreation: true
  });

  solution.createSolutionFolder();
  solution.createComponents();
  solution.updateAppFile();
  solution.updateWaSolutionFile();

  // open the solution
  solution.openSolution();
};

actions.createProject = function(params) {
  params = params || studio.extension.storage.returnValue;
  if (! params || ! params.components || params.components.length !== 1) {
    return false;
  }

  var solution = new SolutionCreator( { 
    solPath: studio.currentSolution.getSolutionFile().parent.path,
    solutionCreated: true
  });

  var waProjectPath = solution.createComponent({
      type: params.components[0].type,
      enabled: params.components[0].enabled,
      template: params.components[0].template,
      name: params.name
  });
  solution.updateAppFile();
  solution.updateWaSolutionFile();
  studio.addExistingProject(waProjectPath, false);

  // fire event : new component is added
  StudioEvents.emit('studio.onComponentCreated', Solution.getCurrent().getComponentInfoFromName(params.name));
};

actions.removeComponent = function (componentPath) {

  var solution = new SolutionCreator({
    solPath: studio.currentSolution.getSolutionFile().parent.path,
    solutionCreated: true
  });

  var component = solution.getComponentFromFullPath(componentPath);
  solution.removeComponent(component);
};


StudioEvents.on('studio.onComponentRemoved', function (event) {
  if (event.source.data && event.source.data.length) {
    var componentPath = event.source.data[0].path;
    if (componentPath) {
      componentPath = componentPath.replace(/app\.waProject$/, 'app.json');
      actions.removeComponent(componentPath);
    }
  }
});

function getMessageString(options) {
	var message = {
		msg: options.message,
		type: options.type || null,
		category: options.category || 'env'
    };

	return 'wakanda-extension-mobile-console.append.' + (new Buffer(JSON.stringify(message), "utf8")).toString("base64");
}

function printConsole(obj) {
    studio.sendCommand(getMessageString(obj));
}
