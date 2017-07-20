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
                mathbbReg = /\\mathbb{([A-Z])}/g,
                notinsetReg = /not\\(in|ni|subset|supset|subseteq|supseteq)/g,
                controlBox = new ControlBox(),
                self = this,
                defaultOptions = { 
                    // message: ".kmath-message-" + uuid, 
                    element: "#kmath-" + uuid 
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
                // this.$message = $(this.options.message);

                $category = $(".math-category", this.element);
                $mathSymbol = $(".math-symbol", this.element);
                $mathEditor = $(".math-editor", this.element);
                controlBox.init($category);
                this._initialView();
                addStyleNode(kmathcss);
                //下面这几个DOM元素只有this._initialView 完成之后才有值
                $advance_editarea = $(".advance-editarea", this.element);
                $advance_view = $(".advance-view", this.element);
                $basic_editarea = $(".basic-editarea", this.element);
                $tobasic_btn = $(".tobasic", this.element);
                $toadvance_btn = $(".toadvance", this.element);
                this.$message = $('.kmath-message', this.element);

                // Switch basic \ advance view 
                this.element.on("click", '.tobasic', function () {
                    if(!self._ableToBasic()){
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

                $mathSymbol.on('click', 'li', function (e) {
                    if (self.isBasic) {
                        self.mathField.cmd(this.title);
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

                        textarea.selectionStart = this.title.length + start;
                        textarea.selectionEnd = textarea.selectionStart;
                        textarea.focus();
                    }

                });

                $category.on('click', 'li', function (e) {
                    if ($(this).hasClass('selected-category')) {
                        return;
                    }
                    $(this).siblings('li').removeClass('selected-category').end().addClass('selected-category');
                    controlBox.switchSymbols($(this).attr('data-title'), self.isBasic, $mathSymbol);
                });

                $advance_editarea.on({ 'keyup': self._typesetView, 'change': this._typesetView });

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
                    setTimeout(function(){
                        self.mathField.select();
                        self.mathField.write(value);
                    });
                } else {
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
            /**
             * 唯一改变this.isBasic的method
             */
            this._toggleView = function (status) {
                this.isBasic = status;
                if (this.isBasic) {
                    $basic_editarea.show(0);
                    $toadvance_btn.show(0);
                    $advance_editarea.hide(0);
                    $advance_view.hide(0);
                    $tobasic_btn.hide(0);
                } else {
                    $basic_editarea.hide(0);
                    $toadvance_btn.hide(0);
                    $advance_editarea.show(0);
                    $advance_view.show(0);
                    $tobasic_btn.show(0);
                }
            }

            this._ableToBasic = function(){
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
                    }else{
                        return true;
                    }
                }else{
                    return false;
                }
            }

            this._initialView = function () {
                var $view = $('<div style="padding-bottom: 1.5em; position: relative">' +
                    '<button class="blue-link tobasic">' + $$.GCI18N.kMath.SwitchtoBasic + '</button>' +
                    '<button class="blue-link toadvance">' + $$.GCI18N.kMath.SwitchtoAdvance + '</button>' +
                    '<textarea class="advance-editarea"></textarea>' +          // S_N = \\displaystyle\\sqrt{ \\frac{1}{N} \\sum\^N_{i=1}{(x_i - \\bar{x})\^2} }
                    '<div class="advance-view"></div>' +
                    // '<textarea id="basic-editarea"></textarea>'+
                    '<span class="basic-editarea"></span>' +
                    '<div class="kmath-message"></div>'+
                    '</div>');

                $mathEditor.html($view);

            }
            this._typesetView = function () {
                // $advance_view.html(checkBreaks($advance_editarea.val()));
                if (!$advance_editarea.val().trim().length) {
                    $advance_view.html('');
                    return;
                }
                $advance_view.html("$$" + $advance_editarea.val() + "$$");
                MathJax.Hub.Queue(["Typeset", MathJax.Hub, $advance_view[0]]);
                self.$message && self.$message.hide();
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
                new Symbol('\\frac', '\\frac{n}{m}', 'group0', '\\frac{n}{m}', 'line-height: normal; '),
                new Symbol('\\sqrt', '\\sqrt{x}', 'group0', '\\sqrt{x}', 'line-height: normal; padding-top: 5px;'),
                new Symbol('\\nthroot', '\\sqrt[n]{x}', 'group0', '\\sqrt[n]{x}', 'line-height: normal; text-align: left'),
                // new Symbol('+', '\\langle \\rangle', 'group0', '<span style="line-height: 1.5em"><span class="block"><span class="paren">⟨</span><span class="block"></span><span class="paren">⟩</span></span></span>'),
                new Symbol('\\binomial', '\\binom{n}{m}', 'group0', '\\binom{n}{m}', 'line-height: normal; text-align: left'),
                // new Symbol('+', '\\begin{matrix} 1 \\\ 2 \\\ 3 \\end{matrix}', 'group0', '<span style="line-height: 1.5em"><span>+</span></span>'),
                new Symbol('\\f', 'f', 'group0', 'f'),
                new Symbol('\\prime', '\\prime', 'group0', '\\prime'),

                new Symbol('+', '+', 'group1', '+'),
                new Symbol('-', '-', 'group1', '-'),
                new Symbol('\\pm', '\\pm', 'group1', '\\pm'),
                new Symbol('\\mp', '\\mp', 'group1', '\\mp'),
                new Symbol('\\cdot', '\\cdot', 'group1', '\\cdot'),
                new Symbol('=', '=', 'group1', '='),
                new Symbol('\\times', '\\times', 'group1', '\\times'),
                new Symbol('\\div', '\\div', 'group1', '\\div'),
                new Symbol('\\ast', '\\ast', 'group1', '\\ast'),

                new Symbol('\\therefore', '\\therefore', 'group4', '\\therefore'),
                new Symbol('\\because', '\\because', 'group4', '\\because'),

                new Symbol('\\sum', '\\sum{n}', 'group2', '\\sum'),
                new Symbol('\\prod', '\\prod{n}', 'group2', '\\prod'),
                new Symbol('\\coprod', '\\coprod{n}', 'group2', '\\coprod'),
                new Symbol('\\int', '\\int{x}', 'group2', '\\int'),

                new Symbol('\\N', '\\mathbb{N}', 'group3', '\\N'),
                new Symbol('\\P', '\\mathbb{P}', 'group3', '\\P'),
                new Symbol('\\Q', '\\mathbb{Q}', 'group3', '\\Q'),
                new Symbol('\\R', '\\mathbb{R}', 'group3', '\\R'),
                new Symbol('\\C', '\\mathbb{C}', 'group3', '\\C'),
                new Symbol('\\H', '\\mathbb{H}', 'group3', '\\H')
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

                new Symbol('\\Gamma', '\\Gamma', 'group5', '\\Gamma'),
                new Symbol('\\Delta', '\\Delta', 'group5', '\\Delta'),
                new Symbol('\\Theta', '\\Theta', 'group5', '\\Theta'),
                new Symbol('\\Lambda', '\\Lambda', 'group5', '\\Lambda'),
                new Symbol('\\Xi', '\\Xi', 'group5', '\\Xi'),
                new Symbol('\\Pi', '\\Pi', 'group5', '\\Pi'),
                new Symbol('\\Sigma', '\\Sigma', 'group5', '\\Sigma'),
                new Symbol('\\Upsilon', '\\Upsilon', 'group5', '\\Upsilon'),
                new Symbol('\\Phi', '\\Phi', 'group5', '\\Phi'),
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
                new Symbol('\\amalg', '\\amalg', 'group1', '\\amalg')
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
                new Symbol('\\varnothing', '\\varnothing', 'group1', '\\varnothing')
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
                new Symbol('\\Leftrightarrow', '\\Leftrightarrow', 'group1', '\\Leftrightarrow')
            ];

            this.Delimiters = [
                new Symbol('\\lfloor', '\\lfloor', 'group1', '\\lfloor'),
                new Symbol('\\rfloor', '\\rfloor', 'group1', '\\rfloor'),
                new Symbol('\\lceil', '\\lceil', 'group1', '\\lceil'),
                new Symbol('\\rceil', '\\rceil', 'group1', '\\rceil'),
                new Symbol('\\slash', '\/', 'group1', '\\slash'),
                new Symbol('\\lbrace', '\\lbrace', 'group1', '\\lbrace'),
                new Symbol('\\rbrace', '\\rbrace', 'group1', '\\rbrace')
            ];

            this.Misc = [
                new Symbol('\\forall', '\\forall', 'group1', '\\forall'),
                new Symbol('\\ldots', '\\ldots', 'group1', '\\ldots'),
                new Symbol('\\cdots', '\\cdots', 'group1', '\\cdots'),
                new Symbol('\\vdots', '\\vdots', 'group1', '\\vdots'),
                // new Symbol('\\ddots', '\\unicode{8944}', 'group1', '\\ddots'),      //???
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
                new Symbol('\\circ', '\\circ', 'group1', '\\circ'),
                new Symbol('\\bullet', '\\bullet', 'group1', '\\bullet'),
                new Symbol('\\setminus', '\\setminus', 'group1', '\\setminus'),
                new Symbol('\\neg', '\\neg', 'group1', '\\neg'),
                new Symbol('\\dots', '\\dots', 'group1', '\\dots'),
                new Symbol('\\Re', '\\Re', 'group1', '\\Re'),
                new Symbol('\\Im', '\\Im', 'group1', '\\Im'),
                new Symbol('\\partial', '\\partial', 'group1', '\\partial'),
                new Symbol('\\infty', '\\infty', 'group1', '\\infty'),
                new Symbol('\\aleph', '\\aleph', 'group1', '\\aleph'),
                new Symbol('\\deg', '\\deg', 'group1', '\\deg'),
                new Symbol('\\angle', '\\angle', 'group1', '\\angle')
            ];
            /**
             * render category
             */
            this.init = function ($category) {
                var str = '';

                $.map(category, function (c, index) {
                    index === 0 ?
                        str += '<li class="selected-category" title="' + c.displayTitle + '" data-title="' + c.title + '">' + c.icon + '<span>' + c.displayTitle + '</span></li>' :
                        str += '<li title="' + c.displayTitle + '" data-title="' + c.title + '">' + c.icon + '<span>' + c.displayTitle + '</span></li>'
                });
                $category.html(str);
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
                    $mathSymbol.find('li').each(function () {
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
                    $mathSymbol.find('li').each(function () {
                        MQ.StaticMath(this);
                    });
                });

                symbolCaches.push({
                    ele: ele,
                    title: title,
                    isBasic: isBasic
                });
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
         */
        function Symbol(latex, advance, group, text, style) {
            this.text = text;
            this.latex = latex;
            this.advance = advance;
            this.group = group;
            this.style = style;
            this.createTemplate = function (isBasic) {
                var tit = isBasic ? this.latex : this.advance;
                var result = this.style ?
                    '<li class="' + this.group + '" title="' + tit + '" style="' + this.style + '">' + this.text + '</li>' :
                    '<li class="' + this.group + '" title="' + tit + '">' + this.text + '</li>';
                // var result = '<li class="'+ this.group +'" title="'+ tit +'">' + this.advance + '</li>';
                return result;
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

        var kmathcss = '.math-insert.button,.math-cancel.button{float:right;margin-top:20px;margin-left:15px;box-sizing:border-box}#kmath,[data-role="kmath"]{padding:0 5px 6px;max-width:900px;min-width:720px;font-family:"Times New Roman",serif;border:1px solid #ccc}.math-category{padding:0;margin:0}.math-category>li{display:inline-block;padding:0 15px;line-height:44px;cursor:pointer;box-sizing:border-box}.math-category>li>span{padding-left:6px}.math-category>li.selected-category{border-bottom:2px solid #5FB554}.math-symbol{display:flex;flex-wrap:wrap;align-items:flex-start;align-content:flex-start;height:142px;padding:5px 5px 0;margin:0;border:1px solid #dbdbdb;border-top-color:#5FB554;box-sizing:border-box}.math-symbol>li{padding:0;overflow:hidden;margin-left:-1px;margin-bottom:5px;height:40px;width:40px;line-height:35px;text-align:center;color:#008ee6;border:1px solid #dbdbdb;cursor:pointer;box-sizing:border-box}.advance-editarea{display:block;overflow:auto;width:98%;margin:0 auto;height:120px}.advance-view{overflow:auto;margin:0 auto;height:143px}.advance-editarea::-webkit-scrollbar{-webkit-appearance:none;width:10px;height:10px}.advance-editarea::-webkit-scrollbar-thumb{border-radius:8px;border:2px solid #fff;background-color:rgba(0,0,0,.3)}.advance-view::-webkit-scrollbar{-webkit-appearance:none;width:10px;height:10px}.advance-view::-webkit-scrollbar-thumb{border-radius:8px;border:2px solid #fff;background-color:rgba(0,0,0,.3)}.basic-editarea{clear:both;display:block;width:99%;margin:0 auto;height:267px}.kmath-message{position:absolute;bottom:0.1em;left:0.5em;font-size:0.9em}.blue-link{margin:10px 0;float:right;border:none;background:none;color:#3a9be5;cursor:pointer}.blue-link:hover{text-decoration:underline}.math-symbol .mq-empty{display:none!important}.math-symbol big{font-size:1.3em}';
        //export KMath
        window.KMath = KMath;
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
            TypesetFailed: "Failed to typeset the entered equations. Try again later."
        }
    }
};