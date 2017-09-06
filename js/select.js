//+++++Select widget
    $.widget("aui.kmathselect", {
        version: "1.0",
        options: {
            placeholder: 'select one',
            selectedIndex: -1,//通过selectedIndex 判断哪个元素被选中，当点击dropdownmenu 时更新selectedIndex
            items: [{ key: "asdf", value: 0 }, { key: "qwer", value: 1 }, { key: "zxcv", value: 2 }]
        },
        _create: function () {
            this.element.addClass("kmath-select");
            this._createContent();
            this.input = $(".kmath-select-input", this.element)
                .attr('placeholder', this.options.placeholder);
            this.dropdownMenu = this.element.find('.kmath-select-menu');
            this.menuitems = this.element.find('.kmath-select-menuitem');
            this.pendingSelectedIndex=-1;
            this._on({
                "click .kmath-select-input": function (e) {
                    this._toggle();
                },
                "blur .kmath-select-input": function (e) {
                    this._toggle(false);
                },
                "input .kmath-select-input": function (e) {//filter logic base on control menuitem visible or not 
                    var self = this,
                        searchText = this.input.val();
                    this.menuitems.removeClass("select");//当输入时去掉选择状态
                    this.options.selectedIndex = -1;//selectedIndex 输入时重置
                    this.pendingSelectedIndex=-1;//重置 this.pendingSelectedIndex
                    this._toggle(true);//when input open the dropdown menu
                    if (searchText) {
                        this.options.items.filter(function (ele, index, arr) {//filter logic 主要根据显隐控制
                            var isContain = ele.key.indexOf(searchText.trim()) > -1
                            if (isContain) {
                                $(self.menuitems[index]).toggleClass("none", false);
                            } else {
                                $(self.menuitems[index]).toggleClass("none", true);
                            }
                            return isContain;
                        })
                    } else {
                        this.menuitems.toggleClass('none', false);
                    }


                },                                     //pendingSelectedIndex 只针对 filtered 集合 
                "keydown .kmath-select-input": function (e) {//this.pendingSelectedIndex 生命周期仅为一次dropdownmenu 打开的过程中（如过打开过程中执行输入则重置）
                    // console.log("keydown");
                    var items = this.menuitems.not(".none"),//items 满足过滤条件的menuitems集合 全部menuitems 集合 this.menuitems
                        index = this.pendingSelectedIndex>-1?this.pendingSelectedIndex: this.options.selectedIndex,
                        length = items.length;
                    try {
                        switch (e.which) {
                            case $.ui.keyCode.ENTER:
                                if (this.pendingSelectedIndex > -1) {
                                    $(items[this.pendingSelectedIndex]).mousedown();

                                } else {
                                    $(items[0]).mousedown();
                                }
                                break;
                            case $.ui.keyCode.DOWN:
                            case $.ui.keyCode.RIGHT:
                                this._toggle(true);
                                this.menuitems.toggleClass('select', false); //当 up or down 时清空原来的选中状态
                                index++;
                                this.pendingSelectedIndex = index % length;
                                e.preventDefault()
                                break;
                            case $.ui.keyCode.UP:
                            case $.ui.keyCode.LEFT:
                                this._toggle(true);
                                this.menuitems.toggleClass('select', false); //当 up or down 时清空原来的选中状态
                                index--;
                                if (index < 0) index += length;
                                this.pendingSelectedIndex = index % length;
                                e.preventDefault()
                                break;
                        }
                       $(items[this.pendingSelectedIndex]).toggleClass('select',true); 
                    } catch (ex) {
                        console.error(ex.message);
                    }

                },
                "mousedown .kmath-select-menuitem": function (e) {
                    var index =  $(e.target).index();//这里的index 是针对全部 menuitems  而不是 filtered
                    var itemValue = this.options.items[index].key;
                    var currentItem = $(this.menuitems[index]);

                    this.input.val(itemValue);
                    if(this.options.onchange){
                        this.options.onchange(this.options.items[index]);
                    }
                    currentItem.toggleClass("select", true);
                    this._toggle(false);// close dropdownMenu  which action will trigger mouseleave event
                    this.options.selectedIndex = index;
                    this.input.focus();
                }
            })
            this.refresh();
        },
        _setOption: function (key) {
            $.Widget.prototype._setOption.apply(this, arguments);
            switch (key) {
                case 'items': {
                    $('.kmath-select-menu').replaceWith(this._createDropdownMenu());
                    this.refresh(true);
                    break;
                }
                case 'selectedIndex': {
                    this.refresh();
                    break;
                }
            }

        },
        _createContent: function () {
            var templateMenu = '';
            var templateStr = '<div class="kmath-select-div">' +
                '<input class="kmath-select-input"></input>' +
                //'<span class="select-arrow"></span>' +
                '</div>';
            templateMenu = this._createDropdownMenu();
            templateStr += templateMenu;
            this.element.append(templateStr);

        },
        _createDropdownMenu: function (items) {
            items = items || this.options.items;
            var templateMenu = [];

            for (var i = items.length; i--;) {
                templateMenu.push('<li class="kmath-select-menuitem" index=' + i + '>' + items[i].key + '</li>');
            }
            templateMenu.reverse();
            templateMenu.unshift('<ul class="kmath-select-menu">');
            templateMenu.push('</ul>');
            return templateMenu.join(' ');
        },
        refresh: function (deep) {
            if (deep) {
                this.options.selectedIndex = -1;
                this.dropdownMenu = this.element.find('.kmath-select-menu');
                this.menuitems = this.element.find('.kmath-select-menuitem');
            }
            try {
                this.input.val(this.options.items[this.options.selectedIndex].key)
            } catch (ex) {
                this.input.val('');
            }

        },
        _toggle: function (toggle) {
            if (toggle === undefined) //shuffle arguments
                this.element.toggleClass("open");
            else {

                if (toggle)
                    this.element.toggleClass("open", true);
                else
                    this.element.toggleClass("open", false);

            }
            // 当open dropdownmenu 时给选择元素添加 .select 并且无论open or close 都重置选择状态和 pendingSelectedIndex（其他重置 pendingSelectedIndex的情况为 “输入”）
            this.pendingSelectedIndex = -1;
            this.menuitems.removeClass("select");
            $(this.menuitems[this.options.selectedIndex]).toggleClass('select', true);
           

        }
    })