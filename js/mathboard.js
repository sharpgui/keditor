

new KMath();

function KMath(){

    this._init=function(){
        $("#kmath").html($('<ul id="math-category"></ul>' + 
            '<ul id="math-symbol">123</ul>' +
            '<div id="math-editor">456</div>'));

        new ControlBox().init();
        new AdvanceView().createView();

    }

    return this._init();

}


function ControlBox(){

    var symbolCaches = [], category ;

    this.isBasic = true;

    category = [
        {title: 'Basic', icon: '+'},
        {title: 'Greek', icon: '**'}
    ];

    this.Basic = [
        {text: 'sub', latex: '\subscript', advance: '_{sub}', group: 'group0'},
        {text: 'sup', latex: '\sum22', advance: '^{sup}', group: 'group0'},
        {text: 'n/m', latex: '\//', advance: '_{sub}', group: 'group0'},
        {text: '+', latex: '\sum', advance: '_{sub}', group: 'group1'},
        {text: '-', latex: '\sum', advance: '_{sub}', group: 'group1'}
    ];

    this.Greek = [
        {text: '-', latex: '\sum', advance: '_{sub}', group: 'group1'},
        {text: '-', latex: '\sum', advance: '_{sub}', group: 'group1'},
        {text: '-', latex: '\sum', advance: '_{sub}', group: 'group1'},
        {text: '^', latex: '\sum', advance: '_{sub}', group: 'group2'},
        {text: '22', latex: '\sum', advance: '_{sub}', group: 'group2'},
        {text: '-', latex: '\sum', advance: '_{sub}', group: 'group3'}
    ];

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

        $("#math-symbol").on('click', 'li', function(e){
            var textarea, start, end, value;
            textarea = $("#math-editor textarea")[0];
            start = textarea.selectionStart;
            end = textarea.selectionEnd;
            value = textarea.value;

            textarea.value = value.substr(0, start) + $(this).attr('title') + value.substr(end, value.length);
        });

    }

    // render symbols
    this.switchSymbols = function(title){

        // Basic in default
        title ? '' : title = category[0].title;

        var ele = '',
            groups = {},    // current symbols group name store
            $symbol = $("#math-symbol"),
            symbolCache;

        // if(symbolCaches[title]){
        //     return $symbol.html(symbolCaches[title]);
        // }

        symbolCache = $.grep(symbolCaches, function(cache){
            if(cache.title == title && cache.isBasic == this.isBasic){
                return cache;
            }
        });

        if(symbolCache.length){
            return $symbol.html(symbolCache);
        }

        $.map(this[title], function(s){
            // ele += '<li class="'+ s.group +'" title="'+ s.latex +'" advance="'+ s.advance +'">' + s.text + '</li>';
            ele += new Symbol(s).createTemplate(this.isBasic);
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
            isBasic: this.isBasic
        }); 
    }

}

function Symbol(s){
    this.text = s.text;
    this.latex = s.latex;
    this.advance = s.advance;
    this.group = s.group;

    this.createTemplate = function(isBasic) {
        var tit = isBasic? this.latext : this.advance;
        var result = '<li class="'+ this.group +'" title="'+ this.latex +'" advance="'+ this.advance +'">' + this.text + '</li>';
        return result;
    }
}
// Symbol.prototype.createTemplate = function(isBasic) {
//       var tit = isBasic? this.latext : this.advance;
//       var result = '<li class="'+ this.group +'" title="'+ this.latex +'" advance="'+ this.advance +'">' + this.text + '</li>';
//       return result;
// }


function AdvanceView(){
    this.createView = function(){
        var str = '<div>'+
            '<button class="blue-link">switch view to basic</button>' + 
            '<textarea id="advance-editarea">\\sum ee6\\sqrt[3][6]</textarea>'+
            '<div id="advance-view"></div>'+
            '</div>';
        $("#math-editor").html(str);

        $("#math-editor").find("button").click(function(){
            new BasicView().createView();
        });

        $("#advance-editarea").bind('change', function(e){
            $("#advance-view").html('$$' + this.value + '$$');
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, $("#advance-view")[0]]);
        });

        $("#advance-editarea").trigger('change');
    }
    
    var typesetView = function(){
        $("#advance-view").html(' $$' + this.value + '$$ ');
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, $("#advance-view")[0]]);
    };

}

function BasicView(){
    this.createView = function(){
        var str = '<div>'+
            '<button class="blue-link">switch view to Advance</button>' + 
            '<textarea id="basic-editarea"></textarea>'+
            '</div>';
        $("#math-editor").html(str);

        $("#math-editor").find("button").click(function(){
            new AdvanceView().createView();
        });
    }

}
