# MathJax 

MathJax 支持的输入方式有三种 AsciMath，MathML，Tex，输出方式有六种 CommonHTML，HTML-CSS，NativeMML，PlainSource,PreviwHTML,SVG.

## 主要抽象概念

主要抽象出三个接口 inputJax ，elementJax，outputJax

- inputJax：将输入的数据源（latex，mathML...)转为 elemeJax ,并且MathJax 主文件中的 inputJax 为一个接口具体实现是在一个动态加入的文件中。
- elementJax ：即MathJax核心对象
- outputJax：修饰和定义DOM结构的样式，并且MathJax 主文件中的 outputJax 为一个接口具体实现在一个动态引入的文件中


## 修改范围
自定义的math需要修改对应 input/output 实现的js 逻辑，添加对应output 所需要的fonts，css

- jax
  + input
    - AsciiMath
    - MathML
    - TTex
   + output
    - CommonHTML
       + js
       + fonts
       + css
    - HTML-CSS
       + js
       + font
       + css
    - NativeMML
    - PlainSource
    - PreviewHTML
       + js
       + fonts
       + css
     