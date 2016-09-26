/* AlloyFinger v0.1.2
 * By dntzhang
 * Github: https://github.com/AlloyTeam/AlloyFinger
 */
;(function() {
    function getLen(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y);
    }

    function dot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    }

    function getAngle(v1, v2) {
        var mr = getLen(v1) * getLen(v2);
        if (mr === 0) return 0;
        var r = dot(v1, v2) / mr;
        if (r > 1) r = 1;
        return Math.acos(r);
    }

    function cross(v1, v2) {
        return v1.x * v2.y - v2.x * v1.y;
    }

    function getRotateAngle(v1, v2) {
        var angle = getAngle(v1, v2);
        if (cross(v1, v2) > 0) {
            angle *= -1;
        }

        return angle * 180 / Math.PI;
    }
    var AlloyFinger = function (el, option) {

        el.addEventListener("touchstart", this.start.bind(this), false);
        el.addEventListener("touchmove", this.move.bind(this), false);
        el.addEventListener("touchend", this.end.bind(this), false);
        el.addEventListener("touchcancel",this.cancel.bind(this),false);

        this.preV = { x: null, y: null };
        this.pinchStartLen = null;
        this.scale = 1;
        this.isDoubleTap = false;
        this.rotate = option.rotate || function () { };
        this.touchStart = option.touchStart || function () { };
        this.multipointStart = option.multipointStart || function () { };
        this.multipointEnd=option.multipointEnd||function(){};
        this.pinch = option.pinch || function () { };
        this.swipe = option.swipe || function () { };
        this.tap = option.tap || function () { };
        this.doubleTap = option.doubleTap || function () { };
        this.longTap = option.longTap || function () { };
        this.singleTap = option.singleTap || function () { };
        this.pressMove = option.pressMove || function () { };
        this.touchMove = option.touchMove || function () { };
        this.touchEnd = option.touchEnd || function () { };
        this.touchCancel = option.touchCancel || function () { };
        this.distance = option.distance || 30;


        this.delta = null;
        this.last = null;
        this.now = null;
        this.tapTimeout = null;
        this.touchTimeout = null;
        this.longTapTimeout = null;
        this.swipeTimeout=null;
        this.x1 = this.x2 = this.y1 = this.y2 = null;
        this.preTapPosition={x:null,y:null};
    };

    AlloyFinger.prototype = {
        start: function (evt) {
            if(!evt.touches)return;
            this.now = Date.now();
            this.x1 = evt.touches[0].pageX;
            this.y1 = evt.touches[0].pageY;
            this.delta = this.now - (this.last || this.now);
            this.touchStart(evt);
            if(this.preTapPosition.x!==null){
                this.isDoubleTap = (this.delta > 0 && this.delta <= 250&&Math.abs(this.preTapPosition.x-this.x1)<30&&Math.abs(this.preTapPosition.y-this.y1)<30);
            }
            this.preTapPosition.x=this.x1;
            this.preTapPosition.y=this.y1;
            this.last = this.now;
            var preV = this.preV,
                len = evt.touches.length;
            if (len > 1) {
                this._cancelLongTap();
                var v = { x: evt.touches[1].pageX - this.x1, y: evt.touches[1].pageY - this.y1 };
                preV.x = v.x;
                preV.y = v.y;
                this.pinchStartLen = getLen(preV);
                this.multipointStart(evt);
            }
            this.longTapTimeout = setTimeout(function(){
                this.longTap(evt);
            }.bind(this), 750);
        },
        move: function (evt) {
            if(!evt.touches)return;
            var preV = this.preV,
                len = evt.touches.length,
                currentX = evt.touches[0].pageX,
                currentY = evt.touches[0].pageY;
            this.isDoubleTap=false;
            if (len > 1) {
                var v = { x: evt.touches[1].pageX - currentX, y: evt.touches[1].pageY - currentY };

                if (preV.x !== null) {
                    if (this.pinchStartLen > 0) {
                        evt.scale = getLen(v) / this.pinchStartLen;
                        this.pinch(evt);
                    }

                    evt.angle = getRotateAngle(v, preV);
                    this.rotate(evt);
                }
                preV.x = v.x;
                preV.y = v.y;
            } else {
                if (this.x2 !== null) {
                    evt.deltaX = currentX - this.x2;
                    evt.deltaY = currentY - this.y2;

                }else{
                    evt.deltaX = 0;
                    evt.deltaY = 0;
                }
                this.pressMove(evt);
            }

            this.touchMove(evt);

            this._cancelLongTap();
            this.x2 = currentX;
            this.y2 = currentY;
            if (evt.touches.length > 1) {
                this._cancelLongTap();
                evt.preventDefault();
            }
        },
        end: function (evt) {
            if(!evt.changedTouches)return;
            this._cancelLongTap();
            var self = this;
            if( evt.touches.length<2){
                this.multipointEnd(evt);
            }
            this.touchEnd(evt);
            //swipe
            //console.log('this.distance:', this.distance);
            if ((this.x2 && Math.abs(this.x1 - this.x2) > this.distance) ||
                (this.y2 && Math.abs(this.preV.y - this.y2) > this.distance)) {
                evt.direction = this._swipeDirection(this.x1, this.x2, this.y1, this.y2);
                this.swipeTimeout = setTimeout(function () {
                    self.swipe(evt);
                }, 0)
            } else {
                this.tapTimeout = setTimeout(function () {
                    self.tap(evt);
                    // trigger double tap immediately
                    if (self.isDoubleTap) {
                        self.doubleTap(evt);
                        clearTimeout(self.touchTimeout);
                        self.isDoubleTap = false;
                    }else{
                        self.touchTimeout=setTimeout(function(){
                            self.singleTap(evt);
                        },250);
                    }
                }, 0)
            }

            this.preV.x = 0;
            this.preV.y = 0;
            this.scale = 1;
            this.pinchStartLen = null;
            this.x1 = this.x2 = this.y1 = this.y2 = null;
        },
        cancel:function(evt){
            clearTimeout(this.touchTimeout);
            clearTimeout(this.tapTimeout);
            clearTimeout(this.longTapTimeout);
            clearTimeout(this.swipeTimeout);
            this.touchCancel(evt);
        },
        _cancelLongTap: function () {
            clearTimeout(this.longTapTimeout);
        },
        _swipeDirection: function (x1, x2, y1, y2) {
            return Math.abs(x1 - x2) >= Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down')
        }


    };

    if (typeof module !== 'undefined' && typeof exports === 'object') {
        module.exports = AlloyFinger;
    }else {
        window.AlloyFinger = AlloyFinger;
    }
})();

/**
 * mSlider 体位切换插件
 * 时间:2016/9/26
 *  全局一个主构架实例
 *  暂时不支持自定义动画和时间
 *  页面滚动模式 [自带原生 | 插件扩展 ]
 *  切换前后回调
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
        function after($cur,$prev,direction){
            if(options.after && typeof options.after === 'function'){
                options.after(
                    {
                        "$cur":$cur,
                        "$prev":$prev,
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
