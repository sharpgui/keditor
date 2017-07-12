//+++++KMath extend for Kendo Window
//=================================
+function () {
'use strict';
   
   KMath.prototype.init= createWindow;
    /**
         * 先创建kendo window ，window dom 初始化完毕后调用 KMath 的_init 创建DOM 结构
         * @method createWindow
         */
    function createWindow() {
        var self=this,//KMath instance
         $kmath_window ;
        $(document.body).append('<div id="kmath-wrapper">' +
            '<div id="'+this.options.element.slice(1)+'"></div>' +//KMath 容器根据传入参数动态生成
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

            $(this).attr('disabled', true);
            MathJax.Hub.Queue(function () {
                if (self.options.isBasic && self.options.mathField) {
                    self.setFormula('$$' + self.options.mathField.latex() + '$$');
                }
            });
            MathJax.Hub.Queue(function () {

                var result = self.getFormula();

                if (self.options.$message && !result) {
                    self.options.$message.text('Typeset failed. Please retry after reload the webpage.');
                    self.options.$message.show(100);
                    $kmath_window.find('.math-insert').attr('disabled', false);
                    return;
                }

                $kmath_window.find('.math-insert').attr('disabled', false);
               // $kmath_window.data("kendoWindow").close();
                $kmath_window.data("kendoWindow").formula=result;
                console.dir(result);

            });
          
        });

        mathEditor._init();
     
        return   $kmath_window.data("kendoWindow");

    }

}();