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
            this.offsetContentElmScrollbars();
            this.update();
            if (this.options.preventOuterScroll === true) {
                // Prevent outer scroll while trackdrag the contentElm
                this.contentElm.on('wheel.' + this.options.eventNamespace, this.onScrollWheel);
            }
            //There could be a zoom change. Zoom is almost not indistinguishable from resize events. So on window resize, recalculate contentElm offet
            jQuery(window).on('resize.' + this.options.eventNamespace, this.offsetContentElmScrollbars.bind(this, true));
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
            var contentSize = this.getValue(this.contentElm, 'size', axis), contentScrollSize = this.getValue(this.contentElm, 'scrollSize', axis);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNjcm9sbGJhckRpbWVuc2lvbnMudHMiLCJTY3JvbGxlcnRQbHVnaW4udHMiLCJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFPLFNBQVMsQ0FpRGY7QUFqREQsV0FBTyxTQUFTLEVBQ2hCLENBQUM7SUFPRztRQUFBO1FBd0NBLENBQUM7UUF0Q2lCLDZCQUFTLEdBQXZCLFVBQXdCLGNBQW9DO1lBRXhELElBQUksT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUM7WUFFN0IsRUFBRSxDQUFBLENBQUMsY0FBYyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FDOUIsQ0FBQztnQkFDRyxNQUFNLElBQUksU0FBUyxDQUFDLHdFQUF3RSxDQUFDLENBQUM7WUFDbEcsQ0FBQztZQUVELEdBQUcsQ0FBQSxDQUFrQixVQUFjLEVBQWQsaUNBQWMsRUFBZCw0QkFBYyxFQUFkLElBQWMsQ0FBQztnQkFBaEMsSUFBSSxTQUFTLHVCQUFBO2dCQUViLE1BQU0sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDO2dCQUVyQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFFLEdBQUcsT0FBTyxHQUFHLE1BQU0sQ0FBQztnQkFDNUQsT0FBTyxHQUFHLE1BQU0sQ0FBRTthQUNyQjtZQUVELE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUNqQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7WUFDeEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1lBQ3pCLE9BQU8sQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQztZQUNwQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUM7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RyxHQUFHLFNBQVMsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksRUFDdkMsTUFBTSxHQUFvQixHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRTVDLEVBQUUsQ0FBQSxDQUFDLE1BQU0sS0FBSyxNQUFNLElBQUksTUFBTSxZQUFZLFNBQVMsQ0FBQyxNQUFNLEtBQUssS0FBSyxDQUFDLENBQ3JFLENBQUM7WUFDRyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLEdBQUcsSUFBSSxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ3hFLENBQUM7UUFDRCxJQUFJLENBQUMsRUFBRSxDQUFBLENBQUMsTUFBTSxZQUFZLFNBQVMsQ0FBQyxNQUFNLEtBQUssS0FBSyxDQUFDLENBQ3JELENBQUM7WUFDRyxNQUFNLElBQUksU0FBUyxDQUFDLDZDQUE2QyxDQUFDLENBQUM7UUFDdkUsQ0FBQztRQUVELE1BQU0sQ0FBQSxDQUFDLE1BQU0sQ0FBQyxDQUNkLENBQUM7WUFDRyxLQUFLLE1BQU07Z0JBQ1AsTUFBTSxDQUFDO1lBQ1gsS0FBSyxRQUFRO2dCQUNULE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDaEIsS0FBSyxDQUFDO1lBQ1YsS0FBSyxTQUFTO2dCQUNWLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDakIsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDcEIsS0FBSyxDQUFDO1lBQ1Y7Z0JBQ0ksTUFBTSxJQUFJLFNBQVMsQ0FBQywyQkFBMkIsR0FBRyxNQUFNLENBQUMsQ0FBQztRQUNsRSxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFUCxDQUFDLENBQUMiLCJmaWxlIjoic2Nyb2xsZXJ0LmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlIFNjcm9sbGVydFxue1xuICAgIGV4cG9ydCBpbnRlcmZhY2UgU2Nyb2xsYmFyRGltZW5zaW9uc1xuICAgIHtcbiAgICAgICAgdGFnTmFtZTpzdHJpbmc7XG4gICAgICAgIGNsYXNzZXM6c3RyaW5nO1xuICAgIH1cblxuICAgIGV4cG9ydCBjbGFzcyBTY3JvbGxiYXJEaW1lbnNpb25zXG4gICAge1xuICAgICAgICBwdWJsaWMgc3RhdGljIGNhbGN1bGF0ZShjb250YWluZXJUcmFpbDpTY3JvbGxiYXJEaW1lbnNpb25zW10pOm51bWJlclxuICAgICAgICB7XG4gICAgICAgICAgICBsZXQgcm9vdEVsbSwgY3VyRWxtLCBwcmV2RWxtO1xuXG4gICAgICAgICAgICBpZihjb250YWluZXJUcmFpbC5sZW5ndGggPD0gMClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBjb250YWluZXIgdHJhaWwgc3BlY2lmaWVkIGZvciBzY3JvbGxiYXIgZGltZW5zaW9ucyBjYWxjdWxhdGlvblwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yKGxldCBjb250YWluZXIgb2YgY29udGFpbmVyVHJhaWwpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY3VyRWxtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChjb250YWluZXIudGFnTmFtZSk7XG4gICAgICAgICAgICAgICAgY3VyRWxtLmNsYXNzTmFtZSA9IGNvbnRhaW5lci5jbGFzc2VzO1xuXG4gICAgICAgICAgICAgICAgKHByZXZFbG0pID8gcHJldkVsbS5hcHBlbmRDaGlsZChjdXJFbG0gKSA6IHJvb3RFbG0gPSBjdXJFbG07XG4gICAgICAgICAgICAgICAgcHJldkVsbSA9IGN1ckVsbSA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJvb3RFbG0uc3R5bGUucG9zaXRpb24gPSBcImZpeGVkXCI7XG4gICAgICAgICAgICByb290RWxtLnN0eWxlLnRvcCA9IFwiMFwiO1xuICAgICAgICAgICAgcm9vdEVsbS5zdHlsZS5sZWZ0ID0gXCIwXCI7XG4gICAgICAgICAgICByb290RWxtLnN0eWxlLnZpc2liaWxpdHkgPSBcImhpZGRlblwiO1xuICAgICAgICAgICAgcm9vdEVsbS5zdHlsZS53aWR0aCA9IFwiMjAwcHhcIjtcbiAgICAgICAgICAgIHJvb3RFbG0uc3R5bGUuaGVpZ2h0ID0gXCIyMDBweFwiO1xuXG4gICAgICAgICAgICBjdXJFbG0uc3R5bGUub3ZlcmZsb3cgPSBcImhpZGRlblwiO1xuXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHJvb3RFbG0pO1xuICAgICAgICAgICAgbGV0IHdpdGhvdXRTY3JvbGxiYXJzID0gY3VyRWxtLmNsaWVudFdpZHRoO1xuXG4gICAgICAgICAgICBjdXJFbG0uc3R5bGUub3ZlcmZsb3cgPSBcInNjcm9sbFwiO1xuICAgICAgICAgICAgbGV0IHdpdGhTY3JvbGxiYXJzID0gY3VyRWxtLmNsaWVudFdpZHRoO1xuXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHJvb3RFbG0pO1xuXG4gICAgICAgICAgICByZXR1cm4gd2l0aG91dFNjcm9sbGJhcnMgLSB3aXRoU2Nyb2xsYmFycztcblxuICAgICAgICB9XG4gICAgfVxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90eXBpbmdzL2luZGV4LmQudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIlNjcm9sbGJhckRpbWVuc2lvbnMudHNcIiAvPlxuXG5tb2R1bGUgU2Nyb2xsZXJ0IHtcblxuICAgIGV4cG9ydCB0eXBlIEF4aXNUeXBlID0gXCJ4XCIgfCBcInlcIjtcbiAgICB0eXBlIE5vcm1hbGl6ZWRTY3JvbGxQcm9wZXJ0eSA9IFwic2l6ZVwiIHwgXCJzY3JvbGxTaXplXCIgfCBcInNjcm9sbFBvc1wiIHwgXCJjbGllbnRTaXplXCI7XG4gICAgdHlwZSBEaXJlY3Rpb25UeXBlID0gXCJoZWVuXCIgfCBcIndlZXJcIjsgLy9BS0EgIGZvcnRoIGFuZCBiYWNrIChodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PVg3VjA5VG1zdS0wKVxuXG4gICAgaW50ZXJmYWNlIFNjcm9sbGJhckNvbnRhaW5lclxuICAgIHtcbiAgICAgICAgc2Nyb2xsYmFyOkpRdWVyeTtcbiAgICAgICAgdHJhY2s6SlF1ZXJ5O1xuICAgIH1cblxuICAgIGV4cG9ydCBpbnRlcmZhY2UgUGx1Z2luT3B0aW9uc1xuICAgIHtcbiAgICAgICAgYXhlcz86QXhpc1R5cGVbXTtcbiAgICAgICAgcHJldmVudE91dGVyU2Nyb2xsPzpib29sZWFuO1xuICAgICAgICBjc3NQcmVmaXg/OnN0cmluZztcbiAgICAgICAgZXZlbnROYW1lc3BhY2U/OnN0cmluZztcbiAgICAgICAgY29udGVudFNlbGVjdG9yPzpzdHJpbmc7XG4gICAgfVxuXG4gICAgZXhwb3J0IGNsYXNzIFBsdWdpblxuICAgIHtcbiAgICAgICAgcHVibGljIHN0YXRpYyBOQU1FOnN0cmluZyA9ICdzY3JvbGxlcnQnO1xuXG4gICAgICAgIHByaXZhdGUgb3B0aW9uczpQbHVnaW5PcHRpb25zID0ge1xuICAgICAgICAgICAgYXhlczogWyd4JywgJ3knXSxcbiAgICAgICAgICAgIHByZXZlbnRPdXRlclNjcm9sbDogZmFsc2UsXG4gICAgICAgICAgICBjc3NQcmVmaXg6ICdzY3JvbGxlcnQnLFxuICAgICAgICAgICAgZXZlbnROYW1lc3BhY2U6ICdzY3JvbGxlcnQnLFxuICAgICAgICAgICAgY29udGVudFNlbGVjdG9yOiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgcHJpdmF0ZSBjb250ZW50RWxtOkpRdWVyeTtcblxuICAgICAgICBwcml2YXRlIHN0YXRpYyBldmVudE5hbWVzcGFjZUlkID0gMDtcblxuICAgICAgICBwcml2YXRlIHNjcm9sbGJhckVsbXM6eyBbaWQ6IHN0cmluZ10gOiBTY3JvbGxiYXJDb250YWluZXIgfSA9IHtcbiAgICAgICAgICAgIHg6IG51bGwsXG4gICAgICAgICAgICB5OiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgcHJpdmF0ZSBzY3JvbGxDYWNoZSA9IHtcbiAgICAgICAgICAgIHg6IG51bGwsXG4gICAgICAgICAgICB5OiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgcHJpdmF0ZSBvcmlnaW5hbENzc1ZhbHVlczp7IFtpZDogc3RyaW5nXSA6IHN0cmluZzsgfTtcblxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbnRhaW5lckVsbTpKUXVlcnksIG9wdGlvbnM/OlBsdWdpbk9wdGlvbnMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucyA9IGpRdWVyeS5leHRlbmQoIHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMgKTtcblxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlID0gdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlICsgKytQbHVnaW4uZXZlbnROYW1lc3BhY2VJZDtcbiAgICAgICAgICAgIHRoaXMuY29udGVudEVsbSA9IHRoaXMuY29udGFpbmVyRWxtLmNoaWxkcmVuKHRoaXMub3B0aW9ucy5jb250ZW50U2VsZWN0b3IgfHwgJy4nICsgdGhpcy5vcHRpb25zLmNzc1ByZWZpeCArJy1jb250ZW50Jyk7XG5cbiAgICAgICAgICAgIHRoaXMub2Zmc2V0Q29udGVudEVsbVNjcm9sbGJhcnMoKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlKCk7XG5cbiAgICAgICAgICAgIGlmKHRoaXMub3B0aW9ucy5wcmV2ZW50T3V0ZXJTY3JvbGwgPT09IHRydWUpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgLy8gUHJldmVudCBvdXRlciBzY3JvbGwgd2hpbGUgdHJhY2tkcmFnIHRoZSBjb250ZW50RWxtXG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZW50RWxtLm9uKCd3aGVlbC4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlLCB0aGlzLm9uU2Nyb2xsV2hlZWwpO1xuXG4gICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgKiBAdG9kbyBUaGUga2V5ZG93biBvdXRlciBzY3JvbGwgcHJldmVudGlvbiBpcyBub3Qgd29ya2luZyB5ZXQuXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgLy8gUHJldmVudCBvdXRlciBzY3JvbGwgb24ga2V5IGRvd25cbiAgICAgICAgICAgICAgICAvKnRoaXMuY29udGVudEVsbS5vbigna2V5ZG93bi4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlLCB0aGlzLm9uS2V5RG93bik7Ki9cbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICAvL1RoZXJlIGNvdWxkIGJlIGEgem9vbSBjaGFuZ2UuIFpvb20gaXMgYWxtb3N0IG5vdCBpbmRpc3Rpbmd1aXNoYWJsZSBmcm9tIHJlc2l6ZSBldmVudHMuIFNvIG9uIHdpbmRvdyByZXNpemUsIHJlY2FsY3VsYXRlIGNvbnRlbnRFbG0gb2ZmZXRcbiAgICAgICAgICAgIGpRdWVyeSh3aW5kb3cpLm9uKCdyZXNpemUuJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSwgdGhpcy5vZmZzZXRDb250ZW50RWxtU2Nyb2xsYmFycy5iaW5kKHRoaXMsIHRydWUpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyB1cGRhdGUoKVxuICAgICAgICB7XG4gICAgICAgICAgICBsZXQgcmVwb3NpdGlvblRyYWNrID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGZvcihsZXQgYXhpcyBvZiB0aGlzLm9wdGlvbnMuYXhlcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUF4aXMoYXhpcyk7XG4gICAgICAgICAgICAgICAgaWYodGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sIFwic2Nyb2xsUG9zXCIsIGF4aXMpICE9PSAwKSByZXBvc2l0aW9uVHJhY2sgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL0lmIHdlIHN0YXJ0IG9uIGEgc2Nyb2xsIHBvc2l0aW9uXG4gICAgICAgICAgICBpZihyZXBvc2l0aW9uVHJhY2sgPT09IHRydWUpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZW50RWxtLnRyaWdnZXIoJ3Njcm9sbC4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgYWRkU2Nyb2xsYmFyKGF4aXM6QXhpc1R5cGUsIGNvbnRhaW5lckVsbTpKUXVlcnkpOlNjcm9sbGJhckNvbnRhaW5lclxuICAgICAgICB7XG4gICAgICAgICAgICBsZXQgc2Nyb2xsYmFyRWxtLCB0cmFja0VsbTtcblxuICAgICAgICAgICAgY29udGFpbmVyRWxtLmFwcGVuZChcbiAgICAgICAgICAgICAgICBzY3JvbGxiYXJFbG0gPSBqUXVlcnkoJzxkaXYgLz4nKS5hZGRDbGFzcyhcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmNzc1ByZWZpeCArICctc2Nyb2xsYmFyJyArICcgJ1xuICAgICAgICAgICAgICAgICAgICArIHRoaXMub3B0aW9ucy5jc3NQcmVmaXggKyAnLXNjcm9sbGJhci0nICsgYXhpc1xuICAgICAgICAgICAgICAgICkuYXBwZW5kKHRyYWNrRWxtID0galF1ZXJ5KCc8ZGl2IC8+JykuYWRkQ2xhc3ModGhpcy5vcHRpb25zLmNzc1ByZWZpeCArICctdHJhY2snKSlcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc2Nyb2xsYmFyOiBzY3JvbGxiYXJFbG0sXG4gICAgICAgICAgICAgICAgdHJhY2s6IHRyYWNrRWxtXG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuXG4gICAgICAgIHByaXZhdGUgb25TY3JvbGxXaGVlbCA9IChldmVudDpKUXVlcnlNb3VzZUV2ZW50T2JqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIGxldCBvcmlnaW5hbEV2ZW50OldoZWVsRXZlbnQgPSA8V2hlZWxFdmVudD5ldmVudC5vcmlnaW5hbEV2ZW50O1xuXG4gICAgICAgICAgICBmb3IobGV0IGF4aXMgb2YgdGhpcy5vcHRpb25zLmF4ZXMpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGV0IGRlbHRhID0gb3JpZ2luYWxFdmVudFsnZGVsdGEnICsgYXhpcy50b1VwcGVyQ2FzZSgpXTtcbiAgICAgICAgICAgICAgICBpZihkZWx0YSAhPT0gMCkgdGhpcy5wcmV2ZW50T3V0ZXJTY3JvbGwoYXhpcywgKGRlbHRhIDwgMCkgPyBcImhlZW5cIiA6IFwid2VlclwiLCBldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcHJpdmF0ZSBvbktleURvd24gPSAoZXZlbnQ6SlF1ZXJ5S2V5RXZlbnRPYmplY3QpID0+IHtcblxuICAgICAgICAgICAgaWYoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAhPT0gdGhpcy5jb250ZW50RWxtWzBdKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYoWzM3LDM4LDMzLDM2XS5pbmRleE9mKGV2ZW50LndoaWNoKSAhPT0gLTEgKSAvLyBoZWVuXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcmV2ZW50T3V0ZXJTY3JvbGwoXG4gICAgICAgICAgICAgICAgICAgIFszOCwzMywzNl0uaW5kZXhPZihldmVudC53aGljaCkgIT09IC0xID8gXCJ5XCIgOiBcInhcIixcbiAgICAgICAgICAgICAgICAgICAgXCJoZWVuXCIsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYoWzM5LDQwLDMyLDM0LDM1XS5pbmRleE9mKGV2ZW50LndoaWNoKSAhPT0gLTEgKSAvLyB3ZWVyXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcmV2ZW50T3V0ZXJTY3JvbGwoXG4gICAgICAgICAgICAgICAgICAgIFs0MCwzNSwzNiwzNCwzMl0uaW5kZXhPZihldmVudC53aGljaCkgIT09IC0xID8gXCJ5XCIgOiBcInhcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3ZWVyXCIsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBwcml2YXRlIHByZXZlbnRPdXRlclNjcm9sbChheGlzOkF4aXNUeXBlLCBkaXJlY3Rpb246RGlyZWN0aW9uVHlwZSwgZXZlbnQ6QmFzZUpRdWVyeUV2ZW50T2JqZWN0KVxuICAgICAgICB7XG4gICAgICAgICAgICBsZXQgc2Nyb2xsUG9zID0gdGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sIFwic2Nyb2xsUG9zXCIsIGF4aXMpO1xuICAgICAgICAgICAgc3dpdGNoKGRpcmVjdGlvbilcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwiaGVlblwiOlxuICAgICAgICAgICAgICAgICAgICBpZihzY3JvbGxQb3MgPD0gMCkgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIndlZXJcIjpcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNjcm9sbFNpemUgPSB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgXCJzY3JvbGxTaXplXCIsIGF4aXMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xpZW50U2l6ZSA9IHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCBcImNsaWVudFNpemVcIiwgYXhpcyk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYoc2Nyb2xsU2l6ZSAtIHNjcm9sbFBvcyA9PT0gY2xpZW50U2l6ZSkgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIG9mZnNldENvbnRlbnRFbG1TY3JvbGxiYXJzID0gKGZvcmNlOmJvb2xlYW4gPSBmYWxzZSkgPT4ge1xuXG4gICAgICAgICAgICBsZXQgc2Nyb2xsYmFyRGltZW5zaW9uID0gU2Nyb2xsYmFyRGltZW5zaW9ucy5jYWxjdWxhdGUoW1xuICAgICAgICAgICAgICAgICAgICB7IHRhZ05hbWU6IHRoaXMuY29udGFpbmVyRWxtLnByb3AoJ3RhZ05hbWUnKSwgY2xhc3NlczogdGhpcy5jb250YWluZXJFbG0ucHJvcCgnY2xhc3MnKSB9LFxuICAgICAgICAgICAgICAgICAgICB7IHRhZ05hbWU6IHRoaXMuY29udGVudEVsbS5wcm9wKCd0YWdOYW1lJyksIGNsYXNzZXM6IHRoaXMuY29udGVudEVsbS5wcm9wKCdjbGFzcycpIH1cbiAgICAgICAgICAgICAgICBdKSxcbiAgICAgICAgICAgICAgICBjb3JyZWN0Rm9yRmxvYXRpbmdTY3JvbGxiYXIgPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYoc2Nyb2xsYmFyRGltZW5zaW9uID09PSAwICYmIHRoaXMuaGFzVmlzaWJsZUZsb2F0aW5nU2Nyb2xsYmFyKCkgPT09IHRydWUpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY29ycmVjdEZvckZsb2F0aW5nU2Nyb2xsYmFyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBzY3JvbGxiYXJEaW1lbnNpb24gPSAyMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGNzc1ZhbHVlcyA9IHt9O1xuICAgICAgICAgICAgaWYodGhpcy5vcHRpb25zLmF4ZXMuaW5kZXhPZigneScpICE9PSAtMSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjc3NWYWx1ZXNbJ292ZXJmbG93LXknXSA9IFwic2Nyb2xsXCI7XG4gICAgICAgICAgICAgICAgaWYoc2Nyb2xsYmFyRGltZW5zaW9uKSBjc3NWYWx1ZXNbJ3JpZ2h0J10gPSAtc2Nyb2xsYmFyRGltZW5zaW9uICsgXCJweFwiO1xuICAgICAgICAgICAgICAgIGlmKGNvcnJlY3RGb3JGbG9hdGluZ1Njcm9sbGJhcikgY3NzVmFsdWVzWydwYWRkaW5nLXJpZ2h0J10gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYodGhpcy5vcHRpb25zLmF4ZXMuaW5kZXhPZigneCcpICE9PSAtMSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjc3NWYWx1ZXNbJ292ZXJmbG93LXgnXSA9IFwic2Nyb2xsXCI7XG4gICAgICAgICAgICAgICAgaWYoc2Nyb2xsYmFyRGltZW5zaW9uKSBjc3NWYWx1ZXNbJ2JvdHRvbSddID0gLXNjcm9sbGJhckRpbWVuc2lvbiArIFwicHhcIjtcbiAgICAgICAgICAgICAgICBpZihjb3JyZWN0Rm9yRmxvYXRpbmdTY3JvbGxiYXIpIGNzc1ZhbHVlc1sncGFkZGluZy1ib3R0b20nXSA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZighdGhpcy5vcmlnaW5hbENzc1ZhbHVlcykgdGhpcy5vcmlnaW5hbENzc1ZhbHVlcyA9IHRoaXMuY29udGVudEVsbS5jc3MoT2JqZWN0LmtleXMoY3NzVmFsdWVzKSk7XG5cbiAgICAgICAgICAgIGlmKGNvcnJlY3RGb3JGbG9hdGluZ1Njcm9sbGJhciAmJiBjc3NWYWx1ZXNbJ3BhZGRpbmctcmlnaHQnXSA9PT0gZmFsc2UpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY3NzVmFsdWVzWydwYWRkaW5nLXJpZ2h0J10gPSAocGFyc2VJbnQodGhpcy5vcmlnaW5hbENzc1ZhbHVlc1sncGFkZGluZy1yaWdodCddKSArIHNjcm9sbGJhckRpbWVuc2lvbikgKyBcInB4XCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKGNvcnJlY3RGb3JGbG9hdGluZ1Njcm9sbGJhciAmJiBjc3NWYWx1ZXNbJ3BhZGRpbmctYm90dG9tJ10gPT09IGZhbHNlKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNzc1ZhbHVlc1sncGFkZGluZy1ib3R0b20nXSA9IChwYXJzZUludCh0aGlzLm9yaWdpbmFsQ3NzVmFsdWVzWydwYWRkaW5nLWJvdHRvbSddKSArIHNjcm9sbGJhckRpbWVuc2lvbikgKyBcInB4XCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuY29udGVudEVsbS5jc3MoY3NzVmFsdWVzKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2Nyb2xsYmFycyBieSBkZWZhdWx0IGluIE9TWCBkb24ndCB0YWtlIHVwIHNwYWNlIGJ1dCBhcmUgZmxvYXRpbmcuIFdlIG11c3QgY29ycmVjdCBmb3IgdGhpcywgYnV0IGhvdyBkbyB3ZVxuICAgICAgICAgKiBrbm93IGlmIHdlIG11c3QgY29ycmVjdD8gV2Via2l0IGJhc2VkIGJyb3dzZXJzIGhhdmUgdGhlIHBzZXVkbyBjc3Mtc2VsZWN0b3IgOjotd2Via2l0LXNjcm9sbGJhciBieSB3aGljaCB0aGVcbiAgICAgICAgICogcHJvYmxlbSBpcyBzb2x2ZWQuIEZvciBhbGwgb3RoZXIgZW5naW5lcyBhbm90aGVyIHN0cmF0ZWd5IG11c3RcbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICBwcml2YXRlIGhhc1Zpc2libGVGbG9hdGluZ1Njcm9sbGJhcigpOmJvb2xlYW5cbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9BcHBsZVdlYktpdC9pKSA9PT0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgdXBkYXRlQXhpcyhheGlzOkF4aXNUeXBlKVxuICAgICAgICB7XG4gICAgICAgICAgICBsZXQgaGFzU2Nyb2xsID0gdGhpcy5oYXNTY3JvbGwoYXhpcyk7XG4gICAgICAgICAgICBpZihoYXNTY3JvbGwgPT09IHRydWUgJiYgdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdID09PSBudWxsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyRWxtLmFkZENsYXNzKHRoaXMub3B0aW9ucy5jc3NQcmVmaXggKyBcIi1heGlzLVwiICsgYXhpcyk7XG5cbiAgICAgICAgICAgICAgICBsZXQgZWxtcyA9IHRoaXMuYWRkU2Nyb2xsYmFyKGF4aXMsIHRoaXMuY29udGFpbmVyRWxtKSxcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsYmFyRWxtID0gZWxtcy5zY3JvbGxiYXIsXG4gICAgICAgICAgICAgICAgICAgIHRyYWNrRWxtID0gZWxtcy50cmFjaztcblxuICAgICAgICAgICAgICAgIHNjcm9sbGJhckVsbS5vbignbW91c2Vkb3duLicgKyBheGlzICsgJy4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlLCB0aGlzLm9uU2Nyb2xsYmFyTW91c2Vkb3duLmJpbmQodGhpcywgYXhpcywgc2Nyb2xsYmFyRWxtLCB0cmFja0VsbSkpO1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGVudEVsbS5vbignc2Nyb2xsLicgKyBheGlzICsgJy4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlLCB0aGlzLm9uU2Nyb2xsLmJpbmQodGhpcywgYXhpcywgc2Nyb2xsYmFyRWxtLCB0cmFja0VsbSkpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdID0gZWxtcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYoaGFzU2Nyb2xsID09PSBmYWxzZSAmJiB0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10gIT09IG51bGwpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbG0ucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmNzc1ByZWZpeCArIFwiLWF4aXMtXCIgKyBheGlzKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXS5zY3JvbGxiYXIucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIHRoaXMuY29udGVudEVsbS5vZmYoJy4nICsgYXhpcyArIFwiLlwiICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vUmVzaXplIHRyYWNrIGFjY29yZGluZyB0byBjdXJyZW50IHNjcm9sbCBkaW1lbnNpb25zXG4gICAgICAgICAgICBpZih0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10gIT09IG51bGwpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNpemVUcmFjayhheGlzLCB0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10uc2Nyb2xsYmFyLCB0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10udHJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBnZXRWYWx1ZShlbG06SlF1ZXJ5LCBwcm9wZXJ0eTpOb3JtYWxpemVkU2Nyb2xsUHJvcGVydHksIGF4aXM6QXhpc1R5cGUpOm51bWJlclxuICAgICAgICB7XG4gICAgICAgICAgICBzd2l0Y2gocHJvcGVydHkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY2FzZSAnc2l6ZSc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbG1bYXhpcyA9PT0gJ3knID8gJ291dGVySGVpZ2h0JyA6ICdvdXRlcldpZHRoJ10oKTtcbiAgICAgICAgICAgICAgICBjYXNlICdjbGllbnRTaXplJzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsbVswXVtheGlzID09PSAneScgPyAnY2xpZW50SGVpZ2h0JyA6ICdjbGllbnRXaWR0aCddO1xuICAgICAgICAgICAgICAgIGNhc2UgJ3Njcm9sbFNpemUnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZWxtWzBdW2F4aXMgPT09ICd5JyA/ICdzY3JvbGxIZWlnaHQnIDogJ3Njcm9sbFdpZHRoJ107XG4gICAgICAgICAgICAgICAgY2FzZSAnc2Nyb2xsUG9zJzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsbVtheGlzID09PSAneScgPyAnc2Nyb2xsVG9wJyA6ICdzY3JvbGxMZWZ0J10oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgaGFzU2Nyb2xsKGF4aXM6QXhpc1R5cGUpOmJvb2xlYW5cbiAgICAgICAge1xuICAgICAgICAgICAgbGV0IGNvbnRlbnRTaXplID0gdGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sICdzaXplJywgYXhpcyksXG4gICAgICAgICAgICAgICAgY29udGVudFNjcm9sbFNpemUgPSB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgJ3Njcm9sbFNpemUnLCBheGlzKTtcbiAgICBcbiAgICAgICAgICAgIHJldHVybiBjb250ZW50U2l6ZSA8IGNvbnRlbnRTY3JvbGxTaXplO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSByZXNpemVUcmFjayhheGlzOkF4aXNUeXBlLCBzY3JvbGxiYXJFbG06SlF1ZXJ5LCB0cmFja0VsbTpKUXVlcnkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxldCBjb250ZW50U2l6ZSA9IHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2l6ZScsIGF4aXMpLFxuICAgICAgICAgICAgICAgIGNvbnRlbnRTY3JvbGxTaXplID0gdGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sICdzY3JvbGxTaXplJywgYXhpcyk7XG4gICAgXG4gICAgICAgICAgICBpZihjb250ZW50U2l6ZSA8IGNvbnRlbnRTY3JvbGxTaXplKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNjcm9sbGJhckVsbS5yZW1vdmVDbGFzcygnaGlkZGVuJyk7XG4gICAgXG4gICAgICAgICAgICAgICAgbGV0IHNjcm9sbGJhckRpbWVuc2lvbiA9IHRoaXMuZ2V0VmFsdWUoc2Nyb2xsYmFyRWxtLCAnc2l6ZScsIGF4aXMpO1xuICAgIFxuICAgICAgICAgICAgICAgIHRyYWNrRWxtLmNzcyhheGlzID09PSAneScgPyAnaGVpZ2h0JyA6ICd3aWR0aCcsXG4gICAgICAgICAgICAgICAgICAgIHNjcm9sbGJhckRpbWVuc2lvbiAqIChjb250ZW50U2l6ZSAvIGNvbnRlbnRTY3JvbGxTaXplKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc2Nyb2xsYmFyRWxtLmFkZENsYXNzKCdoaWRkZW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgcG9zaXRpb25UcmFjayhheGlzOkF4aXNUeXBlLCBzY3JvbGxiYXJFbG06SlF1ZXJ5LCB0cmFja0VsbTpKUXVlcnkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxldCByZWxUcmFja1BvcyA9IHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2Nyb2xsUG9zJywgYXhpcylcbiAgICAgICAgICAgICAgICAgICAgLyAodGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sICdzY3JvbGxTaXplJywgYXhpcykgLSB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgJ3NpemUnLCBheGlzKSksXG4gICAgICAgICAgICAgICAgdHJhY2tEaW1lbnNpb24gPSB0aGlzLmdldFZhbHVlKHRyYWNrRWxtLCAnc2l6ZScsIGF4aXMpLFxuICAgICAgICAgICAgICAgIHNjcm9sbGJhckRpbWVuc2lvbiA9IHRoaXMuZ2V0VmFsdWUoc2Nyb2xsYmFyRWxtLCAnc2l6ZScsIGF4aXMpO1xuICAgIFxuICAgICAgICAgICAgdHJhY2tFbG0uY3NzKGF4aXMgPT09ICd5JyA/ICd0b3AnIDogJ2xlZnQnLFxuICAgICAgICAgICAgICAgIChzY3JvbGxiYXJEaW1lbnNpb24gLSB0cmFja0RpbWVuc2lvbikgKiByZWxUcmFja1Bvc1xuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgb25TY3JvbGwoYXhpczpBeGlzVHlwZSwgc2Nyb2xsYmFyRWxtOkpRdWVyeSwgdHJhY2tFbG06SlF1ZXJ5LCBldmVudDpNb3VzZUV2ZW50KVxuICAgICAgICB7XG4gICAgICAgICAgICBpZih0aGlzLnNjcm9sbENhY2hlW2F4aXNdICE9PSAodGhpcy5zY3JvbGxDYWNoZVtheGlzXSA9IHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2Nyb2xsUG9zJywgYXhpcykpKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMucG9zaXRpb25UcmFjayhheGlzLCBzY3JvbGxiYXJFbG0sIHRyYWNrRWxtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgb25TY3JvbGxiYXJNb3VzZWRvd24gPSAoYXhpczogQXhpc1R5cGUsIHNjcm9sbGJhckVsbTogSlF1ZXJ5LCB0cmFja0VsbTogSlF1ZXJ5LCBldmVudDogTW91c2VFdmVudCkgPT4ge1xuXG4gICAgICAgICAgICBpZihldmVudC50YXJnZXQgPT09IHNjcm9sbGJhckVsbVswXSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvQ2xpY2tlZFBvc2l0aW9uKGF4aXMsIGV2ZW50KTtcbiAgICAgICAgICAgICAgICB0aGlzLnRyYWNrTW91c2Vkb3duKGF4aXMsIHNjcm9sbGJhckVsbSwgZXZlbnQpOyAvL0Fsc28gc3RhcnQgZHJhZ2dpbmcgdGhlIHRyYWNrIHRvIGRvIGEgY29ycmVjdGlvbiBkcmFnIGFmdGVyIGNsaWNraW5nIHRoZSBzY3JvbGxiYXJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYoZXZlbnQudGFyZ2V0ID09PSB0cmFja0VsbVswXSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRyYWNrTW91c2Vkb3duKGF4aXMsIHNjcm9sbGJhckVsbSwgZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHByaXZhdGUgdHJhY2tNb3VzZWRvd24oYXhpczogQXhpc1R5cGUsIHNjcm9sbGJhckVsbTogSlF1ZXJ5LCBldmVudDogTW91c2VFdmVudClcbiAgICAgICAge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgbGV0IG9yaWdpbiA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRQb3M6IGV2ZW50W2F4aXMgPT09ICd5JyA/ICdwYWdlWScgOiAncGFnZVgnXSxcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRTY3JvbGw6IHRoaXMuY29udGVudEVsbVtheGlzID09PSAneScgPyAnc2Nyb2xsVG9wJyA6ICdzY3JvbGxMZWZ0J10oKSxcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsRmFjdG9yOiB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgJ3Njcm9sbFNpemUnLCBheGlzKSAvIHRoaXMuZ2V0VmFsdWUoc2Nyb2xsYmFyRWxtLCAnc2l6ZScsIGF4aXMpIC8vSG93IGJpZyBpZiB0aGUgc2Nyb2xsYmFyIGVsZW1lbnQgY29tcGFyZWQgdG8gdGhlIGNvbnRlbnQgc2Nyb2xsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAkd2luZG93ID0galF1ZXJ5KHdpbmRvdyksXG4gICAgICAgICAgICAgICAgbW92ZUhhbmRsZXIgPSB0aGlzLm9uVHJhY2tEcmFnLmJpbmQodGhpcywgYXhpcywgb3JpZ2luKTtcblxuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbG0uYWRkQ2xhc3ModGhpcy5vcHRpb25zLmNzc1ByZWZpeCArIFwiLXRyYWNrZHJhZy1cIiArIGF4aXMpO1xuXG4gICAgICAgICAgICAkd2luZG93XG4gICAgICAgICAgICAgICAgLm9uKCdtb3VzZW1vdmUuJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSwgbW92ZUhhbmRsZXIpXG4gICAgICAgICAgICAgICAgLm9uZSgnbW91c2V1cC4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlLCAoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgJHdpbmRvdy5vZmYoJ21vdXNlbW92ZScsIG1vdmVIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbG0ucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmNzc1ByZWZpeCArIFwiLXRyYWNrZHJhZy1cIiArIGF4aXMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBvblRyYWNrRHJhZyhheGlzOkF4aXNUeXBlLCBvcmlnaW4sIGV2ZW50Ok1vdXNlRXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIHRoaXMuY29udGVudEVsbVtheGlzID09PSd5JyA/ICdzY3JvbGxUb3AnIDogJ3Njcm9sbExlZnQnXShcbiAgICAgICAgICAgICAgICBvcmlnaW4uc3RhcnRTY3JvbGwgKyAoZXZlbnRbYXhpcyA9PT0gJ3knID8gJ3BhZ2VZJyA6ICdwYWdlWCddIC0gb3JpZ2luLnN0YXJ0UG9zKSAqIG9yaWdpbi5zY3JvbGxGYWN0b3JcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIHNjcm9sbFRvQ2xpY2tlZFBvc2l0aW9uKGF4aXM6QXhpc1R5cGUsIGV2ZW50Ok1vdXNlRXZlbnQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgXG4gICAgICAgICAgICBsZXQgb2Zmc2V0ID0gZXZlbnRbKGF4aXMgPT09ICd5JykgPyAnb2Zmc2V0WSc6ICdvZmZzZXRYJ107XG4gICAgXG4gICAgICAgICAgICBpZihvZmZzZXQgPD0gMTApIG9mZnNldCA9IDA7IC8vTGl0dGxlIHR3ZWFrIHRvIG1ha2UgaXQgZWFzaWVyIHRvIGdvIGJhY2sgdG8gdG9wXG4gICAgXG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG1bYXhpcyA9PT0gJ3knID8gJ3Njcm9sbFRvcCcgOiAnc2Nyb2xsTGVmdCddKFxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2Nyb2xsU2l6ZScsIGF4aXMpICogKG9mZnNldCAvIHRoaXMuZ2V0VmFsdWUoalF1ZXJ5KGV2ZW50LnRhcmdldCksICdzaXplJywgYXhpcykpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIGRlc3Ryb3koKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG0ub2ZmKCcuJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSk7XG4gICAgICAgICAgICBqUXVlcnkod2luZG93KS5vZmYoJy4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlKTtcblxuICAgICAgICAgICAgZm9yKGxldCBheGlzIGluIHRoaXMuc2Nyb2xsYmFyRWxtcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZih0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10gJiYgdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdLnNjcm9sbGJhciBpbnN0YW5jZW9mIGpRdWVyeSA9PT0gdHJ1ZSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXS5zY3JvbGxiYXIucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG0uY3NzKHRoaXMub3JpZ2luYWxDc3NWYWx1ZXMpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGluZ3MvaW5kZXguZC50c1wiIC8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiU2Nyb2xsZXJ0UGx1Z2luLnRzXCIgLz5cblxualF1ZXJ5LmZuW1Njcm9sbGVydC5QbHVnaW4uTkFNRV0gPSBmdW5jdGlvbiguLi5hcmdzKSB7XG5cbiAgICBsZXQgYWN0aW9uOnN0cmluZyA9IHR5cGVvZiBhcmdzWzBdID09PSBcInN0cmluZ1wiICA/IGFyZ3NbMF0gOiBcImluaXRcIixcbiAgICAgICAgb3B0aW9uczpTY3JvbGxlcnQuUGx1Z2luT3B0aW9ucyA9ICh0eXBlb2YgYXJnc1sxXSA9PT0gXCJvYmplY3RcIilcbiAgICAgICAgICAgID8gYXJnc1sxXVxuICAgICAgICAgICAgOiAodHlwZW9mIGFyZ3NbMF0gPT09IFwib2JqZWN0XCIpID8gYXJnc1swXSA6IHt9O1xuXG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcblxuICAgICAgICBsZXQgZWxtID0galF1ZXJ5KHRoaXMpLFxuICAgICAgICAgICAga2V5ID0gXCJwbHVnaW4tXCIgKyBTY3JvbGxlcnQuUGx1Z2luLk5BTUUsXG4gICAgICAgICAgICBwbHVnaW46U2Nyb2xsZXJ0LlBsdWdpbiA9IGVsbS5kYXRhKGtleSk7XG5cbiAgICAgICAgaWYoYWN0aW9uID09PSBcImluaXRcIiAmJiBwbHVnaW4gaW5zdGFuY2VvZiBTY3JvbGxlcnQuUGx1Z2luID09PSBmYWxzZSlcbiAgICAgICAge1xuICAgICAgICAgICAgZWxtLmRhdGEoa2V5LCBwbHVnaW4gPSBuZXcgU2Nyb2xsZXJ0LlBsdWdpbihqUXVlcnkodGhpcyksIG9wdGlvbnMpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKHBsdWdpbiBpbnN0YW5jZW9mIFNjcm9sbGVydC5QbHVnaW4gPT09IGZhbHNlKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiVGhlIFNjcm9sbGVydCBwbHVnaW4gaXMgbm90IHlldCBpbml0aWFsaXplZFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaChhY3Rpb24pXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNhc2UgXCJpbml0XCI6IC8vRG9sY2UgZmFyIG5pZW50ZVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGNhc2UgXCJ1cGRhdGVcIjpcbiAgICAgICAgICAgICAgICBwbHVnaW4udXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiZGVzdHJveVwiOlxuICAgICAgICAgICAgICAgIHBsdWdpbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgZWxtLnJlbW92ZURhdGEoa2V5KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgU2Nyb2xsZXJ0IGFjdGlvbiBcIiArIGFjdGlvbik7XG4gICAgICAgIH1cbiAgICB9KTtcblxufTsiXX0=
