    //+++++KMath 
    //=================================
    (function (window) {
        'use strict';
        var MQ = MathQuill.getInterface(2),
            uuid = 0;

        /**
         * KMath
         * @class
         * @param {*} options 
         * @method setFormula (latex,true) =>{.....}  latex 为传入源数据，true 外部调用强制赋值时必须设置为true
         * @method getFormula ()=> DOM 获取DOM结构
         */
        function KMath(options) {
            /**
             * @prop {MathField} mathFiled
             * @prop {jQuery} $message
             * @prop {Bool} isBasic
             * @var {PlanObject} defaultOptions{$message:"提示信息DOM selector",element:"KMath container"}
             * @var {jQuery} $category category container
             * @var {jQuery} $mathEditor container
             * @var {jQuery} $mathSymbol container
             */
            var $advance_editarea,
                $advance_view,
                $basic_editarea,
                $tobasic_btn,
                $toadvance_btn,
                $category,
                $mathEditor,
                $mathSymbol,
                $matrixTable,
                $fontsize,
                mathbbReg = /\\mathbb{([A-Z])}/g,
                notinsetReg = /not\\(in|ni|subset|supset|subseteq|supseteq)/g,
                supReg = /\^([^{])/g,
                controlBox = new ControlBox(),
                self = this,
                defaultOptions = {
                    // message: ".kmath-message-" + uuid, 
                    element: "#kmath-" + uuid,
                    fsoptions: [
                        { value: '125%', key: '(inherited size)' },
                        { value: 'xx-small', key: '1 (8pt)' },
                        { value: 'x-small', key: '2 (10pt)' },
                        { value: 'small', key: '3 (12pt)' },
                        { value: 'medium', key: '4 (14pt)' },
                        { value: 'large', key: '5 (18pt)' },
                        { value: 'x-large', key: '6 (24pt)' },
                        { value: 'xx-large', key: '7 (36pt)' },
                    ]
                };
            this.uuid = uuid++;
            this.mathField = null;//之后赋值因为现在DOM对象还没有生成
            this.isBasic = false;// this._toggleView中修改
            this.options = $.extend(defaultOptions, options);

            this._init = function () {
                // math.window.extend中执行 _init() 在kendowindow open时，故作此判断。
                if ($(this.options.element).attr("data-role") == 'kmath') {
                    return;
                }
                // _init方法createWindow 之后才会创建所以this.element需要在这赋值
                this.element = $(this.options.element).attr("data-role", "kmath");
                this.element.html('<ul class="math-category"></ul>' +
                    '<ul class="math-symbol"></ul>' +
                    '<div class="math-editor"></div>');

                $(this.element).parent().append('<div class="kmath-message"></div>');
                // this.$message = $(this.options.message);

                $category = $(".math-category", this.element);
                $mathSymbol = $(".math-symbol", this.element);
                $mathEditor = $(".math-editor", this.element);
                controlBox.init($category);
                $matrixTable = $('.customMatrix');  //controlBox init完成之后生成
                this._initialView();
                // addStyleNode(kmathcss);
                //下面这几个DOM元素只有this._initialView 完成之后才有值
                $advance_editarea = $(".advance-editarea", this.element);
                $advance_view = $(".advance-view", this.element);
                $basic_editarea = $(".basic-editarea", this.element);
                $tobasic_btn = $(".tobasic", this.element);
                $toadvance_btn = $(".toadvance", this.element);
                $fontsize = $(".kmath-fontsize", this.element);
                this.$message = $('.kmath-message', $(this.element).parent());

                this._initFontsize($fontsize);

                // Switch basic \ advance view 
                this.element.on("click", '.tobasic', function () {
                    if (!self._ableToBasic()) {
                        return;
                    }

                    self._toggleView(true);

                    var str = $advance_view.find("script").text();

                    self.setFormula('$$' + str + '$$');
                    controlBox.switchSymbols($('.selected-category', $category).attr('data-title'), true, $mathSymbol);

                });

                this.element.on("click", '.toadvance', function () {

                    self._toggleView(false);
                    // self._typesetView();
                    controlBox.switchSymbols($('.selected-category', $category).attr('data-title'), false, $mathSymbol);
                    if (self.mathField && self.mathField.latex()) {
                        self.setFormula('$$' + self.mathField.latex() + '$$');
                    } else {
                        self.setFormula('$$$$');
                    }
                });

                $mathSymbol.on('click', 'li:not(.matrix)', function (e) {
                    if (self.isBasic) {
                        $(this).attr('data-mq') === ('true') ? self.mathField.write(this.title) : self.mathField.cmd(this.title);
                        self.mathField.focus();
                    } else {
                        var textarea, start, end, value;
                        // textarea = isBasic? $("#basic-editarea")[0] : $("#advance-editarea")[0];
                        textarea = $advance_editarea[0];
                        value = textarea.value;
                        start = textarea.selectionStart;
                        end = textarea.selectionEnd;

                        //新插入的LaTeX可能会与其后内容一起编译，所以加空格断开。Like \diva. 
                        textarea.value = value.substr(0, start) + this.title + ' ' + value.substr(end, value.length);
                        $(textarea).trigger("change");

                        textarea.selectionStart = this.title.length + start + 1;
                        textarea.selectionEnd = textarea.selectionStart;
                        textarea.focus();
                    }
                });

                $mathSymbol.on('click', 'li.matrix', function (e) {
                    e.stopPropagation();
                    $matrixTable.data('title', this.title);
                    controlBox.showCustomMatrix(this);
                });

                $matrixTable.on('click', 'td', function () {
                    var datas = $matrixTable.data(),
                        latex = controlBox.createMatrixLatex(datas);
                    if (self.isBasic) {
                        console.log(' basic view ... ')
                    } else {
                        var textarea, start, end, value;
                        // textarea = isBasic? $("#basic-editarea")[0] : $("#advance-editarea")[0];
                        textarea = $advance_editarea[0];
                        value = textarea.value;
                        start = textarea.selectionStart;
                        end = textarea.selectionEnd;

                        textarea.value = value.substr(0, start) + latex + ' ' + value.substr(end, value.length);
                        $(textarea).trigger("change");

                        textarea.selectionStart = latex.length + start + 1;
                        textarea.selectionEnd = textarea.selectionStart;
                        textarea.focus();
                    }
                    $matrixTable.hide();
                    $matrixTable.find('td').removeClass('on');
                });

                $category.on('click', 'li', function (e) {
                    if ($(this).hasClass('selected-category')) {
                        return;
                    }
                    $(this).siblings('li').removeClass('selected-category').end().addClass('selected-category');
                    controlBox.switchSymbols($(this).attr('data-title'), self.isBasic, $mathSymbol);
                });

                $advance_editarea.on({ 'keyup': self._typesetView, 'change': this._typesetView, 'paste': this._typesetView });

                // Basic view
                this.mathField = MQ.MathField($basic_editarea[0], {
                    spaceBehavesLikeTab: false,
                    handlers: {
                        edit: function () { }
                    }
                });

                // set default view
                $toadvance_btn.trigger("click");

            };
            /**
             * 给mathEditor赋值
             * @param {String}latex 数据源
             * @param {Bool} 只有isOpening为true 的时候才会向 $basic_deitarea 赋值,因为BasicView 和AdvanceView insert 时都是采用mathjax渲染使用同一个insert 事件所以才有这个设置
             */
            this.setFormula = function (value, isNotOpening) {
                if (this.isBasic && !isNotOpening) {
                    value = value.substr(2, value.length - 4);
                    value = value.replace(mathbbReg, "\\$1");
                    value = value.replace(notinsetReg, 'not$1');
                    // setTimeout 为保证Dom显示完成，使得公式缩放计算正确。
                    setTimeout(function () {
                        self.mathField.select();
                        self.mathField.write(value);
                    });
                } else {
                    value = value.replace(supReg, '^{$1}');
                    value = value.trim();
                    // 由于IE不支持 startsWith / endsWith 方法、并且新逻辑下value一定是数学公式。所以此处不做判断，直接去掉首尾$$
                    // if(value.startsWith('$$') && value.endsWith('$$')){
                    value = value.substr(2, value.length - 4);
                    // }
                    $advance_editarea.val(value);
                    $advance_editarea.trigger('change');
                }
            };

            this.getFormula = function () {
                var latex, dom, styles;
                dom = $advance_view;
                if (!dom.html().trim()) {
                    return $('<span>$nbsp;</span>')[0];
                }
                latex = dom.find("script").text();
                dom = dom.clone();
                latex = "$$" + latex + "$$";
                dom = dom.find(".MathJax_CHTML");
                // temporary enlarge the font size;
                // dom.css('font-size', '125%');
                dom.css('font-size', $advance_view[0].style.fontSize);
                styles = dom.attr('style');
                // 阻止选中
                dom.attr('style', styles + '-webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; ');
                dom.attr("data-mathml", escape(dom.attr("data-mathml")));     // 保留MathML
                dom.attr('data-latex', latex);
                dom.attr("contenteditable", false);
                dom.find(".MJX_Assistive_MathML").remove();
                // 添加空格。会使光标明显，但在重复编辑的情况下，会出现多个空格。故注掉。
                // dom = $('<span></span>').append(dom).append('<span>&nbsp;</span>');

                return dom[0];
                // }
            }
            this.checkEquation = function(){
                var tag = $advance_view.children('script');
                if(tag.length && tag.get(0).MathJax.elementJax.texError){
                    self.$message.text($$.GCI18N.kMath.CannotRenderinMQ + ' textError');
                    self.$message.show(100);
                    return true;
                }
            }
            /**
             * 唯一改变this.isBasic的method
             */
            this._toggleView = function (status) {
                this.isBasic = status;
                if (this.isBasic) {
                    $basic_editarea.show(0);
                    $toadvance_btn.show(0);
                    $advance_editarea.hide(0);
                    $advance_view.parent().hide(0);
                    $tobasic_btn.hide(0);
                    // $fontsize.hide(0);
                } else {
                    $basic_editarea.hide(0);
                    $toadvance_btn.hide(0);
                    $advance_editarea.show(0);
                    $advance_view.parent().show(0);
                    $tobasic_btn.show(0);
                    // $fontsize.show(0);
                }
            }

            this._ableToBasic = function () {
                if (self.mathField) {
                    var str = $advance_view.find("script").text();
                    if (str) {
                        str = str.replace(mathbbReg, "\\$1");
                        str = str.replace(notinsetReg, 'not$1');
                    }
                    self.mathField.select();
                    self.mathField.write(str);
                    if (self.$message && str && !self.mathField.latex()) {
                        self.$message.text($$.GCI18N.kMath.CannotRenderinMQ);
                        self.$message.show(100);
                        return false;
                    } else {
                        return true;
                    }
                } else {
                    return false;
                }
            }

            this._initialView = function () {
                var $view = $('<div>' +
                    '<button class="blue-link tobasic">' + $$.GCI18N.kMath.SwitchtoBasic + '</button>' +
                    '<button class="blue-link toadvance">' + $$.GCI18N.kMath.SwitchtoAdvance + '</button>' +
                    '<textarea class="advance-editarea"></textarea>' +          // S_N = \\displaystyle\\sqrt{ \\frac{1}{N} \\sum\^N_{i=1}{(x_i - \\bar{x})\^2} }
                    '<div style="background: #f3f3f3; padding-right: 5px; margin: 6px 2px 0; box-sizing: border-box; border: 1px solid rgb(222, 222, 222); ">' +
                    '<div style="padding-bottom: 3px; height: 2.2em; border-bottom: 1px solid rgb(222, 222, 222);">' +
                        '<div style="line-height: 2.2em; padding-left: 5px; float: left;">Formula: </div>' +
                        '<div style="float: right;" class="kmath-fontsize"></div>' +
                    '</div>' +
                    '<div class="advance-view" style="visibility: visible;"></div>' +
                    '</div>' +
                    // '<textarea id="basic-editarea"></textarea>'+
                    '<span class="basic-editarea"></span>' +
                    // '<div class="kmath-message"></div>' +
                    '</div>');

                $mathEditor.html($view);
            }

            this._initFontsize = function ($ele) {
                $ele.kmathselect({
                    selectedIndex: 0,
                    items: this.options.fsoptions,
                    onchange: function (selection) {
                        $advance_view.css('font-size', selection.value);
                    }
                });
            }

            // this._initFontsize01 = function($ele){
            //     $ele.kmathselect({
            //         selectedIndex: 0,
            //         items: this.options.fontsizeOptions,
            //         onchange: this.updateFontSize
            //     });
            // }

            // this.updateFontSize01 = function(selection){
            //     // console.log(selection);
            //     MathJax.Hub.config.CommonHTML.scale = selection.value;
            //     MathJax.Hub.Queue(["Rerender",MathJax.Hub])
            // }

            // this._initFontsize01 = function($ele){
            //     var $select = $('<select></select>');
            //     this.options.fontsizeOptions.map(function(item){
            //         if(item.scale && item.text.length){
            //             $select.append('<option value="'+ item.value +'">'+ item.key +'</option>');
            //         }
            //     });

            //     $ele.append($select);

            //     $select.change(function(){
            //         MathJax.Hub.config.CommonHTML.scale = this.value;
            //         MathJax.Hub.Queue(["Rerender",MathJax.Hub])
            //     });

            // }

            // this._initFontsize00 = function($ele){
            //     var str = '<span>Font Size: </span>'
            //     str += '<button class="plus">+</button>';
            //     str += '<input class="fontsize" value="1"/>';
            //     str += '<button class="minus">-</button>';
            //     $ele.append(str);

            //     var input = $('.fontsize', $ele)[0];
            //     $ele.on('click', '.plus', function(){
            //         input.value = input.value < 20 ? Number(input.value) + 1 : input.value;
            //         MathJax.Hub.config.CommonHTML.scale = input.value * 30;
            //         MathJax.Hub.Queue(["Rerender",MathJax.Hub])
            //     });
            //     $ele.on('click', '.minus', function(){
            //         input.value = Number(input.value) > 1 ? Number(input.value) - 1 : input.value;
            //         MathJax.Hub.config.CommonHTML.scale = input.value * 30;
            //         MathJax.Hub.Queue(["Rerender",MathJax.Hub])
            //     });


            // }

            this._typesetView = function (e) {
                // $advance_view.html(checkBreaks($advance_editarea.val()));
                self.$message && self.$message.hide();
                if (e && e.type == 'paste') {
                    setTimeout(self._typesetView, 100);
                }
                if(e && e.type == 'keyup' && !checkKeycode(e.keyCode)){
                    return;
                }

                if (!$advance_editarea.val().trim().length) {
                    $advance_view.html('');
                    return;
                }
                $advance_view.css('visibility', 'hidden');
                $advance_view.html("$$" + $advance_editarea.val() + "$$");
                MathJax.Hub.Queue(["Typeset", MathJax.Hub, $advance_view[0]]);
                MathJax.Hub.Queue(function () {
                    $advance_view.css('visibility', 'visible');
                });
                // MathJax.Hub.Typeset($advance_view[0]);
            }

            // 判断keycode是否为用户输入。若为功能键/控制键 return false.
            var checkKeycode = function(keycode){
                if(keycode > 111 && keycode < 124){
                    // F1 - F12
                    return false;
                }
                if(keycode > 15 && keycode < 21){
                    // shift ctrl alt Capelock
                    return false;
                }
                if(keycode > 32 && keycode < 41){
                    // pageup pagedown end home arrows
                    return false;
                }
                if(keycode >= 170 || keycode == 144){
                    // Media || Number lock
                    return false;
                }
                return true;
            }
        }

        /**
         * Constructs ControlBox objects 
         * @class ControlBox
         * @constructor
         * @desc render categroy and symbols 
         * @method init render categroy 
         * @method switchSymbols render symbols
         * @ 存储各个symbol 信息，和菜单信息 生成 math-symbol dom 结构
         */
        function ControlBox() {

            var symbolCaches = [],
                category;

            category = [
                { title: 'Basic', icon: '+', displayTitle: $$.GCI18N.kMath.Basic },
                { title: 'Greek', icon: 'π', displayTitle: $$.GCI18N.kMath.Greek },
                { title: 'Operators', icon: '⊕', displayTitle: $$.GCI18N.kMath.Operators },
                { title: 'Relationships', icon: '≤', displayTitle: $$.GCI18N.kMath.Relationships },
                { title: 'Arrows', icon: '⇔', displayTitle: $$.GCI18N.kMath.Arrows },
                { title: 'Delimiters', icon: '{', displayTitle: $$.GCI18N.kMath.Delimiters },
                { title: 'Misc', icon: '∞', displayTitle: $$.GCI18N.kMath.Misc }
            ];

            this.Basic = [

                new Symbol('\\subscript', '_{sub}', 'group0', '_{sub}', 'font-size: 0.9em;'),
                new Symbol('\\supscript', '\^{sup}', 'group0', '\^{sup}', 'font-size: 0.9em;'),
                new Symbol('\\frac', '\\frac{n}{m}', 'group0', '\\frac{n}{m}', '', '', 'fi-kmath-frac-a'),
                new AdvancedSymbol('\\tfrac{n}{m}', 'group0', 'fi-kmath-tiny-frac-a'),
                new AdvancedSymbol('{n}/{m}', 'group0', 'fi-kmath-tilted-frac-a'),
                new AdvancedSymbol('\\small{{n}/{m}}\\normalsize', 'group0', 'fi-kmath-tiny-tilted-frac-a'),
                new Symbol('\\sqrt', '\\sqrt{x}', 'group0', '\\sqrt{x}', 'line-height: normal; padding-top: 5px;'),
                new Symbol('\\nthroot', '\\sqrt[n]{x}', 'group0', '\\sqrt[n]{x}', 'line-height: normal; text-align: left'),
                new Symbol('\\binomial', '\\binom{n}{m}', 'group0', '\\binom{n}{m}', 'line-height: normal; text-align: left; font-size: 1em; padding-left: 3px;'),
                new Symbol('\\f', 'f', 'group0', 'f', 'font-size: 1.3em'),
                new Symbol('\\prime', '\\prime', 'group0', '\\prime'),

                new Symbol('+', '+', 'group1', '+', 'font-size: 1.5em'),
                new Symbol('-', '-', 'group1', '-', 'font-size: 1.5em'),
                new Symbol('\\pm', '\\pm', 'group1', '\\pm', 'font-size: 1.5em'),
                new Symbol('\\mp', '\\mp', 'group1', '\\mp', 'font-size: 1.5em'),
                new Symbol('\\cdot', '\\cdot', 'group1', '\\cdot', 'font-size: 1.5em'),
                new Symbol('=', '=', 'group1', '=', 'font-size: 1.5em'),
                new Symbol('\\doteq', '\\doteq', 'group1', '\\doteq', 'font-size: 1.5em'),

                new Symbol('\\times', '\\times', 'group1', '\\times', 'font-size: 1.5em'),
                new Symbol('\\div', '\\div', 'group1', '\\div', 'font-size: 1.5em'),
                new Symbol('\\ast', '\\ast', 'group1', '\\ast', 'font-size: 1.5em'),

                new Symbol('\\therefore', '\\therefore', 'group5', '\\therefore', 'font-size: 1.5em'),
                new Symbol('\\because', '\\because', 'group5', '\\because', 'font-size: 1.5em'),

                new Symbol('\\sum', '\\sum{n}', 'group2', '\\sum', '', '', 'fi-kmath-sum-a'),
                new Symbol('\\prod', '\\prod{n}', 'group2', '\\prod', '', '', 'fi-kmath-prod-a'),
                new Symbol('\\prod_{}{}', '\\prod_{a}{n}', 'group2', '\\prod_{a}{n}', '', 'true', 'fi-kmath-prod-sub-a'),
                new Symbol('\\prod_{}^{}{}', '\\prod_{a}^{b}{n}', 'group2', '\\prod_{a}^{b}{n}', '', 'true', 'fi-kmath-prod-sub-sup-a'),
                new Symbol('\\coprod', '\\coprod{n}', 'group2', '\\coprod', '', '', 'fi-kmath-co-prod-a'),
                new Symbol('\\coprod_{}{}', '\\coprod_{a}{n}', 'group2', '\\coprod_{a}{n}', '', 'true', 'fi-kmath-coprod-sub-a'),
                new Symbol('\\coprod_{}^{}{}', '\\coprod_{a}^{b}{n}', 'group2', '\\coprod_{a}^{b}{n}', '', 'true', 'fi-kmath-coprod-sub-sup-a'),
                new Symbol('\\int', '\\int{x}', 'group2', '\\int', '', '', 'fi-kmath-int-a'),
                new AdvancedSymbol('\\int\\limits_{a}{x}', 'group2', 'fi-kmath-int-limits-sub-a'),
                new AdvancedSymbol('\\int\\limits_{a}^{b}{x}', 'group2', 'fi-kmath-int-limits-sub-sup-a'),

                new Symbol('\\int_{}{x}', '\\int_{a}{x}', 'group2', '\\int_{a}{x}', '', 'true', 'fi-kmath-int-sub-a'),
                new Symbol('\\int_{}^{}{x}', '\\int_{a}^{b}{x}', 'group2', '\\int_{a}^{b}{x}', '', 'true', 'fi-kmath-int-sub-sup-a'),

                new AdvancedSymbol('\\iint', 'group2', 'fi-kmath-iint-a'),
                new AdvancedSymbol('\\iint_{a}', 'group2', 'fi-kmath-iint-sub-a'),
                new AdvancedSymbol('\\iint\\limits_{a}', 'group2', 'fi-kmath-iint-limits-sub-a'),
                new AdvancedSymbol('\\iiint', 'group2', 'fi-kmath-iiint-a'),
                new AdvancedSymbol('\\iiint_{a}', 'group2', 'fi-kmath-iiint-sub-a'),
                new AdvancedSymbol('\\iiint\\limits_{a}', 'group2', 'fi-kmath-iiint-limits-sub-a'),

                new Symbol('\\oint', '\\oint{x}', 'group2', '\\oint', '', '', 'fi-kmath-oint-a'),
                new AdvancedSymbol('\\oint\\limits_{a}{x}', 'group2', 'fi-kmath-oint-limits-sub-a'),
                new Symbol('\\oint _{} {x}', '\\oint _{a} {x}', 'group2', '\\oint_{a}', '', 'true', 'fi-kmath-oint-sub-a'),

                new Matrix('matrix', 'fi-kmath-matrix-a', 'group4'),
                new Matrix('bmatrix', 'fi-kmath-b-matrix-a', 'group4'),
                new Matrix('pmatrix', 'fi-kmath-p-matrix-a', 'group4'),
                new Matrix('Bmatrix', 'fi-kmath-bb-matrix-a', 'group4'),
                new Matrix('smallmatrix', 'fi-kmath-small-matrix-a', 'group4'),
                new Matrix('vmatrix', 'fi-kmath-v-matrix-a', 'group4'),
                new Matrix('Vmatrix', 'fi-kmath-vv-matrix-a', 'group4'),

                new AdvancedSymbol('\\dot{a}', 'group20', 'fi-kmath-dot-a'),
                new AdvancedSymbol('\\ddot{a}', 'group20', 'fi-kmath-ddot-a'),
                new AdvancedSymbol('\\dddot{a}', 'group20', 'fi-kmath-dddot-a'),
                new AdvancedSymbol('\\widehat{a}', 'group20', 'fi-kmath-wide-hat-a'),
                new AdvancedSymbol('\\tilde{a}', 'group20', 'fi-kmath-tilde-a'),
                new AdvancedSymbol('\\widetilde{a}', 'group20', 'fi-kmath-wide-tilde-a'),
                new AdvancedSymbol('\\breve{a}', 'group20', 'fi-kmath-breve-a'),
                new AdvancedSymbol('\\grave{a}', 'group20', 'fi-kmath-grave-a'),
                new AdvancedSymbol('\\vec{a}', 'group20', 'fi-kmath-vec-a'),      // Symbols 
                new AdvancedSymbol('\\mathring{a}', 'group20', 'fi-kmath-mathring-a'),


                // new AdvancedSymbol('\\bar{abc}', 'group20', '\\bar{abc}'),  // switch后，变成overline

                // new Symbol('\\iint', '\\iint{x}', 'group2', '\\iint', 'font-size: 1.2em;'),      n a in basic
                // new Symbol('\\iiint', '\\iiint{x}', 'group2', '\\iiint', 'font-size: 1.2em;'),   n a in basic

            ];

            this.Greek = [
                new Symbol('\\alpha', '\\alpha', 'group3', '\\alpha'),
                new Symbol('\\beta', '\\beta', 'group3', '\\beta'),
                new Symbol('\\gamma', '\\gamma', 'group3', '\\gamma'),
                new Symbol('\\delta', '\\delta', 'group3', '\\delta'),
                new Symbol('\\epsilon', '\\epsilon', 'group3', '\\epsilon'),
                new Symbol('\\zeta', '\\zeta', 'group3', '\\zeta'),
                new Symbol('\\eta', '\\eta', 'group3', '\\eta'),
                new Symbol('\\theta', '\\theta', 'group3', '\\theta'),
                new Symbol('\\iota', '\\iota', 'group3', '\\iota'),
                new Symbol('\\kappa', '\\kappa', 'group3', '\\kappa'),
                new Symbol('\\lambda', '\\lambda', 'group3', '\\lambda'),
                new Symbol('\\mu', '\\mu', 'group3', '\\mu'),
                new Symbol('\\nu', '\\nu', 'group3', '\\nu'),
                new Symbol('\\xi', '\\xi', 'group3', '\\xi'),
                new Symbol('\\pi', '\\pi', 'group3', '\\pi'),
                new Symbol('\\rho', '\\rho', 'group3', '\\rho'),
                new Symbol('\\sigma', '\\sigma', 'group3', '\\sigma'),
                new Symbol('\\tau', '\\tau', 'group3', '\\tau'),
                new Symbol('\\upsilon', '\\upsilon', 'group3', '\\upsilon'),
                new Symbol('\\phi', '\\phi', 'group3', '\\phi'),
                new Symbol('\\chi', '\\chi', 'group3', '\\chi'),
                new Symbol('\\psi', '\\psi', 'group3', '\\psi'),
                new Symbol('\\omega', '\\omega', 'group3', '\\omega'),

                new Symbol('\\digamma', '\\digamma', 'group4', '\\digamma'),
                new Symbol('\\varepsilon', '\\varepsilon', 'group4', '\\varepsilon'),
                new Symbol('\\vartheta', '\\vartheta', 'group4', '\\vartheta'),
                new Symbol('\\varkappa', '\\varkappa', 'group4', '\\varkappa'),
                new Symbol('\\varpi', '\\varpi', 'group4', '\\varpi'),
                new Symbol('\\varrho', '\\varrho', 'group4', '\\varrho'),
                new Symbol('\\varsigma', '\\varsigma', 'group4', '\\varsigma'),
                new Symbol('\\varphi', '\\varphi', 'group4', '\\varphi'),

                new Symbol('A', 'A', 'group5', 'A'),
                new Symbol('B', 'B', 'group5', 'B'),
                new Symbol('\\Gamma', '\\Gamma', 'group5', '\\Gamma'),
                new Symbol('\\Delta', '\\Delta', 'group5', '\\Delta'),
                new Symbol('E', 'E', 'group5', 'E'),
                new Symbol('Z', 'Z', 'group5', 'Z'),
                new Symbol('\\Theta', '\\Theta', 'group5', '\\Theta'),
                new Symbol('I', 'I', 'group5', 'I'),
                new Symbol('K', 'K', 'group5', 'K'),
                new Symbol('\\Lambda', '\\Lambda', 'group5', '\\Lambda'),
                new Symbol('M', 'M', 'group5', 'M'),
                new Symbol('N', 'N', 'group5', 'N'),
                new Symbol('\\Xi', '\\Xi', 'group5', '\\Xi'),
                new Symbol('O', 'O', 'group5', 'O'),
                new Symbol('\\Pi', '\\Pi', 'group5', '\\Pi'),
                new Symbol('P', 'P', 'group5', 'P'),
                new Symbol('\\Sigma', '\\Sigma', 'group5', '\\Sigma'),
                new Symbol('T', 'T', 'group5', 'T'),
                new Symbol('\\Upsilon', '\\Upsilon', 'group5', '\\Upsilon'),
                new Symbol('\\Phi', '\\Phi', 'group5', '\\Phi'),
                new Symbol('X', 'X', 'group5', 'X'),
                new Symbol('\\Psi', '\\Psi', 'group5', '\\Psi'),
                new Symbol('\\Omega', '\\Omega', 'group5', '\\Omega')
            ];

            this.Operators = [
                new Symbol('\\wedge', '\\wedge', 'group1', '\\wedge'),
                new Symbol('\\vee', '\\vee', 'group1', '\\vee'),
                new Symbol('\\cup', '\\cup', 'group1', '\\cup'),
                new Symbol('\\cap', '\\cap', 'group1', '\\cap'),
                new Symbol('\\diamond', '\\diamond', 'group1', '\\diamond'),
                new Symbol('\\bigtriangleup', '\\bigtriangleup', 'group1', '\\bigtriangleup'),
                new Symbol('\\ominus', '\\ominus', 'group1', '\\ominus'),
                new Symbol('\\uplus', '\\uplus', 'group1', '\\uplus'),
                new Symbol('\\otimes', '\\otimes', 'group1', '\\otimes'),
                new Symbol('\\oplus', '\\oplus', 'group1', '\\oplus'),
                new Symbol('\\bigtriangledown', '\\bigtriangledown', 'group1', '\\bigtriangledown'),
                new Symbol('\\sqcap', '\\sqcap', 'group1', '\\sqcap'),
                new Symbol('\\triangleleft', '\\triangleleft', 'group1', '\\triangleleft'),
                new Symbol('\\sqcup', '\\sqcup', 'group1', '\\sqcup'),
                new Symbol('\\triangleright', '\\triangleright', 'group1', '\\triangleright'),
                new Symbol('\\odot', '\\odot', 'group1', '\\odot'),
                new Symbol('\\bigcirc', '\\bigcirc', 'group1', '\\bigcirc'),
                new Symbol('\\dagger', '\\dagger', 'group1', '\\dagger'),
                new Symbol('\\ddagger', '\\ddagger', 'group1', '\\ddagger'),
                new Symbol('\\wr', '\\wr', 'group1', '\\wr'),
                new Symbol('\\amalg', '\\amalg', 'group1', '\\amalg', 'font-size: 0.9em;')
            ];

            this.Relationships = [
                new Symbol('<', '<', 'group1', '<'),
                new Symbol('>', '>', 'group1', '>'),
                new Symbol('\\equiv', '\\equiv', 'group1', '\\equiv'),
                new Symbol('\\cong', '\\cong', 'group1', '\\cong'),
                new Symbol('\\sim', '\\sim', 'group1', '\\sim'),
                new Symbol('\\notin', '\\not\in', 'group1', '\\not\in'),
                new Symbol('\\ne', '\\ne', 'group1', '\\ne'),
                new Symbol('\\propto', '\\propto', 'group1', '\\propto'),
                new Symbol('\\approx', '\\approx', 'group1', '\\approx'),
                new Symbol('\\le', '\\le', 'group1', '\\le'),
                new Symbol('\\ge', '\\ge', 'group1', '\\ge'),
                new Symbol('\\in', '\\in', 'group1', '\\in'),
                new Symbol('\\ni', '\\ni', 'group1', '\\ni'),
                new Symbol('\\notni', '\\not\\ni', 'group1', '\\notni'),
                new Symbol('\\subset', '\\subset', 'group1', '\\subset'),
                new Symbol('\\supset', '\\supset', 'group1', '\\supset'),
                new Symbol('\\notsubset', '\\not\\subset', 'group1', '\\not\subset'),
                new Symbol('\\notsupset', '\\not\\supset', 'group1', '\\not\supset'),
                new Symbol('\\subseteq', '\\subseteq', 'group1', '\\subseteq'),
                new Symbol('\\supseteq', '\\supseteq', 'group1', '\\supseteq'),
                new Symbol('\\notsubseteq', '\\not\\subseteq', 'group1', '\\not\subseteq'),
                new Symbol('\\notsupseteq', '\\not\\supseteq', 'group1', '\\not\supseteq'),
                new Symbol('\\models', '\\models', 'group1', '\\models'),
                new Symbol('\\prec', '\\prec', 'group1', '\\prec'),
                new Symbol('\\succ', '\\succ', 'group1', '\\succ'),
                new Symbol('\\preceq', '\\preceq', 'group1', '\\preceq'),
                new Symbol('\\succeq', '\\succeq', 'group1', '\\succeq'),
                new Symbol('\\simeq', '\\simeq', 'group1', '\\simeq'),
                new Symbol('\\mid', '\\mid', 'group1', '\\mid'),
                new Symbol('\\ll', '\\ll', 'group1', '\\ll'),
                new Symbol('\\gg', '\\gg', 'group1', '\\gg'),
                new Symbol('\\parallel', '\\parallel', 'group1', '\\parallel'),
                new Symbol('\\bowtie', '\\bowtie', 'group1', '\\bowtie'),
                new Symbol('\\sqsubset', '\\sqsubset', 'group1', '\\sqsubset'),
                new Symbol('\\sqsupset', '\\sqsupset', 'group1', '\\sqsupset'),
                new Symbol('\\smile', '\\smile', 'group1', '\\smile'),
                new Symbol('\\sqsubseteq', '\\sqsubseteq', 'group1', '\\sqsubseteq'),
                new Symbol('\\sqsupseteq', '\\sqsupseteq', 'group1', '\\sqsupseteq'),
                new Symbol('\\doteq', '\\doteq', 'group1', '\\doteq'),
                new Symbol('\\frown', '\\frown', 'group1', '\\frown'),
                new Symbol('\\vdash', '\\vdash', 'group1', '\\vdash'),
                new Symbol('\\dashv', '\\dashv', 'group1', '\\dashv'),
                new Symbol('\\exists', '\\exists', 'group1', '\\exists'),
                new Symbol('\\varnothing', '\\varnothing', 'group1', '\\varnothing'),

                new Symbol('\\bigcap', '\\bigcap{n}', 'group2', '\\bigcap', '', '', 'fi-kmath-bigcap-a'),
                new Symbol('\\bigcap _{} {x}', '\\bigcap _{a} {x}', 'group2', '\\bigcap{a}', '', 'true', 'fi-kmath-bigcap-sub-a'),
                new Symbol('\\bigcap _{}^{} {x}', '\\bigcap _{a}^{b} {x}', 'group2', '\\bigcap_{a}^{b}', '', 'true', 'fi-kmath-bigcap-sub-sup-a'),
                new Symbol('\\bigcup', '\\bigcup{x}', 'group2', '\\bigcup', '', '', 'fi-kmath-bigcup-a'),
                new Symbol('\\bigcup _{} {x}', '\\bigcup _{a} {x}', 'group2', '\\bigcup_{a}', '', 'true', 'fi-kmath-bigcup-sub-a'),
                new Symbol('\\bigcup _{}^{} {x}', '\\bigcup _{a}^{b} {x}', 'group2', '\\bigcup_{a}^{b}', '', 'true', 'fi-kmath-bigcup-sub-sup-a'),

            ];

            this.Arrows = [
                new Symbol('\\longleftarrow', '\\longleftarrow', 'group1', '\\longleftarrow'),
                new Symbol('\\longrightarrow', '\\longrightarrow', 'group1', '\\longrightarrow'),
                new Symbol('\\Longleftarrow', '\\Longleftarrow', 'group1', '\\Longleftarrow'),
                new Symbol('\\Longrightarrow', '\\Longrightarrow', 'group1', '\\Longrightarrow'),
                new Symbol('\\longleftrightarrow', '\\longleftrightarrow', 'group1', '\\longleftrightarrow'),
                new Symbol('\\updownarrow', '\\updownarrow', 'group1', '\\updownarrow'),
                new Symbol('\\Longleftrightarrow', '\\Longleftrightarrow', 'group1', '\\Longleftrightarrow'),
                new Symbol('\\Updownarrow', '\\Updownarrow', 'group1', '\\Updownarrow'),
                new Symbol('\\mapsto', '\\mapsto', 'group1', '\\mapsto'),
                new Symbol('\\nearrow', '\\nearrow', 'group1', '\\nearrow'),
                new Symbol('\\hookleftarrow', '\\hookleftarrow', 'group1', '\\hookleftarrow'),
                new Symbol('\\hookrightarrow', '\\hookrightarrow', 'group1', '\\hookrightarrow'),
                new Symbol('\\searrow', '\\searrow', 'group1', '\\searrow'),
                new Symbol('\\leftharpoonup', '\\leftharpoonup', 'group1', '\\leftharpoonup'),
                new Symbol('\\rightharpoonup', '\\rightharpoonup', 'group1', '\\rightharpoonup'),
                new Symbol('\\swarrow', '\\swarrow', 'group1', '\\swarrow'),
                new Symbol('\\leftharpoondown', '\\leftharpoondown', 'group1', '\\leftharpoondown'),
                new Symbol('\\rightharpoondown', '\\rightharpoondown', 'group1', '\\rightharpoondown'),
                new Symbol('\\nwarrow', '\\nwarrow', 'group1', '\\nwarrow'),
                new Symbol('\\downarrow', '\\downarrow', 'group1', '\\downarrow'),
                new Symbol('\\Downarrow', '\\Downarrow', 'group1', '\\Downarrow'),
                new Symbol('\\uparrow', '\\uparrow', 'group1', '\\uparrow'),
                new Symbol('\\Uparrow', '\\Uparrow', 'group1', '\\Uparrow'),
                new Symbol('\\rightarrow', '\\rightarrow', 'group1', '\\rightarrow'),
                new Symbol('\\Rightarrow', '\\Rightarrow', 'group1', '\\Rightarrow'),
                new Symbol('\\leftarrow', '\\leftarrow', 'group1', '\\leftarrow'),
                new Symbol('\\Leftarrow', '\\Leftarrow', 'group1', '\\Leftarrow'),
                new Symbol('\\leftrightarrow', '\\leftrightarrow', 'group1', '\\leftrightarrow'),
                new Symbol('\\Leftrightarrow', '\\Leftrightarrow', 'group1', '\\Leftrightarrow'),
                new AdvancedSymbol('\\leadsto', 'group1', 'fi-kmath-leadsto-a'),
                new AdvancedSymbol('\\xleftarrow{}', 'group1', 'fi-kmath-xleft-arrow-overset-a'),
                new AdvancedSymbol('\\xleftarrow[]{}', 'group1', 'fi-kmath-xleft-arrow-underset-a'),
                new AdvancedSymbol('\\xrightarrow{}', 'group1', 'fi-kmath-xright-arrow-overset-a'),
                new AdvancedSymbol('\\xrightarrow[]{}', 'group1', 'fi-kmath-xright-arrow-underset-a'),
                new AdvancedSymbol('\\circlearrowleft', 'group1', 'fi-kmath-circle-arrow-left-a'),

                new AdvancedSymbol('\\overset{}{}', 'group1', 'fi-kmath-overset-a'),
                new AdvancedSymbol('\\underset{}{}', 'group1', 'fi-kmath-underset-a'),
                new AdvancedSymbol('\\overset{a}{\\underset{a}{abc} } ', 'group1', 'fi-kmath-overset-underset-a'),

                new Symbol('\\overrightarrow', '\\overrightarrow{}', 'group6', '\\overrightarrow{abc}', '', '', 'fi-kmath-over-right-arrow-a'),
                new Symbol('\\overleftarrow', '\\overleftarrow{}', 'group6', '\\overleftarrow{abc}', '', '', 'fi-kmath-over-left-arrow-a'),
                new Symbol('\\overline', '\\overline{}', 'group6', '\\overline{abc}', '', '', 'fi-kmath-over-line-a'),


                new AdvancedSymbol('\\overset{abc}{\\rightarrow}', 'group20', 'fi-kmath-overset-right-arrow-a'),
                new AdvancedSymbol('\\overset{abc}{\\leftarrow}', 'group20', 'fi-kmath-overset-left-arrow-a'),
                new AdvancedSymbol('\\overset{abc}{\\leftrightarrow}', 'group20', 'fi-kmath-overset-left-right-arrow-a'),
                new AdvancedSymbol('\\underset{abc}{\\rightarrow}', 'group20', 'fi-kmath-underset-right-arrow-a'),
                new AdvancedSymbol('\\underset{abc}{\\leftarrow}', 'group20', 'fi-kmath-underset-left-arrow-a'),
                new AdvancedSymbol('\\underset{abc}{\\leftrightarrow}', 'group20', 'fi-kmath-underset-left-right-arrow-a'),

            ];

            this.Delimiters = [
                new Symbol('\\left\\{\\right\\}', '\\left\\{\\right\\}', 'group1', '{}', '', 'true', 'fi-kmath-brace-a'),
                new Symbol('\\left(\\right)', '\\left(\\right)', 'group1', '()', '', 'true'),
                new Symbol('\\left[\\right]', '\\left[\\right]', 'group1', '[]', '', 'true'),
                new Symbol('\\lfloor', '\\lfloor', 'group1', '\\lfloor'),
                new Symbol('\\rfloor', '\\rfloor', 'group1', '\\rfloor'),
                new Symbol('\\lceil', '\\lceil', 'group1', '\\lceil'),
                new Symbol('\\rceil', '\\rceil', 'group1', '\\rceil'),
                new Symbol('\\slash', '\/', 'group1', '\\slash'),
                new Symbol('\\lbrace', '\\lbrace', 'group1', '\\lbrace'),
                new Symbol('\\rbrace', '\\rbrace', 'group1', '\\rbrace'),
                new AdvancedSymbol('\\langle', 'group2', 'fi-kmath-langle-a'),
                new AdvancedSymbol('\\rangle', 'group2', 'fi-kmath-rangle-a'),
                new AdvancedSymbol('\\overbrace{}', 'group2', 'fi-kmath-over-brace-a'),
                new AdvancedSymbol('\\underbrace{}', 'group2', 'fi-kmath-under-brace-a'),



            ];

            this.Misc = [
                new Symbol('\\forall', '\\forall', 'group1', '\\forall'),
                new Symbol('\\ldots', '\\ldots', 'group1', '\\ldots'),
                new Symbol('\\cdots', '\\cdots', 'group1', '\\cdots'),
                new Symbol('\\ddots', '\\ddots', 'group1', '\\ddots'),
                new Symbol('\\vdots', '\\vdots', 'group1', '\\vdots'),
                new Symbol('\\surd', '\\surd', 'group1', '\\surd'),
                new Symbol('\\triangle', '\\triangle', 'group1', '\\triangle'),
                new Symbol('\\ell', '\\ell', 'group1', '\\ell'),
                new Symbol('\\top', '\\top', 'group1', '\\top'),
                new Symbol('\\flat', '\\flat', 'group1', '\\flat'),
                new Symbol('\\natural', '\\natural', 'group1', '\\natural'),
                new Symbol('\\sharp', '\\sharp', 'group1', '\\sharp'),
                new Symbol('\\wp', '\\wp', 'group1', '\\wp'),
                new Symbol('\\bot', '\\bot', 'group1', '\\bot'),
                new Symbol('\\clubsuit', '\\clubsuit', 'group1', '\\clubsuit'),
                new Symbol('\\diamondsuit', '\\diamondsuit', 'group1', '\\diamondsuit'),
                new Symbol('\\heartsuit', '\\heartsuit', 'group1', '\\heartsuit'),
                new Symbol('\\spadesuit', '\\spadesuit', 'group1', '\\spadesuit'),
                // new Symbol('\\caret', '\\caret', 'group1', '\\caret'),
                new Symbol('\\backslash', '\\backslash', 'group1', '\\backslash'),
                new Symbol('\\vert', '\\vert', 'group1', '\\vert'),
                new Symbol('\\perp', '\\perp', 'group1', '\\perp'),
                new Symbol('\\nabla', '\\nabla', 'group1', '\\nabla'),
                new Symbol('\\hbar', '\\hbar', 'group1', '\\hbar'),
                // new Symbol('\\AA', '\\AA', 'group1', '\\AA'),
                new Symbol('A\^{\\circ}', 'A\^{\\circ}', 'group1', 'A\^{\\circ}', '', 'true', 'fi-kmath-sub-circ-a'),
                new Symbol('A\^{\\prime}', 'A\^{\\prime}', 'group1', 'A\^{\\prime}', '', 'true', 'fi-kmath-sup-prime-a'),
                new Symbol('A\^{\\prime\\prime}', 'A\^{\\prime\\prime}', 'group1', 'A\^{\\prime\\prime}', '', 'true', 'fi-kmath-sup-double-prime-a'),
                new Symbol('A\^{\\prime\\prime\\prime}', 'A\^{\\prime\\prime\\prime}', 'group1', 'A\^{\\prime\\prime\\prime}', '', 'true', 'fi-kmath-sup-triple-prime-a'),

                new Symbol('\\circ', '\\circ', 'group1', '\\circ'),
                new Symbol('\\bullet', '\\bullet', 'group1', '\\bullet'),
                new Symbol('\\setminus', '\\setminus', 'group1', '\\setminus'),
                new Symbol('\\neg', '\\neg', 'group1', '\\neg'),
                new Symbol('\\dots', '\\dots', 'group1', '\\dots'),
                new Symbol('\\Re', '\\Re', 'group1', '\\Re'),
                new Symbol('\\Im', '\\Im', 'group1', '\\Im'),
                new Symbol('\\partial', '\\partial', 'group1', '\\partial'),
                new Symbol('\\infty', '\\infty', 'group1', '\\infty'),
                new Symbol('\\&', '\\&', 'group1', '\\&', '', 'true'),
                new Symbol('\\aleph', '\\aleph', 'group1', '\\aleph'),
                new Symbol('\\deg', '\\deg', 'group1', '\\deg'),

                new Symbol('\\lim_{x\\to\\infty}{}', '\\lim_{x\\to\\infty}{}', 'group6', 'lim', '', 'true'),
                new Symbol('\\log_{}\\left(\\right)', '\\log_{}\\left(\\right)', 'group6', 'log', '', 'true'),

                new Symbol('\\angle', '\\angle', 'group1', '\\angle'),
                new Symbol('\\wp', '\\wp', 'group1', '\\wp'),
                new AdvancedSymbol('\\Join', 'group1', 'fi-kmath-join-a'),
                new AdvancedSymbol('\\S', 'group1', 'fi-kmath-double-s-a'),
                new AdvancedSymbol('^{\\backprime}A', 'group1', 'fi-kmath-sup-back-prime-a'),
                new AdvancedSymbol('\\overset{\\frown}{A} ', 'group1', 'fi-kmath-overset-frown-a'),
                new AdvancedSymbol('\\maltese', 'group1', 'fi-kmath-maltese-a'),



                new Symbol('\\N', '\\mathbb{N}', 'group3', '\\N', 'font-size: 1.3em'),
                new Symbol('\\P', '\\mathbb{P}', 'group3', '\\P', 'font-size: 1.3em'),
                new Symbol('\\Q', '\\mathbb{Q}', 'group3', '\\Q', 'font-size: 1.3em'),
                new Symbol('\\R', '\\mathbb{R}', 'group3', '\\R', 'font-size: 1.3em'),
                new Symbol('\\C', '\\mathbb{C}', 'group3', '\\C', 'font-size: 1.3em'),
                new Symbol('\\H', '\\mathbb{H}', 'group3', '\\H', 'font-size: 1.3em'),

                new AdvancedSymbol('\\,', 'group2', 'fi-kmath-spacing3-a'),
                new AdvancedSymbol('\\:', 'group2', 'fi-kmath-spacing4-a'),
                new AdvancedSymbol('\\;', 'group2', 'fi-kmath-spacing5-a'),
                new AdvancedSymbol('\\!', 'group2', 'fi-kmath-spacing-minus3-a'),
                new AdvancedSymbol('\\ ', 'group2', 'fi-kmath-spacing-normal-a'),
                new AdvancedSymbol('\\quad', 'group2', 'fi-kmath-spacing-quad-a'),
                new AdvancedSymbol('\\qquad', 'group2', 'fi-kmath-spacing-qquad-a'),
                // new Symbol('\\quad', '\\quad', 'group2', '\\quad', '', '', 'fi-kmath-spacing-quad-a'),
                // new Symbol('\\qquad', '\\qquad', 'group2', '\\qquad', '', '', 'fi-kmath-spacing-qquad-a'),
            ];
            /**
             * render category
             */
            this.init = function ($category) {
                var str = '',
                    $matrixTable,
                    row = 10,
                    table;

                // category
                $.map(category, function (c, index) {
                    index === 0 ?
                        str += '<li class="selected-category" title="' + c.displayTitle + '" data-title="' + c.title + '">' + c.icon + '<span>' + c.displayTitle + '</span></li>' :
                        str += '<li title="' + c.displayTitle + '" data-title="' + c.title + '">' + c.icon + '<span>' + c.displayTitle + '</span></li>'
                });
                $category.html(str);

                // matrixTable
                $matrixTable = $('<div class="customMatrix" style="display: none;"></div>');
                $matrixTable.append('<div class="title">' + 'select size: ' + ' <span class="customMatrixDimensions"></span></div>');
                $matrixTable.append('<span class="closeCustomMatrix"><div>' + 'close' + '</div></span>');
                table = '<table class="customMatrixTable">';
                for (var i = row; i--;) {
                    table += '<tr>';
                    for (var j = row; j--;) {
                        table += '<td></td>'
                    }
                    table += '</tr>'
                }
                table += '</table>';
                $matrixTable.append(table);
                $(document.body).append($matrixTable);

                $matrixTable.on('mouseover', 'td', function () {
                    var x, y;
                    $matrixTable.find('td').removeClass('on');
                    x = $(this).parent().find('td').index(this) + 1;
                    y = $(this).closest('tbody').find('tr').index($(this).parent()[0]) + 1;
                    $matrixTable.data('x', x);
                    $matrixTable.data('y', y);
                    var trs = $('tr:nth-child(-n + ' + y + ')', $(this).closest('tbody'));
                    $('td:nth-child(-n + ' + x + ')', trs).addClass('on');
                    $('.customMatrixDimensions', $matrixTable).text(x + ' x ' + y);
                });

                $matrixTable.find('.closeCustomMatrix').click(function () {
                    hideTable();
                });

                $matrixTable.click(function (e) {
                    e.stopPropagation();
                });

                $(document).click(function () {
                    hideTable();
                });

                function hideTable() {
                    $matrixTable.find('td').removeClass('on');
                    $matrixTable.hide();
                }

                //this.switchSymbols();
            }

            // render symbols
            /**
             * 切换菜单是生成对应的DOM（toolbars）
             * @method
             * @param {String} 菜单分组
             * @param {Bool} isBasic 状态
             * @param {jQuery} math symbol 容器
             */
            this.switchSymbols = function (title, isBasic, $mathSymbol) {
                // 'Basic' in default
                title ? '' : title = category[0].title;

                var ele = '',
                    groups = {},    // current symbols group name store
                    symbolCache;

                /**
                 * $.grep:查找满足过滤函数的数组元素。原始数组不受影响。
                 */
                symbolCache = $.grep(symbolCaches, function (cache) {
                    if (cache.title == title && cache.isBasic == isBasic) {
                        return cache;
                    }
                });
                if (symbolCache.length) {
                    $mathSymbol.html(symbolCache[0].ele);
                    $mathSymbol.find('li').not('.directDisplay').each(function () {
                        MQ.StaticMath(this);
                    });

                    return;
                }
                /**
                 * 遍历指定 symbol集合 s 为 Symbol 实例
                 */
                $.map(this[title], function (s) {
                    // ele += '<li class="'+ s.group +'" title="'+ s.latex +'" advance="'+ s.advance +'">' + s.text + '</li>';
                    ele += s.createTemplate(isBasic);
                    groups[s.group] = 1;
                });
                ele = $(ele);
                // set styles for the last one in each group 
                for (var key in groups) {
                    ele.filter('.' + key).last().css('margin-right', '5px');
                }
                $mathSymbol.html(ele);

                // 首次执行可能由于页面渲染未完成导致数学符号的缩放计算不正确，故setTimeout。
                // MQ.StaticMath 会忽略所有标签，故在li级别循环执行。
                setTimeout(function () {
                    $mathSymbol.find('li').not('.directDisplay').each(function () {
                        MQ.StaticMath(this);
                    });
                });

                symbolCaches.push({
                    ele: ele,
                    title: title,
                    isBasic: isBasic
                });
            }

            /**
             * 显示设置矩阵大小的table
             * @method
             * @param {symbol} Dom 用于获取相对位置
             */
            this.showCustomMatrix = function (symbol) {
                var $table = $(".customMatrix");
                var offset = $(symbol).offset();
                $table.css('left', offset.left);
                $table.css('top', offset.top + 45);
                $table.show();
            }

            /**
             * 生成矩阵的latex
             * @method
             * @param {datas} Array 在table上存储的数据
             */
            this.createMatrixLatex = function (datas) {
                var begintxt = '',
                    endtxt = '',
                    result = '';
                switch (datas.title) {
                    case 'matrix':
                        begintxt = "\\begin{matrix}\n";
                        endtxt = "\n\\end{matrix}";
                        break;
                    case 'bmatrix':
                        begintxt = "\\begin{bmatrix}\n";
                        endtxt = "\n\\end{bmatrix}";
                        break;
                    case 'Bmatrix':
                        begintxt = "\\begin{Bmatrix}\n";
                        endtxt = "\n\\end{Bmatrix}";
                        break;
                    case 'pmatrix':
                        begintxt = "\\begin{pmatrix}\n";
                        endtxt = "\n\\end{pmatrix}";
                        break;
                    case 'smallmatrix':
                        begintxt = "\\bigl(\\begin{smallmatrix}\n";
                        endtxt = "\n\\end{smallmatrix}\\bigr)";
                        break;
                    case 'vmatrix':
                        begintxt = "\\begin{vmatrix}\n";
                        endtxt = "\n\\end{vmatrix}";
                        break;
                    case 'Vmatrix':
                        begintxt = "\\begin{Vmatrix}\n";
                        endtxt = "\n\\end{Vmatrix}";
                        break;
                    default:
                        console.log('no match.');
                        return '';
                }

                for (var c = 0; c < datas.y; c++) {
                    for (var a = 0; a < datas.x - 1; a++) {
                        result += " & "
                    }
                    if (c < datas.y - 1) {
                        result += "\\\\\n"
                    }
                }

                return begintxt + result + endtxt;
            }

        }
        /**
         * constructs Symbol objuects
         * @class Symbol 
         * @param {String} latex basicView latex
         * @param {String} advance advanceView latex
         * @param {String} group
         * @param {String} text (需要通过 MQ.StaticMath 方法生成符号)
         * @param {String} style 
         * @param {Boolean} needUseWrite 设置在basic view中的输入方式（true, mean using write） 
         * @param {String} iconClass 使用font设置symbol显示
         */
        function Symbol(latex, advance, group, text, style, needUseWrite, iconClass) {
            this.text = text;
            this.latex = latex;
            this.advance = advance;
            this.group = group;
            this.style = style;
            this.needUseWrite = !!needUseWrite;
            this.iconClass = iconClass;
            this.createTemplate = function (isBasic) {
                var tit = isBasic ? this.latex : this.advance;
                var text, clazz, style = '';
                if (this.iconClass) {
                    text = '<span class="' + this.iconClass + '"></span>';
                    clazz = 'directDisplay ' + this.group;
                } else {
                    text = this.text;
                    clazz = this.group;
                }
                style = this.style ? this.style : ''

                // var result = this.style ?
                //     '<li class="' + clazz + '" title="' + tit + '" style="' + this.style + '" data-mq="' + this.needUseWrite + '">' + text + '</li>' :
                //     '<li class="' + clazz + '" title="' + tit + '" data-mq="' + this.needUseWrite + '">' + text + '</li>';
                // var result = '<li class="'+ this.group +'" title="'+ tit +'">' + this.advance + '</li>';

                var result = '<li class="' + clazz + '" title="' + tit + '" style="' + style + '" data-mq="' + this.needUseWrite + '">' + text + '</li>';
                return result;
            }
        }

        function AdvancedSymbol(advance, group, iconClass) {
            this.advance = advance;
            this.group = group;
            this.iconClass = iconClass;
            this.createTemplate = function (isBasic) {
                var result = '<li class="directDisplay ' + this.group + '" title="' + advance + '"><span class="' + this.iconClass + '"></span></li>';
                return isBasic ? "" : result;
            }
        }

        function Matrix(title, icon, group) {
            this.title = title;
            this.icon = icon;
            this.group = group;
            this.createTemplate = function (isBasic) {
                // Basic view中， hide Matrix symbols
                return isBasic ? '' : '<li class="' + this.group + ' matrix directDisplay" title="' + title + '" ><span class="' + this.icon + '"></span></li>';
            }
        }

        /**
         * Add style node to specified document
         * @method
         * @param {String} str inner css 
         * @param {document} doc default in window.document
         */
        function addStyleNode(str, doc) {
            doc = doc ? doc : document;
            var styleNode = doc.createElement("style");
            styleNode.type = "text/css";
            if (styleNode.styleSheet) {
                styleNode.styleSheet.cssText = str;       //ie下要通过 styleSheet.cssText写入.   
            } else {
                styleNode.innerHTML = str;       //在ff中， innerHTML是可读写的，但在ie中，它是只读的.   
            }
            doc.getElementsByTagName("head")[0].appendChild(styleNode);
        }
        // var kmathcss = '.kmath-select{position:relative;z-index:999;margin:4px 0 0 5px;max-width:160px}.kmath-select-menu{display:none;padding:0px;margin:0px;min-width:155px;position:absolute;top:100%;width:100%;left:0;background:#fff;border:1px solid #ccc;max-height:150px;overflow:auto}.open .kmath-select-menu{display:inline-block}.kmath-select-menuitem{list-style:none;border:0;padding:0 6px;margin-top:1px;margin-bottom:2px;line-height:2}.kmath-select-menuitem:hover{background-color:#eefbee}.kmath-select-menuitem.select{background-color:#eefbee}.kmath-select-input{border:1px solid #a9a9a9;background-color:transparent;width:100%;line-height:2;padding:0 6px;cursor:default;box-sizing:border-box}.kmath-select-div:after{content:"";border-top-width:5px;border-bottom-width:0px;border-color:transparent;border-top-color:#232323;border-style:solid;position:absolute;top:13px;right:10px;z-index:-1}.none{display:none}.customMatrix{position:absolute;display:inline-block;min-width:230px;padding:5px;background:#fff;border:1px solid #9c9a9a;border-radius:6px;z-index:99999;font-family:Segoe UI}.customMatrix .title{float:left;padding-bottom:2px}.closeCustomMatrix{float:right;cursor:pointer}.customMatrixTable{clear:both;border-right:1px solid #eee;border-bottom:1px solid #eee;border-spacing:0}.customMatrixTable td{height:20px;width:20px;border-top:1px solid #eee;border-left:1px solid #eee;cursor:pointer}.customMatrixTable td.on{background:darkgray}.math-insert.button,.math-cancel.button{float:right;margin-top:20px;margin-left:15px;box-sizing:border-box}#kmath,[data-role="kmath"]{padding:0 5px 6px;max-width:900px;min-width:720px;font-family:"Times New Roman",serif;border:1px solid #ccc}.math-category{padding:0;margin:0}.math-category>li{display:inline-block;padding:0 15px;line-height:44px;cursor:pointer;box-sizing:border-box}.math-category>li>span{padding-left:6px}.math-category>li.selected-category{border-bottom:2px solid #5FB554}.math-symbol{display:flex;flex-wrap:wrap;align-items:flex-start;align-content:flex-start;height:142px;padding:5px 5px 0;margin:0;border:1px solid #dbdbdb;border-top-color:#5FB554;box-sizing:border-box}.math-symbol>li{list-style:none;padding:0;overflow:hidden;margin-left:-1px;margin-bottom:5px;height:40px;width:40px;line-height:35px;text-align:center;color:#000;border:1px solid #dbdbdb;cursor:pointer;box-sizing:border-box}.math-symbol>li.directDisplay{font-size:2em;padding-top:4px}.advance-editarea{display:block;overflow:auto;width:98%;margin:0 auto;height:120px}.advance-view{overflow:auto;margin:0 auto;height:144px}.advance-editarea::-webkit-scrollbar{-webkit-appearance:none;width:10px;height:10px}.advance-editarea::-webkit-scrollbar-thumb{border-radius:8px;border:2px solid #fff;background-color:rgba(0,0,0,.3)}.advance-view::-webkit-scrollbar{-webkit-appearance:none;width:10px;height:10px}.advance-view::-webkit-scrollbar-thumb{border-radius:8px;border:2px solid #fff;background-color:rgba(0,0,0,.3)}.basic-editarea,.basic-editarea .mq-root-block,.basic-editarea .mq-math-mode .mq-root-block{overflow:auto;width:auto}.basic-editarea{clear:both;display:block;width:99%;margin:0 auto;height:300px}.basic-editarea::-webkit-scrollbar,.basic-editarea .mq-root-block::-webkit-scrollbar,.basic-editarea .mq-math-mode .mq-root-block::-webkit-scrollbar{-webkit-appearance:none;width:10px;height:10px}.basic-editarea::-webkit-scrollbar-thumb,.basic-editarea .mq-root-block::-webkit-scrollbar-thumb,.basic-editarea .mq-math-mode .mq-root-block::-webkit-scrollbar-thumb{border-radius:8px;border:2px solid #fff;background-color:rgba(0,0,0,.3)}.kmath-message{position:absolute;bottom:0.1em;left:0.5em;font-size:0.9em;font-family:Verdana}.blue-link{margin:10px 0;float:right;border:none;background:none;color:#3a9be5;cursor:pointer}.blue-link:hover{text-decoration:underline}.math-symbol .mq-empty{display:none!important}.math-symbol big{font-size:1.3em!important}';
        // var mathjaxcss = ".mjx-chtml{display:inline-block;line-height:0;text-indent:0;text-align:left;text-transform:none;font-style:normal;font-weight:normal;font-size:100%;font-size-adjust:none;letter-spacing:normal;word-wrap:normal;word-spacing:normal;white-space:nowrap;float:none;direction:ltr;max-width:none;max-height:none;min-width:0;min-height:0;border:0;margin:0;padding:1px 0}.MJXc-display{display:block;text-align:center;margin:1em 0;padding:0}.mjx-chtml[tabindex]:focus,body :focus .mjx-chtml[tabindex]{display:inline-table}.mjx-full-width{text-align:center;display:table-cell!important;width:10000em}.mjx-math{display:inline-block;border-collapse:separate;border-spacing:0}.mjx-math *{display:inline-block;-webkit-box-sizing:content-box!important;-moz-box-sizing:content-box!important;box-sizing:content-box!important;text-align:left}.mjx-numerator{display:block;text-align:center}.mjx-denominator{display:block;text-align:center}.MJXc-stacked{height:0;position:relative}.MJXc-stacked>*{position:absolute}.MJXc-bevelled>*{display:inline-block}" +
        //     ".mjx-stack{display:inline-block}.mjx-op{display:block}.mjx-under{display:table-cell}.mjx-over{display:block}.mjx-over>*{padding-left:0!important;padding-right:0!important}.mjx-under>*{padding-left:0!important;padding-right:0!important}.mjx-stack>.mjx-sup{display:block}.mjx-stack>.mjx-sub{display:block}.mjx-prestack>.mjx-presup{display:block}.mjx-prestack>.mjx-presub{display:block}.mjx-delim-h>.mjx-char{display:inline-block}.mjx-surd{vertical-align:top}.mjx-mphantom *{visibility:hidden}.mjx-merror{background-color:#ff8;color:#c00;border:1px solid #c00;padding:2px 3px;font-style:normal;font-size:90%}.mjx-annotation-xml{line-height:normal}.mjx-menclose>svg{fill:none;stroke:currentColor}.mjx-mtr{display:table-row}.mjx-mlabeledtr{display:table-row}.mjx-mtd{display:table-cell;text-align:center}.mjx-label{display:table-row}.mjx-box{display:inline-block}.mjx-block{display:block}.mjx-span{display:inline}.mjx-char{display:block;white-space:pre}.mjx-itable{display:inline-table;width:auto}.mjx-row{display:table-row}" +
        //     ".mjx-cell{display:table-cell}.mjx-table{display:table;width:100%}.mjx-line{display:block;height:0}.mjx-strut{width:0;padding-top:1em}.mjx-vsize{width:0}.MJXc-space1{margin-left:.167em}.MJXc-space2{margin-left:.222em}.MJXc-space3{margin-left:.278em}.mjx-chartest{display:block;visibility:hidden;position:absolute;top:0;line-height:normal;font-size:500%}.mjx-chartest .mjx-char{display:inline}.mjx-chartest .mjx-box{padding-top:1000px}.MJXc-processing{visibility:hidden;position:fixed;width:0;height:0;overflow:hidden}.MJXc-processed{display:none}.mjx-test{display:block;font-style:normal;font-weight:normal;font-size:100%;font-size-adjust:none;text-indent:0;text-transform:none;letter-spacing:normal;word-spacing:normal;overflow:hidden;height:1px}.mjx-ex-box-test{position:absolute;width:1px;height:60ex}.mjx-line-box-test{display:table!important}.mjx-line-box-test span{display:table-cell!important;width:10000em!important;min-width:0;max-width:none;padding:0;border:0;margin:0}#MathJax_CHTML_Tooltip{background-color:InfoBackground;color:InfoText;border:1px solid black;box-shadow:2px 2px 5px #aaa;-webkit-box-shadow:2px 2px 5px #aaa;-moz-box-shadow:2px 2px 5px #aaa;-khtml-box-shadow:2px 2px 5px #aaa;padding:3px 4px;z-index:401;position:absolute;left:0;top:0;width:auto;height:auto;display:none}" +
        //     ".mjx-chtml .mjx-noError{line-height:1.2;vertical-align:;font-size:90%;text-align:left;color:black;padding:1px 3px;border:1px solid}.MJXc-TeX-unknown-R{font-family:STIXGeneral,'Cambria Math','Arial Unicode MS',serif;font-style:normal;font-weight:normal}.MJXc-TeX-unknown-I{font-family:STIXGeneral,'Cambria Math','Arial Unicode MS',serif;font-style:italic;font-weight:normal}.MJXc-TeX-unknown-B{font-family:STIXGeneral,'Cambria Math','Arial Unicode MS',serif;font-style:normal;font-weight:bold}.MJXc-TeX-unknown-BI{font-family:STIXGeneral,'Cambria Math','Arial Unicode MS',serif;font-style:italic;font-weight:bold}.MJXc-TeX-ams-R{font-family:MJXc-TeX-ams-R,MJXc-TeX-ams-Rw}.MJXc-TeX-cal-B{font-family:MJXc-TeX-cal-B,MJXc-TeX-cal-Bx,MJXc-TeX-cal-Bw}.MJXc-TeX-frak-R{font-family:MJXc-TeX-frak-R,MJXc-TeX-frak-Rw}.MJXc-TeX-frak-B{font-family:MJXc-TeX-frak-B,MJXc-TeX-frak-Bx,MJXc-TeX-frak-Bw}" +
        //     ".MJXc-TeX-math-BI{font-family:MJXc-TeX-math-BI,MJXc-TeX-math-BIx,MJXc-TeX-math-BIw}.MJXc-TeX-sans-R{font-family:MJXc-TeX-sans-R,MJXc-TeX-sans-Rw}.MJXc-TeX-sans-B{font-family:MJXc-TeX-sans-B,MJXc-TeX-sans-Bx,MJXc-TeX-sans-Bw}.MJXc-TeX-sans-I{font-family:MJXc-TeX-sans-I,MJXc-TeX-sans-Ix,MJXc-TeX-sans-Iw}.MJXc-TeX-script-R{font-family:MJXc-TeX-script-R,MJXc-TeX-script-Rw}.MJXc-TeX-type-R{font-family:MJXc-TeX-type-R,MJXc-TeX-type-Rw}.MJXc-TeX-cal-R{font-family:MJXc-TeX-cal-R,MJXc-TeX-cal-Rw}.MJXc-TeX-main-B{font-family:MJXc-TeX-main-B,MJXc-TeX-main-Bx,MJXc-TeX-main-Bw}.MJXc-TeX-main-I{font-family:MJXc-TeX-main-I,MJXc-TeX-main-Ix,MJXc-TeX-main-Iw}.MJXc-TeX-main-R{font-family:MJXc-TeX-main-R,MJXc-TeX-main-Rw}.MJXc-TeX-math-I{font-family:MJXc-TeX-math-I,MJXc-TeX-math-Ix,MJXc-TeX-math-Iw}.MJXc-TeX-size1-R{font-family:MJXc-TeX-size1-R,MJXc-TeX-size1-Rw}.MJXc-TeX-size2-R{font-family:MJXc-TeX-size2-R,MJXc-TeX-size2-Rw}.MJXc-TeX-size3-R{font-family:MJXc-TeX-size3-R,MJXc-TeX-size3-Rw}.MJXc-TeX-size4-R{font-family:MJXc-TeX-size4-R,MJXc-TeX-size4-Rw}" +
        //     "@font-face{font-family:MJXc-TeX-ams-R;src:local('MathJax_AMS'),local('MathJax_AMS-Regular')}@font-face{font-family:MJXc-TeX-ams-Rw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_AMS-Regular.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_AMS-Regular.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_AMS-Regular.otf') format('opentype')}@font-face{font-family:MJXc-TeX-cal-B;src:local('MathJax_Caligraphic Bold'),local('MathJax_Caligraphic-Bold')}@font-face{font-family:MJXc-TeX-cal-Bx;src:local('MathJax_Caligraphic');font-weight:bold}@font-face{font-family:MJXc-TeX-cal-Bw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Caligraphic-Bold.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Caligraphic-Bold.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Caligraphic-Bold.otf') format('opentype')}@font-face{font-family:MJXc-TeX-frak-R;src:local('MathJax_Fraktur'),local('MathJax_Fraktur-Regular')}" +
        //     "@font-face{font-family:MJXc-TeX-frak-Rw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Fraktur-Regular.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Fraktur-Regular.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Fraktur-Regular.otf') format('opentype')}@font-face{font-family:MJXc-TeX-frak-B;src:local('MathJax_Fraktur Bold'),local('MathJax_Fraktur-Bold')}@font-face{font-family:MJXc-TeX-frak-Bx;src:local('MathJax_Fraktur');font-weight:bold}@font-face{font-family:MJXc-TeX-frak-Bw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Fraktur-Bold.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Fraktur-Bold.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Fraktur-Bold.otf') format('opentype')}@font-face{font-family:MJXc-TeX-math-BI;src:local('MathJax_Math BoldItalic'),local('MathJax_Math-BoldItalic')}@font-face{font-family:MJXc-TeX-math-BIx;src:local('MathJax_Math');font-weight:bold;font-style:italic}" +
        //     "@font-face{font-family:MJXc-TeX-math-BIw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Math-BoldItalic.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Math-BoldItalic.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Math-BoldItalic.otf') format('opentype')}@font-face{font-family:MJXc-TeX-sans-R;src:local('MathJax_SansSerif'),local('MathJax_SansSerif-Regular')}@font-face{font-family:MJXc-TeX-sans-Rw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_SansSerif-Regular.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_SansSerif-Regular.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_SansSerif-Regular.otf') format('opentype')}@font-face{font-family:MJXc-TeX-sans-B;src:local('MathJax_SansSerif Bold'),local('MathJax_SansSerif-Bold')}@font-face{font-family:MJXc-TeX-sans-Bx;src:local('MathJax_SansSerif');font-weight:bold}@font-face{font-family:MJXc-TeX-sans-Bw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_SansSerif-Bold.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_SansSerif-Bold.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_SansSerif-Bold.otf') format('opentype')}" +
        //     "@font-face{font-family:MJXc-TeX-sans-I;src:local('MathJax_SansSerif Italic'),local('MathJax_SansSerif-Italic')}@font-face{font-family:MJXc-TeX-sans-Ix;src:local('MathJax_SansSerif');font-style:italic}@font-face{font-family:MJXc-TeX-sans-Iw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_SansSerif-Italic.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_SansSerif-Italic.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_SansSerif-Italic.otf') format('opentype')}@font-face{font-family:MJXc-TeX-script-R;src:local('MathJax_Script'),local('MathJax_Script-Regular')}@font-face{font-family:MJXc-TeX-script-Rw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Script-Regular.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Script-Regular.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Script-Regular.otf') format('opentype')}@font-face{font-family:MJXc-TeX-type-R;src:local('MathJax_Typewriter'),local('MathJax_Typewriter-Regular')}" +
        //     "@font-face{font-family:MJXc-TeX-type-Rw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Typewriter-Regular.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Typewriter-Regular.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Typewriter-Regular.otf') format('opentype')}@font-face{font-family:MJXc-TeX-cal-R;src:local('MathJax_Caligraphic'),local('MathJax_Caligraphic-Regular')}@font-face{font-family:MJXc-TeX-cal-Rw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Caligraphic-Regular.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Caligraphic-Regular.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Caligraphic-Regular.otf') format('opentype')}@font-face{font-family:MJXc-TeX-main-B;src:local('MathJax_Main Bold'),local('MathJax_Main-Bold')}@font-face{font-family:MJXc-TeX-main-Bx;src:local('MathJax_Main');font-weight:bold}@font-face{font-family:MJXc-TeX-main-Bw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Main-Bold.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Main-Bold.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Main-Bold.otf') format('opentype')}" +
        //     "@font-face{font-family:MJXc-TeX-main-I;src:local('MathJax_Main Italic'),local('MathJax_Main-Italic')}@font-face{font-family:MJXc-TeX-main-Ix;src:local('MathJax_Main');font-style:italic}@font-face{font-family:MJXc-TeX-main-Iw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Main-Italic.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Main-Italic.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Main-Italic.otf') format('opentype')}@font-face{font-family:MJXc-TeX-main-R;src:local('MathJax_Main'),local('MathJax_Main-Regular')}@font-face{font-family:MJXc-TeX-main-Rw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Main-Regular.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Main-Regular.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Main-Regular.otf') format('opentype')}@font-face{font-family:MJXc-TeX-math-I;src:local('MathJax_Math Italic'),local('MathJax_Math-Italic')}" +
        //     "@font-face{font-family:MJXc-TeX-math-Ix;src:local('MathJax_Math');font-style:italic}@font-face{font-family:MJXc-TeX-math-Iw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Math-Italic.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Math-Italic.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Math-Italic.otf') format('opentype')}@font-face{font-family:MJXc-TeX-size1-R;src:local('MathJax_Size1'),local('MathJax_Size1-Regular')}@font-face{font-family:MJXc-TeX-size1-Rw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Size1-Regular.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Size1-Regular.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Size1-Regular.otf') format('opentype')}@font-face{font-family:MJXc-TeX-size2-R;src:local('MathJax_Size2'),local('MathJax_Size2-Regular')}@font-face{font-family:MJXc-TeX-size2-Rw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Size2-Regular.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Size2-Regular.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Size2-Regular.otf') format('opentype')}" +
        //     "@font-face{font-family:MJXc-TeX-size3-R;src:local('MathJax_Size3'),local('MathJax_Size3-Regular')}@font-face{font-family:MJXc-TeX-size3-Rw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Size3-Regular.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Size3-Regular.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Size3-Regular.otf') format('opentype')}@font-face{font-family:MJXc-TeX-size4-R;src:local('MathJax_Size4'),local('MathJax_Size4-Regular')}@font-face{font-family:MJXc-TeX-size4-Rw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Size4-Regular.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Size4-Regular.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Size4-Regular.otf') format('opentype')}" +
        //     ".mjx-chtml{border:1px solid rgba(255,255,255,0)}.mjx-chtml:focus{outline:0}.MathJax_CHTML_focused{border:1px solid rgba(77,144,254,0.9);border-radius:2px}.kmath-contextmenu{font-family:Verdana;font-size:13px;position:absolute;margin:0;padding:0;list-style:none;background:#fff;border:1px solid #ccc;z-index:999999}.kmath-contextmenu li{padding:0 13px;line-height:40px;cursor:pointer}.kmath-contextmenu li:hover{background:#eefbee}";

        //export KMath
        window.KMath = KMath;
        // KMath.addStyleNode = addStyleNode;
        // KMath.mathjaxcss = mathjaxcss;
    })(window);

window.$$ = {
    GCI18N: {
        kMath: {
            Cancel: "Cancel",
            Insert: "Insert",
            Formulas: "Formulas",
            SwitchtoBasic: "Switch to Basic View",
            SwitchtoAdvance: "Switch to Advanced View",
            Basic: "Basic",
            Greek: "Greek",
            Operators: "Operators",
            Relationships: "Relationships",
            Arrows: "Arrows",
            Delimiters: "Delimiters",
            Misc: "Miscellaneous",
            CannotRenderinMQ: "This equation is not available in the Basic View.",
            TypesetFailed: "Failed to typeset the entered equations. Try again later.",
            CopyLaTeX: "Copy LaTeX"
        }
    }
};