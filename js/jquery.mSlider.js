/**
 *
 */
;(function(){
    'use strict';
    $.fn.mSlider = function (opt) {
        var options = $.extend({
            nativeScroll:!0,
            touchStart:function(){},
            touchMove: function () {},
            touchEnd: function () {},
            touchCancel: function () {},
            activeClass: 'active', // Class to be added to highlight nav elements
            sectionSelector: 'scrollto', // Class of the section that is interconnected with nav links
            animDuration: 350, //
            before:null,
            after:null
        }, opt);

        //执行回调前
        function before($cur,$next,direction){
            if(options.before && typeof options.before === 'function'){
                options.before(
                    {
                        "$cur":$cur,
                        "$next":$next,
                        "direction":direction
                    }
                )
            }
        }

        //回调
        function after($cur,$next,direction){
            if(options.after && typeof options.after === 'function'){
                options.after(
                    {
                        "$cur":$cur,
                        "$next":$next,
                        "direction":direction
                    }
                )
            }
        }

        /*
         上下左右切换动画
         */
        var isAction = !1;
        var timer = null;
        /*核心切换逻辑*/
        var toTranslate = 'translateX(0)';
        function slideTo($target,$next,direction){
            var $d = $.Deferred();
            var formTranslate = '';

            if(!$target || !$next){return}
            switch (direction){
                case 'Up':
                    formTranslate = 'translateY(100%)';
                    break;
                case 'Down':
                    formTranslate = 'translateY(-100%)';
                    break;
                case 'Left':
                    formTranslate = 'translateX(100%)';
                    break;
                case 'Right':
                    formTranslate = 'translateX(-100%)';
                    break;
            }
            $next.css({'transform':formTranslate,"zIndex":9,"visibility": "visible"});
            $next.animate({
                transform: toTranslate
            },function(){
                $next.css({"zIndex":1});
                $target.css({"zIndex": -1,"visibility": "hidden"});
                isAction = !1;
                $d.resolve($next,$target);
                if(timer){clearTimeout(timer);timer = null;}
            });
            if(timer){clearTimeout(timer);timer = null;}
            timer = setTimeout(function(){
                $d.reject('动画回调失败');
                isAction = !1; //动画回调失败后解锁
            },500);
            return $d.promise();
        }

        /*切换*/
        function switchSlide($cur,$next,direction){
            before($cur,$next,direction);
            slideTo($cur,$next,direction).then(function(_$cur,_$prev){
                after(_$cur,_$prev,direction)
            },function(err){
                console && console.log((err))
            });
        }
        /*slideUp*/
        function slideUp(direction){
            if(treeDate.x === 0){
                $cur = treeDate.childrenFirstDom[treeDate.y];
                if(treeDate.y < treeDate.length -1 && treeDate.length > 1){
                    isAction = !0;
                    treeDate.y++;
                    treeDate.actionIndex++;
                    $next = treeDate.childrenFirstDom[treeDate.y];
                    switchSlide($cur,$next,direction);
                }
            }
        }
        /*slideDown*/
        function slideDown(direction){
            if(treeDate.x === 0){
                $cur = treeDate.childrenFirstDom[treeDate.y];
                if(treeDate.y > 0){
                    isAction = !0;
                    treeDate.y--;
                    treeDate.actionIndex--;
                    $next = treeDate.childrenFirstDom[treeDate.y];
                    switchSlide($cur,$next,direction);
                }
            }
        }
        /*slideLeft*/
        function slideLeft(direction){
            type = treeDate.children[treeDate.y]["dateType"];
            if(type === 'infinite'){
                isAction = !0;
                $cur = treeDate.childrenDom[treeDate.y].shift();
                treeDate.childrenDom[treeDate.y].push($cur);
                $next = treeDate.childrenDom[treeDate.y][0];

                if(treeDate.childrenDom[treeDate.y].length === 2){  //只有2个元素循环的时候
                    $pre = $next;
                }else{
                    $pre = treeDate.childrenDom[treeDate.y][1];
                }

                treeDate.x++;
                if(treeDate.x > treeDate.childrenDom[treeDate.y].length -1){
                    treeDate.x = 0;
                }
                switchSlide($cur,$next,direction);
            }else{
                $cur = treeDate.childrenFirstDom[treeDate.x];
                if(treeDate.x < treeDate.childrenDom[treeDate.y].length -1){
                    isAction = !0;
                    treeDate.x++;
                    $next = treeDate.childrenDom[treeDate.y][treeDate.x];
                    switchSlide($cur,$next,direction);
                }
            }
        }
        /*slideRight*/
        function slideRight(direction){
            type = treeDate.children[treeDate.y]["dateType"];
            if(type === 'infinite'){
                isAction = !0;

                $pre = treeDate.childrenDom[treeDate.y][1];
                $cur = treeDate.childrenDom[treeDate.y][0];

                $next = treeDate.childrenDom[treeDate.y].pop();
                treeDate.childrenDom[treeDate.y].unshift($next);

                treeDate.x--;
                if(treeDate.x < 0){
                    treeDate.x = treeDate.childrenDom[treeDate.y].length -1;
                }
                switchSlide($cur,$next,direction);
            }else{
                $cur = treeDate.childrenDom[treeDate.y][treeDate.x];
                if(treeDate.x > 0){
                    treeDate.x--;
                    isAction = !0;
                    $next = treeDate.childrenDom[treeDate.y][treeDate.x];
                    switchSlide($cur,$next,direction);
                }
            }
        }
        /*IScroll*/
        function createIScroll(ele){
            new IScroll(ele, {
                scrollbars: true,
                interactiveScrollbars: true,
                shrinkScrollbars: 'scale',
                fadeScrollbars: true,
                click:true}
            );
        }
        /*fixCreateIScroll*/
        function fixCreateIScroll(){
            console && console.log('正在尝试外部链接加载文件');
            $.getScript('//cdn.bootcss.com/iScroll/5.2.0/iscroll.min.js').done(function(){
                $.each(failScrollElement,function(i,ele){
                    try {
                        createIScroll(ele);
                        console && console.log(ele,'元素插件初始化成功!');
                    }catch (e){
                        console && console.log(e);
                        console && console.log('插件初始化失败!');
                    }
                })
            });
        }

        var winW = window.innerWidth;
        var winH = window.innerHeight;
        var type;
        var IScrollState = !1;
        var failScrollElement = []; //记录初始化失败的 滚动元素

        console.log(winW, winH);
        var $pre,$cur,$next;
        var treeDate = {
            x: 0, //列
            y: 0, //行
            location: [0, 0], //[行,列] 记录当前坐标系
            location2: {
                "x":0,
                "y":0
            }, //[行,列] 记录当前坐标系
            actionIndex: 0,
            //主体行
            childrenFirstDom: [], //子元素第一个元素 [上下切换的元素]
            children: [],
            childrenDom:[],
            infiniteArray:[], //存放
            length: -1
        };

        return this.each(function () {
            var $this = $(this);
            this.style.width = winW + 'px';
            this.style.height = winH + 'px';
            var $mSlider__spa = $this.find('.mSlider__spa');

            //生成json 数据
            $($mSlider__spa).each(function(i,ele){
                var _$this = $(this);
                //treeDate.childrenFirstDom.push(_$this);
                var $children = _$this.children();
                var type = _$this.attr('datatype');
                var object = {
                    dom:[],
                    actionIndex: 0,
                    "dateType":"normal"
                };

                if(typeof type !== 'undefined' && type === 'infinite'){
                    object.dateType = 'infinite'
                }

                $children.each(function(i2,ele2){
                    if(i2 === 0){
                        treeDate.childrenFirstDom.push($(ele2));
                    }
                    if($(ele2).hasClass('mSlider__scroll') && !options.nativeScroll){
                        try {
                            $(ele2).addClass('mSlider__scroll--iScrollPlug');
                            createIScroll(ele2);
                            console && console.log(ele2,'元素插件初始化成功!');
                        }
                        catch (e) {
                            //如果没有加载到依赖插件,抛出 异常错误
                            console && console.log(e);
                            console && console.log('插件初始化失败');
                            failScrollElement.push(ele2);
                            IScrollState = !0;
                        }
                    }
                    object.dom.push($(ele2));
                });
                treeDate.children.push(object)
            });

            $.each(treeDate.children,function(i,ele){
                treeDate.childrenDom.push(ele.dom); //压入数组
            });

            treeDate.length = treeDate.childrenFirstDom.length;

            //启动插件滚动 阻止默认事件
            if(!options.nativeScroll){
                document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
            }
            //启动插滚动插件修正方案
            if(IScrollState){
                fixCreateIScroll();
            }
            new AlloyFinger(this, {
                distance:100,
                touchStart: function (e) {options.touchStart(e);},
                touchMove: function (e) {options.touchMove(e)},
                touchEnd: function (e) {options.touchEnd(e)},
                touchCancel: function (e) {options.touchCancel(e)},
                swipe: function (evt) {
                    if(isAction){return;}
                    /*
                    * Up/Down  上下滑,先判断 y 坐标
                    * Left/Right   先 获取 y 坐标 ,代入 y坐标 得出 对应子元素数组 判断 子元素数组长度是否超过 2
                    * */
                    switch (evt.direction){
                        case 'Up':
                            slideUp(evt.direction);
                            break;
                        case 'Down':
                            slideDown(evt.direction);
                            break;
                        case 'Left':
                            slideLeft(evt.direction);
                            break;
                        case 'Right':
                            slideRight(evt.direction);
                            break;
                    }
                },
                singleTap: function (evt) {}
            });
        });
    }
})(jQuery,window,document);
