(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], factory);
	} else if (typeof module === 'object' && module.exports) {
		// Node/CommonJS
		module.exports = function( root, jQuery ) {
			if ( jQuery === undefined ) {
				// require('jQuery') returns a factory that requires window to
				// build a jQuery instance, we normalize how we use modules
				// that require this pattern but the window provided is a noop
				// if it's defined (how jquery works)
				if ( typeof window !== 'undefined' ) {
					jQuery = require('jquery');
				}
				else {
					jQuery = require('jquery')(root);
				}
			}
			factory(jQuery);
			return jQuery;
		};
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function (jQuery) {
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
                (prevElm) ? prevElm.appendChild(curElm) : rootElm = curElm;
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
                contentSelector: null,
                useNativeFloatingScrollbars: true
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
                    if (delta && _this.scrollbarElms[axis]
                        && (event.target === _this.scrollbarElms[axis].scrollbar.get(0)
                            || event.target === _this.scrollbarElms[axis].track.get(0))) {
                        event.preventDefault();
                        _this.contentElm[axis === 'y' ? 'scrollTop' : 'scrollLeft'](_this.getValue(_this.contentElm, 'scrollPos', axis) + delta);
                    }
                    else if (_this.options.preventOuterScroll === true) {
                        if (delta !== 0)
                            _this.preventOuterScroll(axis, (delta < 0) ? "heen" : "weer", event);
                    }
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
                ]), correctForFloatingScrollbar = false;
                if (scrollbarDimension === 0 && _this.hasVisibleFloatingScrollbar() === true) {
                    correctForFloatingScrollbar = true;
                    scrollbarDimension = 20;
                }
                var cssValues = {};
                if (_this.options.axes.indexOf('y') !== -1) {
                    cssValues['overflow-y'] = "scroll";
                    if (scrollbarDimension)
                        cssValues['right'] = -scrollbarDimension + "px";
                    if (correctForFloatingScrollbar)
                        cssValues['padding-right'] = false;
                }
                if (_this.options.axes.indexOf('x') !== -1) {
                    cssValues['overflow-x'] = "scroll";
                    if (scrollbarDimension)
                        cssValues['bottom'] = -scrollbarDimension + "px";
                    if (correctForFloatingScrollbar)
                        cssValues['padding-bottom'] = false;
                }
                if (!_this.originalCssValues)
                    _this.originalCssValues = _this.contentElm.css(Object.keys(cssValues));
                if (correctForFloatingScrollbar && cssValues['padding-right'] === false) {
                    cssValues['padding-right'] = (parseInt(_this.originalCssValues['padding-right']) + scrollbarDimension) + "px";
                }
                if (correctForFloatingScrollbar && cssValues['padding-bottom'] === false) {
                    cssValues['padding-bottom'] = (parseInt(_this.originalCssValues['padding-bottom']) + scrollbarDimension) + "px";
                }
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
            var browserHasFloatingScrollbars = false;
            if (this.options.useNativeFloatingScrollbars === true) {
                browserHasFloatingScrollbars = Scrollert.ScrollbarDimensions.calculate([{ tagName: "div", classes: "" }]) <= 0;
            }
            if (this.options.useNativeFloatingScrollbars === false || browserHasFloatingScrollbars === false) {
                this.offsetContentElmScrollbars();
                this.update();
                // Relay scroll event on scrollbar/track to content and prevent outer scroll.
                this.containerElm.on('wheel.' + this.options.eventNamespace, this.onScrollWheel);
                /*
                 * @todo The keydown outer scroll prevention is not working yet.
                 */
                if (this.options.preventOuterScroll === true) {
                }
                //There could be a zoom change. Zoom is almost not indistinguishable from resize events. So on window resize, recalculate contentElm offet
                jQuery(window).on('resize.' + this.options.eventNamespace, this.offsetContentElmScrollbars.bind(this, true));
            }
            else {
                this.contentElm.addClass(this.options.cssPrefix + "-disabled");
            }
        }
        Plugin.prototype.update = function () {
            var repositionTrack = false;
            for (var _i = 0, _a = this.options.axes; _i < _a.length; _i++) {
                var axis = _a[_i];
                this.updateAxis(axis);
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
            containerElm.append(scrollbarElm = jQuery('<div />').addClass(this.options.cssPrefix + '-scrollbar' + ' '
                + this.options.cssPrefix + '-scrollbar-' + axis).append(trackElm = jQuery('<div />').addClass(this.options.cssPrefix + '-track')));
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
        /**
         * Scrollbars by default in OSX don't take up space but are floating. We must correct for this, but how do we
         * know if we must correct? Webkit based browsers have the pseudo css-selector ::-webkit-scrollbar by which the
         * problem is solved. For all other engines another strategy must
         *
         * @returns {boolean}
         */
        Plugin.prototype.hasVisibleFloatingScrollbar = function () {
            return window.navigator.userAgent.match(/AppleWebKit/i) === null;
        };
        Plugin.prototype.updateAxis = function (axis) {
            var hasScroll = this.hasScroll(axis);
            if (hasScroll === true && this.scrollbarElms[axis] === null) {
                this.containerElm.addClass(this.options.cssPrefix + "-axis-" + axis);
                var elms = this.addScrollbar(axis, this.containerElm), scrollbarElm = elms.scrollbar, trackElm = elms.track;
                scrollbarElm.on('mousedown.' + axis + '.' + this.options.eventNamespace, this.onScrollbarMousedown.bind(this, axis, scrollbarElm, trackElm));
                this.contentElm.on('scroll.' + axis + '.' + this.options.eventNamespace, this.onScroll.bind(this, axis, scrollbarElm, trackElm));
                this.scrollbarElms[axis] = elms;
            }
            else if (hasScroll === false && this.scrollbarElms[axis] !== null) {
                this.containerElm.removeClass(this.options.cssPrefix + "-axis-" + axis);
                this.scrollbarElms[axis].scrollbar.remove();
                this.scrollbarElms[axis] = null;
                this.contentElm.off('.' + axis + "." + this.options.eventNamespace);
            }
            //Resize track according to current scroll dimensions
            if (this.scrollbarElms[axis] !== null) {
                this.resizeTrack(axis, this.scrollbarElms[axis].scrollbar, this.scrollbarElms[axis].track);
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
            var contentSize = Math.round(this.getValue(this.contentElm, 'size', axis)), contentScrollSize = Math.round(this.getValue(this.contentElm, 'scrollSize', axis));
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
            trackElm.css(axis === 'y' ? 'top' : 'left', (scrollbarDimension - trackDimension) * Math.min(relTrackPos, 1));
        };
        Plugin.prototype.onScroll = function (axis, scrollbarElm, trackElm, event) {
            if (this.scrollCache[axis] !== (this.scrollCache[axis] = this.getValue(this.contentElm, 'scrollPos', axis))) {
                this.positionTrack(axis, scrollbarElm, trackElm);
            }
        };
        Plugin.prototype.trackMousedown = function (axis, scrollbarElm, event) {
            var _this = this;
            event.preventDefault();
            var origin = {
                startPos: event[axis === 'y' ? 'pageY' : 'pageX'],
                startScroll: this.contentElm[axis === 'y' ? 'scrollTop' : 'scrollLeft'](),
                scrollFactor: this.getValue(this.contentElm, 'scrollSize', axis) / this.getValue(scrollbarElm, 'size', axis) //How big if the scrollbar element compared to the content scroll
            }, $window = jQuery(window), moveHandler = this.onTrackDrag.bind(this, axis, origin);
            this.containerElm.addClass(this.options.cssPrefix + "-trackdrag-" + axis);
            $window
                .on('mousemove.' + this.options.eventNamespace, moveHandler)
                .one('mouseup.' + this.options.eventNamespace, function () {
                $window.off('mousemove', moveHandler);
                _this.containerElm.removeClass(_this.options.cssPrefix + "-trackdrag-" + axis);
            });
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
                if (this.scrollbarElms[axis] && this.scrollbarElms[axis].scrollbar instanceof jQuery === true) {
                    this.scrollbarElms[axis].scrollbar.remove();
                    this.scrollbarElms[axis] = null;
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


	return jQuery;
}));
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNjcm9sbGJhckRpbWVuc2lvbnMudHMiLCJTY3JvbGxlcnRQbHVnaW4udHMiLCJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFPLFNBQVMsQ0FpRGY7QUFqREQsV0FBTyxTQUFTLEVBQ2hCLENBQUM7SUFPRztRQUFBO1FBd0NBLENBQUM7UUF0Q2lCLDZCQUFTLEdBQXZCLFVBQXdCLGNBQW9DO1lBRXhELElBQUksT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUM7WUFFN0IsRUFBRSxDQUFBLENBQUMsY0FBYyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FDOUIsQ0FBQztnQkFDRyxNQUFNLElBQUksU0FBUyxDQUFDLHdFQUF3RSxDQUFDLENBQUM7WUFDbEcsQ0FBQztZQUVELEdBQUcsQ0FBQSxDQUFrQixVQUFjLEVBQWQsaUNBQWMsRUFBZCw0QkFBYyxFQUFkLElBQWMsQ0FBQztnQkFBaEMsSUFBSSxTQUFTLHVCQUFBO2dCQUViLE1BQU0sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDO2dCQUVyQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFFLEdBQUcsT0FBTyxHQUFHLE1BQU0sQ0FBQztnQkFDNUQsT0FBTyxHQUFHLE1BQU0sQ0FBRTthQUNyQjtZQUVELE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUNqQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7WUFDeEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1lBQ3pCLE9BQU8sQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQztZQUNwQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUM7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QztnQkFDcEIsS0FBSyxDQUFDO1lBQ1Y7Z0JBQ0ksTUFBTSxJQUFJLFNBQVMsQ0FBQywyQkFBMkIsR0FBRyxNQUFNLENBQUMsQ0FBQztRQUNsRSxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFUCxDQUFDLENBQUMiLCJmaWxlIjoic2Nyb2xsZXJ0LmpzIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlIFNjcm9sbGVydFxue1xuICAgIGV4cG9ydCBpbnRlcmZhY2UgU2Nyb2xsYmFyRGltZW5zaW9uc1xuICAgIHtcbiAgICAgICAgdGFnTmFtZTpzdHJpbmc7XG4gICAgICAgIGNsYXNzZXM6c3RyaW5nO1xuICAgIH1cblxuICAgIGV4cG9ydCBjbGFzcyBTY3JvbGxiYXJEaW1lbnNpb25zXG4gICAge1xuICAgICAgICBwdWJsaWMgc3RhdGljIGNhbGN1bGF0ZShjb250YWluZXJUcmFpbDpTY3JvbGxiYXJEaW1lbnNpb25zW10pOm51bWJlclxuICAgICAgICB7XG4gICAgICAgICAgICBsZXQgcm9vdEVsbSwgY3VyRWxtLCBwcmV2RWxtO1xuXG4gICAgICAgICAgICBpZihjb250YWluZXJUcmFpbC5sZW5ndGggPD0gMClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBjb250YWluZXIgdHJhaWwgc3BlY2lmaWVkIGZvciBzY3JvbGxiYXIgZGltZW5zaW9ucyBjYWxjdWxhdGlvblwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yKGxldCBjb250YWluZXIgb2YgY29udGFpbmVyVHJhaWwpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY3VyRWxtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChjb250YWluZXIudGFnTmFtZSk7XG4gICAgICAgICAgICAgICAgY3VyRWxtLmNsYXNzTmFtZSA9IGNvbnRhaW5lci5jbGFzc2VzO1xuXG4gICAgICAgICAgICAgICAgKHByZXZFbG0pID8gcHJldkVsbS5hcHBlbmRDaGlsZChjdXJFbG0gKSA6IHJvb3RFbG0gPSBjdXJFbG07XG4gICAgICAgICAgICAgICAgcHJldkVsbSA9IGN1ckVsbSA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJvb3RFbG0uc3R5bGUucG9zaXRpb24gPSBcImZpeGVkXCI7XG4gICAgICAgICAgICByb290RWxtLnN0eWxlLnRvcCA9IFwiMFwiO1xuICAgICAgICAgICAgcm9vdEVsbS5zdHlsZS5sZWZ0ID0gXCIwXCI7XG4gICAgICAgICAgICByb290RWxtLnN0eWxlLnZpc2liaWxpdHkgPSBcImhpZGRlblwiO1xuICAgICAgICAgICAgcm9vdEVsbS5zdHlsZS53aWR0aCA9IFwiMjAwcHhcIjtcbiAgICAgICAgICAgIHJvb3RFbG0uc3R5bGUuaGVpZ2h0ID0gXCIyMDBweFwiO1xuXG4gICAgICAgICAgICBjdXJFbG0uc3R5bGUub3ZlcmZsb3cgPSBcImhpZGRlblwiO1xuXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHJvb3RFbG0pO1xuICAgICAgICAgICAgbGV0IHdpdGhvdXRTY3JvbGxiYXJzID0gY3VyRWxtLmNsaWVudFdpZHRoO1xuXG4gICAgICAgICAgICBjdXJFbG0uc3R5bGUub3ZlcmZsb3cgPSBcInNjcm9sbFwiO1xuICAgICAgICAgICAgbGV0IHdpdGhTY3JvbGxiYXJzID0gY3VyRWxtLmNsaWVudFdpZHRoO1xuXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHJvb3RFbG0pO1xuXG4gICAgICAgICAgICByZXR1cm4gd2l0aG91dFNjcm9sbGJhcnMgLSB3aXRoU2Nyb2xsYmFycztcblxuICAgICAgICB9XG4gICAgfVxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90eXBpbmdzL2luZGV4LmQudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIlNjcm9sbGJhckRpbWVuc2lvbnMudHNcIiAvPlxuXG5tb2R1bGUgU2Nyb2xsZXJ0IHtcblxuICAgIGV4cG9ydCB0eXBlIEF4aXNUeXBlID0gXCJ4XCIgfCBcInlcIjtcbiAgICB0eXBlIE5vcm1hbGl6ZWRTY3JvbGxQcm9wZXJ0eSA9IFwic2l6ZVwiIHwgXCJzY3JvbGxTaXplXCIgfCBcInNjcm9sbFBvc1wiIHwgXCJjbGllbnRTaXplXCI7XG4gICAgdHlwZSBEaXJlY3Rpb25UeXBlID0gXCJoZWVuXCIgfCBcIndlZXJcIjsgLy9BS0EgIGZvcnRoIGFuZCBiYWNrIChodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PVg3VjA5VG1zdS0wKVxuXG4gICAgaW50ZXJmYWNlIFNjcm9sbGJhckNvbnRhaW5lclxuICAgIHtcbiAgICAgICAgc2Nyb2xsYmFyOkpRdWVyeTtcbiAgICAgICAgdHJhY2s6SlF1ZXJ5O1xuICAgIH1cblxuICAgIGV4cG9ydCBpbnRlcmZhY2UgUGx1Z2luT3B0aW9uc1xuICAgIHtcbiAgICAgICAgYXhlcz86QXhpc1R5cGVbXTtcbiAgICAgICAgcHJldmVudE91dGVyU2Nyb2xsPzpib29sZWFuO1xuICAgICAgICBjc3NQcmVmaXg/OnN0cmluZztcbiAgICAgICAgZXZlbnROYW1lc3BhY2U/OnN0cmluZztcbiAgICAgICAgY29udGVudFNlbGVjdG9yPzpzdHJpbmc7XG5cdFx0dXNlTmF0aXZlRmxvYXRpbmdTY3JvbGxiYXJzPzpib29sZWFuO1xuICAgIH1cblxuICAgIGV4cG9ydCBjbGFzcyBQbHVnaW5cbiAgICB7XG4gICAgICAgIHB1YmxpYyBzdGF0aWMgTkFNRTpzdHJpbmcgPSAnc2Nyb2xsZXJ0JztcblxuICAgICAgICBwcml2YXRlIG9wdGlvbnM6UGx1Z2luT3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGF4ZXM6IFsneCcsICd5J10sXG4gICAgICAgICAgICBwcmV2ZW50T3V0ZXJTY3JvbGw6IGZhbHNlLFxuICAgICAgICAgICAgY3NzUHJlZml4OiAnc2Nyb2xsZXJ0JyxcbiAgICAgICAgICAgIGV2ZW50TmFtZXNwYWNlOiAnc2Nyb2xsZXJ0JyxcbiAgICAgICAgICAgIGNvbnRlbnRTZWxlY3RvcjogbnVsbCxcblx0XHRcdHVzZU5hdGl2ZUZsb2F0aW5nU2Nyb2xsYmFyczogdHJ1ZVxuICAgICAgICB9O1xuXG4gICAgICAgIHByaXZhdGUgY29udGVudEVsbTpKUXVlcnk7XG5cbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgZXZlbnROYW1lc3BhY2VJZCA9IDA7XG5cbiAgICAgICAgcHJpdmF0ZSBzY3JvbGxiYXJFbG1zOnsgW2lkOiBzdHJpbmddIDogU2Nyb2xsYmFyQ29udGFpbmVyIH0gPSB7XG4gICAgICAgICAgICB4OiBudWxsLFxuICAgICAgICAgICAgeTogbnVsbFxuICAgICAgICB9O1xuXG4gICAgICAgIHByaXZhdGUgc2Nyb2xsQ2FjaGUgPSB7XG4gICAgICAgICAgICB4OiBudWxsLFxuICAgICAgICAgICAgeTogbnVsbFxuICAgICAgICB9O1xuXG4gICAgICAgIHByaXZhdGUgb3JpZ2luYWxDc3NWYWx1ZXM6eyBbaWQ6IHN0cmluZ10gOiBzdHJpbmc7IH07XG5cbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBjb250YWluZXJFbG06SlF1ZXJ5LCBvcHRpb25zPzpQbHVnaW5PcHRpb25zKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMgPSBqUXVlcnkuZXh0ZW5kKCB7fSwgdGhpcy5vcHRpb25zLCBvcHRpb25zICk7XG5cbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSA9IHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSArICsrUGx1Z2luLmV2ZW50TmFtZXNwYWNlSWQ7XG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG0gPSB0aGlzLmNvbnRhaW5lckVsbS5jaGlsZHJlbih0aGlzLm9wdGlvbnMuY29udGVudFNlbGVjdG9yIHx8ICcuJyArIHRoaXMub3B0aW9ucy5jc3NQcmVmaXggKyctY29udGVudCcpO1xuXG5cdFx0XHRsZXQgYnJvd3Nlckhhc0Zsb2F0aW5nU2Nyb2xsYmFycyA9IGZhbHNlO1xuXHRcdFx0aWYodGhpcy5vcHRpb25zLnVzZU5hdGl2ZUZsb2F0aW5nU2Nyb2xsYmFycyA9PT0gdHJ1ZSlcbiAgICAgICAgICAgIHtcblx0XHRcdFx0YnJvd3Nlckhhc0Zsb2F0aW5nU2Nyb2xsYmFycyA9IFNjcm9sbGJhckRpbWVuc2lvbnMuY2FsY3VsYXRlKFt7IHRhZ05hbWU6IFwiZGl2XCIsIGNsYXNzZXM6IFwiXCIgfV0pIDw9IDA7XG5cdFx0XHR9XG5cblx0XHRcdGlmKHRoaXMub3B0aW9ucy51c2VOYXRpdmVGbG9hdGluZ1Njcm9sbGJhcnMgPT09IGZhbHNlIHx8IGJyb3dzZXJIYXNGbG9hdGluZ1Njcm9sbGJhcnMgPT09IGZhbHNlKVxuICAgICAgICAgICAge1xuXHRcdFx0XHR0aGlzLm9mZnNldENvbnRlbnRFbG1TY3JvbGxiYXJzKCk7XG5cdFx0XHRcdHRoaXMudXBkYXRlKCk7XG5cblx0XHRcdFx0Ly8gUmVsYXkgc2Nyb2xsIGV2ZW50IG9uIHNjcm9sbGJhci90cmFjayB0byBjb250ZW50IGFuZCBwcmV2ZW50IG91dGVyIHNjcm9sbC5cblx0XHRcdFx0dGhpcy5jb250YWluZXJFbG0ub24oJ3doZWVsLicgKyB0aGlzLm9wdGlvbnMuZXZlbnROYW1lc3BhY2UsIHRoaXMub25TY3JvbGxXaGVlbCk7XG5cblx0XHRcdFx0Lypcblx0XHRcdFx0ICogQHRvZG8gVGhlIGtleWRvd24gb3V0ZXIgc2Nyb2xsIHByZXZlbnRpb24gaXMgbm90IHdvcmtpbmcgeWV0LlxuXHRcdFx0XHQgKi9cblx0XHRcdFx0aWYodGhpcy5vcHRpb25zLnByZXZlbnRPdXRlclNjcm9sbCA9PT0gdHJ1ZSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdC8vIFByZXZlbnQgb3V0ZXIgc2Nyb2xsIG9uIGtleSBkb3duXG5cdFx0XHRcdFx0Ly90aGlzLmNvbnRlbnRFbG0ub24oJ2tleWRvd24uJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSwgdGhpcy5vbktleURvd24pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly9UaGVyZSBjb3VsZCBiZSBhIHpvb20gY2hhbmdlLiBab29tIGlzIGFsbW9zdCBub3QgaW5kaXN0aW5ndWlzaGFibGUgZnJvbSByZXNpemUgZXZlbnRzLiBTbyBvbiB3aW5kb3cgcmVzaXplLCByZWNhbGN1bGF0ZSBjb250ZW50RWxtIG9mZmV0XG5cdFx0XHRcdGpRdWVyeSh3aW5kb3cpLm9uKCdyZXNpemUuJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSwgdGhpcy5vZmZzZXRDb250ZW50RWxtU2Nyb2xsYmFycy5iaW5kKHRoaXMsIHRydWUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtcblx0XHRcdFx0dGhpcy5jb250ZW50RWxtLmFkZENsYXNzKGAke3RoaXMub3B0aW9ucy5jc3NQcmVmaXh9LWRpc2FibGVkYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgdXBkYXRlKClcbiAgICAgICAge1xuICAgICAgICAgICAgbGV0IHJlcG9zaXRpb25UcmFjayA9IGZhbHNlO1xuXG4gICAgICAgICAgICBmb3IobGV0IGF4aXMgb2YgdGhpcy5vcHRpb25zLmF4ZXMpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVBeGlzKGF4aXMpO1xuICAgICAgICAgICAgICAgIGlmKHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCBcInNjcm9sbFBvc1wiLCBheGlzKSAhPT0gMCkgcmVwb3NpdGlvblRyYWNrID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9JZiB3ZSBzdGFydCBvbiBhIHNjcm9sbCBwb3NpdGlvblxuICAgICAgICAgICAgaWYocmVwb3NpdGlvblRyYWNrID09PSB0cnVlKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGVudEVsbS50cmlnZ2VyKCdzY3JvbGwuJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIGFkZFNjcm9sbGJhcihheGlzOkF4aXNUeXBlLCBjb250YWluZXJFbG06SlF1ZXJ5KTpTY3JvbGxiYXJDb250YWluZXJcbiAgICAgICAge1xuICAgICAgICAgICAgbGV0IHNjcm9sbGJhckVsbSwgdHJhY2tFbG07XG5cbiAgICAgICAgICAgIGNvbnRhaW5lckVsbS5hcHBlbmQoXG4gICAgICAgICAgICAgICAgc2Nyb2xsYmFyRWxtID0galF1ZXJ5KCc8ZGl2IC8+JykuYWRkQ2xhc3MoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5jc3NQcmVmaXggKyAnLXNjcm9sbGJhcicgKyAnICdcbiAgICAgICAgICAgICAgICAgICAgKyB0aGlzLm9wdGlvbnMuY3NzUHJlZml4ICsgJy1zY3JvbGxiYXItJyArIGF4aXNcbiAgICAgICAgICAgICAgICApLmFwcGVuZCh0cmFja0VsbSA9IGpRdWVyeSgnPGRpdiAvPicpLmFkZENsYXNzKHRoaXMub3B0aW9ucy5jc3NQcmVmaXggKyAnLXRyYWNrJykpXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHNjcm9sbGJhcjogc2Nyb2xsYmFyRWxtLFxuICAgICAgICAgICAgICAgIHRyYWNrOiB0cmFja0VsbVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcblxuICAgICAgICBwcml2YXRlIG9uU2Nyb2xsV2hlZWwgPSAoZXZlbnQ6SlF1ZXJ5TW91c2VFdmVudE9iamVjdCkgPT4ge1xuXG4gICAgICAgICAgICBsZXQgb3JpZ2luYWxFdmVudDpXaGVlbEV2ZW50ID0gPFdoZWVsRXZlbnQ+ZXZlbnQub3JpZ2luYWxFdmVudDtcblxuICAgICAgICAgICAgZm9yKGxldCBheGlzIG9mIHRoaXMub3B0aW9ucy5heGVzKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxldCBkZWx0YSA9IG9yaWdpbmFsRXZlbnRbJ2RlbHRhJyArIGF4aXMudG9VcHBlckNhc2UoKV07XG5cbiAgICAgICAgICAgICAgICBpZihkZWx0YSAmJiB0aGlzLnNjcm9sbGJhckVsbXNbYXhpc11cbiAgICAgICAgICAgICAgICAgICAgJiYgKGV2ZW50LnRhcmdldCA9PT0gdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdLnNjcm9sbGJhci5nZXQoMClcbiAgICAgICAgICAgICAgICAgICAgICAgIHx8IGV2ZW50LnRhcmdldCA9PT0gdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdLnRyYWNrLmdldCgwKVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG1bYXhpcyA9PT0neScgPyAnc2Nyb2xsVG9wJyA6ICdzY3JvbGxMZWZ0J10oXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgJ3Njcm9sbFBvcycsIGF4aXMpICsgZGVsdGFcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZih0aGlzLm9wdGlvbnMucHJldmVudE91dGVyU2Nyb2xsID09PSB0cnVlKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRlbHRhICE9PSAwKSB0aGlzLnByZXZlbnRPdXRlclNjcm9sbChheGlzLCAoZGVsdGEgPCAwKSA/IFwiaGVlblwiIDogXCJ3ZWVyXCIsIGV2ZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcHJpdmF0ZSBvbktleURvd24gPSAoZXZlbnQ6SlF1ZXJ5S2V5RXZlbnRPYmplY3QpID0+IHtcblxuICAgICAgICAgICAgaWYoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAhPT0gdGhpcy5jb250ZW50RWxtWzBdKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYoWzM3LDM4LDMzLDM2XS5pbmRleE9mKGV2ZW50LndoaWNoKSAhPT0gLTEgKSAvLyBoZWVuXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcmV2ZW50T3V0ZXJTY3JvbGwoXG4gICAgICAgICAgICAgICAgICAgIFszOCwzMywzNl0uaW5kZXhPZihldmVudC53aGljaCkgIT09IC0xID8gXCJ5XCIgOiBcInhcIixcbiAgICAgICAgICAgICAgICAgICAgXCJoZWVuXCIsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYoWzM5LDQwLDMyLDM0LDM1XS5pbmRleE9mKGV2ZW50LndoaWNoKSAhPT0gLTEgKSAvLyB3ZWVyXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcmV2ZW50T3V0ZXJTY3JvbGwoXG4gICAgICAgICAgICAgICAgICAgIFs0MCwzNSwzNiwzNCwzMl0uaW5kZXhPZihldmVudC53aGljaCkgIT09IC0xID8gXCJ5XCIgOiBcInhcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3ZWVyXCIsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBwcml2YXRlIHByZXZlbnRPdXRlclNjcm9sbChheGlzOkF4aXNUeXBlLCBkaXJlY3Rpb246RGlyZWN0aW9uVHlwZSwgZXZlbnQ6QmFzZUpRdWVyeUV2ZW50T2JqZWN0KVxuICAgICAgICB7XG4gICAgICAgICAgICBsZXQgc2Nyb2xsUG9zID0gdGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sIFwic2Nyb2xsUG9zXCIsIGF4aXMpO1xuICAgICAgICAgICAgc3dpdGNoKGRpcmVjdGlvbilcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwiaGVlblwiOlxuICAgICAgICAgICAgICAgICAgICBpZihzY3JvbGxQb3MgPD0gMCkgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIndlZXJcIjpcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNjcm9sbFNpemUgPSB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgXCJzY3JvbGxTaXplXCIsIGF4aXMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xpZW50U2l6ZSA9IHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCBcImNsaWVudFNpemVcIiwgYXhpcyk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYoc2Nyb2xsU2l6ZSAtIHNjcm9sbFBvcyA9PT0gY2xpZW50U2l6ZSkgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIG9mZnNldENvbnRlbnRFbG1TY3JvbGxiYXJzID0gKGZvcmNlOmJvb2xlYW4gPSBmYWxzZSkgPT4ge1xuXG4gICAgICAgICAgICBsZXQgc2Nyb2xsYmFyRGltZW5zaW9uID0gU2Nyb2xsYmFyRGltZW5zaW9ucy5jYWxjdWxhdGUoW1xuICAgICAgICAgICAgICAgICAgICB7IHRhZ05hbWU6IHRoaXMuY29udGFpbmVyRWxtLnByb3AoJ3RhZ05hbWUnKSwgY2xhc3NlczogdGhpcy5jb250YWluZXJFbG0ucHJvcCgnY2xhc3MnKSB9LFxuICAgICAgICAgICAgICAgICAgICB7IHRhZ05hbWU6IHRoaXMuY29udGVudEVsbS5wcm9wKCd0YWdOYW1lJyksIGNsYXNzZXM6IHRoaXMuY29udGVudEVsbS5wcm9wKCdjbGFzcycpIH1cbiAgICAgICAgICAgICAgICBdKSxcbiAgICAgICAgICAgICAgICBjb3JyZWN0Rm9yRmxvYXRpbmdTY3JvbGxiYXIgPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYoc2Nyb2xsYmFyRGltZW5zaW9uID09PSAwICYmIHRoaXMuaGFzVmlzaWJsZUZsb2F0aW5nU2Nyb2xsYmFyKCkgPT09IHRydWUpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY29ycmVjdEZvckZsb2F0aW5nU2Nyb2xsYmFyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBzY3JvbGxiYXJEaW1lbnNpb24gPSAyMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGNzc1ZhbHVlcyA9IHt9O1xuICAgICAgICAgICAgaWYodGhpcy5vcHRpb25zLmF4ZXMuaW5kZXhPZigneScpICE9PSAtMSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjc3NWYWx1ZXNbJ292ZXJmbG93LXknXSA9IFwic2Nyb2xsXCI7XG4gICAgICAgICAgICAgICAgaWYoc2Nyb2xsYmFyRGltZW5zaW9uKSBjc3NWYWx1ZXNbJ3JpZ2h0J10gPSAtc2Nyb2xsYmFyRGltZW5zaW9uICsgXCJweFwiO1xuICAgICAgICAgICAgICAgIGlmKGNvcnJlY3RGb3JGbG9hdGluZ1Njcm9sbGJhcikgY3NzVmFsdWVzWydwYWRkaW5nLXJpZ2h0J10gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYodGhpcy5vcHRpb25zLmF4ZXMuaW5kZXhPZigneCcpICE9PSAtMSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjc3NWYWx1ZXNbJ292ZXJmbG93LXgnXSA9IFwic2Nyb2xsXCI7XG4gICAgICAgICAgICAgICAgaWYoc2Nyb2xsYmFyRGltZW5zaW9uKSBjc3NWYWx1ZXNbJ2JvdHRvbSddID0gLXNjcm9sbGJhckRpbWVuc2lvbiArIFwicHhcIjtcbiAgICAgICAgICAgICAgICBpZihjb3JyZWN0Rm9yRmxvYXRpbmdTY3JvbGxiYXIpIGNzc1ZhbHVlc1sncGFkZGluZy1ib3R0b20nXSA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZighdGhpcy5vcmlnaW5hbENzc1ZhbHVlcykgdGhpcy5vcmlnaW5hbENzc1ZhbHVlcyA9IHRoaXMuY29udGVudEVsbS5jc3MoT2JqZWN0LmtleXMoY3NzVmFsdWVzKSk7XG5cbiAgICAgICAgICAgIGlmKGNvcnJlY3RGb3JGbG9hdGluZ1Njcm9sbGJhciAmJiBjc3NWYWx1ZXNbJ3BhZGRpbmctcmlnaHQnXSA9PT0gZmFsc2UpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY3NzVmFsdWVzWydwYWRkaW5nLXJpZ2h0J10gPSAocGFyc2VJbnQodGhpcy5vcmlnaW5hbENzc1ZhbHVlc1sncGFkZGluZy1yaWdodCddKSArIHNjcm9sbGJhckRpbWVuc2lvbikgKyBcInB4XCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKGNvcnJlY3RGb3JGbG9hdGluZ1Njcm9sbGJhciAmJiBjc3NWYWx1ZXNbJ3BhZGRpbmctYm90dG9tJ10gPT09IGZhbHNlKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNzc1ZhbHVlc1sncGFkZGluZy1ib3R0b20nXSA9IChwYXJzZUludCh0aGlzLm9yaWdpbmFsQ3NzVmFsdWVzWydwYWRkaW5nLWJvdHRvbSddKSArIHNjcm9sbGJhckRpbWVuc2lvbikgKyBcInB4XCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuY29udGVudEVsbS5jc3MoY3NzVmFsdWVzKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2Nyb2xsYmFycyBieSBkZWZhdWx0IGluIE9TWCBkb24ndCB0YWtlIHVwIHNwYWNlIGJ1dCBhcmUgZmxvYXRpbmcuIFdlIG11c3QgY29ycmVjdCBmb3IgdGhpcywgYnV0IGhvdyBkbyB3ZVxuICAgICAgICAgKiBrbm93IGlmIHdlIG11c3QgY29ycmVjdD8gV2Via2l0IGJhc2VkIGJyb3dzZXJzIGhhdmUgdGhlIHBzZXVkbyBjc3Mtc2VsZWN0b3IgOjotd2Via2l0LXNjcm9sbGJhciBieSB3aGljaCB0aGVcbiAgICAgICAgICogcHJvYmxlbSBpcyBzb2x2ZWQuIEZvciBhbGwgb3RoZXIgZW5naW5lcyBhbm90aGVyIHN0cmF0ZWd5IG11c3RcbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICBwcml2YXRlIGhhc1Zpc2libGVGbG9hdGluZ1Njcm9sbGJhcigpOmJvb2xlYW5cbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9BcHBsZVdlYktpdC9pKSA9PT0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgdXBkYXRlQXhpcyhheGlzOkF4aXNUeXBlKVxuICAgICAgICB7XG4gICAgICAgICAgICBsZXQgaGFzU2Nyb2xsID0gdGhpcy5oYXNTY3JvbGwoYXhpcyk7XG4gICAgICAgICAgICBpZihoYXNTY3JvbGwgPT09IHRydWUgJiYgdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdID09PSBudWxsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyRWxtLmFkZENsYXNzKHRoaXMub3B0aW9ucy5jc3NQcmVmaXggKyBcIi1heGlzLVwiICsgYXhpcyk7XG5cbiAgICAgICAgICAgICAgICBsZXQgZWxtcyA9IHRoaXMuYWRkU2Nyb2xsYmFyKGF4aXMsIHRoaXMuY29udGFpbmVyRWxtKSxcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsYmFyRWxtID0gZWxtcy5zY3JvbGxiYXIsXG4gICAgICAgICAgICAgICAgICAgIHRyYWNrRWxtID0gZWxtcy50cmFjaztcblxuICAgICAgICAgICAgICAgIHNjcm9sbGJhckVsbS5vbignbW91c2Vkb3duLicgKyBheGlzICsgJy4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlLCB0aGlzLm9uU2Nyb2xsYmFyTW91c2Vkb3duLmJpbmQodGhpcywgYXhpcywgc2Nyb2xsYmFyRWxtLCB0cmFja0VsbSkpO1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGVudEVsbS5vbignc2Nyb2xsLicgKyBheGlzICsgJy4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlLCB0aGlzLm9uU2Nyb2xsLmJpbmQodGhpcywgYXhpcywgc2Nyb2xsYmFyRWxtLCB0cmFja0VsbSkpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdID0gZWxtcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYoaGFzU2Nyb2xsID09PSBmYWxzZSAmJiB0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10gIT09IG51bGwpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbG0ucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmNzc1ByZWZpeCArIFwiLWF4aXMtXCIgKyBheGlzKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXS5zY3JvbGxiYXIucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIHRoaXMuY29udGVudEVsbS5vZmYoJy4nICsgYXhpcyArIFwiLlwiICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vUmVzaXplIHRyYWNrIGFjY29yZGluZyB0byBjdXJyZW50IHNjcm9sbCBkaW1lbnNpb25zXG4gICAgICAgICAgICBpZih0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10gIT09IG51bGwpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNpemVUcmFjayhheGlzLCB0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10uc2Nyb2xsYmFyLCB0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10udHJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBnZXRWYWx1ZShlbG06SlF1ZXJ5LCBwcm9wZXJ0eTpOb3JtYWxpemVkU2Nyb2xsUHJvcGVydHksIGF4aXM6QXhpc1R5cGUpOm51bWJlclxuICAgICAgICB7XG4gICAgICAgICAgICBzd2l0Y2gocHJvcGVydHkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY2FzZSAnc2l6ZSc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbG1bYXhpcyA9PT0gJ3knID8gJ291dGVySGVpZ2h0JyA6ICdvdXRlcldpZHRoJ10oKTtcbiAgICAgICAgICAgICAgICBjYXNlICdjbGllbnRTaXplJzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsbVswXVtheGlzID09PSAneScgPyAnY2xpZW50SGVpZ2h0JyA6ICdjbGllbnRXaWR0aCddO1xuICAgICAgICAgICAgICAgIGNhc2UgJ3Njcm9sbFNpemUnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZWxtWzBdW2F4aXMgPT09ICd5JyA/ICdzY3JvbGxIZWlnaHQnIDogJ3Njcm9sbFdpZHRoJ107XG4gICAgICAgICAgICAgICAgY2FzZSAnc2Nyb2xsUG9zJzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsbVtheGlzID09PSAneScgPyAnc2Nyb2xsVG9wJyA6ICdzY3JvbGxMZWZ0J10oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgaGFzU2Nyb2xsKGF4aXM6QXhpc1R5cGUpOmJvb2xlYW5cbiAgICAgICAge1xuICAgICAgICAgICAgbGV0IGNvbnRlbnRTaXplID0gTWF0aC5yb3VuZCh0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgJ3NpemUnLCBheGlzKSksXG4gICAgICAgICAgICAgICAgY29udGVudFNjcm9sbFNpemUgPSBNYXRoLnJvdW5kKHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2Nyb2xsU2l6ZScsIGF4aXMpKTtcblxuICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnRTaXplIDwgY29udGVudFNjcm9sbFNpemU7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIHJlc2l6ZVRyYWNrKGF4aXM6QXhpc1R5cGUsIHNjcm9sbGJhckVsbTpKUXVlcnksIHRyYWNrRWxtOkpRdWVyeSlcbiAgICAgICAge1xuICAgICAgICAgICAgbGV0IGNvbnRlbnRTaXplID0gdGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sICdzaXplJywgYXhpcyksXG4gICAgICAgICAgICAgICAgY29udGVudFNjcm9sbFNpemUgPSB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgJ3Njcm9sbFNpemUnLCBheGlzKTtcbiAgICBcbiAgICAgICAgICAgIGlmKGNvbnRlbnRTaXplIDwgY29udGVudFNjcm9sbFNpemUpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc2Nyb2xsYmFyRWxtLnJlbW92ZUNsYXNzKCdoaWRkZW4nKTtcbiAgICBcbiAgICAgICAgICAgICAgICBsZXQgc2Nyb2xsYmFyRGltZW5zaW9uID0gdGhpcy5nZXRWYWx1ZShzY3JvbGxiYXJFbG0sICdzaXplJywgYXhpcyk7XG4gICAgXG4gICAgICAgICAgICAgICAgdHJhY2tFbG0uY3NzKGF4aXMgPT09ICd5JyA/ICdoZWlnaHQnIDogJ3dpZHRoJyxcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsYmFyRGltZW5zaW9uICogKGNvbnRlbnRTaXplIC8gY29udGVudFNjcm9sbFNpemUpXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzY3JvbGxiYXJFbG0uYWRkQ2xhc3MoJ2hpZGRlbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBwb3NpdGlvblRyYWNrKGF4aXM6QXhpc1R5cGUsIHNjcm9sbGJhckVsbTpKUXVlcnksIHRyYWNrRWxtOkpRdWVyeSlcbiAgICAgICAge1xuICAgICAgICAgICAgbGV0IHJlbFRyYWNrUG9zID0gdGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sICdzY3JvbGxQb3MnLCBheGlzKVxuICAgICAgICAgICAgICAgICAgICAvICh0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgJ3Njcm9sbFNpemUnLCBheGlzKSAtIHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2l6ZScsIGF4aXMpKSxcbiAgICAgICAgICAgICAgICB0cmFja0RpbWVuc2lvbiA9IHRoaXMuZ2V0VmFsdWUodHJhY2tFbG0sICdzaXplJywgYXhpcyksXG4gICAgICAgICAgICAgICAgc2Nyb2xsYmFyRGltZW5zaW9uID0gdGhpcy5nZXRWYWx1ZShzY3JvbGxiYXJFbG0sICdzaXplJywgYXhpcyk7XG4gICAgXG4gICAgICAgICAgICB0cmFja0VsbS5jc3MoYXhpcyA9PT0gJ3knID8gJ3RvcCcgOiAnbGVmdCcsXG4gICAgICAgICAgICAgICAgKHNjcm9sbGJhckRpbWVuc2lvbiAtIHRyYWNrRGltZW5zaW9uKSAqIE1hdGgubWluKHJlbFRyYWNrUG9zLCAxKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgb25TY3JvbGwoYXhpczpBeGlzVHlwZSwgc2Nyb2xsYmFyRWxtOkpRdWVyeSwgdHJhY2tFbG06SlF1ZXJ5LCBldmVudDpNb3VzZUV2ZW50KVxuICAgICAgICB7XG4gICAgICAgICAgICBpZih0aGlzLnNjcm9sbENhY2hlW2F4aXNdICE9PSAodGhpcy5zY3JvbGxDYWNoZVtheGlzXSA9IHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2Nyb2xsUG9zJywgYXhpcykpKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMucG9zaXRpb25UcmFjayhheGlzLCBzY3JvbGxiYXJFbG0sIHRyYWNrRWxtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgb25TY3JvbGxiYXJNb3VzZWRvd24gPSAoYXhpczogQXhpc1R5cGUsIHNjcm9sbGJhckVsbTogSlF1ZXJ5LCB0cmFja0VsbTogSlF1ZXJ5LCBldmVudDogTW91c2VFdmVudCkgPT4ge1xuXG4gICAgICAgICAgICBpZihldmVudC50YXJnZXQgPT09IHNjcm9sbGJhckVsbVswXSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvQ2xpY2tlZFBvc2l0aW9uKGF4aXMsIGV2ZW50KTtcbiAgICAgICAgICAgICAgICB0aGlzLnRyYWNrTW91c2Vkb3duKGF4aXMsIHNjcm9sbGJhckVsbSwgZXZlbnQpOyAvL0Fsc28gc3RhcnQgZHJhZ2dpbmcgdGhlIHRyYWNrIHRvIGRvIGEgY29ycmVjdGlvbiBkcmFnIGFmdGVyIGNsaWNraW5nIHRoZSBzY3JvbGxiYXJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYoZXZlbnQudGFyZ2V0ID09PSB0cmFja0VsbVswXSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRyYWNrTW91c2Vkb3duKGF4aXMsIHNjcm9sbGJhckVsbSwgZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHByaXZhdGUgdHJhY2tNb3VzZWRvd24oYXhpczogQXhpc1R5cGUsIHNjcm9sbGJhckVsbTogSlF1ZXJ5LCBldmVudDogTW91c2VFdmVudClcbiAgICAgICAge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgbGV0IG9yaWdpbiA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRQb3M6IGV2ZW50W2F4aXMgPT09ICd5JyA/ICdwYWdlWScgOiAncGFnZVgnXSxcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRTY3JvbGw6IHRoaXMuY29udGVudEVsbVtheGlzID09PSAneScgPyAnc2Nyb2xsVG9wJyA6ICdzY3JvbGxMZWZ0J10oKSxcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsRmFjdG9yOiB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgJ3Njcm9sbFNpemUnLCBheGlzKSAvIHRoaXMuZ2V0VmFsdWUoc2Nyb2xsYmFyRWxtLCAnc2l6ZScsIGF4aXMpIC8vSG93IGJpZyBpZiB0aGUgc2Nyb2xsYmFyIGVsZW1lbnQgY29tcGFyZWQgdG8gdGhlIGNvbnRlbnQgc2Nyb2xsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAkd2luZG93ID0galF1ZXJ5KHdpbmRvdyksXG4gICAgICAgICAgICAgICAgbW92ZUhhbmRsZXIgPSB0aGlzLm9uVHJhY2tEcmFnLmJpbmQodGhpcywgYXhpcywgb3JpZ2luKTtcblxuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbG0uYWRkQ2xhc3ModGhpcy5vcHRpb25zLmNzc1ByZWZpeCArIFwiLXRyYWNrZHJhZy1cIiArIGF4aXMpO1xuXG4gICAgICAgICAgICAkd2luZG93XG4gICAgICAgICAgICAgICAgLm9uKCdtb3VzZW1vdmUuJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSwgbW92ZUhhbmRsZXIpXG4gICAgICAgICAgICAgICAgLm9uZSgnbW91c2V1cC4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlLCAoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgJHdpbmRvdy5vZmYoJ21vdXNlbW92ZScsIG1vdmVIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbG0ucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmNzc1ByZWZpeCArIFwiLXRyYWNrZHJhZy1cIiArIGF4aXMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBvblRyYWNrRHJhZyhheGlzOkF4aXNUeXBlLCBvcmlnaW4sIGV2ZW50Ok1vdXNlRXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIHRoaXMuY29udGVudEVsbVtheGlzID09PSd5JyA/ICdzY3JvbGxUb3AnIDogJ3Njcm9sbExlZnQnXShcbiAgICAgICAgICAgICAgICBvcmlnaW4uc3RhcnRTY3JvbGwgKyAoZXZlbnRbYXhpcyA9PT0gJ3knID8gJ3BhZ2VZJyA6ICdwYWdlWCddIC0gb3JpZ2luLnN0YXJ0UG9zKSAqIG9yaWdpbi5zY3JvbGxGYWN0b3JcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIHNjcm9sbFRvQ2xpY2tlZFBvc2l0aW9uKGF4aXM6QXhpc1R5cGUsIGV2ZW50Ok1vdXNlRXZlbnQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgXG4gICAgICAgICAgICBsZXQgb2Zmc2V0ID0gZXZlbnRbKGF4aXMgPT09ICd5JykgPyAnb2Zmc2V0WSc6ICdvZmZzZXRYJ107XG4gICAgXG4gICAgICAgICAgICBpZihvZmZzZXQgPD0gMTApIG9mZnNldCA9IDA7IC8vTGl0dGxlIHR3ZWFrIHRvIG1ha2UgaXQgZWFzaWVyIHRvIGdvIGJhY2sgdG8gdG9wXG4gICAgXG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG1bYXhpcyA9PT0gJ3knID8gJ3Njcm9sbFRvcCcgOiAnc2Nyb2xsTGVmdCddKFxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2Nyb2xsU2l6ZScsIGF4aXMpICogKG9mZnNldCAvIHRoaXMuZ2V0VmFsdWUoalF1ZXJ5KGV2ZW50LnRhcmdldCksICdzaXplJywgYXhpcykpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIGRlc3Ryb3koKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG0ub2ZmKCcuJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSk7XG4gICAgICAgICAgICBqUXVlcnkod2luZG93KS5vZmYoJy4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlKTtcblxuICAgICAgICAgICAgZm9yKGxldCBheGlzIGluIHRoaXMuc2Nyb2xsYmFyRWxtcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZih0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10gJiYgdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdLnNjcm9sbGJhciBpbnN0YW5jZW9mIGpRdWVyeSA9PT0gdHJ1ZSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXS5zY3JvbGxiYXIucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG0uY3NzKHRoaXMub3JpZ2luYWxDc3NWYWx1ZXMpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGluZ3MvaW5kZXguZC50c1wiIC8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiU2Nyb2xsZXJ0UGx1Z2luLnRzXCIgLz5cblxualF1ZXJ5LmZuW1Njcm9sbGVydC5QbHVnaW4uTkFNRV0gPSBmdW5jdGlvbiguLi5hcmdzKSB7XG5cbiAgICBsZXQgYWN0aW9uOnN0cmluZyA9IHR5cGVvZiBhcmdzWzBdID09PSBcInN0cmluZ1wiICA/IGFyZ3NbMF0gOiBcImluaXRcIixcbiAgICAgICAgb3B0aW9uczpTY3JvbGxlcnQuUGx1Z2luT3B0aW9ucyA9ICh0eXBlb2YgYXJnc1sxXSA9PT0gXCJvYmplY3RcIilcbiAgICAgICAgICAgID8gYXJnc1sxXVxuICAgICAgICAgICAgOiAodHlwZW9mIGFyZ3NbMF0gPT09IFwib2JqZWN0XCIpID8gYXJnc1swXSA6IHt9O1xuXG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcblxuICAgICAgICBsZXQgZWxtID0galF1ZXJ5KHRoaXMpLFxuICAgICAgICAgICAga2V5ID0gXCJwbHVnaW4tXCIgKyBTY3JvbGxlcnQuUGx1Z2luLk5BTUUsXG4gICAgICAgICAgICBwbHVnaW46U2Nyb2xsZXJ0LlBsdWdpbiA9IGVsbS5kYXRhKGtleSk7XG5cbiAgICAgICAgaWYoYWN0aW9uID09PSBcImluaXRcIiAmJiBwbHVnaW4gaW5zdGFuY2VvZiBTY3JvbGxlcnQuUGx1Z2luID09PSBmYWxzZSlcbiAgICAgICAge1xuICAgICAgICAgICAgZWxtLmRhdGEoa2V5LCBwbHVnaW4gPSBuZXcgU2Nyb2xsZXJ0LlBsdWdpbihqUXVlcnkodGhpcyksIG9wdGlvbnMpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKHBsdWdpbiBpbnN0YW5jZW9mIFNjcm9sbGVydC5QbHVnaW4gPT09IGZhbHNlKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiVGhlIFNjcm9sbGVydCBwbHVnaW4gaXMgbm90IHlldCBpbml0aWFsaXplZFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaChhY3Rpb24pXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNhc2UgXCJpbml0XCI6IC8vRG9sY2UgZmFyIG5pZW50ZVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGNhc2UgXCJ1cGRhdGVcIjpcbiAgICAgICAgICAgICAgICBwbHVnaW4udXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiZGVzdHJveVwiOlxuICAgICAgICAgICAgICAgIHBsdWdpbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgZWxtLnJlbW92ZURhdGEoa2V5KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgU2Nyb2xsZXJ0IGFjdGlvbiBcIiArIGFjdGlvbik7XG4gICAgICAgIH1cbiAgICB9KTtcblxufTsiXX0=
