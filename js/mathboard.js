(function(){

    var isBasic = false;

    function KMath(){
        var $advance_editarea, $advance_view, $basic_editarea, $tobasic_btn, $toadvance_btn, 
            controlBox = new ControlBox();
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

            $("#toadvance").trigger("click");

            $advance_editarea.on({'keyup': typesetView, 'change': typesetView});
            function typesetView(){
                $advance_view.html(checkBreaks($advance_editarea.val()));
                // $advance_view.html('$$' + $advance_editarea.val() + '$$');
                MathJax.Hub.Queue(["Typeset", MathJax.Hub, $advance_view[0]]);
            }

            $("#math-symbol").on('click', 'li', function(e){
                var textarea, start, end, value;
                textarea = isBasic? $("#basic-editarea")[0] : $("#advance-editarea")[0];
                start = textarea.selectionStart;
                end = textarea.selectionEnd;
                value = textarea.value;

                textarea.value = value.substr(0, start) + $(this).attr('title') + value.substr(end, value.length);

                $(textarea).trigger("change");
                textarea.focus();
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
            '<textarea id="basic-editarea"></textarea>'+
            '</div>');

        $("#math-editor").html($view);
        
    }

    function ControlBox(){

        var symbolCaches = [], category ;

        // this.isBasic = false;

        category = [
            {title: 'Basic', icon: '+'},
            {title: 'Greek', icon: '**'}
        ];

        this.Basic = [
            new Symbol('\\subscript', '_{sub}', 'group0', '<sub style="font-size: 0.6em; line-height: 3.5;">sub</sub>'),
            new Symbol('\\supscript', '\^{sup}', 'group0', '<sup style="font-size: 0.6em">sup</sup>'),
            new Symbol('\\sqrt', '\\sqrt{x}', 'group2', '<span class="block"><span class="sqrt-prefix">√</span><span class="sqrt-stem">&nbsp;</span></span>'),
            new Symbol('\\nthroot', '\\sqrt[n]{x}', 'group2', '<span style="font-size: 0.7em"><sup class="nthroot"><var>n</var></sup><span class="block"><span class="sqrt-prefix">√</span><span class="sqrt-stem">&nbsp;</span></span></span>'),
            new Symbol('+', '+', 'group1', '<span style="line-height: 1.5em"><span>+</span></span>'),
            new Symbol('-', '-', 'group1', '<span style="line-height: 1.5em"><span>−</span></span>'),
            new Symbol('\\pm', '\\pm', 'group1', '<span style="line-height: 1.5em"><span>±</span></span>'),
            new Symbol('\\mp', '\\mp', 'group1', '<span style="line-height: 1.5em"><span>∓</span></span>'),
            new Symbol('=', '=', 'group1', '<span style="line-height: 1.5em"><span class="binary-operator">=</span></span>'),
        ];

        this.Greek = [
            new Symbol('\\sum', '\\sum{n}', 'group3', '<span style="line-height: 1.5em"><big>∑</big></span>'),
            new Symbol('\\int', '\\int{x}', 'group3', '<span style="line-height: 1.5em"><big>∫</big></span>'),
            new Symbol('\\N', '\\mathbb{N}', 'group0', '<span style="line-height: 1.5em"><span>ℕ</span></span>'),
            new Symbol('\\P', '\\mathbb{P}', 'group0', '<span style="line-height: 1.5em"><span>ℙ</span></span>'),
            new Symbol('\\Q', '\\mathbb{Q}', 'group0', '<span style="line-height: 1.5em"><span>ℚ</span></span>'),

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
                return $symbol.html(symbolCache[0].ele);
            }

            $.map(this[title], function(s){
                // ele += '<li class="'+ s.group +'" title="'+ s.latex +'" advance="'+ s.advance +'">' + s.text + '</li>';
                ele += s.createTemplate();
                groups[s.group] = 1;
            });

            ele = $(ele);

            // set styles for the last one in each group 
            for(key in groups){
                ele.filter('.' + key).last().css('margin-right', '5px');
            }

            $symbol.html(ele);

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