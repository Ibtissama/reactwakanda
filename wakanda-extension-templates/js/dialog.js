(function() {

    studio.extension.storage.getItem('dialogArguments').then(function(str) {
        var args = JSON.parse(str);

        var defaultTemplates = {
            mobile: 'ionic1-blank-template',
            web: 'angular1-gulp',
            backend: 'wakanda-javascript'
        };

        function getTemplateInfoFromFolder(folder) {
            var template = {
                name: folder.name,
                description: '',
                tags: [],
                tagsHTML: ''
            };

            var path = folder.path + folder.name + "/";
            var folders = folderContent(path, "folders");

            folders.forEach(function(subFolder) {
                if (subFolder === '.wakanda') {
                    var files = folderContent(path + subFolder + "/", "files");
                    files.forEach(function(file) {
                        if (file === 'manifest.json') {
                            var configFile = readFile(path + subFolder + "/" + file);
                            var config = {};
                            try {
                                config = JSON.parse(configFile);
                            } catch (err) {
                                studio.log(file.name + '\'s .wakanda config file is an invalid JSON');
                            }
                            template.name = config.name || template.name;
                            template.description = config.description || template.description;
                            template.tags = config.tags || template.tags;
                        }
                    });
                }
            });
            template.tags.forEach(function(el) {
                template.tagsHTML += '<span class="form__template-preview-tag">' + el + '</span>';
            });
            return template;
        }

        function addTemplatePreview(containerSelector, templateFolder, isVisible) {
            var template = getTemplateInfoFromFolder(templateFolder);
            var $container = $(containerSelector);
            $container.find('.form__template-preview').append(
                '<div data-id="' + templateFolder.name + '" class="form__template-preview-box" style="display:' + (isVisible ? 'block' : 'none') + ';">' +
                '<p class="form__template-preview-desc">' + template.description + '</p>' +
                template.tagsHTML +
                '</div>'
            );
            $container.find('.form__select').append(
                '<option value="' + templateFolder.name + '">' +
                template.name +
                '</option>'
            );

            if (isVisible) {
                $container.find('.form__select').val(templateFolder.name);
            }
        }

        var mobileTemplatesFolder = args.templatesPath + 'mobile/';
        if (folderExists(mobileTemplatesFolder)) {
            var mobileTemplateFolders = folderContent(mobileTemplatesFolder, "folders");
            mobileTemplateFolders = mobileTemplateFolders.sort();
            mobileTemplateFolders.forEach(function(folder, i) {
                var isVisible = defaultTemplates.mobile === folder;
                var templateFolder = {};
                templateFolder.name = folder;
                templateFolder.path = mobileTemplatesFolder;
                addTemplatePreview('#mobileTemplates', templateFolder, isVisible);
            });
        }

        var webTemplatesFolder = args.templatesPath + 'web/';
        if (folderExists(webTemplatesFolder)) {
            var webTemplatesFolders = folderContent(webTemplatesFolder, "folders");
            webTemplatesFolders = webTemplatesFolders.sort();
            webTemplatesFolders.forEach(function(folder, i) {
                var isVisible = defaultTemplates.web === folder;
                var templateFolder = {};
                templateFolder.name = folder;
                templateFolder.path = webTemplatesFolder;
                addTemplatePreview('#webTemplates', templateFolder, isVisible);
            });
        }

        var backendTemplatesFolder = args.templatesPath + 'backend/';
        if (folderExists(backendTemplatesFolder)) {
            var backendTemplatesFolders = folderContent(backendTemplatesFolder, "folders");
            backendTemplatesFolders = backendTemplatesFolders.sort();
            backendTemplatesFolders.forEach(function(folder, i) {
                var isVisible = defaultTemplates.backend === folder;
                var templateFolder = {};
                templateFolder.name = folder;
                templateFolder.path = backendTemplatesFolder;
                addTemplatePreview('#backendTemplates', templateFolder, isVisible);
            });
        }

        $('.form__input--button').click(function(e) {
            e.preventDefault();
            studio.editor.selectFolder().then(path => {
                if (path) {
                    $(this).parent().find('input').val(path);
                }
            });
        });

        $('.form__input, .form__toggle-input, .form__select').each(function(i, input) {
            var $input = $(input);
            var attributeName = $input.attr('name');
            if (!attributeName) {
                return;
            }
            var dialogArgumentsAttribute = args[attributeName];
            if (typeof dialogArgumentsAttribute === 'undefined') {
                return;
            }
            $input.val(dialogArgumentsAttribute);
        });

        function selectPreview($container, id) {
            $container.find('.form__template-preview-box').hide();
            $container.find('.form__template-preview-box[data-id="' + id + '"]').show();
        }

        function changePreview(element, prev) {
            var $templatesContainer = $(element).closest('.form__group');
            var $templateSelect = $templatesContainer.find('.form__select');
            var $activeOption = $templateSelect.find('option[value="' + $templateSelect.val() + '"]');
            var $newOption = {};
            if (prev) {
                $newOption = $activeOption.prev();
                if ($newOption.length === 0) {
                    $newOption = $templateSelect.find('option').last();
                }
            } else {
                $newOption = $activeOption.next();
                if ($newOption.length === 0) {
                    $newOption = $templateSelect.find('option').first();
                }
            }
            $templateSelect.val($newOption.attr('value'));
            changeSelectValue($templateSelect.next(), $newOption.attr('value'), $newOption.html());
            reloadPreview($templatesContainer);
        }

        function reloadPreview($templatesContainer) {
            var templateId = $templatesContainer.find('.form__select').val();
            selectPreview($templatesContainer.find('.form__template-preview'), templateId);
        }

        $('.form__select').change(function(e) {
            var $templatesContainer = $(this).closest('.form__group');
            reloadPreview($templatesContainer);
        });

        $('.form__template-input-arrow--right').click(function(e) {
            e.preventDefault();
            changePreview(this);
        });

        $('.form__template-input-arrow--left').click(function(e) {
            e.preventDefault();
            changePreview(this, true);
        });

        $('.dialog__button--submit').click(function(e) {
            var name = $("#solutionProjectName").val();
            isValid(name) ? submitDialog() : e.preventDefault();
        });

        function checkSolution(solutionParams) {
            if (!solutionParams) {
                return false;
            }

            if (!solutionParams.name) {
                var path = args.projectCreation ? args.currentSolutionPath : solutionParams.path;
                solutionParams.name = getDefaultSolutionName(path);
            }

            // check for project
            if (args.projectCreation && folderExists(args.currentSolutionPath + solutionParams.name)) {
                studio.alert('This project folder already exists. Please try again with a different name.');
                return false;
            }

            // check for solution
            if (! args.projectCreation && folderExists(solutionParams.path + solutionParams.name)) {
                studio.alert('This solution folder already exists. Please try again with a different name.');
                return false;
            }

            return true;
        }

        function getDefaultSolutionName(folder) {
            var solutionBaseName;

            var i = 0;
            var cont = true;

            while (cont) {
                i++;
                solutionBaseName = "Untitled" + i;
                cont = !folderExists(folder + solutionBaseName);
            }

            return solutionBaseName;
        }

        function submitDialog() {
            var values = {};
            values.components = [];

            $(':input').each(function (i, input) {
                var attributeName = input.getAttribute('name');

                if (!attributeName && !values[attributeName]) {
                    return;
                } else if (input.getAttribute('type') === 'checkbox') {
                    values[attributeName] = $(input).prop('checked');
                } else if (input.getAttribute('type') === 'radio') {
                    if ($(input).prop('checked')) {
                        values[attributeName] = input.value;
                    }
                } else if (attributeName) {
                    values[attributeName] = input.value;
                }
            });

            if (!checkSolution(values)) {
                return false;
            }

            var components = {};
            $('[data-component-type]').each(function (i, input) {
                var type = input.getAttribute("data-component-type");
                var info = input.getAttribute("data-component-info");

                components[type] = components[type] || {};

                components[type].type = type;

                switch (input.getAttribute('type')) {
                    case "checkbox":
                    case "radio":
                        components[type][info] = $(input).prop('checked');
                        break;
                    default:
                        components[type][info] = input.value;
                }
            });

            for (var component in components) {
                if (components[component].enabled) {
                    components[component].name = component;
                    if (components[component].template === "default" && defaultTemplates[component]) {
                        components[component].template = defaultTemplates[component];
                    }

                    values.components.push(components[component]);
                }
            }
             if(!values.components.length){
                studio.alert('Please select at least one project before continuing !')
               return;
            }
            studio.extension.storage.setItem("returnValue", values).then(function() {
                studio.extension.quitDialog();
            });
        }

        function closeDialog() {
            studio.extension.storage.setItem("returnValue", null).then(function() {
                studio.extension.quitDialog();
            });
        }

        $('.dialog__button--cancel').click(function(e) {
            e.preventDefault();
            closeDialog();
        });

        // generate artificial select
        $('.form__select--dropdown').each(function(i, el) {
            var html = '<div class="form__artificial-select-container">';

            var selectHtml = '';
            var optionsHtml = '<div class="form__artificial-select-option--container" style="display:none">';

            for (var option, j = 0; option = el.options[j]; j++) {
                var optionValue = option.getAttribute('value');
                var optionText = option.innerHTML;
                var optionSelected = '';
                if (option.value == el.value) {
                    optionSelected = ' form__artificial-select-option--selected';
                    selectHtml = '<div data-value="' + optionValue + '" class="form__artificial-select">' + optionText + '</div>';
                }
                optionsHtml += '<div data-value="' + optionValue + '" class="form__artificial-select-option' + optionSelected + '">' + optionText + '</div>';
            }

            optionsHtml += '</div>';

            html += selectHtml + optionsHtml + '</div>';

            $(el).hide().after(html);
        });

        function changeSelectValue($container, newValue, newText) {
            $container.find('.form__artificial-select').html(newText);
            $container.prev().val(newValue).trigger('change');
            $container.find('.form__artificial-select-option').each(function(i, el) {
                var $el = $(el);
                if ($el.hasClass('form__artificial-select-option--selected')) {
                    $el.removeClass('form__artificial-select-option--selected');
                }
                if (el.getAttribute('data-value') === newValue) {
                    $el.addClass('form__artificial-select-option--selected');
                }
            });
            $container.find('.form__artificial-select-option--container').hide();
        }

        $('.form__artificial-select-container').hover(function() {
            // on hover
        }, function() {
            // on out
            $(this).find('.form__artificial-select-option--container').hide();
        });

        $('.form__artificial-select').click(function(e) {
            $(this).parent().find('.form__artificial-select-option--container').toggle();
            e.preventDefault();
        });

        $('.form__artificial-select-option').click(function(e) {
            var $container = $(this).closest('.form__artificial-select-container');
            var value = this.getAttribute('data-value');
            var text = this.innerHTML;
            changeSelectValue($container, value, text);
            e.preventDefault();
        });

        $('#solutionProjectName').focus();

        function isValid(str) {
            var pattern = /^[a-zA-Z0-9_-]+$/
            return str.match(pattern) ? true : false;
        }

        $("#solutionProjectName").on("input",function() {
            var name = $(this).val();
            if (!isValid(name)) {
                $(this).addClass('error');
                $("#error-input").val("Allowed characters : A-Z a-z 0-9  _  -");
                $("#error-input").css("color", "red");

            } else {
                $(this).removeClass('error');
                $("#error-input").val("");
            }

        });
        $(document).keydown(function(e) {
            var name = $("#solutionProjectName").val();
            switch (e.which) {
                case 13:
                    isValid(name) ? submitDialog() : e.preventDefault();
                    break;
                case 27:
                    closeDialog();
                    break;
            }
        });
    });
})();
