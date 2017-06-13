(function(){

    var isBasic = false,
        MQ = MathQuill.getInterface(2);

    function KMath(){
        var $advance_editarea, $advance_view, $basic_editarea, $tobasic_btn, $toadvance_btn, 
            controlBox = new ControlBox(),
            mathField;
        this._init = function(){
            $("#kmath").html($('<ul id="math-category"></ul>' + 
                '<ul id="math-symbol">123</ul>' +
                '<div id="math-editor">456</div>'));

            controlBox.init();
            initialView();

            $advance_editarea = $("#advance-editarea");
            $advance_view = $("#advance-view");
            $basic_editarea = $("#basic-editarea");
            $tobasic_btn = $("#tobasic");
            $toadvance_btn = $("#toadvance");

            // Switch basic \ advance view 
            $("#kmath").on("click", '#tobasic', function(){
                $basic_editarea.show(0);
                $toadvance_btn.show(0);

                $advance_editarea.hide(0);
                $advance_view.hide(0);
                $tobasic_btn.hide(0);

                isBasic = true;
                controlBox.switchSymbols($('.selected-category').text().trim());
            });
            $("#kmath").on("click", '#toadvance', function(){
                $basic_editarea.hide(0);
                $toadvance_btn.hide(0);

                $advance_editarea.show(0);
                $advance_view.show(0);
                $tobasic_btn.show(0);

                typesetView();

                isBasic = false;
                controlBox.switchSymbols($('.selected-category').text().trim());              
            });
            // set default view
            $("#toadvance").trigger("click");

            // Advance view listener
            $advance_editarea.on({'keyup': typesetView, 'change': typesetView});
            function typesetView(){
                $advance_view.html(checkBreaks($advance_editarea.val()));
                // $advance_view.html('$$' + $advance_editarea.val() + '$$');
                MathJax.Hub.Queue(["Typeset", MathJax.Hub, $advance_view[0]]);
            }

            // Basic view
            mathField = MQ.MathField($basic_editarea[0], {
                spaceBehavesLikeTab: false, 
                handlers:{
                    edit: function(){
                        console.log(mathField.latex());
                    }
                }
            });

            $("#math-symbol").on('click', 'li', function(e){

                if(isBasic){
                    mathField.cmd(this.title);
                }else{
                    var textarea, start, end, value;
                 // textarea = isBasic? $("#basic-editarea")[0] : $("#advance-editarea")[0];
                    textarea = $("#advance-editarea")[0];
                    value = textarea.value;
                    start = textarea.selectionStart;
                    end = textarea.selectionEnd;

                    textarea.value = value.substr(0, start) + ' ' + this.title + ' ' + value.substr(end, value.length);
                    $(textarea).trigger("change");
                    textarea.focus();
                }
                
            });

        }

        return this._init();
    }

    function checkBreaks (text){
        var arr = text.split('\n');
        var result = '';
        $.each(arr, function(index, row){
            if(row.trim().length > 0){
                result += '$$' + row + '$$';
            }
        });
        return result;
    }

    function initialView(){
        var $view = $('<div>'+
            '<button class="blue-link" id="tobasic">switch view to basic</button>' + 
            '<button class="blue-link" id="toadvance">switch view to Advance</button>' + 
            '<textarea id="advance-editarea">S_N = \\displaystyle\\sqrt{ \\frac{1}{N} \\sum\^N_{i=1}{(x_i - \\bar{x})\^2} }</textarea>'+
            '<div id="advance-view"></div>'+
            // '<textarea id="basic-editarea"></textarea>'+
            '<span id="basic-editarea"></span>'+
            '</div>');

        $("#math-editor").html($view);
        
    }

    function ControlBox(){

        var symbolCaches = [], category ;

        // this.isBasic = false;

        category = [
            {title: 'Basic', icon: '+'},
            {title: 'Greek', icon: '**'},
            {title: 'Operators', icon: '**'},
            {title: 'Relationships', icon: '<'},
            {title: 'Arrows', icon: '?'},
            {title: 'Delimiters', icon: '{'},
            {title: 'Misc', icon: '&'}
        ];

        this.Basic = [
            new Symbol('\\subscript', '_{sub}', 'group0', '_{sub}'),
            new Symbol('\\supscript', '\^{sup}', 'group0', '\^{sup}'),
            new Symbol('\\frac', '\\frac{n}{m}', 'group0', '\\frac{n}{m}'),
            new Symbol('\\sqrt', '\\sqrt{x}', 'group0', '\\sqrt{x}'),
            new Symbol('\\nthroot', '\\sqrt[n]{x}', 'group0', '\\sqrt[n]{x}'),
            // new Symbol('+', '\\langle \\rangle', 'group0', '<span style="line-height: 1.5em"><span class="block"><span class="paren">⟨</span><span class="block"></span><span class="paren">⟩</span></span></span>'),
            new Symbol('\\binomial', '\\binom{n}{m}', 'group0', '\\binom{n}{m}'),
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
            new Symbol('\\not\in', '\\not\in', 'group1', '\\not\in'),
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
            new Symbol('\\not\subset', '\\not\\subset', 'group1', '\\not\subset'),
            new Symbol('\\not\supset', '\\not\\supset', 'group1', '\\not\supset'),
            new Symbol('\\subseteq', '\\subseteq', 'group1', '\\subseteq'),
            new Symbol('\\supseteq', '\\supseteq', 'group1', '\\supseteq'),
            new Symbol('\\not\subseteq', '\\not\\subseteq', 'group1', '\\not\subseteq'),
            new Symbol('\\not\supseteq', '\\not\\supseteq', 'group1', '\\not\supseteq'),
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
            new Symbol('\\slash', '\\slash', 'group1', '\\slash'),
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
            new Symbol('\\caret', '\\caret', 'group1', '\\caret'),
            new Symbol('\\backslash', '\\backslash', 'group1', '\\backslash'),
            new Symbol('\\vert', '\\vert', 'group1', '\\vert'),
            new Symbol('\\perp', '\\perp', 'group1', '\\perp'),
            new Symbol('\\nabla', '\\nabla', 'group1', '\\nabla'),
            new Symbol('\\hbar', '\\hbar', 'group1', '\\hbar'),
            new Symbol('\\AA', '\\AA', 'group1', '\\AA'),
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
        // this.setIsBasic = function(isBasic){
        //     this.isBasic = isBasic;
        //     this.switchSymbols($('.selected-category').text().trim());   // current title
        // }

        // render category
        this.init = function(){
            var str = '',
                $category = $('#math-category');
                self = this;
                
            $.map(category, function(c, index){
                index === 0 ? str += '<li class="selected-category" >' + c.title + '</li>' : 
                    str += '<li>' + c.title + '</li>'
            });
            $category.html(str);

            $category.find('li').click(function(e){
                if($(this).hasClass('selected-category')){
                    return;
                }
                $(this).siblings('li').removeClass('selected-category').end().addClass('selected-category');
                self.switchSymbols($(this).text().trim());
            });

            this.switchSymbols();
        }

        // render symbols
        this.switchSymbols = function(title){
            // 'Basic' in default
            title ? '' : title = category[0].title;

            var ele = '',
                groups = {},    // current symbols group name store
                $symbol = $("#math-symbol"),
                symbolCache;

            // if(symbolCaches[title]){
            //     return $symbol.html(symbolCaches[title]);
            // }
            symbolCache = $.grep(symbolCaches, function(cache){
                if(cache.title == title && cache.isBasic == isBasic){
                    return cache;
                }
            });
            if(symbolCache.length){
                $symbol.html(symbolCache[0].ele);
                $symbol.find('li').each(function(){
                    MQ.StaticMath(this);
                });

                return;               
            }

            $.map(this[title], function(s){
                // ele += '<li class="'+ s.group +'" title="'+ s.latex +'" advance="'+ s.advance +'">' + s.text + '</li>';
                ele += s.createTemplate();
                groups[s.group] = 1;
            });
            ele = $(ele);
            // set styles for the last one in each group 
            for(key in groups){
                ele.filter('.' + key).last().css('margin-right', '20px');
            }
            $symbol.html(ele);

            $symbol.find('li').each(function(){
                MQ.StaticMath(this);
            });

            symbolCaches.push({
                ele: ele,
                title: title,
                isBasic: isBasic
            }); 
        }

    }

    function Symbol(latex, advance, group, text){
        this.text = text;
        this.latex = latex;
        this.advance = advance;
        this.group = group;

        this.createTemplate = function() {
            var tit = isBasic? this.latex : this.advance;
            var result = '<li class="'+ this.group +'" title="'+ tit +'">' + this.text + '</li>';
            // var result = '<li class="'+ this.group +'" title="'+ tit +'">' + this.advance + '</li>';
            return result;
        }
    }

    new KMath();
    // Symbol.prototype.createTemplate = function(isBasic) {
    //       var tit = isBasic? this.latex : this.advance;
    //       var result = '<li class="'+ this.group +'" title="'+ this.latex +'" advance="'+ this.advance +'">' + this.text + '</li>';
    //       return result;
    // }



})();