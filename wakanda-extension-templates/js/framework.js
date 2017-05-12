var json, jsonFile;

studio.extension.storage.setItem('returnValue', undefined);

studio.extension.storage.getItem('dialogArguments').then(function (str) {
  var args = JSON.parse(str);
  jsonFile = args.templatePath;

  //TODO : check for the existence of.wakanda folder and framework.json
  var data = readFile(jsonFile);

  json = JSON.parse(data);
  var elem = json.elements;
  var sel = $('<select class="form__select form__select--dropdown" onchange="getSelectedVal(this);">').appendTo('#el-framwork');
  sel.append($("<option>").attr('value', "default").text("Element to be generated :"));
  for (var i = 0; i < elem.length; i++) {
    sel.append($("<option>").attr('value', elem[i].title).text(elem[i].title));
  }

  resizeDialog();
});

function getSelectedVal(selVal) {
  var selectValue = selVal.value;

  if (selectValue === 'default') {
    // cleanup forms
    $('#el').html('');
    $('#description').html('');
    $('#box').removeClass('box');

    resizeDialog();
    return;
  }

   var jsonElements = json.elements;
   for (var i = 0; i < jsonElements.length; i++) {
      var jsonElement = jsonElements[i];
      if (jsonElement.title == selectValue) {
         var options = jsonElement.options;
         var el = $('#el');
         el.text('');
         drawHtml(el, options);
      }
   }

   resizeDialog();
}

var oldHeight = $(document).height();
function resizeDialog() {
  var newHeight = $('main').outerHeight(true) + $('footer').outerHeight(true);

  if (oldHeight > (newHeight + 50) || oldHeight < newHeight) {
    oldHeight = newHeight;
    studio.extension.resizeDialog($(document).width(), newHeight);
  }
}

 function drawHtml(el, options) {
   for (var i = 0; i < options.length; i++) {
      var option = options[i];
      var type = option.type,
         title = option.title,
         description;

      var label,
         input = $('<input id="' + i + '"></input>');

      if (type === "input") {
         input.attr({'type': 'text','placeholder': title, required: option.mandatory, pattern: option.validator || undefined });
         input.addClass("form__input");

      } else if (type === "boolean") {
         description = $('<span>' + option.description + '</span><br/>');
         label = $('<label style="border-bottom: 1px dotted" for="' + i + '">' + title + '</label>');
         input.attr('type', 'checkbox');
         label.attr('title', option.description);
       }
       //TODO : Add input validation
      $('#box').addClass('box');
      $('#description').text("Please Add the necessary details : ");
      el.append(input);
      el.append(label);
      el.append("<br>");
   }
}


 function quitDialog() {
   studio.extension.quitDialog();
 }

 function getResFromInput(input) {
   var jQInput = $(input);
   switch (jQInput.attr('type')) {
     case "text":
       return jQInput.val();
     case 'checkbox':
       return jQInput.prop('checked');
   }
 }

function execTask() {
  var compoTypeSelect = $('#el-framwork > select'),
    optionsContainer = $('#el');

  var cmpoType = compoTypeSelect.val();
  if (!cmpoType || cmpoType === 'default') {
    studio.alert('You need to select the element to generate.');
    return;
  }
  var options = [];
  var errors = 0;
  optionsContainer.children('input').each(function (i, optionInput) {
    $(optionInput).is(':invalid') && errors++;
    var resInput = getResFromInput(optionInput);
    options.push(resInput);
  });

  if (errors) {
    studio.alert('You need to fix the errors before proceeding.');
    return;
  }
  var values = {
    componentType: cmpoType,
    json: json,
    options: options
  };
  studio.extension.storage.setItem("returnValue", values).then(function () {
    quitDialog();
  });
}
