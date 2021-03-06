 /**
  * desc draft
  */
 +function () {
            /**
              * @var flag {bool} when first click  create and initial preview_window
              * @var preview_window {jQuery} 
              * @var edit_area {jQuery}
              * @var view_area {jQuery}
              * @var seleced_range {Range}
              */
            var flag = true,
                preview_window,
                edit_area,
                view_area,
                seleced_range;

            kendo.ui.Editor.defaultTools['custom'] = {
                name: "custom",
                options: {
                    name: "custom",
                    tooltip: "function",
                    template: '<a href="" role="button" class="k-tool" unselectable="on" title="perview" aria-pressed="false"><span unselectable="on" class="k-tool-icon k-i-custom"></span></a>',
                    exec: execFun
                }
            };
            // var cleaner =kendo.ui.editor.cleaner;


           // kendo.ui.editor.FontTool = $.noop;

            function execFun(e) {
                var editor, window_editor, doc_editor, body_editor;

                editor = $(this).data("kendoEditor");
                window_editor = editor.window;
                doc_editor = window_editor.document;
                body_editor = doc_editor.body;

                // initial popup window when first click
                if (flag) {
                    var head_editor = doc_editor.head;
                    //  $(doc_editor).find("head").append('<script  src=\"https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-MML-AM_CHTML\"><\/script>');
                    //  $(doc_editor).find("head").append('<script src=\"http://cdn.bootcss.com/jquery/3.1.1/jquery.js\"><\/script>');
                    //  $(doc_editor).find("head").get(0).insertAdjacentHTML('beforeend', '<script src=\"./js/test.js\"><\/script>');

                    //  head_editor.insertAdjacentHTML('beforeend', '<script src=\"http://localhost:8000/examples/test.js\"><\/script>');
                    //  head_editor.insertAdjacentHTML('beforeend', '<script src=\"./js/test.js\"><\/script>');
                  //  head_editor.insertAdjacentHTML('beforeend', '<link href="./styles/mathjax.css" rel="stylesheet">');
                    createWindow();
                    initWindow();
                    flag = false;
                }

                /**
                  * @var selection {Selection} area in editor which has been selected
                  * @var range {Range}
                  * @var equation_dom {jQuery} DOM in selection
                  * @var equation_dom_converted {jQuery} DOM in selection and has been converted
                  */
                var selection, range, equation_dom, equation_dom_converted;
                selection = window_editor.getSelection();
                if (selection.toString().length === 0) {
                    window.confirm("must seleced!!");
                    return;
                }
                seleced_range = range = selection.getRangeAt(0);//g
                // range.deleteContents() Range.extractContents cloneContents
                // raw_dom=range.extractContents(); extractContents 选中区域提取后会变成空
                // range.deleteContents()
                // range.insertNode($("<div>lii</div>")[0])
                equation_dom = $(range.cloneContents());
                equation_dom_converted = equation_dom.find(".MathJax_CHTML");
                //如果DOM已经编译为函数形式取其DOM的"data-mathml"属性获取原始数据
                if (equation_dom_converted.length) {
                    edit_area.val(equation_dom_converted.attr("data-mathml"));
                } else {
                    edit_area.val(seleced_range.toString());
                }





                view_area.html(' ');
                preview_window.data("kendoWindow").center().open();

            }

            function createWindow() {
                var template_window = '<div id="editor_window_kendo" style="padding: 15px;display:none;">' +
                    '<div class="row">' +
                    '<div class="col-md-6" id="edit_area_kendo" style="min-height:470px;box-sizing: border-box;" contenteditable="true">' +
                    '<textarea style="min-height:470px;width:100%;resize:none;box-sizing: border-box;"></textarea>' +
                    '</div>' +
                    '<div class="col-md-6" id="view_area_kendo" style="min-height:470px;box-sizing: border-box;" contenteditable="true"></div>' +
                    '</div>' +
                    '</div>';
                $(document.body).append(template_window);

            }

            function initWindow() {
                var preview_windowwrapper;//<jQuery> wrapper of kendoWindow 
                preview_window = $("#editor_window_kendo");
                edit_area = $("#edit_area_kendo").find("textarea");
                view_area = $("#view_area_kendo");


                preview_window.kendoWindow({
                    width: "500px",
                    height: "500px",
                    visible: false,
                    actions: ["insert", "Custom", "Close"],//"Minimize", "Maximize",
                    title: "Edit & perview Formula",
                    close: function () {

                    }
                });
                function getDom(dom) {
                    var latex;
                    dom = dom.clone();
                    latex = dom.find("script").text();
                    latex = "$$" + latex + "$$";
                    dom = dom.find(".MathJax_CHTML");
                    dom.attr("data-mathml", latex);
                    dom.attr("contenteditable", false);
                    dom.find(".MJX_Assistive_MathML").remove();

                    return dom.get(0);

                }
                preview_windowwrapper = preview_window.data("kendoWindow").wrapper;
                preview_windowwrapper.find(".k-i-custom").click(function (e) {

                    view_area.html(edit_area.val());
                    MathJax.Hub.Queue(["Typeset", MathJax.Hub, view_area[0]]);


                    //  e.preventDefault();
                });
                preview_windowwrapper.find(".k-i-insert").click(function (e) {
                    debugger;
                    //防止 typeset 没执行完就执行插入方法
                    MathJax.Hub.Queue(function () {

                        seleced_range.deleteContents();
                        seleced_range.insertNode($("<span>&nbsp;</span>").get(0));
                        seleced_range.insertNode(getDom(view_area));
                        seleced_range.insertNode($("<span>&nbsp;</span>").get(0));
                    });
                });

            }

        }();