//+++++KMath extend for Kendo Window
    //=================================
    +function () {
        'use strict';

        KMath.prototype.init = createWindow;
        /**
             * 先创建kendo window ，window dom 初始化完毕后调用 KMath 的_init 创建DOM 结构
             * @method createWindow
             */
        function createWindow() {
            var self = this,//KMath instance
             $kmath_window;
            $(document.body).append('<div id="kmath-wrapper-' + this.uuid + '">' +
                '<div id="' + this.options.element.slice(1) + '"></div>' +//KMath 容器根据传入参数动态生成
                // '<div class="' + this.options.message.slice(1) + '"></div>' +
                '<button class="math-cancel button">' + $$.GCI18N.kMath.Cancel + '</button>' +
                '<button class="math-insert button button-theme">' + $$.GCI18N.kMath.Insert + '</button>' +
                '</div>');
            $kmath_window = $("#kmath-wrapper-" + this.uuid);
            $kmath_window.kendoWindow({
                width: 885,
                height: 635,
                visible: false,
                actions: ['close'],
                title: $$.GCI18N.kMath.Formulas,
                close: function () { },
                open: function () {
                    self._init();   // 渲染符号时，依赖于父级元素的位置与大小去计算缩放。故先open，再init。
                }
            });

            $kmath_window.find('.math-cancel').click(function () {
                $kmath_window.data("kendoWindow").close();
            });
            $kmath_window.find('.math-insert').click(function () {

                $(this).attr('disabled', true);
                if (self.isBasic && self.options.mathField) {
                    self.setFormula('$$' + self.options.mathField.latex() + '$$', true);
                }
                MathJax.Hub.Queue(function () {
                    if(self.checkEquation()){
                        $kmath_window.find('.math-insert').attr('disabled', false);
                        return;
                    }
                    var result = self.getFormula();

                    if (self.options.$message && !result) {
                        self.options.$message.text($$.GCI18N.kMath.TypesetFailed);
                        self.options.$message.show(100);
                        $kmath_window.find('.math-insert').attr('disabled', false);
                        return;
                    }

                    if (self.onInsertCallback) {
                        self.onInsertCallback(result);
                    }

                    $kmath_window.find('.math-insert').attr('disabled', false);
                    // $kmath_window.data("kendoWindow").close();
                    $kmath_window.data("kendoWindow").formula = result;
                    $kmath_window.data("kendoWindow").close();

                });

            });

            // this._init();

            return $kmath_window.data("kendoWindow");
        }

    }();

        $(function () {
        // catch error if Clipboard class doesn't exist
        try {
            new Clipboard('.test');
        } catch (e) {
            return;
        }
        $(document).on('contextmenu', '.MathJax_CHTML', contextmenuFunc);
        // $(document).on('blur', '.MathJax_CHTML', hideContextmenu);    blur事件在Copy LaTex的click事件之前发生。
        $(document).on('click', hideContextmenu);
        $(document).on('contextmenu', hideContextmenu);

        var interval = setInterval(function () {
            if (!$('.aui-loading').length || ($('.aui-loading').length && $('.aui-loading').css('display') === 'none')) {
                clearInterval(interval);
                setTimeout(function () {
                    $('iframe').each(function () {
                        $(this.contentDocument).on('contextmenu', '.MathJax_CHTML', contextmenuFunc);
                        $(this.contentDocument.body).on('click', hideContextmenu);
                        $(this.contentDocument.body).on('contextmenu', hideContextmenu);
                        // 在页面加载完成之后，将iframe存放在editor.body中。将在contextmenu中使用。
                        this.contentDocument.body.parentFrame = $(this);
                        // this.contentDocument.body.onmousewheel = hideContextmenu;    鼠标滑轮滑动，就会触发。当没有滚动条时，不符合预期。
                        $(this.contentWindow).scroll(hideContextmenu);
                    });
                    document.body.parentFrame = {
                        offset: function () {
                            return { left: 0, top: 0, isNotFrame: true };
                        }
                    }
                    $(window).scroll(hideContextmenu);
                    $('.k-editor-toolbar').on('click', '.k-tool-group *', hideContextmenu);
                }, 500);
            }
        }, 1000);
    });
    function hideContextmenu() {
        // $('iframe').each(function () {
        //     $('.kmath-contextmenu', $(this.contentDocument)).hide();
        // });
        $('.kmath-contextmenu', $(document)).hide();
    }
    function contextmenuFunc(e) {
        // var $menu = $(this).closest('body').find('.kmath-contextmenu'),
        var $menu = $('.kmath-contextmenu'),
            latex = $(this).attr('data-latex');
        if (!latex) {
            return;
        }
        hideContextmenu();
        e.preventDefault();
        e.stopPropagation();
        if (!$menu.length) {
            $menu = $('<ul class="kmath-contextmenu" style="display: none;"></ul>');
            $menu.append('<li class="copylatex">'+ $$.GCI18N.kMath.CopyLaTeX +'<li>');
            $menu.on('contextmenu', function (e) { e.preventDefault(); e.stopPropagation(); });
            // $(this).closest('body').append($menu);
            $(document.body).append($menu);
            var copylatex = $('.copylatex', $menu);
            var clipboard = new Clipboard(copylatex[0]);
            clipboard.on('success', function (e) {
                console.info(e);
            });
            clipboard.on('error', function (e) {
                console.error(e);
            });
        }
        latex = latex ? latex.substr(2, latex.length - 4) : '';        // 去掉latex前后$
        $menu.find('li.copylatex').attr('data-clipboard-text', latex);

        // 当前元素所在的iframe的offset
        // var parentFrameOffset = e.target.closest('body').parentFrame.offset();       // IE不能支持element.closest。改为JQueryElement.closest方式    
        var parentFrameOffset = $(e.target).closest('body').get(0).parentFrame.offset();

        // $menu 在document.body中，相对于body绝对定位。
        // pageX pageY 是相对于文档的位置，clientX clientY 是相对于当前窗口的位置。
        if(parentFrameOffset.isNotFrame){
            $menu.css({ 'left': e.pageX, 'top': e.pageY});
        }else{
            $menu.css({ 'left': e.clientX + parentFrameOffset.left, 'top': e.clientY + parentFrameOffset.top });
        }
        $menu.show();
    }