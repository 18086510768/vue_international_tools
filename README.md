# vue_international_tools

#### 介绍
一个基于express框架的vue国际化插件

#### 软件架构
vue项目使用VueI18n做的国际化，每次抽取页面内的中文十分痛苦，故基于express框架写了这个小插件，自动抽取文件中的中文，使用有道翻译API生成国际化文件的唯一key和英文翻译（建议还是使用专业人工翻译，这里主要是生成国际化文件的key值），输出主文件和两个国际化文件，省去了大部分重复劳动。


#### 安装教程

1.  npm install 安装项目依赖
2.  npm run dev

#### 使用说明

1.  浏览器访问localhost:8600/translate.html上传需要翻译的文件
2.  配置有道翻译appKey和secretKey，不配置会生成中文key（见下面图一），可以去https://ai.youdao.com上申请 
3.  上传文件保存目录为/upload，国际化后的输出目录为/static/output,输出的国际化文件包括你上传的主文件和生成的***_en.js、***_zh.js两个国际化文件，效果图如下。
![输入图片说明](https://images.gitee.com/uploads/images/2019/1030/113812_222bbfe5_1833037.png "demo1.png")
![输入图片说明](https://images.gitee.com/uploads/images/2019/1030/113827_e98dca61_1833037.png "demo2.png")
![输入图片说明](https://images.gitee.com/uploads/images/2019/1030/113840_219a8b3c_1833037.png "demo3.png")
![输入图片说明](https://images.gitee.com/uploads/images/2019/1030/113851_b0fb57a7_1833037.png "demo4.png")

#### 参与贡献
1.  Fork 本仓库
2.  新建 Feat_dev 分支
3.  提交代码
4.  新建 Pull Request
