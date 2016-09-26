/**
 *
 */




;(function(){
    'use strict';
    $.fn.mSlider = function (opt) {
        var options = $.extend({
            floatNav: false,
            activeClass: 'active', // Class to be added to highlight nav elements
            sectionSelector: 'scrollto', // Class of the section that is interconnected with nav links
            animDuration: 350, //
            startAt: 0, // px | scrollto
            deviantPX: 0,
            selector: 'a', //
            //   zindex: 9999, // The zindex value to apply to the element: default 9999, other option is 'auto'
            LockStateModeClass: 'show-class', //
            unLockStateModeClass: 'hide-class', //
            before:null,
            after:null
        }, opt);




        //执行回调前
        function before($pre,$cur,$next,direction,location){
            if(options.before && typeof options.before === 'function'){
                options.before(
                    {
                        "$pre":$pre,
                        "$cur":$cur,
                        "$next":$next,
                        "direction":direction,
                        "location":location
                    }
                )
            }
        }

        //回调
        function after(){

        }

        /*
         上下左右切换动画
         */
        var isAction = !1;
        var timer = null;
        function slideTo($target,$next,direction){
            var $d = $.Deferred();
            var formTranslate = '';
            var toTranslate = '';

            if(!$target || !$next){return}

            switch (direction){
                case 'Up':
                    formTranslate = 'translateY(100%)';
                    toTranslate = 'translateY(0)';
                    break;
                case 'Down':
                    formTranslate = 'translateY(-100%)';
                    toTranslate = 'translateY(0)';
                    break;
                case 'Left':
                    formTranslate = 'translateX(100%)';
                    toTranslate = 'translateX(0)';
                    break;
                case 'Right':
                    formTranslate = 'translateX(-100%)';
                    toTranslate = 'translateX(0)';
                    break;
            }

            $next.css({'transform':formTranslate,"zIndex":9,"visibility": "visible"});
            $next.animate({
                transform: toTranslate
            },function(){
                $next.css({"zIndex":1});
                $target.css({"zIndex": -1,"visibility": "hidden"});
                isAction = !1;
                $d.resolve();
                console.log('resolve');
                if(timer){clearTimeout(timer);timer = null;}
            });
            if(timer){clearTimeout(timer);timer = null;}
            timer = setTimeout(function(){
               $d.reject('失败');
                isAction = !1; //动画回调失败后解锁
                console.log('reject');
            },500);

            return $d.promise();

        }



        /*
        *
        * */


        function init(){

        }

        var winW = window.innerWidth;
        var winH = window.innerHeight;

        var type;

        console.log(winW, winH);
        return this.each(function () {
            //var treeDate = {};
            var $this = $(this);
            this.style.width = winW + 'px';
            this.style.height = winH + 'px';

            var $mSlider__spa = $this.find('.mSlider__spa');

            //var $mSlider__baseSliders = $('.mSlider__baseSlider');

            //var $mSlider__scroll = $('.mSlider__scroll');

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

            ///init
            //treeDate.length = treeDate.childrenFirstDom.length;

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
                    object.dom.push($(ele2));
                    //console.log(treeDate.children[i]);
                    //treeDate.children[i].push($(ele2));
                });
                //console.log(treeDate.children[i]);
                treeDate.children.push(object)
                //console.table(object)

            });




            $.each(treeDate.children,function(i,ele){
                //console.log(i, ele);
                //console.log(ele.dom);
                treeDate.childrenDom.push(ele.dom); //压入数组

            });

            treeDate.length = treeDate.childrenFirstDom.length;

            var $pre,$cur,$next;

            new AlloyFinger(this, {
                distance:100,
                touchStart: function (e) {
                    //console.clear();
                    //console.log('treeDate.x:',treeDate.x);
                    //console.log('treeDate.y:',treeDate.y);
                    //console.log('isAction:',isAction);
                },
                touchMove: function (e) {
                    //e.preventDefault();

                },
                touchEnd: function (e) {
                    //console.log('touchEnd');

                },
                touchCancel: function (e) {

                },
                swipe: function (evt) {
                    //console.log('isAction:',isAction);
                    //isAction = !1;
                    if(isAction){  console.log('isAction:11111111111'); return;}

                    console.log('isAction:222222222');
                    console.log('isAction:',isAction);
                    console.log('isAction:333333');

                    //if(isAction){
                    //    console.log('isAction:444444');
                    //    return;
                    //}

                    /*
                    * Up/Down  上下滑,先判断 y 坐标
                    *
                    *
                    *
                    *
                    * Left/Right   先 获取 y 坐标 ,代入 y坐标 得出 对应子元素数组 判断 子元素数组长度是否超过 2
                    *
                    * */

                    switch (evt.direction){
                        case 'Up':

                            if(treeDate.x === 0){
                                $cur = treeDate.childrenFirstDom[treeDate.y];
                                if(treeDate.y < treeDate.length -1 && treeDate.length > 1){
                                    isAction = !0;
                                    treeDate.y++;
                                    treeDate.actionIndex++;
                                    $next = treeDate.childrenFirstDom[treeDate.y];
                                    before($pre,$cur,$next,evt.direction,treeDate.location);
                                    slideTo($cur,$next,evt.direction).then(function(){
                                        console.log('回调');
                                    },function(err){
                                        console.log((err))
                                    });
                                    //slideTo($cur,$next,evt.direction);
                                }
                            }

                            break;
                        case 'Down':
                            if(treeDate.x === 0){
                                $cur = treeDate.childrenFirstDom[treeDate.y];
                                if(treeDate.y > 0){
                                    isAction = !0;
                                    treeDate.y--;
                                    treeDate.actionIndex--;
                                    $next = treeDate.childrenFirstDom[treeDate.y];

                                    before($pre,$cur,$next,evt.direction,treeDate.location);

                                    //slideTo($cur,$next,evt.direction);
                                    slideTo($cur,$next,evt.direction).then(function(){
                                        console.log('回调');
                                    },function(err){
                                        console.log((err))
                                    });
                                }
                            }


                            break;
                        case 'Left':

                            type = treeDate.children[treeDate.y]["dateType"];

                            console.log('循环模式',type);

                            //console.log('treeDate.childrenDom[treeDate.y]:', treeDate.childrenDom[treeDate.y]);
                            //console.log('treeDate.childrenDom[treeDate.y].length:', treeDate.childrenDom[treeDate.y].length);

                            //console.log('666:',treeDate.childrenDom[treeDate.y]);
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

                                //treeDate.childrenDom[treeDate.y].push($cur);

                                //console.log('$pre:',$pre.html());
                                //console.log('$cur:',$cur.html());
                                //console.log('$next',$next.html());

                                treeDate.x++;
                                if(treeDate.x > treeDate.childrenDom[treeDate.y].length -1){
                                    treeDate.x = 0;
                                }

                                console.log('X : >>>>>>>>>>', treeDate.x);
                                //before($pre,$cur,$next,evt.direction,treeDate.location);
                                //slideTo($cur,$next,evt.direction);
                                slideTo($cur,$next,evt.direction).then(function(){
                                    console.log('回调');
                                },function(err){
                                    console.log((err))
                                });
                                //if(treeDate.x === treeDate.childrenDom[treeDate.y].length -1){
                                //    treeDate.x = -1;
                                //    $cur = treeDate.childrenFirstDom[treeDate.x + 1];
                                //}
                            }else{
                                $cur = treeDate.childrenFirstDom[treeDate.x];
                                if(treeDate.x < treeDate.childrenDom[treeDate.y].length -1){
                                    isAction = !0;
                                    treeDate.x++;
                                    //treeDate.actionIndex++;
                                    $next = treeDate.childrenDom[treeDate.y][treeDate.x];

                                    before($pre,$cur,$next,evt.direction,treeDate.location);

                                    //slideTo($cur,$next,evt.direction);
                                    slideTo($cur,$next,evt.direction).then(function(){
                                        console.log('回调');
                                    },function(err){
                                        console.log((err))
                                    });

                                }

                                //console.log('X : >>>>>>>>>>', treeDate.x);

                            }


                            //console.log('treeDate.x, treeDate.y ',treeDate.x, treeDate.y);
                            //console.log('treeDate.childrenDom[treeDate.y:',treeDate.childrenDom[treeDate.y]);
                            //console.log('treeDate.childrenDom[treeDate.y][treeDate.x]:',treeDate.childrenDom[treeDate.y][treeDate.x]);

                            break;
                        case 'Right':

                            type = treeDate.children[treeDate.y]["dateType"];

                            if(type === 'infinite'){
                                isAction = !0;
                                //if(treeDate.childrenDom[treeDate.y].length == 2){ //只有2个元素循环的时候
                                    //$pre = $next;
                                    $pre = treeDate.childrenDom[treeDate.y][1];
                                    $cur = treeDate.childrenDom[treeDate.y][0];
                                //}else{
                                //    $pre = treeDate.childrenDom[treeDate.y][1];
                                //    $cur = treeDate.childrenDom[treeDate.y][0];
                                //}

                                $next = treeDate.childrenDom[treeDate.y].pop();
                                treeDate.childrenDom[treeDate.y].unshift($next);

                                //treeDate.childrenDom[treeDate.y].push($cur);
                                treeDate.x--;
                                if(treeDate.x < 0){
                                    treeDate.x = treeDate.childrenDom[treeDate.y].length -1;

                                }

                                //slideTo($cur,$next,evt.direction);
                                slideTo($cur,$next,evt.direction).then(function(){
                                    console.log('回调');
                                },function(err){
                                    console.log((err))
                                });
                            }else{
                                $cur = treeDate.childrenDom[treeDate.y][treeDate.x];
                                if(treeDate.x > 0){
                                    treeDate.x--;
                                    isAction = !0;
                                    $next = treeDate.childrenDom[treeDate.y][treeDate.x];
                                    before($pre,$cur,$next,evt.direction,treeDate.location);
                                    //slideTo($cur,$next,evt.direction);
                                    slideTo($cur,$next,evt.direction).then(function(){
                                        console.log('回调');
                                    },function(err){
                                        console.log((err))
                                    });
                                }
                                //console.log('X : <<<<<<<<', treeDate.x);
                            }
                            //$cur = treeDate.childrenFirstDom[treeDate.x];
                            //console.log('循环模式',type);
                            break;
                    }

                    //当前位置切换不等于最前 和 最后
                    //if(oldIndex !== index){
                        //slideTo($mSlider__baseSliders.eq(oldIndex),$mSlider__baseSliders.eq(index),evt.direction)
                    //}

                },
                singleTap: function (evt) {

                }
            });
        });
    }

})(jQuery,window,document);
