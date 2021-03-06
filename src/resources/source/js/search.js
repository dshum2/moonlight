jQuery.expr[':'].contains = function (a, i, m) {
    return jQuery(a).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
};

$(function () {
    const checked = {};
    const body = $('body');

    const init = function (item) {
        $('div.item[data-item="' + item + '"] input.one').each(function () {
            let parent = $(this).parents('div.row');
            let relatedItem = $(this).data('item');
            let propertyName = $(this).data('property');
            let width = $(this).outerWidth() - 2;

            $(this).autocomplete({
                serviceUrl: '/moonlight/elements/autocomplete',
                params: {
                    item: relatedItem
                },
                formatResult: function (suggestion, currentValue) {
                    return suggestion.value + ' <small>(' + suggestion.id + ')</small>';
                },
                onSelect: function (suggestion) {
                    parent.find('input:hidden[name="' + propertyName + '"]').val(suggestion.id);
                    parent.find('span.element-container[data-name="' + propertyName + '"]').html(suggestion.value);
                },
                width: width,
                minChars: 0
            });
        });
    };

    const getElements = function (item, params) {
        let form = $('form[name="search-form"]');
        let itemContainer = $('div.item[data-item="' + item + '"]');
        let url = itemContainer.data('url');
        let formData = new FormData(form[0]);
        let data = {
            item: item
        };

        for (let pair of formData.entries()) {
            data[pair[0]] = pair[1];
        }

        if (params) {
            for (let index in params) {
                data[index] = params[index];
            }
        }

        $.blockUI();

        $.ajax({
            url: url,
            data: data
        }).done(function (response) {
            $.unblockUI();

            if (response.html) {
                itemContainer.html(response.html);
                $(document).trigger('item-loaded', [item]);
                init(item);
            }
        }).fail(function (response) {
            $.unblockUI();
            $.alert(response.statusText);
        });
    };

    const submit = function (item, page) {
        let form = $('form[name="search-form"]');

        form.find('input:hidden[name="page"]').val(page);
        form.submit();
    };

    $('div.item[data-item]').each(function () {
        let item = $(this).data('item');

        init(item);
    });

    body.on('keyup change', '#filter', function () {
        let str = $(this).val();

        if (str.length > 0) {
            $('ul.items > li:not(:contains("' + str + '"))').hide();
            $('ul.items > li:contains("' + str + '")').show();
        } else {
            $('ul.items > li').show();
        }
    });

    body.on('click', '.sort span[data-sort]', function () {
        let item = $(this).parents('.sort').data('active-item');
        let sort = $(this).data('sort');

        $.blockUI();

        $.post('/moonlight/search/sort', {
            item: item,
            sort: sort
        }, function (response) {
            $.unblockUI();

            if (response.html) {
                $('.items-container').html(response.html);
            }
        });
    });

    $('.search-form-links div.link').click(function () {
        let itemContainer = $(this).parents('div.search-form[data-item]');
        let item = itemContainer.data('item');
        let name = $(this).data('name');
        let active = ! $(this).hasClass('active');

        $(this).toggleClass('active');
        $('.search-form-params div.block[data-name="' + name + '"]').toggleClass('active');

        if (active) {
            $('.search-form-params div.block[data-name="' + name + '"]')
                .find('input, select')
                .removeAttr('disabled');
        } else {
            $('.search-form-params div.block[data-name="' + name + '"]')
                .find('input, select')
                .attr('disabled', 'disabled');
        }

        $.post('/moonlight/search/active', {
            item: item,
            property: name,
            active: active
        });
    });

    $('.search-form-params div.close').click(function () {
        let itemContainer = $(this).parents('div.search-form[data-item]');
        let item = itemContainer.data('item');
        let name = $(this).data('name');

        $('.search-form-links div.link[data-name="' + name + '"]').removeClass('active');
        $('.search-form-params div.block[data-name="' + name + '"]').removeClass('active');
        $('.search-form-params div.block[data-name="' + name + '"]')
            .find('input, select')
            .attr('disabled', 'disabled');

        $.post('/moonlight/search/active', {
            item: item,
            property: name,
            active: false
        });
    });

    $('.search-form-params div.block[data-name]:not(.active)')
        .find('input,select')
        .attr('disabled', 'disabled');

    $('.search-form-params input.date').calendar({
        dateFormat: '%Y-%m-%d'
    });

    $('.search-form-params input.one').each(function () {
        let parent = $(this).parents('div.row');
        let relatedItem = $(this).data('item');
        let propertyName = $(this).data('property');
        let width = $(this).outerWidth() - 2;

        $(this).autocomplete({
            serviceUrl: '/moonlight/elements/autocomplete',
            params: {
                item: relatedItem
            },
            formatResult: function (suggestion, currentValue) {
                return suggestion.value + ' <small>(' + suggestion.id + ')</small>';
            },
            onSelect: function (suggestion) {
                parent.find('input:hidden[name="' + propertyName + '"]').val(suggestion.id);
            },
            width: width,
            minChars: 0
        });
    });

    $('.search-form-params .addition.unset[data-property]').click(function () {
        let parent = $(this).parents('div.row');
        let name = $(this).data('property');

        parent.find('input:hidden[name="' + name + '"]').val('');
        parent.find('input:text[name="' + name + '_autocomplete"]').val('');
    });

    body.on('click', 'table.elements th span[data-reset-order]', function () {
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');

        getElements(item, {
            resetorder: true
        });
    });

    body.on('click', 'table.elements th span[data-order][data-direction]', function () {
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');
        let order = $(this).data('order');
        let direction = $(this).data('direction');

        getElements(item, {
            order: order,
            direction: direction
        });
    });

    body.on('click', 'table.elements td.editable', function () {
        let itemContainer = $(this).parents('div.item[data-item]');
        let td = $(this);
        let mode = td.data('mode');

        if (mode === 'edit') {
            td.data('mode', 'view');

            td.find('.view-container').show();
            td.find('.edit-container').hide();
            td.find('.edit-container').find('input,select,textarea')
                .attr('disabled', 'disabled');
        } else {
            td.data('mode', 'edit');

            td.find('.view-container').hide();
            td.find('.edit-container').show();
            td.find('.edit-container').find('input,select,textarea')
                .removeAttr('disabled')
                .focus();
        }

        let count = itemContainer.find('td.editable').filter(function () {
            return $(this).data('mode') === 'edit';
        }).length;

        if (count) {
            itemContainer.find('.button.save:not(.disabled)').addClass('enabled');
        } else {
            itemContainer.find('.button.save:not(.disabled)').removeClass('enabled');
        }
    });

    body.on('click', 'table.elements td.editable input', function (e) {
        e.stopPropagation();
    });

    body.on('click', 'table.elements td.editable select', function (e) {
        e.stopPropagation();
    });

    body.on('click', 'table.elements td.editable textarea', function (e) {
        e.stopPropagation();
    });

    body.on('click', 'table.elements td.editable div.checkbox', function (e) {
        let checkbox = $(this);
        let td = checkbox.parents('td');
        let input = td.find('input:hidden');

        if (input.val() == 1) {
            $(this).removeClass('checked');
            input.val(0);
        } else {
            $(this).addClass('checked');
            input.val(1);
        }

        e.stopPropagation();
    });

    body.on('submit', 'form[name="save"]', function () {
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');
        let count = itemContainer.find('td.editable').filter(function () {
            return $(this).data('mode') === 'edit';
        }).length;

        if (! count) {
            return false;
        }

        itemContainer.find('td.editable.invalid').removeClass('invalid');

        $.blockUI();

        $.ajax({
            url: this.action,
            method: "POST",
            data: new FormData($(this)[0]),
            contentType: false,
            processData: false
        }).done(function (response) {
            $.unblockUI();

            if (response.error) {
                $.alert(response.error);
            }

            if (response.errors) {
                for (let id in response.errors) {
                    for (let name in response.errors[id]) {
                        itemContainer.find('table.elements tr[data-element-id="' + id + '"] td.editable[data-name="' + name + '"]')
                            .addClass('invalid');
                    }
                }
            }

            if (response.views) {
                for (let id in response.views) {
                    for (let name in response.views[id]) {
                        itemContainer.find('table.elements tr[data-element-id="' + id + '"] td.editable[data-name="' + name + '"]')
                            .replaceWith(response.views[id][name]);
                    }
                }

                let count = itemContainer.find('td.editable').filter(function () {
                    return $(this).data('mode') === 'edit';
                }).length;

                if (! count) {
                    itemContainer.find('.button.save:not(.disabled)').removeClass('enabled');
                }

                $(document).trigger('item-saved', [item]);
            }
        }).fail(function (response) {
            $.unblockUI();
            $.alert(response.statusText);
        });

        return false;
    });

    body.on('click', '.button.save.enabled', function () {
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');

        $('div.item[data-item="' + item + '"]').find('form[name="save"]').submit();

        return false;
    });

    body.on('mouseover', 'table.elements td.check', function () {
        $(this).parent().addClass('hover');
    });

    body.on('mouseout', 'table.elements td.check', function () {
        $(this).parent().removeClass('hover');
    });

    body.on('click', 'th.check', function () {
        let tr = $(this).parent();
        let table = tr.parents('table');
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');

        if (typeof checked[item] === 'undefined') {
            checked[item] = [];
        }

        if (tr.hasClass('checked')) {
            checked[item] = [];

            tr.removeClass('checked');
            table.find('tbody tr').each(function () {
                $(this).removeClass('checked');
            });
        } else {
            tr.addClass('checked');

            table.find('tbody tr').each(function () {
                let elementId = $(this).data('element-id');
                let index = checked[item].indexOf(elementId);

                if (index === -1) {
                    checked[item].push(elementId);
                }

                $(this).addClass('checked');
            });
        }

        if (checked[item].length) {
            itemContainer.find('.button.copy:not(.disabled)').addClass('enabled');
            itemContainer.find('.button.move:not(.disabled)').addClass('enabled');
            itemContainer.find('.button.bind:not(.disabled)').addClass('enabled');
            itemContainer.find('.button.unbind:not(.disabled)').addClass('enabled');
            itemContainer.find('.button.favorite:not(.disabled)').addClass('enabled');
            itemContainer.find('.button.delete:not(.disabled)').addClass('enabled');
        } else {
            itemContainer.find('.button.copy:not(.disabled)').removeClass('enabled');
            itemContainer.find('.button.move:not(.disabled)').removeClass('enabled');
            itemContainer.find('.button.bind:not(.disabled)').removeClass('enabled');
            itemContainer.find('.button.unbind:not(.disabled)').removeClass('enabled');
            itemContainer.find('.button.favorite:not(.disabled)').removeClass('enabled');
            itemContainer.find('.button.delete:not(.disabled)').removeClass('enabled');
        }
    });

    body.on('click', 'td.check', function () {
        let tr = $(this).parent();
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');
        let elementId = tr.data('element-id');

        if (typeof checked[item] === 'undefined') {
            checked[item] = [];
        }

        let index = checked[item].indexOf(elementId);

        if (tr.hasClass('checked')) {
            if (index > -1) {
                checked[item].splice(index, 1);
            }

            tr.removeClass('checked');
        } else {
            if (index === -1) {
                checked[item].push(elementId);
            }

            tr.addClass('checked');
        }

        if (checked[item].length) {
            itemContainer.find('.button.copy:not(.disabled)').addClass('enabled');
            itemContainer.find('.button.move:not(.disabled)').addClass('enabled');
            itemContainer.find('.button.bind:not(.disabled)').addClass('enabled');
            itemContainer.find('.button.unbind:not(.disabled)').addClass('enabled');
            itemContainer.find('.button.favorite:not(.disabled)').addClass('enabled');
            itemContainer.find('.button.delete:not(.disabled)').addClass('enabled');
        } else {
            itemContainer.find('.button.copy:not(.disabled)').removeClass('enabled');
            itemContainer.find('.button.move:not(.disabled)').removeClass('enabled');
            itemContainer.find('.button.bind:not(.disabled)').removeClass('enabled');
            itemContainer.find('.button.unbind:not(.disabled)').removeClass('enabled');
            itemContainer.find('.button.favorite:not(.disabled)').removeClass('enabled');
            itemContainer.find('.button.delete:not(.disabled)').removeClass('enabled');
        }
    });

    body.on('click', '.button.copy.enabled', function () {
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');

        $.confirm(null, 'div.item[data-item="' + item + '"] .confirm[ data-confirm-type="copy"]');
    });

    body.on('click', '.button.move.enabled', function () {
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');

        $.confirm(null, 'div.item[data-item="' + item + '"] .confirm[ data-confirm-type="move"]');
    });

    body.on('click', '.button.bind.enabled', function () {
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');

        $.confirm(null, 'div.item[data-item="' + item + '"] .confirm[ data-confirm-type="bind"]');
    });

    body.on('click', '.button.unbind.enabled', function () {
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');

        $.confirm(null, 'div.item[data-item="' + item + '"] .confirm[ data-confirm-type="unbind"]');
    });

    body.on('click', '.button.favorite.enabled', function () {
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');

        itemContainer.find('.favorite-title.add, .favorite-list.add').addClass('hidden');
        itemContainer.find('.favorite-list.add div.rubric').addClass('hidden');
        itemContainer.find('.favorite-title.remove, .favorite-list.remove').addClass('hidden');
        itemContainer.find('.favorite-list.remove div.rubric').addClass('hidden');

        for (let id of checked[item]) {
            let tr = itemContainer.find('table.elements tr[data-element-id="' + id + '"]');
            let addedRubrics = tr.data('rubrics').toString().split(',');

            itemContainer.find('.favorite-list.add div.rubric').each(function () {
                let rubricId = $(this).data('rubric').toString();
                let index = addedRubrics.indexOf(rubricId);

                if (index === -1) {
                    $(this).removeClass('hidden');
                    itemContainer.find('.favorite-title.add, .favorite-list.add').removeClass('hidden');
                }
            });

            for (let rubricId of addedRubrics) {
                if (rubricId) {
                    itemContainer.find('.favorite-list.remove div.rubric[data-rubric="' + rubricId + '"]').removeClass('hidden');
                    itemContainer.find('.favorite-title.remove, .favorite-list.remove').removeClass('hidden');
                }
            }
        }

        $.confirm(null, 'div.item[data-item="' + item + '"] .confirm[data-confirm-type="favorite"]');
    });

    body.on('click', '.button.delete.enabled', function () {
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');

        $.confirm(null, 'div.item[data-item="' + item + '"] .confirm[data-confirm-type="delete"]');
    });

    body.on('click', '.confirm .btn.copy', function () {
        let confirmContainer = $(this).parents('.confirm');
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');
        let url = confirmContainer.data('url');
        let name, value;

        confirmContainer.find('input[type="radio"]:checked:not(:disabled), input[type="hidden"]').each(function () {
            name = $(this).data('property');
            value = $(this).val();
        });

        $.confirmClose();
        $.blockUI();

        $.post(url, {
            item: item,
            checked: checked[item],
            name: name,
            value: value
        }, function (response) {
            $.unblockUI(function () {
                if (response.error) {
                    $.alert(response.error);
                } else if (response.copied && response.url) {
                    location.href = response.url;
                }
            });
        });
    });

    body.on('click', '.confirm .btn.move', function () {
        let confirmContainer = $(this).parents('.confirm');
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');
        let url = confirmContainer.data('url');
        let one = null;

        confirmContainer.find('input[type="radio"]:checked:not(:disabled), input[type="hidden"]').each(function () {
            let name = $(this).data('property');
            let value = $(this).val();

            one = {
                name: name,
                value: value
            };
        });

        if (! one) return false;

        $.confirmClose();
        $.blockUI();

        $.post(url, {
            item: item,
            checked: checked[item],
            name: one.name,
            value: one.value
        }, function (response) {
            $.unblockUI(function () {
                if (response.error) {
                    $.alert(response.error);
                } else if (response.moved && response.url) {
                    location.href = response.url;
                }
            });
        });
    });

    body.on('click', '.confirm .btn.bind', function () {
        let confirmContainer = $(this).parents('.confirm');
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');
        let url = confirmContainer.data('url');
        let ones = {}, count = 0;

        confirmContainer.find('input[type="radio"]:checked:not(:disabled), input[type="hidden"]').each(function () {
            let name = $(this).data('property');
            let value = $(this).val();

            if (value) {
                ones[name] = value;
                count++;
            }
        });

        if (! count) return false;

        $.confirmClose();
        $.blockUI();

        $.post(url, {
            item: item,
            checked: checked[item],
            ones: ones
        }, function (response) {
            if (response.error) {
                $.unblockUI(function () {
                    $.alert(response.error);
                });
            } else if (response.attached) {
                getElements(item);
            }
        });
    });

    body.on('click', '.confirm .btn.unbind', function () {
        let confirmContainer = $(this).parents('.confirm');
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');
        let url = confirmContainer.data('url');
        let ones = {}, count = 0;

        confirmContainer.find('input[type="radio"]:checked:not(:disabled), input[type="hidden"]').each(function () {
            let name = $(this).data('property');
            let value = $(this).val();

            if (value) {
                ones[name] = value;
                count++;
            }
        });

        if (! count) return false;

        $.confirmClose();
        $.blockUI();

        $.post(url, {
            item: item,
            checked: checked[item],
            ones: ones
        }, function (response) {
            if (response.error) {
                $.unblockUI(function () {
                    $.alert(response.error);
                });
            } else if (response.detached) {
                getElements(item);
            }
        });
    });

    body.on('click', '.confirm .favorite-list.add div.rubric', function () {
        let confirmContainer = $(this).parents('.confirm');
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');
        let url = confirmContainer.data('url');
        let addRubric = $(this).data('rubric');

        $.confirmClose();
        $.blockUI();

        $.post(url, {
            item: item,
            checked: checked[item],
            add_favorite_rubric: addRubric
        }, function (response) {
            $.unblockUI(function () {
                if (response.error) {
                    $.alert(response.error);
                } else if (response.saved) {
                    getElements(item);
                }
            });
        }).fail(function () {
            $.unblockUI();
            $.alertDefaultError();
        });
    });

    body.on('click', '.confirm .favorite-list.remove div.rubric', function () {
        let confirmContainer = $(this).parents('.confirm');
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');
        let url = confirmContainer.data('url');
        let removedRubric = $(this).data('rubric');

        $.confirmClose();
        $.blockUI();

        $.post(url, {
            item: item,
            checked: checked[item],
            remove_favorite_rubric: removedRubric
        }, function (response) {
            $.unblockUI(function () {
                if (response.error) {
                    $.alert(response.error);
                } else if (response.saved) {
                    getElements(item);
                }
            });
        }).fail(function () {
            $.unblockUI();
            $.alertDefaultError();
        });
    });

    body.on('keypress', '.confirm .favorite-new input[type="text"]', function (event) {
        if (! event) event = window.event;

        if (event.keyCode) {
            let code = event.keyCode;
        } else if (event.which) {
            let code = event.which;
        }

        if (code === 13) {
            $(this).parents('.confirm').find('.btn.favorite').click();
        }
    });

    body.on('click', '.confirm .btn.favorite', function () {
        let confirmContainer = $(this).parents('.confirm');
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');
        let url = confirmContainer.data('url');
        let newRubric = confirmContainer.find('.favorite-new input[type="text"]').val();

        if (! newRubric) return false;

        $.confirmClose();
        $.blockUI();

        $.post(url, {
            item: item,
            checked: checked[item],
            new_favorite_rubric: newRubric
        }, function (response) {
            $.unblockUI(function () {
                if (response.error) {
                    $.alert(response.error);
                } else if (response.saved) {
                    getElements(item);
                }
            });
        }).fail(function () {
            $.unblockUI();
            $.alertDefaultError();
        });
    });

    body.on('click', '.confirm .btn.remove', function () {
        let confirmContainer = $(this).parents('.confirm');
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');
        let url = confirmContainer.data('url');

        $.confirmClose();
        $.blockUI();

        $.post(url, {
            item: item,
            checked: checked[item]
        }, function (response) {
            $.unblockUI(function () {
                if (response.error) {
                    $.alert(response.error);
                } else if (response.deleted) {
                    getElements(item);
                }
            });
        });
    });

    body.on('click', 'ul.pager > li[data-link="prev"].active', function () {
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');
        let pager = $(this).parent();
        let page = parseInt(pager.data('page')) - 1;

        if (page < 1) page = 1;

        submit(item, page);
    });

    body.on('click', 'ul.pager > li[data-link="first"].active', function () {
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');

        submit(item, 1);
    });

    body.on('keydown', 'ul.pager > li.page > input', function (event) {
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');
        let pager = $(this).parents('ul.pager');
        let last = parseInt(pager.data('last'));
        let code = event.keyCode || event.which;
        let page = parseInt($(this).val());

        if (code === 13) {
            if (isNaN(page) || page < 1) page = 1;
            if (page > last) page = last;

            submit(item, page);
        }
    });

    body.on('click', 'ul.pager > li[data-link="last"].active', function () {
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');
        let pager = $(this).parent();
        let last = pager.data('last');

        submit(item, last);
    });

    body.on('click', 'ul.pager > li[data-link="next"].active', function () {
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');
        let pager = $(this).parent();
        let last = parseInt(pager.data('last'));
        let page = parseInt(pager.data('page')) + 1;

        if (page > last) page = last;

        submit(item, page);
    });

    body.on('click', 'li.column-toggler', function () {
        let li = $(this);
        let dropdown = li.find('.dropdown');
        let display = li.data('display');

        if (display === 'show') {
            li.data('display', 'hide').removeClass('open');
            dropdown.fadeOut(200);
        } else {
            li.data('display', 'show').addClass('open');
            dropdown.fadeIn(200);
        }
    });

    body.on('click', 'li.column-toggler .dropdown', function (e) {
        e.stopPropagation();
    });

    body.on('click', 'li.column-toggler .dropdown ul > li', function (e) {
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');
        let li = $(this);
        let name = li.data('name');
        let show = li.data('show');

        if (show === true) {
            li.data('show', false).removeClass('checked');
            show = false;
        } else {
            li.data('show', true).addClass('checked');
            show = true;
        }

        $.post('/moonlight/column', {
            item: item,
            name: name,
            show: show
        });
    });

    body.on('keyup change', 'li.column-toggler .dropdown .perpage input', $.debounce(function () {
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');
        let input = $(this);
        let perpage = input.val();

        $.post('/moonlight/perpage', {
            item: item,
            perpage: perpage
        });
    }, 500));

    body.on('keypress', 'li.column-toggler .dropdown .perpage input', function (event) {
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');
        let input = $(this);
        let perpage = input.val();

        if (! event) event = window.event;

        if (event.keyCode) {
            let code = event.keyCode;
        } else if (event.which) {
            let code = event.which;
        }

        if (code === 13) {
            $.post('/moonlight/perpage', {
                item: item,
                perpage: perpage
            }, function () {
                $('li.column-toggler .dropdown .btn').click();
            });
        }
    });

    body.on('click', 'li.column-toggler .dropdown .btn', function (e) {
        let itemContainer = $(this).parents('div.item[data-item]');
        let item = itemContainer.data('item');
        let li = $(this).parents('li.column-toggler');
        let dropdown = li.find('.dropdown');

        li.data('display', 'hide');

        dropdown.fadeOut(200, function () {
            let url = new URL(location.href);
            let query_string = url.search;
            let search_params = new URLSearchParams(query_string);

            search_params.set('page', '1');
            url.search = search_params.toString();

            if (window.history.replaceState) {
                window.history.replaceState({}, null, url.toString());
                getElements(item);
            } else {
                window.location.href = url.toString();
            }
        });
    });
});
