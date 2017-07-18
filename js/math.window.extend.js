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
                '<div class="' + this.options.message.slice(1) + '"></div>' +
                '<button class="math-cancel button">' + $$.GCI18N.kMath.Cancel + '</button>' +
                '<button class="math-insert button button-theme">' + $$.GCI18N.kMath.Insert + '</button>' +
                '</div>');
            $kmath_window = $("#kmath-wrapper-" + this.uuid);
            $kmath_window.kendoWindow({
                width: '875px',
                height: '590px',
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
                    self.setFormula('$$' + self.options.mathField.latex() + '$$');
                }
                MathJax.Hub.Queue(function () {
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

    