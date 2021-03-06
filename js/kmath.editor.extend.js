    //+++++KMath extend for Kendo Editor
    //=================================
    (function () {
        'use strict';

        /**
         * @var {KendoEditor} editor 
         * @var {Boolean} flag 
         * @var {Range} range
         * @var {KMath} mathEditor   
         * @var {JQuery} $kmath_window  window of kendoWindow
         */

        var flag = true,
            editor,
            range,
            $kmath_window,
            mathEditor = new KMath();//uppercase K uppercase M

        //kendo editor math extend
        kendo.ui.Editor.defaultTools['kmath'] = {
            name: "kmath",
            options: {
                name: "kmath",
                tooltip: "function",
                template: '<a href="" role="button" class="k-tool formulas_btn underline-none" unselectable="on" title="' + $$.GCI18N.kMath.Formulas + '" aria-pressed="false"><span unselectable="on" style="font-size: 22px; font-family: serif">π</span></a>',
                exec: execFun
            }
        };
        /**
         * 点击 PI(mathEditor toolbar) 时执行的逻辑
         * @desc 弹出mathEditor 窗口，并且当前有formula 选中的话，回显并且重新编辑
         * @param {*} e 
         */
        function execFun(e) {
            var equation_dom;
            editor = $(this).data('kendoEditor');
            range = editor.getRange();

            editor.flag = !!editor.flag;    // editor.flag 默认为 undefined，即赋值为false。editor.flag 为 true 时，值不变。

            if (flag) {
                createWindow();
                flag = false;
            }
            if (!editor.flag) {
                // KMath.addStyleNode(KMath.mathjaxcss, editor.document)

                editor.flag = true;

                // remove event handler before register new one 
                $(editor.body).off('dblclick', '.MathJax_CHTML');
                $(editor.body).off('focus', '.MathJax_CHTML');
                $(editor.body).off('blur', '.MathJax_CHTML');

                // 双击 .MathJax_CHTML 进入公式编辑
                // 通过 .MathJax_CHTML_focused 标记选中的公式
                // e.data.currentEditor 为双击事件中更新全局变量 editor
                $(editor.body).on('dblclick', '.MathJax_CHTML', { currentEditor: editor }, function (e) {
                    mathEditor.toggleView(false);
                    mathEditor.setFormula($(this).attr("data-latex"));
                    mathEditor.setFormulaFontSize(this.style.fontSize);     // 设置font size为当前公式的大小
                    editor = e.data.currentEditor;
                    // 设置range
                    range.setStartBefore(this);
                    range.setEndAfter(this);
                    // range.selectNode(n);
                    $kmath_window.data("kendoWindow").center().open();
                });
                $(editor.body).on('focus', '.MathJax_CHTML', { currentEditor: editor }, function (e) {
                    editor = e.data.currentEditor;
                    $(this).addClass('MathJax_CHTML_focused');
                });
                $(editor.body).on('blur', '.MathJax_CHTML', function (e) {
                    $(this).removeClass('MathJax_CHTML_focused');
                });
            }

            // kendoWindow 打开前 检查 .MathJax_CHTML_focused
            equation_dom = $('.MathJax_CHTML_focused', editor.body);
            mathEditor.toggleView(false);
            if (equation_dom.length) {
                mathEditor.setFormula(equation_dom.attr("data-latex"));
                document.body.kmath_equation = equation_dom[0];         // 若带有focus标记，将equation缓存在body元素上。
                mathEditor.setFormulaFontSize(equation_dom[0].style.fontSize);  // 设置font size为当前公式的大小
            } else {
                mathEditor.setFormula('');
                mathEditor.setFormulaFontSize();        // 非edit情况，则设置font size为默认值
            }
            mathEditor.$message && mathEditor.$message.hide();
            $kmath_window.data("kendoWindow").center().open();
        }

        /**
         * Init KendoWindow
         * @method createWindow
         */
        function createWindow() {

            $(document.body).append('<div id="kmath-wrapper-' + mathEditor.uuid + '">' +
                '<div id="' + mathEditor.options.element.slice(1) + '"></div>' +
                // '<div class="' + mathEditor.options.message.slice(1) + '"></div>' +
                '<button class="math-cancel button">Cancel</button>' +
                '<button class="math-insert button button-theme">Insert</button>' +
                '</div>');
            $kmath_window = $("#kmath-wrapper-" + mathEditor.uuid);
            $kmath_window.kendoWindow({
                width: 885,
                height: 635,
                visible: false,
                actions: ['close'],
                title: $$.GCI18N.kMath.Formulas,
                close: function () { },
                draggable: false,
                modal: true
            });

            $kmath_window.find('.math-cancel').click(function () {
                $kmath_window.data("kendoWindow").close();
            });
            
            // Disabled insert btn --> set formula to advance view --> check equation --> remove old one from editor --> insert --> set cursor position
            $kmath_window.find('.math-insert').click(function () {
                $(this).attr('disabled', true);
                if (mathEditor.isBasic && mathEditor.mathField) {
                    mathEditor.setFormula('$$' + mathEditor.mathField.latex() + '$$', true);
                }
                // IE：此时editor已经失去焦点，所以不能得到range。
                // var range = editor.getRange();
                // range.deleteContents();
                // range.insertNode(mathEditor.getFormula());
                // editor.paste(mathEditor.getFormula().outerHTML);
                
                MathJax.Hub.Queue(function () {
                    if(mathEditor.checkEquation()){
                        $kmath_window.find('.math-insert').attr('disabled', false);
                        return;
                    }
                    // 取出focus的数学表达式。使用后remove
                    if (document.body.kmath_equation) {
                        range.setStartBefore(document.body.kmath_equation);
                        range.setEndAfter(document.body.kmath_equation);
                        document.body.kmath_equation = undefined;
                    }
                    var ele = range.extractContents();
                    var needSpace = true;
                    if (ele.childElementCount) {
                        needSpace = !$(ele.firstElementChild).hasClass('MathJax_CHTML')
                    }
                    var fragement = editor.document.createDocumentFragment(),
                        result = mathEditor.getFormula(),
                        id,
                        node;
                    if (mathEditor.$message && !result) {
                        mathEditor.$message.text($$.GCI18N.kMath.TypesetFailed);
                        mathEditor.$message.show(100);
                        $kmath_window.find('.math-insert').attr('disabled', false);
                        return;
                    }
                    id = result.id;
                    if (id) {
                        // span contentEditable="false" 去掉IE浏览器中显示在公式周围的虚线框。
                        // 添加一个空格，在公式之前。则能将光标放置在公式之前。
                        needSpace ? result = $('<span></span>').append('<span>&nbsp;</span>').append($('<span contentEditable="false"></span>').append(result)).append('<span>&nbsp;</span>')[0] : '';
                        fragement.appendChild(result);
                        range.insertNode(fragement);
                        node = needSpace ? $('#' + id, editor.body).parent().parent()[0] : $('#' + id, editor.body)[0];
                        try {
                            range.setStartAfter(node);
                            range.collapse(true);
                            editor.selectRange(range);
                        } catch (e) {
                            console.error(e, node);
                        }
                    }
                    $kmath_window.find('.math-insert').attr('disabled', false);
                    $kmath_window.data("kendoWindow").close();
                    editor.focus();
                    if (editor.options.onInsertMath) {
                        editor.options.onInsertMath();
                    }
                });
                // editor.focus();
            });

            mathEditor._init();


        }

    })();