//+++++KMath extend for Kendo Editor
//=================================
(function () {
    'use strict';

    /**
     * @var {Boolean} isBasic 
     * @var {KendoEditor} editor 
     * @var {Boolean} flag 
     * @var {Range} range
     * @var {KMath} kMath  lowercase k uppercase M 
     * @var {JQuery} $kmath_window  window of kendoWindow
     */

   

    var flag = true,
        editor,
        range,
        options = { $message: "#kmath-message", isBasic: false },
        $kmath_window,
        kMath;//lowercase k uppercase M 

    kMath = new KMath(options);//uppercase K uppercase M

    //kendo editor math extend
    kendo.ui.Editor.defaultTools['kmath'] = {
        name: "kmath",
        options: {
            name: "kmath",
            tooltip: "function",
            template: '<a href="" role="button" class="k-tool formulas_btn" unselectable="on" title="Formulas" aria-pressed="false"><span unselectable="on" style="font-family: serif">π</span></a>',
            exec: execFun
        }
    };

    function execFun(e) {
        var equation_dom;
        editor = $(this).data('kendoEditor');
        range = editor.getRange();

        if (flag) {
            addStyleNode(mathjaxcss, editor.document)
            createWindow();
            flag = false;

            // 双击 .MathJax_CHTML 进入公式编辑
            // 通过 .MathJax_CHTML_focused 标记选中的公式
            $(editor.body).on('dblclick', '.MathJax_CHTML', function () {
                kMath.setFormula($(this).attr("data-latex"));
                $kmath_window.data("kendoWindow").center().open();
            });
            $(editor.body).on('click', '.MathJax_CHTML', function (e) {
                $('.MathJax_CHTML', editor.body).removeClass('MathJax_CHTML_focused');
                $(this).addClass('MathJax_CHTML_focused');
                e.stopPropagation();
            });
            $(editor.body).on('click', function () {
                $('.MathJax_CHTML', editor.body).removeClass('MathJax_CHTML_focused');
                e.stopPropagation();
            });

            MathJax.Hub.Config({
                menuSettings: { context: "Browser" }    // hide right-clicking menu
            });
        }

        // equation_dom = $(range.cloneContents()).find(".MathJax_CHTML");
        // if (equation_dom.length) {
        //     kMath.setFormula(equation_dom.attr("data-latex"));
        // } else {
        //     kMath.setFormula(range.toString());
        // }

        // kendoWindow 打开前 检查 .MathJax_CHTML_focused
        equation_dom = $('.MathJax_CHTML_focused', editor.body);
        if (equation_dom.length) {
            kMath.setFormula(equation_dom.attr("data-latex"), true);
        } else {
            kMath.setFormula('', true);
        }
        kMath.options.$message && kMath.options.$message.hide();
        $kmath_window.data("kendoWindow").center().open();
    }

    /**
     * Init KendoWindow
     * @method createWindow
     */
    function createWindow() {
        addStyleNode(kmathcss);
        $(document.body).append('<div id="kmath-wrapper">' +
            '<div id="kmath"></div>' +
            '<div id="kmath-message"></div>' +
            '<button class="math-cancel button">Cancel</button>' +
            '<button class="math-insert button button-theme">Insert</button>' +
            '</div>');
        $kmath_window = $("#kmath-wrapper");
        $kmath_window.kendoWindow({
            width: '875px',
            height: '590px',
            visible: false,
            actions: ['close'],
            title: 'Formulas',
            close: function () { }
        });

        $kmath_window.find('.math-cancel').click(function () {
            $kmath_window.data("kendoWindow").close();
        });
        $kmath_window.find('.math-insert').click(function () {
            range.deleteContents();
            // range.insertNode(kMath.getFormula());
            // editor.paste(kMath.getFormula().outerHTML);
            $(this).attr('disabled', true);
            MathJax.Hub.Queue(function () {
                if (kMath.options.isBasic && kMath.options.mathField) {
                    kMath.setFormula('$$' + kMath.options.mathField.latex() + '$$');
                }
            });
            MathJax.Hub.Queue(function () {
                $('.MathJax_CHTML_focused', editor.body).remove();
                var fragement = editor.document.createDocumentFragment(),
                    result = kMath.getFormula(),
                    id,
                    node;
                if (kMath.options.$message && !result) {
                    kMath.options.$message.text('Typeset failed. Please retry after reload the webpage.');
                    kMath.options.$message.show(100);
                    $kmath_window.find('.math-insert').attr('disabled', false);
                    return;
                }
                id = result.id;
                if (id) {
                    fragement.appendChild(result);
                    range.insertNode(fragement);
                    node = $('#' + id, editor.body)[0];
                    range.setStartAfter(node);
                    range.collapse(true);
                    editor.selectRange(range);
                }
                $kmath_window.find('.math-insert').attr('disabled', false);
                $kmath_window.data("kendoWindow").close();
                editor.focus();
            });
            // editor.focus();
        });

        kMath._init();
        kMath.options.$message = kMath.options.$message;

    }

    /**
     * Add style node to specified document
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



    var kmathcss = '.math-insert.button,.math-cancel.button{float:right;margin-top:20px;margin-left:15px;box-sizing:border-box}#kmath,[data-role="kmath"]{padding:0 5px 6px;max-width:900px;min-width:720px;font-family:"Times New Roman",serif;border:1px solid #ccc}#math-category{padding:0;margin:0}#math-category>li{display:inline-block;padding:0 15px;line-height:44px;cursor:pointer;box-sizing:border-box}#math-category>li>span{padding-left:6px}#math-category>li.selected-category{border-bottom:2px solid #5FB554}#math-symbol{display:flex;flex-wrap:wrap;align-items:flex-start;align-content:flex-start;height:142px;padding:5px 5px 0;margin:0;border:1px solid #dbdbdb;border-top-color:#5FB554;box-sizing:border-box}#math-symbol>li{padding:0;overflow:hidden;margin-left:-1px;margin-bottom:5px;height:40px;width:40px;line-height:35px;text-align:center;color:#008ee6;border:1px solid #dbdbdb;cursor:pointer;box-sizing:border-box}#advance-editarea{display:block;overflow:auto;width:98%;margin:0 auto;height:120px}#advance-view{overflow:auto;margin:0 auto;height:143px}#advance-editarea::-webkit-scrollbar{-webkit-appearance:none;width:10px;height:10px}#advance-editarea::-webkit-scrollbar-thumb{border-radius:8px;border:2px solid #fff;background-color:rgba(0,0,0,.3)}#advance-view::-webkit-scrollbar{-webkit-appearance:none;width:10px;height:10px}#advance-view::-webkit-scrollbar-thumb{border-radius:8px;border:2px solid #fff;background-color:rgba(0,0,0,.3)}#basic-editarea{clear:both;display:block;width:99%;margin:0 auto;height:266px}#kmath-message{float:left;margin-top:20px;padding-left:5px;font-size:0.9em}.blue-link{margin:10px 0;float:right;border:none;background:none;color:#3a9be5;cursor:pointer}.blue-link:hover{text-decoration:underline}#math-symbol .mq-empty{display:none!important}#math-symbol big{font-size:1.3em}';
    var mathjaxcss = ".mjx-chtml{display:inline-block;line-height:0;text-indent:0;text-align:left;text-transform:none;font-style:normal;font-weight:normal;font-size:100%;font-size-adjust:none;letter-spacing:normal;word-wrap:normal;word-spacing:normal;white-space:nowrap;float:none;direction:ltr;max-width:none;max-height:none;min-width:0;min-height:0;border:0;margin:0;padding:1px 0}.MJXc-display{display:block;text-align:center;margin:1em 0;padding:0}.mjx-chtml[tabindex]:focus,body :focus .mjx-chtml[tabindex]{display:inline-table}.mjx-full-width{text-align:center;display:table-cell!important;width:10000em}.mjx-math{display:inline-block;border-collapse:separate;border-spacing:0}.mjx-math *{display:inline-block;-webkit-box-sizing:content-box!important;-moz-box-sizing:content-box!important;box-sizing:content-box!important;text-align:left}.mjx-numerator{display:block;text-align:center}.mjx-denominator{display:block;text-align:center}.MJXc-stacked{height:0;position:relative}.MJXc-stacked>*{position:absolute}.MJXc-bevelled>*{display:inline-block}" +
        ".mjx-stack{display:inline-block}.mjx-op{display:block}.mjx-under{display:table-cell}.mjx-over{display:block}.mjx-over>*{padding-left:0!important;padding-right:0!important}.mjx-under>*{padding-left:0!important;padding-right:0!important}.mjx-stack>.mjx-sup{display:block}.mjx-stack>.mjx-sub{display:block}.mjx-prestack>.mjx-presup{display:block}.mjx-prestack>.mjx-presub{display:block}.mjx-delim-h>.mjx-char{display:inline-block}.mjx-surd{vertical-align:top}.mjx-mphantom *{visibility:hidden}.mjx-merror{background-color:#ff8;color:#c00;border:1px solid #c00;padding:2px 3px;font-style:normal;font-size:90%}.mjx-annotation-xml{line-height:normal}.mjx-menclose>svg{fill:none;stroke:currentColor}.mjx-mtr{display:table-row}.mjx-mlabeledtr{display:table-row}.mjx-mtd{display:table-cell;text-align:center}.mjx-label{display:table-row}.mjx-box{display:inline-block}.mjx-block{display:block}.mjx-span{display:inline}.mjx-char{display:block;white-space:pre}.mjx-itable{display:inline-table;width:auto}.mjx-row{display:table-row}" +
        ".mjx-cell{display:table-cell}.mjx-table{display:table;width:100%}.mjx-line{display:block;height:0}.mjx-strut{width:0;padding-top:1em}.mjx-vsize{width:0}.MJXc-space1{margin-left:.167em}.MJXc-space2{margin-left:.222em}.MJXc-space3{margin-left:.278em}.mjx-chartest{display:block;visibility:hidden;position:absolute;top:0;line-height:normal;font-size:500%}.mjx-chartest .mjx-char{display:inline}.mjx-chartest .mjx-box{padding-top:1000px}.MJXc-processing{visibility:hidden;position:fixed;width:0;height:0;overflow:hidden}.MJXc-processed{display:none}.mjx-test{display:block;font-style:normal;font-weight:normal;font-size:100%;font-size-adjust:none;text-indent:0;text-transform:none;letter-spacing:normal;word-spacing:normal;overflow:hidden;height:1px}.mjx-ex-box-test{position:absolute;width:1px;height:60ex}.mjx-line-box-test{display:table!important}.mjx-line-box-test span{display:table-cell!important;width:10000em!important;min-width:0;max-width:none;padding:0;border:0;margin:0}#MathJax_CHTML_Tooltip{background-color:InfoBackground;color:InfoText;border:1px solid black;box-shadow:2px 2px 5px #aaa;-webkit-box-shadow:2px 2px 5px #aaa;-moz-box-shadow:2px 2px 5px #aaa;-khtml-box-shadow:2px 2px 5px #aaa;padding:3px 4px;z-index:401;position:absolute;left:0;top:0;width:auto;height:auto;display:none}" +
        ".mjx-chtml .mjx-noError{line-height:1.2;vertical-align:;font-size:90%;text-align:left;color:black;padding:1px 3px;border:1px solid}.MJXc-TeX-unknown-R{font-family:STIXGeneral,'Cambria Math','Arial Unicode MS',serif;font-style:normal;font-weight:normal}.MJXc-TeX-unknown-I{font-family:STIXGeneral,'Cambria Math','Arial Unicode MS',serif;font-style:italic;font-weight:normal}.MJXc-TeX-unknown-B{font-family:STIXGeneral,'Cambria Math','Arial Unicode MS',serif;font-style:normal;font-weight:bold}.MJXc-TeX-unknown-BI{font-family:STIXGeneral,'Cambria Math','Arial Unicode MS',serif;font-style:italic;font-weight:bold}.MJXc-TeX-ams-R{font-family:MJXc-TeX-ams-R,MJXc-TeX-ams-Rw}.MJXc-TeX-cal-B{font-family:MJXc-TeX-cal-B,MJXc-TeX-cal-Bx,MJXc-TeX-cal-Bw}.MJXc-TeX-frak-R{font-family:MJXc-TeX-frak-R,MJXc-TeX-frak-Rw}.MJXc-TeX-frak-B{font-family:MJXc-TeX-frak-B,MJXc-TeX-frak-Bx,MJXc-TeX-frak-Bw}" +
        ".MJXc-TeX-math-BI{font-family:MJXc-TeX-math-BI,MJXc-TeX-math-BIx,MJXc-TeX-math-BIw}.MJXc-TeX-sans-R{font-family:MJXc-TeX-sans-R,MJXc-TeX-sans-Rw}.MJXc-TeX-sans-B{font-family:MJXc-TeX-sans-B,MJXc-TeX-sans-Bx,MJXc-TeX-sans-Bw}.MJXc-TeX-sans-I{font-family:MJXc-TeX-sans-I,MJXc-TeX-sans-Ix,MJXc-TeX-sans-Iw}.MJXc-TeX-script-R{font-family:MJXc-TeX-script-R,MJXc-TeX-script-Rw}.MJXc-TeX-type-R{font-family:MJXc-TeX-type-R,MJXc-TeX-type-Rw}.MJXc-TeX-cal-R{font-family:MJXc-TeX-cal-R,MJXc-TeX-cal-Rw}.MJXc-TeX-main-B{font-family:MJXc-TeX-main-B,MJXc-TeX-main-Bx,MJXc-TeX-main-Bw}.MJXc-TeX-main-I{font-family:MJXc-TeX-main-I,MJXc-TeX-main-Ix,MJXc-TeX-main-Iw}.MJXc-TeX-main-R{font-family:MJXc-TeX-main-R,MJXc-TeX-main-Rw}.MJXc-TeX-math-I{font-family:MJXc-TeX-math-I,MJXc-TeX-math-Ix,MJXc-TeX-math-Iw}.MJXc-TeX-size1-R{font-family:MJXc-TeX-size1-R,MJXc-TeX-size1-Rw}.MJXc-TeX-size2-R{font-family:MJXc-TeX-size2-R,MJXc-TeX-size2-Rw}.MJXc-TeX-size3-R{font-family:MJXc-TeX-size3-R,MJXc-TeX-size3-Rw}.MJXc-TeX-size4-R{font-family:MJXc-TeX-size4-R,MJXc-TeX-size4-Rw}" +
        "@font-face{font-family:MJXc-TeX-ams-R;src:local('MathJax_AMS'),local('MathJax_AMS-Regular')}@font-face{font-family:MJXc-TeX-ams-Rw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_AMS-Regular.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_AMS-Regular.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_AMS-Regular.otf') format('opentype')}@font-face{font-family:MJXc-TeX-cal-B;src:local('MathJax_Caligraphic Bold'),local('MathJax_Caligraphic-Bold')}@font-face{font-family:MJXc-TeX-cal-Bx;src:local('MathJax_Caligraphic');font-weight:bold}@font-face{font-family:MJXc-TeX-cal-Bw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Caligraphic-Bold.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Caligraphic-Bold.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Caligraphic-Bold.otf') format('opentype')}@font-face{font-family:MJXc-TeX-frak-R;src:local('MathJax_Fraktur'),local('MathJax_Fraktur-Regular')}" +
        "@font-face{font-family:MJXc-TeX-frak-Rw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Fraktur-Regular.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Fraktur-Regular.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Fraktur-Regular.otf') format('opentype')}@font-face{font-family:MJXc-TeX-frak-B;src:local('MathJax_Fraktur Bold'),local('MathJax_Fraktur-Bold')}@font-face{font-family:MJXc-TeX-frak-Bx;src:local('MathJax_Fraktur');font-weight:bold}@font-face{font-family:MJXc-TeX-frak-Bw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Fraktur-Bold.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Fraktur-Bold.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Fraktur-Bold.otf') format('opentype')}@font-face{font-family:MJXc-TeX-math-BI;src:local('MathJax_Math BoldItalic'),local('MathJax_Math-BoldItalic')}@font-face{font-family:MJXc-TeX-math-BIx;src:local('MathJax_Math');font-weight:bold;font-style:italic}" +
        "@font-face{font-family:MJXc-TeX-math-BIw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Math-BoldItalic.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Math-BoldItalic.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Math-BoldItalic.otf') format('opentype')}@font-face{font-family:MJXc-TeX-sans-R;src:local('MathJax_SansSerif'),local('MathJax_SansSerif-Regular')}@font-face{font-family:MJXc-TeX-sans-Rw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_SansSerif-Regular.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_SansSerif-Regular.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_SansSerif-Regular.otf') format('opentype')}@font-face{font-family:MJXc-TeX-sans-B;src:local('MathJax_SansSerif Bold'),local('MathJax_SansSerif-Bold')}@font-face{font-family:MJXc-TeX-sans-Bx;src:local('MathJax_SansSerif');font-weight:bold}@font-face{font-family:MJXc-TeX-sans-Bw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_SansSerif-Bold.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_SansSerif-Bold.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_SansSerif-Bold.otf') format('opentype')}" +
        "@font-face{font-family:MJXc-TeX-sans-I;src:local('MathJax_SansSerif Italic'),local('MathJax_SansSerif-Italic')}@font-face{font-family:MJXc-TeX-sans-Ix;src:local('MathJax_SansSerif');font-style:italic}@font-face{font-family:MJXc-TeX-sans-Iw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_SansSerif-Italic.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_SansSerif-Italic.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_SansSerif-Italic.otf') format('opentype')}@font-face{font-family:MJXc-TeX-script-R;src:local('MathJax_Script'),local('MathJax_Script-Regular')}@font-face{font-family:MJXc-TeX-script-Rw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Script-Regular.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Script-Regular.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Script-Regular.otf') format('opentype')}@font-face{font-family:MJXc-TeX-type-R;src:local('MathJax_Typewriter'),local('MathJax_Typewriter-Regular')}" +
        "@font-face{font-family:MJXc-TeX-type-Rw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Typewriter-Regular.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Typewriter-Regular.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Typewriter-Regular.otf') format('opentype')}@font-face{font-family:MJXc-TeX-cal-R;src:local('MathJax_Caligraphic'),local('MathJax_Caligraphic-Regular')}@font-face{font-family:MJXc-TeX-cal-Rw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Caligraphic-Regular.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Caligraphic-Regular.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Caligraphic-Regular.otf') format('opentype')}@font-face{font-family:MJXc-TeX-main-B;src:local('MathJax_Main Bold'),local('MathJax_Main-Bold')}@font-face{font-family:MJXc-TeX-main-Bx;src:local('MathJax_Main');font-weight:bold}@font-face{font-family:MJXc-TeX-main-Bw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Main-Bold.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Main-Bold.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Main-Bold.otf') format('opentype')}" +
        "@font-face{font-family:MJXc-TeX-main-I;src:local('MathJax_Main Italic'),local('MathJax_Main-Italic')}@font-face{font-family:MJXc-TeX-main-Ix;src:local('MathJax_Main');font-style:italic}@font-face{font-family:MJXc-TeX-main-Iw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Main-Italic.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Main-Italic.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Main-Italic.otf') format('opentype')}@font-face{font-family:MJXc-TeX-main-R;src:local('MathJax_Main'),local('MathJax_Main-Regular')}@font-face{font-family:MJXc-TeX-main-Rw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Main-Regular.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Main-Regular.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Main-Regular.otf') format('opentype')}@font-face{font-family:MJXc-TeX-math-I;src:local('MathJax_Math Italic'),local('MathJax_Math-Italic')}" +
        "@font-face{font-family:MJXc-TeX-math-Ix;src:local('MathJax_Math');font-style:italic}@font-face{font-family:MJXc-TeX-math-Iw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Math-Italic.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Math-Italic.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Math-Italic.otf') format('opentype')}@font-face{font-family:MJXc-TeX-size1-R;src:local('MathJax_Size1'),local('MathJax_Size1-Regular')}@font-face{font-family:MJXc-TeX-size1-Rw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Size1-Regular.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Size1-Regular.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Size1-Regular.otf') format('opentype')}@font-face{font-family:MJXc-TeX-size2-R;src:local('MathJax_Size2'),local('MathJax_Size2-Regular')}@font-face{font-family:MJXc-TeX-size2-Rw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Size2-Regular.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Size2-Regular.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Size2-Regular.otf') format('opentype')}" +
        "@font-face{font-family:MJXc-TeX-size3-R;src:local('MathJax_Size3'),local('MathJax_Size3-Regular')}@font-face{font-family:MJXc-TeX-size3-Rw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Size3-Regular.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Size3-Regular.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Size3-Regular.otf') format('opentype')}@font-face{font-family:MJXc-TeX-size4-R;src:local('MathJax_Size4'),local('MathJax_Size4-Regular')}@font-face{font-family:MJXc-TeX-size4-Rw;src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/eot/MathJax_Size4-Regular.eot');src:url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/woff/MathJax_Size4-Regular.woff') format('woff'),url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/fonts/HTML-CSS/TeX/otf/MathJax_Size4-Regular.otf') format('opentype')}";

})();

