/*
 * transform: A jQuery cssHooks adding cross-browser 2d transform capabilities to $.fn.css() and $.fn.animate()
 *
 * limitations:
 * - requires jQuery 1.4.3+
 * - Should you use the *translate* property, then your elements need to be absolutely positionned in a relatively positionned wrapper **or it will fail in IE678**.
 * - transformOrigin is not accessible
 *
 * latest version and complete README available on Github:
 * https://github.com/louisremi/jquery.transform.js
 *
 * Copyright 2011 @louis_remi
 * Licensed under the MIT license.
 *
 * This saved you an hour of work?
 * Send me music http://www.amazon.co.uk/wishlist/HNTU0468LQON
 *
 */
(function( $, window, document, Math, undefined ) {

    /*
     * Feature tests and global variables
     */
    var div = document.createElement("div"),
        divStyle = div.style,
        suffix = "Transform",
        testProperties = [
            "O" + suffix,
            "ms" + suffix,
            "Webkit" + suffix,
            "Moz" + suffix
        ],
        i = testProperties.length,
        supportProperty,
        supportMatrixFilter,
        supportFloat32Array = "Float32Array" in window,
        propertyHook,
        propertyGet,
        rMatrix = /Matrix([^)]*)/,
        rAffine = /^\s*matrix\(\s*1\s*,\s*0\s*,\s*0\s*,\s*1\s*(?:,\s*0(?:px)?\s*){2}\)\s*$/,
        _transform = "transform",
        _transformOrigin = "transformOrigin",
        _translate = "translate",
        _rotate = "rotate",
        _scale = "scale",
        _skew = "skew",
        _matrix = "matrix";

// test different vendor prefixes of these properties
    while ( i-- ) {
        if ( testProperties[i] in divStyle ) {
            $.support[_transform] = supportProperty = testProperties[i];
            $.support[_transformOrigin] = supportProperty + "Origin";
            continue;
        }
    }
// IE678 alternative
    if ( !supportProperty ) {
        $.support.matrixFilter = supportMatrixFilter = divStyle.filter === "";
    }

// px isn't the default unit of these properties
    $.cssNumber[_transform] = $.cssNumber[_transformOrigin] = true;

    /*
     * fn.css() hooks
     */
    if ( supportProperty && supportProperty != _transform ) {
        // Modern browsers can use jQuery.cssProps as a basic hook
        $.cssProps[_transform] = supportProperty;
        $.cssProps[_transformOrigin] = supportProperty + "Origin";

        // Firefox needs a complete hook because it stuffs matrix with "px"
        if ( supportProperty == "Moz" + suffix ) {
            propertyHook = {
                get: function( elem, computed ) {
                    return (computed ?
                            // remove "px" from the computed matrix
                            $.css( elem, supportProperty ).split("px").join(""):
                            elem.style[supportProperty]
                    );
                },
                set: function( elem, value ) {
                    // add "px" to matrices
                    elem.style[supportProperty] = /matrix\([^)p]*\)/.test(value) ?
                        value.replace(/matrix((?:[^,]*,){4})([^,]*),([^)]*)/, _matrix+"$1$2px,$3px"):
                        value;
                }
            };
            /* Fix two jQuery bugs still present in 1.5.1
             * - rupper is incompatible with IE9, see http://jqbug.com/8346
             * - jQuery.css is not really jQuery.cssProps aware, see http://jqbug.com/8402
             */
        } else if ( /^1\.[0-5](?:\.|$)/.test($.fn.jquery) ) {
            propertyHook = {
                get: function( elem, computed ) {
                    return (computed ?
                            $.css( elem, supportProperty.replace(/^ms/, "Ms") ):
                            elem.style[supportProperty]
                    );
                }
            };
        }
        /* TODO: leverage hardware acceleration of 3d transform in Webkit only
         else if ( supportProperty == "Webkit" + suffix && support3dTransform ) {
         propertyHook = {
         set: function( elem, value ) {
         elem.style[supportProperty] =
         value.replace();
         }
         }
         }*/

    } else if ( supportMatrixFilter ) {
        propertyHook = {
            get: function( elem, computed, asArray ) {
                var elemStyle = ( computed && elem.currentStyle ? elem.currentStyle : elem.style ),
                    matrix, data;

                if ( elemStyle && rMatrix.test( elemStyle.filter ) ) {
                    matrix = RegExp.$1.split(",");
                    matrix = [
                        matrix[0].split("=")[1],
                        matrix[2].split("=")[1],
                        matrix[1].split("=")[1],
                        matrix[3].split("=")[1]
                    ];
                } else {
                    matrix = [1,0,0,1];
                }

                if ( ! $.cssHooks[_transformOrigin] ) {
                    matrix[4] = elemStyle ? parseInt(elemStyle.left, 10) || 0 : 0;
                    matrix[5] = elemStyle ? parseInt(elemStyle.top, 10) || 0 : 0;

                } else {
                    data = $._data( elem, "transformTranslate", undefined );
                    matrix[4] = data ? data[0] : 0;
                    matrix[5] = data ? data[1] : 0;
                }

                return asArray ? matrix : _matrix+"(" + matrix + ")";
            },
            set: function( elem, value, animate ) {
                var elemStyle = elem.style,
                    currentStyle,
                    Matrix,
                    filter,
                    centerOrigin;

                if ( !animate ) {
                    elemStyle.zoom = 1;
                }

                value = matrix(value);

                // rotate, scale and skew
                Matrix = [
                    "Matrix("+
                    "M11="+value[0],
                    "M12="+value[2],
                    "M21="+value[1],
                    "M22="+value[3],
                    "SizingMethod='auto expand'"
                ].join();
                filter = ( currentStyle = elem.currentStyle ) && currentStyle.filter || elemStyle.filter || "";

                elemStyle.filter = rMatrix.test(filter) ?
                    filter.replace(rMatrix, Matrix) :
                filter + " progid:DXImageTransform.Microsoft." + Matrix + ")";

                if ( ! $.cssHooks[_transformOrigin] ) {

                    // center the transform origin, from pbakaus's Transformie http://github.com/pbakaus/transformie
                    if ( (centerOrigin = $.transform.centerOrigin) ) {
                        elemStyle[centerOrigin == "margin" ? "marginLeft" : "left"] = -(elem.offsetWidth/2) + (elem.clientWidth/2) + "px";
                        elemStyle[centerOrigin == "margin" ? "marginTop" : "top"] = -(elem.offsetHeight/2) + (elem.clientHeight/2) + "px";
                    }

                    // translate
                    // We assume that the elements are absolute positionned inside a relative positionned wrapper
                    elemStyle.left = value[4] + "px";
                    elemStyle.top = value[5] + "px";

                } else {
                    $.cssHooks[_transformOrigin].set( elem, value );
                }
            }
        };
    }
// populate jQuery.cssHooks with the appropriate hook if necessary
    if ( propertyHook ) {
        $.cssHooks[_transform] = propertyHook;
    }
// we need a unique setter for the animation logic
    propertyGet = propertyHook && propertyHook.get || $.css;

    /*
     * fn.animate() hooks
     */
    $.fx.step.transform = function( fx ) {
        var elem = fx.elem,
            start = fx.start,
            end = fx.end,
            pos = fx.pos,
            transform = "",
            precision = 1E5,
            i, startVal, endVal, unit;

        // fx.end and fx.start need to be converted to interpolation lists
        if ( !start || typeof start === "string" ) {

            // the following block can be commented out with jQuery 1.5.1+, see #7912
            if ( !start ) {
                start = propertyGet( elem, supportProperty );
            }

            // force layout only once per animation
            if ( supportMatrixFilter ) {
                elem.style.zoom = 1;
            }

            // replace "+=" in relative animations (-= is meaningless with transforms)
            end = end.split("+=").join(start);

            // parse both transform to generate interpolation list of same length
            $.extend( fx, interpolationList( start, end ) );
            start = fx.start;
            end = fx.end;
        }

        i = start.length;

        // interpolate functions of the list one by one
        while ( i-- ) {
            startVal = start[i];
            endVal = end[i];
            unit = +false;

            switch ( startVal[0] ) {

                case _translate:
                    unit = "px";
                case _scale:
                    unit || ( unit = "");

                    transform = startVal[0] + "(" +
                        Math.round( (startVal[1][0] + (endVal[1][0] - startVal[1][0]) * pos) * precision ) / precision + unit +","+
                        Math.round( (startVal[1][1] + (endVal[1][1] - startVal[1][1]) * pos) * precision ) / precision + unit + ")"+
                        transform;
                    break;

                case _skew + "X":
                case _skew + "Y":
                case _rotate:
                    transform = startVal[0] + "(" +
                        Math.round( (startVal[1] + (endVal[1] - startVal[1]) * pos) * precision ) / precision +"rad)"+
                        transform;
                    break;
            }
        }

        fx.origin && ( transform = fx.origin + transform );

        propertyHook && propertyHook.set ?
            propertyHook.set( elem, transform, +true ):
            elem.style[supportProperty] = transform;
    };

    /*
     * Utility functions
     */

// turns a transform string into its "matrix(A,B,C,D,X,Y)" form (as an array, though)
    function matrix( transform ) {
        transform = transform.split(")");
        var
            trim = $.trim
            , i = -1
        // last element of the array is an empty string, get rid of it
            , l = transform.length -1
            , split, prop, val
            , prev = supportFloat32Array ? new Float32Array(6) : []
            , curr = supportFloat32Array ? new Float32Array(6) : []
            , rslt = supportFloat32Array ? new Float32Array(6) : [1,0,0,1,0,0]
            ;

        prev[0] = prev[3] = rslt[0] = rslt[3] = 1;
        prev[1] = prev[2] = prev[4] = prev[5] = 0;

        // Loop through the transform properties, parse and multiply them
        while ( ++i < l ) {
            split = transform[i].split("(");
            prop = trim(split[0]);
            val = split[1];
            curr[0] = curr[3] = 1;
            curr[1] = curr[2] = curr[4] = curr[5] = 0;

            switch (prop) {
                case _translate+"X":
                    curr[4] = parseInt(val, 10);
                    break;

                case _translate+"Y":
                    curr[5] = parseInt(val, 10);
                    break;

                case _translate:
                    val = val.split(",");
                    curr[4] = parseInt(val[0], 10);
                    curr[5] = parseInt(val[1] || 0, 10);
                    break;

                case _rotate:
                    val = toRadian(val);
                    curr[0] = Math.cos(val);
                    curr[1] = Math.sin(val);
                    curr[2] = -Math.sin(val);
                    curr[3] = Math.cos(val);
                    break;

                case _scale+"X":
                    curr[0] = +val;
                    break;

                case _scale+"Y":
                    curr[3] = val;
                    break;

                case _scale:
                    val = val.split(",");
                    curr[0] = val[0];
                    curr[3] = val.length>1 ? val[1] : val[0];
                    break;

                case _skew+"X":
                    curr[2] = Math.tan(toRadian(val));
                    break;

                case _skew+"Y":
                    curr[1] = Math.tan(toRadian(val));
                    break;

                case _matrix:
                    val = val.split(",");
                    curr[0] = val[0];
                    curr[1] = val[1];
                    curr[2] = val[2];
                    curr[3] = val[3];
                    curr[4] = parseInt(val[4], 10);
                    curr[5] = parseInt(val[5], 10);
                    break;
            }

            // Matrix product (array in column-major order)
            rslt[0] = prev[0] * curr[0] + prev[2] * curr[1];
            rslt[1] = prev[1] * curr[0] + prev[3] * curr[1];
            rslt[2] = prev[0] * curr[2] + prev[2] * curr[3];
            rslt[3] = prev[1] * curr[2] + prev[3] * curr[3];
            rslt[4] = prev[0] * curr[4] + prev[2] * curr[5] + prev[4];
            rslt[5] = prev[1] * curr[4] + prev[3] * curr[5] + prev[5];

            prev = [rslt[0],rslt[1],rslt[2],rslt[3],rslt[4],rslt[5]];
        }
        return rslt;
    }

// turns a matrix into its rotate, scale and skew components
// algorithm from http://hg.mozilla.org/mozilla-central/file/7cb3e9795d04/layout/style/nsStyleAnimation.cpp
    function unmatrix(matrix) {
        var
            scaleX
            , scaleY
            , skew
            , A = matrix[0]
            , B = matrix[1]
            , C = matrix[2]
            , D = matrix[3]
            ;

        // Make sure matrix is not singular
        if ( A * D - B * C ) {
            // step (3)
            scaleX = Math.sqrt( A * A + B * B );
            A /= scaleX;
            B /= scaleX;
            // step (4)
            skew = A * C + B * D;
            C -= A * skew;
            D -= B * skew;
            // step (5)
            scaleY = Math.sqrt( C * C + D * D );
            C /= scaleY;
            D /= scaleY;
            skew /= scaleY;
            // step (6)
            if ( A * D < B * C ) {
                A = -A;
                B = -B;
                skew = -skew;
                scaleX = -scaleX;
            }

            // matrix is singular and cannot be interpolated
        } else {
            // In this case the elem shouldn't be rendered, hence scale == 0
            scaleX = scaleY = skew = 0;
        }

        // The recomposition order is very important
        // see http://hg.mozilla.org/mozilla-central/file/7cb3e9795d04/layout/style/nsStyleAnimation.cpp#l971
        return [
            [_translate, [+matrix[4], +matrix[5]]],
            [_rotate, Math.atan2(B, A)],
            [_skew + "X", Math.atan(skew)],
            [_scale, [scaleX, scaleY]]
        ];
    }

// build the list of transform functions to interpolate
// use the algorithm described at http://dev.w3.org/csswg/css3-2d-transforms/#animation
    function interpolationList( start, end ) {
        var list = {
                start: [],
                end: []
            },
            i = -1, l,
            currStart, currEnd, currType;

        // get rid of affine transform matrix
        ( start == "none" || isAffine( start ) ) && ( start = "" );
        ( end == "none" || isAffine( end ) ) && ( end = "" );

        // if end starts with the current computed style, this is a relative animation
        // store computed style as the origin, remove it from start and end
        if ( start && end && !end.indexOf("matrix") && toArray( start ).join() == toArray( end.split(")")[0] ).join() ) {
            list.origin = start;
            start = "";
            end = end.slice( end.indexOf(")") +1 );
        }

        if ( !start && !end ) { return; }

        // start or end are affine, or list of transform functions are identical
        // => functions will be interpolated individually
        if ( !start || !end || functionList(start) == functionList(end) ) {

            start && ( start = start.split(")") ) && ( l = start.length );
            end && ( end = end.split(")") ) && ( l = end.length );

            while ( ++i < l-1 ) {
                start[i] && ( currStart = start[i].split("(") );
                end[i] && ( currEnd = end[i].split("(") );
                currType = $.trim( ( currStart || currEnd )[0] );

                append( list.start, parseFunction( currType, currStart ? currStart[1] : 0 ) );
                append( list.end, parseFunction( currType, currEnd ? currEnd[1] : 0 ) );
            }

            // otherwise, functions will be composed to a single matrix
        } else {
            list.start = unmatrix(matrix(start));
            list.end = unmatrix(matrix(end))
        }

        return list;
    }

    function parseFunction( type, value ) {
        var
        // default value is 1 for scale, 0 otherwise
            defaultValue = +(!type.indexOf(_scale)),
            scaleX,
        // remove X/Y from scaleX/Y & translateX/Y, not from skew
            cat = type.replace( /e[XY]/, "e" );

        switch ( type ) {
            case _translate+"Y":
            case _scale+"Y":

                value = [
                    defaultValue,
                    value ?
                        parseFloat( value ):
                        defaultValue
                ];
                break;

            case _translate+"X":
            case _translate:
            case _scale+"X":
                scaleX = 1;
            case _scale:

                value = value ?
                ( value = value.split(",") ) &&	[
                    parseFloat( value[0] ),
                    parseFloat( value.length>1 ? value[1] : type == _scale ? scaleX || value[0] : defaultValue+"" )
                ]:
                    [defaultValue, defaultValue];
                break;

            case _skew+"X":
            case _skew+"Y":
            case _rotate:
                value = value ? toRadian( value ) : 0;
                break;

            case _matrix:
                return unmatrix( value ? toArray(value) : [1,0,0,1,0,0] );
                break;
        }

        return [[ cat, value ]];
    }

    function isAffine( matrix ) {
        return rAffine.test(matrix);
    }

    function functionList( transform ) {
        return transform.replace(/(?:\([^)]*\))|\s/g, "");
    }

    function append( arr1, arr2, value ) {
        while ( value = arr2.shift() ) {
            arr1.push( value );
        }
    }

// converts an angle string in any unit to a radian Float
    function toRadian(value) {
        return ~value.indexOf("deg") ?
        parseInt(value,10) * (Math.PI * 2 / 360):
            ~value.indexOf("grad") ?
            parseInt(value,10) * (Math.PI/200):
                parseFloat(value);
    }

// Converts "matrix(A,B,C,D,X,Y)" to [A,B,C,D,X,Y]
    function toArray(matrix) {
        // remove the unit of X and Y for Firefox
        matrix = /([^,]*),([^,]*),([^,]*),([^,]*),([^,p]*)(?:px)?,([^)p]*)(?:px)?/.exec(matrix);
        return [matrix[1], matrix[2], matrix[3], matrix[4], matrix[5], matrix[6]];
    }

    $.transform = {
        centerOrigin: "margin"
    };

})( jQuery, window, document, Math );

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
var iscrollList = {};   //存放插件生成的滚动页面引用对象
;(function(){
    'use strict';
    $.fn.mSlider = function (opt) {
        var options = $.extend({
            nativeScroll:!0, //默认启动原生滚动
            mainScroll:!1,
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
                isScrollPage = !1;
                scrollBottom = !1;
                scrollTop = !1;
                after(_$cur,_$prev,direction)
            },function(err){
                console && console.log((err))
            });
        }
        /*slideUp*/
        function slideUp(){
            if(treeDate.x === 0){
                $cur = treeDate.childrenFirstDom[treeDate.y];
                if(treeDate.y < treeDate.length -1 && treeDate.length > 1){
                    isAction = !0;
                    treeDate.y++;
                    treeDate.actionIndex++;
                    $next = treeDate.childrenFirstDom[treeDate.y];
                    switchSlide($cur,$next,'Up');
                }
            }
        }
        /*slideDown*/
        function slideDown(){
            if(treeDate.x === 0){
                $cur = treeDate.childrenFirstDom[treeDate.y];
                if(treeDate.y > 0){
                    isAction = !0;
                    treeDate.y--;
                    treeDate.actionIndex--;
                    $next = treeDate.childrenFirstDom[treeDate.y];
                    switchSlide($cur,$next,'Down');
                }
            }
        }
        /*slideLeft*/
        function slideLeft(){
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
                switchSlide($cur,$next,'Left');
            }else{
                $cur = treeDate.childrenFirstDom[treeDate.x];
                if(treeDate.x < treeDate.childrenDom[treeDate.y].length -1){
                    isAction = !0;
                    treeDate.x++;
                    $next = treeDate.childrenDom[treeDate.y][treeDate.x];
                    switchSlide($cur,$next,'Left');
                }
            }
        }
        /*slideRight*/
        function slideRight(){
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
                switchSlide($cur,$next,'Right');
            }else{
                $cur = treeDate.childrenDom[treeDate.y][treeDate.x];
                if(treeDate.x > 0){
                    treeDate.x--;
                    isAction = !0;
                    $next = treeDate.childrenDom[treeDate.y][treeDate.x];
                    switchSlide($cur,$next,'Right');
                }
            }
        }
        /*IScroll*/
        function createIScroll(ele){
            return new IScroll(ele, {
                scrollbars: true,
                interactiveScrollbars: true,
                shrinkScrollbars: 'scale',
                fadeScrollbars: true,
                click:true,
                    probeType:1
            }
            );
        }
        /*fixCreateIScroll*/
        function fixCreateIScroll(i){
            console && console.log('正在尝试外部链接加载文件');
            $.getScript('//cdn.bootcss.com/iScroll/5.2.0/iscroll-probe.min.js').done(function(){
                $.each(failScrollElement,function(i2,ele){
                    try {
                        createIScroll(ele);
                        //iscrollList["scrollPage" + i + "_" + i2 ] = createIScroll(ele2);
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
        //var iscrollList = {};   //存放插件生成的滚动页面引用对象
        var scrollEnd = !1;     //滚动到底部或顶部
        var scrollBottom = !1;     //滚动到底部
        var scrollTop = !1;     //滚动到顶部
        var slideArrow;         //记录滑动方向
        var isScrollPage = !1; //是否为滚动页面类型
        var maxH;             //滚动页面高度
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


                            if(!options.mainScroll){
                                createIScroll(ele2);
                            }else{
                                iscrollList["scrollPage" + i + "_" + i2 ] = createIScroll(ele2);
                                if( i2 === 0){   //主轴上的滚动页面才需要这样,
                                    iscrollList["scrollPage" + i + "_" + i2 ].on('scrollStart', function () {
                                        isScrollPage = !0;
                                        maxH = this.maxScrollY;
                                    });

                                    iscrollList["scrollPage" + i + "_" + i2 ].on('scroll',function(){
                                        console.log('this.y:', this.y);

                                        if(this.y > 30){
                                            scrollTop = !0;
                                            scrollBottom = !1;
                                        }else if(this.y < maxH - 30){
                                            scrollBottom = !0;
                                            scrollTop = !1;
                                        }else{
                                            scrollBottom = !1;
                                            scrollTop = !1;
                                        }
                                        return false;
                                    });

                                    iscrollList["scrollPage" + i + "_" + i2 ].on('scrollEnd', function () {
                                        if(scrollTop){
                                            slideDown();
                                        }else if(scrollBottom){
                                            slideUp();
                                        }
                                    });
                                }
                            }

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

            console.log(iscrollList);

            $.each(treeDate.children,function(i,ele){
                treeDate.childrenDom.push(ele.dom); //压入数组
            });

            treeDate.length = treeDate.childrenFirstDom.length;

            //启动插件滚动 阻止默认事件
            if(!options.nativeScroll){
                document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
            }
            //启动插滚动插件修正方案 [修复方案不支持 主轴,无法获取 行数]
            if(IScrollState && !options.mainScroll){
                fixCreateIScroll();
            }

            new AlloyFinger(this, {
                distance:100,
                touchStart: function (e) {options.touchStart(e);},
                touchMove: function (e) {options.touchMove(e)},
                touchEnd: function (e) {options.touchEnd(e)},
                touchCancel: function (e) {options.touchCancel(e)},
                swipe: function (evt) {
                    //return;
                   // if(scrollBottom){return}
                    if(isAction){return;}
                    /*
                    * Up/Down  上下滑,先判断 y 坐标
                    * Left/Right   先 获取 y 坐标 ,代入 y坐标 得出 对应子元素数组 判断 子元素数组长度是否超过 2
                    * */
                    switch (evt.direction){
                        case 'Up':
                            slideArrow = 'Up';
                            if(!isScrollPage){
                                slideUp();
                            }
                           // slideUp();
                            break;
                        case 'Down':
                            if(!isScrollPage){
                                slideDown();
                            }
                            slideArrow = 'Down';
                            //slideDown();
                            break;
                        case 'Left':
                            slideArrow = 'Left';
                            slideLeft();
                            break;
                        case 'Right':
                            slideArrow = 'Right';
                            slideRight();
                            break;
                    }
                    console.log('slideArrow:',slideArrow);
                    console.log('isScrollPage:',isScrollPage);
                },
                singleTap: function (evt) {}
            });






        });
    }
})(jQuery,window,document);

