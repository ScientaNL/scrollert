var Scrollert;
(function (Scrollert) {
    var ScrollbarDimensions = (function () {
        function ScrollbarDimensions() {
        }
        ScrollbarDimensions.calculate = function (containerTrail) {
            var rootElm, curElm, prevElm;
            if (containerTrail.length <= 0) {
                throw new TypeError("Invalid container trail specified for scrollbar dimensions calculation");
            }
            for (var _i = 0, containerTrail_1 = containerTrail; _i < containerTrail_1.length; _i++) {
                var container = containerTrail_1[_i];
                curElm = document.createElement(container.tagName);
                curElm.className = container.classes;
                (prevElm) ? prevElm.append(curElm) : rootElm = curElm;
                prevElm = curElm;
            }
            rootElm.style.position = "fixed";
            rootElm.style.top = "0";
            rootElm.style.left = "0";
            rootElm.style.visibility = "hidden";
            rootElm.style.width = "200px";
            rootElm.style.height = "200px";
            curElm.style.overflow = "hidden";
            document.body.appendChild(rootElm);
            var withoutScrollbars = curElm.clientWidth;
            curElm.style.overflow = "scroll";
            var withScrollbars = curElm.clientWidth;
            document.body.removeChild(rootElm);
            return withoutScrollbars - withScrollbars;
        };
        return ScrollbarDimensions;
    }());
    Scrollert.ScrollbarDimensions = ScrollbarDimensions;
})(Scrollert || (Scrollert = {}));
/// <reference path="../typings/index.d.ts" />
/// <reference path="ScrollbarDimensions.ts" />
var Scrollert;
(function (Scrollert) {
    var Plugin = (function () {
        function Plugin(containerElm, options) {
            var _this = this;
            this.containerElm = containerElm;
            this.options = {
                axes: ['x', 'y'],
                preventOuterScroll: false,
                cssPrefix: 'scrollert',
                eventNamespace: 'scrollert',
                contentSelector: null
            };
            this.scrollbarElms = {
                x: null,
                y: null
            };
            this.scrollCache = {
                x: null,
                y: null
            };
            this.onScrollWheel = function (event) {
                var originalEvent = event.originalEvent;
                for (var _i = 0, _a = _this.options.axes; _i < _a.length; _i++) {
                    var axis = _a[_i];
                    var delta = originalEvent['delta' + axis.toUpperCase()];
                    if (delta !== 0)
                        _this.preventOuterScroll(axis, (delta < 0) ? "heen" : "weer", event);
                }
            };
            this.onKeyDown = function (event) {
                if (document.activeElement !== _this.contentElm[0]) {
                    return;
                }
                if ([37, 38, 33, 36].indexOf(event.which) !== -1) {
                    _this.preventOuterScroll([38, 33, 36].indexOf(event.which) !== -1 ? "y" : "x", "heen", event);
                }
                else if ([39, 40, 32, 34, 35].indexOf(event.which) !== -1) {
                    _this.preventOuterScroll([40, 35, 36, 34, 32].indexOf(event.which) !== -1 ? "y" : "x", "weer", event);
                }
            };
            this.offsetContentElmScrollbars = function (force) {
                if (force === void 0) { force = false; }
                var scrollbarDimension = Scrollert.ScrollbarDimensions.calculate([
                    { tagName: _this.containerElm.prop('tagName'), classes: _this.containerElm.prop('class') },
                    { tagName: _this.contentElm.prop('tagName'), classes: _this.contentElm.prop('class') }
                ]);
                var cssValues = {};
                if (_this.options.axes.indexOf('y') !== -1) {
                    cssValues['overflow-y'] = "scroll";
                    if (scrollbarDimension)
                        cssValues['right'] = -scrollbarDimension + "px";
                }
                if (_this.options.axes.indexOf('x') !== -1) {
                    cssValues['overflow-x'] = "scroll";
                    if (scrollbarDimension)
                        cssValues['bottom'] = -scrollbarDimension + "px";
                }
                if (!_this.originalCssValues)
                    _this.originalCssValues = _this.contentElm.css(Object.keys(cssValues));
                _this.contentElm.css(cssValues);
            };
            this.onScrollbarMousedown = function (axis, scrollbarElm, trackElm, event) {
                if (event.target === scrollbarElm[0]) {
                    _this.scrollToClickedPosition(axis, event);
                    _this.trackMousedown(axis, scrollbarElm, event); //Also start dragging the track to do a correction drag after clicking the scrollbar
                }
                else if (event.target === trackElm[0]) {
                    _this.trackMousedown(axis, scrollbarElm, event);
                }
            };
            this.options = jQuery.extend({}, this.options, options);
            this.options.eventNamespace = this.options.eventNamespace + ++Plugin.eventNamespaceId;
            this.contentElm = this.containerElm.children(this.options.contentSelector || '.' + this.options.cssPrefix + '-content');
            this.offsetContentElmScrollbars();
            this.update();
            if (this.options.preventOuterScroll === true) {
                // Prevent outer scroll while scrolling the contentElm
                this.contentElm.on('wheel.' + this.options.eventNamespace, this.onScrollWheel);
            }
            //There could be a zoom change. Zoom is almost not indistinguishable from resize events. So on window resize, recalculate contentElm offet
            jQuery(window).on('resize.' + this.options.eventNamespace, this.offsetContentElmScrollbars.bind(this, true));
        }
        Plugin.prototype.update = function () {
            var repositionTrack = false;
            for (var _i = 0, _a = this.options.axes; _i < _a.length; _i++) {
                var axis = _a[_i];
                this.initAxis(axis);
                if (this.getValue(this.contentElm, "scrollPos", axis) !== 0)
                    repositionTrack = true;
            }
            //If we start on a scroll position
            if (repositionTrack === true) {
                this.contentElm.trigger('scroll.' + this.options.eventNamespace);
            }
        };
        Plugin.prototype.addScrollbar = function (axis, containerElm) {
            var scrollbarElm, trackElm;
            containerElm.append(scrollbarElm = jQuery('<div />').addClass(this.options.cssPrefix + '-scrollbar-' + axis)
                .append(trackElm = jQuery('<div />').addClass(this.options.cssPrefix + '-track')));
            return {
                scrollbar: scrollbarElm,
                track: trackElm
            };
        };
        ;
        Plugin.prototype.preventOuterScroll = function (axis, direction, event) {
            var scrollPos = this.getValue(this.contentElm, "scrollPos", axis);
            switch (direction) {
                case "heen":
                    if (scrollPos <= 0)
                        event.preventDefault();
                    break;
                case "weer":
                    var scrollSize = this.getValue(this.contentElm, "scrollSize", axis), clientSize = this.getValue(this.contentElm, "clientSize", axis);
                    if (scrollSize - scrollPos === clientSize)
                        event.preventDefault();
                    break;
            }
        };
        Plugin.prototype.initAxis = function (axis) {
            var hasScroll = this.hasScroll(axis);
            if (hasScroll === true && this.scrollbarElms[axis] === null) {
                var elms = this.addScrollbar(axis, this.containerElm), scrollbarElm = elms.scrollbar, trackElm = elms.track;
                this.resizeTrack(axis, scrollbarElm, trackElm);
                scrollbarElm.on('mousedown.' + axis + '.' + this.options.eventNamespace, this.onScrollbarMousedown.bind(this, axis, scrollbarElm, trackElm));
                this.contentElm.on('scroll.' + axis + '.' + this.options.eventNamespace, this.onScroll.bind(this, axis, scrollbarElm, trackElm));
                this.scrollbarElms[axis] = scrollbarElm;
            }
            else if (hasScroll === false && this.scrollbarElms[axis] !== null) {
                this.scrollbarElms[axis].remove();
                this.contentElm.off('.' + axis + "." + this.options.eventNamespace);
            }
        };
        Plugin.prototype.getValue = function (elm, property, axis) {
            switch (property) {
                case 'size':
                    return elm[axis === 'y' ? 'outerHeight' : 'outerWidth']();
                case 'clientSize':
                    return elm[0][axis === 'y' ? 'clientHeight' : 'clientWidth'];
                case 'scrollSize':
                    return elm[0][axis === 'y' ? 'scrollHeight' : 'scrollWidth'];
                case 'scrollPos':
                    return elm[axis === 'y' ? 'scrollTop' : 'scrollLeft']();
            }
        };
        Plugin.prototype.hasScroll = function (axis) {
            var contentSize = this.getValue(this.contentElm, 'size', axis), contentScrollSize = this.getValue(this.contentElm, 'scrollSize', axis);
            console.log(contentSize, contentScrollSize);
            return contentSize < contentScrollSize;
        };
        Plugin.prototype.resizeTrack = function (axis, scrollbarElm, trackElm) {
            var contentSize = this.getValue(this.contentElm, 'size', axis), contentScrollSize = this.getValue(this.contentElm, 'scrollSize', axis);
            if (contentSize < contentScrollSize) {
                scrollbarElm.removeClass('hidden');
                var scrollbarDimension = this.getValue(scrollbarElm, 'size', axis);
                trackElm.css(axis === 'y' ? 'height' : 'width', scrollbarDimension * (contentSize / contentScrollSize));
            }
            else {
                scrollbarElm.addClass('hidden');
            }
        };
        Plugin.prototype.positionTrack = function (axis, scrollbarElm, trackElm) {
            var relTrackPos = this.getValue(this.contentElm, 'scrollPos', axis)
                / (this.getValue(this.contentElm, 'scrollSize', axis) - this.getValue(this.contentElm, 'size', axis)), trackDimension = this.getValue(trackElm, 'size', axis), scrollbarDimension = this.getValue(scrollbarElm, 'size', axis);
            trackElm.css(axis === 'y' ? 'top' : 'left', (scrollbarDimension - trackDimension) * relTrackPos);
        };
        Plugin.prototype.onScroll = function (axis, scrollbarElm, trackElm, event) {
            if (this.scrollCache[axis] !== (this.scrollCache[axis] = this.getValue(this.contentElm, 'scrollPos', axis))) {
                this.positionTrack(axis, scrollbarElm, trackElm);
            }
        };
        Plugin.prototype.trackMousedown = function (axis, scrollbarElm, event) {
            event.preventDefault();
            var origin = {
                startPos: event[axis === 'y' ? 'pageY' : 'pageX'],
                startScroll: this.contentElm[axis === 'y' ? 'scrollTop' : 'scrollLeft'](),
                scrollFactor: this.getValue(this.contentElm, 'scrollSize', axis) / this.getValue(scrollbarElm, 'size', axis) //How big if the scrollbar element compared to the content scroll
            }, $window = jQuery(window), moveHandler = this.onTrackDrag.bind(this, axis, origin);
            $window
                .on('mousemove.' + this.options.eventNamespace, moveHandler)
                .one('mouseup.' + this.options.eventNamespace, function () { $window.off('mousemove', moveHandler); });
        };
        Plugin.prototype.onTrackDrag = function (axis, origin, event) {
            event.preventDefault();
            this.contentElm[axis === 'y' ? 'scrollTop' : 'scrollLeft'](origin.startScroll + (event[axis === 'y' ? 'pageY' : 'pageX'] - origin.startPos) * origin.scrollFactor);
        };
        Plugin.prototype.scrollToClickedPosition = function (axis, event) {
            event.preventDefault();
            var offset = event[(axis === 'y') ? 'offsetY' : 'offsetX'];
            if (offset <= 10)
                offset = 0; //Little tweak to make it easier to go back to top
            this.contentElm[axis === 'y' ? 'scrollTop' : 'scrollLeft'](this.getValue(this.contentElm, 'scrollSize', axis) * (offset / this.getValue(jQuery(event.target), 'size', axis)));
        };
        Plugin.prototype.destroy = function () {
            this.contentElm.off('.' + this.options.eventNamespace);
            jQuery(window).off('.' + this.options.eventNamespace);
            for (var axis in this.scrollbarElms) {
                if (this.scrollbarElms.hasOwnProperty(axis) === true && this.scrollbarElms[axis] instanceof jQuery === true) {
                    this.scrollbarElms[axis].remove();
                }
            }
            this.contentElm.css(this.originalCssValues);
        };
        Plugin.NAME = 'scrollert';
        Plugin.eventNamespaceId = 0;
        return Plugin;
    }());
    Scrollert.Plugin = Plugin;
})(Scrollert || (Scrollert = {}));
/// <reference path="../typings/index.d.ts" />
/// <reference path="ScrollertPlugin.ts" />
jQuery.fn[Scrollert.Plugin.NAME] = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    var action = typeof args[0] === "string" ? args[0] : "init", options = (typeof args[1] === "object")
        ? args[1]
        : (typeof args[0] === "object") ? args[0] : {};
    return this.each(function () {
        var elm = jQuery(this), key = "plugin-" + Scrollert.Plugin.NAME, plugin = elm.data(key);
        if (action === "init" && plugin instanceof Scrollert.Plugin === false) {
            elm.data(key, plugin = new Scrollert.Plugin(jQuery(this), options));
        }
        else if (plugin instanceof Scrollert.Plugin === false) {
            throw new TypeError("The Scrollert plugin is not yet initialized");
        }
        switch (action) {
            case "init":
                return;
            case "update":
                plugin.update();
                break;
            case "destroy":
                plugin.destroy();
                elm.removeData(key);
                break;
            default:
                throw new TypeError("Invalid Scrollert action " + action);
        }
    });
};
