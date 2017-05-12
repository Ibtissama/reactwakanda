var tools = {};

tools.createFile = function(path, content) {
  if(typeof content === 'object') {
    content = JSON.stringify(content, null, 2);
  }
  var blob = (new studio.Buffer(content)).toBlob();
  blob.copyTo(path, 'OverWrite');
};

tools.copyFolder = function (source, destination) {
  var folder = new studio.Folder(source);
  if (!folder.exists) {
    return false;
  }

  var destFolder = new studio.Folder(destination);
  if (!destFolder.exists) {
    destFolder.create();
  }


  if (destination.slice(-1) !== '/') {
    destination += '/';
  }

  folder.files.forEach(function (_file) {
    _file.copyTo(destination + _file.name);
  });

  folder.folders.forEach(function (_folder) {
    tools.copyFolder(_folder.path, destination + _folder.name);
  });
};

tools.createFolder = function(path) {
  return studio.Folder(path).create();
};

tools.readFile = function(path) {
  var file = studio.File(path);
  if(file.exists) {
    return File(path).toString();
  }
};

tools.checkExistFile = function(path) {
  var file = studio.File(path);
  return file.exists;
};

tools.copyFile = function(source, destination) {
  var file = studio.File(source);
  if(file.exists) {
    file.copyTo(destination);
  }
};

exports.tools = tools;