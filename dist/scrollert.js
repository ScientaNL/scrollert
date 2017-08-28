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
            this.browserHasFloatingScrollbars = false;
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
            if (this.options.useNativeFloatingScrollbars === true) {
                this.browserHasFloatingScrollbars = Scrollert.ScrollbarDimensions.calculate([{ tagName: "div", classes: "" }]) <= 0;
            }
            if (this.options.useNativeFloatingScrollbars === false || this.browserHasFloatingScrollbars === false) {
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
            if (this.options.useNativeFloatingScrollbars === false || this.browserHasFloatingScrollbars === false) {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNjcm9sbGJhckRpbWVuc2lvbnMudHMiLCJTY3JvbGxlcnRQbHVnaW4udHMiLCJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFPLFNBQVMsQ0FpRGY7QUFqREQsV0FBTyxTQUFTLEVBQ2hCLENBQUM7SUFPRztRQUFBO1FBd0NBLENBQUM7UUF0Q2lCLDZCQUFTLEdBQXZCLFVBQXdCLGNBQW9DO1lBRXhELElBQUksT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUM7WUFFN0IsRUFBRSxDQUFBLENBQUMsY0FBYyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FDOUIsQ0FBQztnQkFDRyxNQUFNLElBQUksU0FBUyxDQUFDLHdFQUF3RSxDQUFDLENBQUM7WUFDbEcsQ0FBQztZQUVELEdBQUcsQ0FBQSxDQUFrQixVQUFjLEVBQWQsaUNBQWMsRUFBZCw0QkFBYyxFQUFkLElBQWMsQ0FBQztnQkFBaEMsSUFBSSxTQUFTLHVCQUFBO2dCQUViLE1BQU0sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDO2dCQUVyQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFFLEdBQUcsT0FBTyxHQUFHLE1BQU0sQ0FBQztnQkFDNUQsT0FBTyxHQUFHLE1BQU0sQ0FBRTthQUNyQjtZQUVELE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUNqQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7WUFDeEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1lBQ3pCLE9BQU8sQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQztZQUNwQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUM7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UTtnQkFDVCxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2hCLEtBQUssQ0FBQztZQUNWLEtBQUssU0FBUztnQkFDVixNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2pCLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3BCLEtBQUssQ0FBQztZQUNWO2dCQUNJLE1BQU0sSUFBSSxTQUFTLENBQUMsMkJBQTJCLEdBQUcsTUFBTSxDQUFDLENBQUM7UUFDbEUsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBRVAsQ0FBQyxDQUFDIiwiZmlsZSI6InNjcm9sbGVydC5qcyIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZSBTY3JvbGxlcnRcbntcbiAgICBleHBvcnQgaW50ZXJmYWNlIFNjcm9sbGJhckRpbWVuc2lvbnNcbiAgICB7XG4gICAgICAgIHRhZ05hbWU6c3RyaW5nO1xuICAgICAgICBjbGFzc2VzOnN0cmluZztcbiAgICB9XG5cbiAgICBleHBvcnQgY2xhc3MgU2Nyb2xsYmFyRGltZW5zaW9uc1xuICAgIHtcbiAgICAgICAgcHVibGljIHN0YXRpYyBjYWxjdWxhdGUoY29udGFpbmVyVHJhaWw6U2Nyb2xsYmFyRGltZW5zaW9uc1tdKTpudW1iZXJcbiAgICAgICAge1xuICAgICAgICAgICAgbGV0IHJvb3RFbG0sIGN1ckVsbSwgcHJldkVsbTtcblxuICAgICAgICAgICAgaWYoY29udGFpbmVyVHJhaWwubGVuZ3RoIDw9IDApXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgY29udGFpbmVyIHRyYWlsIHNwZWNpZmllZCBmb3Igc2Nyb2xsYmFyIGRpbWVuc2lvbnMgY2FsY3VsYXRpb25cIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvcihsZXQgY29udGFpbmVyIG9mIGNvbnRhaW5lclRyYWlsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGN1ckVsbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoY29udGFpbmVyLnRhZ05hbWUpO1xuICAgICAgICAgICAgICAgIGN1ckVsbS5jbGFzc05hbWUgPSBjb250YWluZXIuY2xhc3NlcztcblxuICAgICAgICAgICAgICAgIChwcmV2RWxtKSA/IHByZXZFbG0uYXBwZW5kQ2hpbGQoY3VyRWxtICkgOiByb290RWxtID0gY3VyRWxtO1xuICAgICAgICAgICAgICAgIHByZXZFbG0gPSBjdXJFbG0gO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByb290RWxtLnN0eWxlLnBvc2l0aW9uID0gXCJmaXhlZFwiO1xuICAgICAgICAgICAgcm9vdEVsbS5zdHlsZS50b3AgPSBcIjBcIjtcbiAgICAgICAgICAgIHJvb3RFbG0uc3R5bGUubGVmdCA9IFwiMFwiO1xuICAgICAgICAgICAgcm9vdEVsbS5zdHlsZS52aXNpYmlsaXR5ID0gXCJoaWRkZW5cIjtcbiAgICAgICAgICAgIHJvb3RFbG0uc3R5bGUud2lkdGggPSBcIjIwMHB4XCI7XG4gICAgICAgICAgICByb290RWxtLnN0eWxlLmhlaWdodCA9IFwiMjAwcHhcIjtcblxuICAgICAgICAgICAgY3VyRWxtLnN0eWxlLm92ZXJmbG93ID0gXCJoaWRkZW5cIjtcblxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChyb290RWxtKTtcbiAgICAgICAgICAgIGxldCB3aXRob3V0U2Nyb2xsYmFycyA9IGN1ckVsbS5jbGllbnRXaWR0aDtcblxuICAgICAgICAgICAgY3VyRWxtLnN0eWxlLm92ZXJmbG93ID0gXCJzY3JvbGxcIjtcbiAgICAgICAgICAgIGxldCB3aXRoU2Nyb2xsYmFycyA9IGN1ckVsbS5jbGllbnRXaWR0aDtcblxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChyb290RWxtKTtcblxuICAgICAgICAgICAgcmV0dXJuIHdpdGhvdXRTY3JvbGxiYXJzIC0gd2l0aFNjcm9sbGJhcnM7XG5cbiAgICAgICAgfVxuICAgIH1cbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vdHlwaW5ncy9pbmRleC5kLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJTY3JvbGxiYXJEaW1lbnNpb25zLnRzXCIgLz5cblxubW9kdWxlIFNjcm9sbGVydCB7XG5cbiAgICBleHBvcnQgdHlwZSBBeGlzVHlwZSA9IFwieFwiIHwgXCJ5XCI7XG4gICAgdHlwZSBOb3JtYWxpemVkU2Nyb2xsUHJvcGVydHkgPSBcInNpemVcIiB8IFwic2Nyb2xsU2l6ZVwiIHwgXCJzY3JvbGxQb3NcIiB8IFwiY2xpZW50U2l6ZVwiO1xuICAgIHR5cGUgRGlyZWN0aW9uVHlwZSA9IFwiaGVlblwiIHwgXCJ3ZWVyXCI7IC8vQUtBICBmb3J0aCBhbmQgYmFjayAoaHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1YN1YwOVRtc3UtMClcblxuICAgIGludGVyZmFjZSBTY3JvbGxiYXJDb250YWluZXJcbiAgICB7XG4gICAgICAgIHNjcm9sbGJhcjpKUXVlcnk7XG4gICAgICAgIHRyYWNrOkpRdWVyeTtcbiAgICB9XG5cbiAgICBleHBvcnQgaW50ZXJmYWNlIFBsdWdpbk9wdGlvbnNcbiAgICB7XG4gICAgICAgIGF4ZXM/OkF4aXNUeXBlW107XG4gICAgICAgIHByZXZlbnRPdXRlclNjcm9sbD86Ym9vbGVhbjtcbiAgICAgICAgY3NzUHJlZml4PzpzdHJpbmc7XG4gICAgICAgIGV2ZW50TmFtZXNwYWNlPzpzdHJpbmc7XG4gICAgICAgIGNvbnRlbnRTZWxlY3Rvcj86c3RyaW5nO1xuICAgICAgICB1c2VOYXRpdmVGbG9hdGluZ1Njcm9sbGJhcnM/OmJvb2xlYW47XG4gICAgfVxuXG4gICAgZXhwb3J0IGNsYXNzIFBsdWdpblxuICAgIHtcbiAgICAgICAgcHVibGljIHN0YXRpYyBOQU1FOnN0cmluZyA9ICdzY3JvbGxlcnQnO1xuXG4gICAgICAgIHByaXZhdGUgb3B0aW9uczpQbHVnaW5PcHRpb25zID0ge1xuICAgICAgICAgICAgYXhlczogWyd4JywgJ3knXSxcbiAgICAgICAgICAgIHByZXZlbnRPdXRlclNjcm9sbDogZmFsc2UsXG4gICAgICAgICAgICBjc3NQcmVmaXg6ICdzY3JvbGxlcnQnLFxuICAgICAgICAgICAgZXZlbnROYW1lc3BhY2U6ICdzY3JvbGxlcnQnLFxuICAgICAgICAgICAgY29udGVudFNlbGVjdG9yOiBudWxsLFxuICAgICAgICAgICAgdXNlTmF0aXZlRmxvYXRpbmdTY3JvbGxiYXJzOiB0cnVlXG4gICAgICAgIH07XG5cbiAgICAgICAgcHJpdmF0ZSBjb250ZW50RWxtOkpRdWVyeTtcblxuICAgICAgICBwcml2YXRlIHN0YXRpYyBldmVudE5hbWVzcGFjZUlkID0gMDtcblxuICAgICAgICBwcml2YXRlIHNjcm9sbGJhckVsbXM6eyBbaWQ6IHN0cmluZ10gOiBTY3JvbGxiYXJDb250YWluZXIgfSA9IHtcbiAgICAgICAgICAgIHg6IG51bGwsXG4gICAgICAgICAgICB5OiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgcHJpdmF0ZSBzY3JvbGxDYWNoZSA9IHtcbiAgICAgICAgICAgIHg6IG51bGwsXG4gICAgICAgICAgICB5OiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgcHJpdmF0ZSBvcmlnaW5hbENzc1ZhbHVlczp7IFtpZDogc3RyaW5nXSA6IHN0cmluZzsgfTtcblxuICAgICAgICBwcml2YXRlIGJyb3dzZXJIYXNGbG9hdGluZ1Njcm9sbGJhcnM6Ym9vbGVhbiA9IGZhbHNlO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgY29udGFpbmVyRWxtOkpRdWVyeSwgb3B0aW9ucz86UGx1Z2luT3B0aW9ucylcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zID0galF1ZXJ5LmV4dGVuZCgge30sIHRoaXMub3B0aW9ucywgb3B0aW9ucyApO1xuXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuZXZlbnROYW1lc3BhY2UgPSB0aGlzLm9wdGlvbnMuZXZlbnROYW1lc3BhY2UgKyArK1BsdWdpbi5ldmVudE5hbWVzcGFjZUlkO1xuICAgICAgICAgICAgdGhpcy5jb250ZW50RWxtID0gdGhpcy5jb250YWluZXJFbG0uY2hpbGRyZW4odGhpcy5vcHRpb25zLmNvbnRlbnRTZWxlY3RvciB8fCAnLicgKyB0aGlzLm9wdGlvbnMuY3NzUHJlZml4ICsnLWNvbnRlbnQnKTtcblxuICAgICAgICAgICAgaWYodGhpcy5vcHRpb25zLnVzZU5hdGl2ZUZsb2F0aW5nU2Nyb2xsYmFycyA9PT0gdHJ1ZSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJyb3dzZXJIYXNGbG9hdGluZ1Njcm9sbGJhcnMgPSBTY3JvbGxiYXJEaW1lbnNpb25zLmNhbGN1bGF0ZShbeyB0YWdOYW1lOiBcImRpdlwiLCBjbGFzc2VzOiBcIlwiIH1dKSA8PSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZih0aGlzLm9wdGlvbnMudXNlTmF0aXZlRmxvYXRpbmdTY3JvbGxiYXJzID09PSBmYWxzZSB8fCB0aGlzLmJyb3dzZXJIYXNGbG9hdGluZ1Njcm9sbGJhcnMgPT09IGZhbHNlKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMub2Zmc2V0Q29udGVudEVsbVNjcm9sbGJhcnMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuXG4gICAgICAgICAgICAgICAgLy8gUmVsYXkgc2Nyb2xsIGV2ZW50IG9uIHNjcm9sbGJhci90cmFjayB0byBjb250ZW50IGFuZCBwcmV2ZW50IG91dGVyIHNjcm9sbC5cbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lckVsbS5vbignd2hlZWwuJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSwgdGhpcy5vblNjcm9sbFdoZWVsKTtcblxuICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICogQHRvZG8gVGhlIGtleWRvd24gb3V0ZXIgc2Nyb2xsIHByZXZlbnRpb24gaXMgbm90IHdvcmtpbmcgeWV0LlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGlmKHRoaXMub3B0aW9ucy5wcmV2ZW50T3V0ZXJTY3JvbGwgPT09IHRydWUpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAvLyBQcmV2ZW50IG91dGVyIHNjcm9sbCBvbiBrZXkgZG93blxuICAgICAgICAgICAgICAgICAgICAvL3RoaXMuY29udGVudEVsbS5vbigna2V5ZG93bi4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlLCB0aGlzLm9uS2V5RG93bik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy9UaGVyZSBjb3VsZCBiZSBhIHpvb20gY2hhbmdlLiBab29tIGlzIGFsbW9zdCBub3QgaW5kaXN0aW5ndWlzaGFibGUgZnJvbSByZXNpemUgZXZlbnRzLiBTbyBvbiB3aW5kb3cgcmVzaXplLCByZWNhbGN1bGF0ZSBjb250ZW50RWxtIG9mZmV0XG4gICAgICAgICAgICAgICAgalF1ZXJ5KHdpbmRvdykub24oJ3Jlc2l6ZS4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlLCB0aGlzLm9mZnNldENvbnRlbnRFbG1TY3JvbGxiYXJzLmJpbmQodGhpcywgdHJ1ZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGVudEVsbS5hZGRDbGFzcyhgJHt0aGlzLm9wdGlvbnMuY3NzUHJlZml4fS1kaXNhYmxlZGApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIHVwZGF0ZSgpXG4gICAgICAgIHtcblx0XHRcdGlmKHRoaXMub3B0aW9ucy51c2VOYXRpdmVGbG9hdGluZ1Njcm9sbGJhcnMgPT09IGZhbHNlIHx8IHRoaXMuYnJvd3Nlckhhc0Zsb2F0aW5nU2Nyb2xsYmFycyA9PT0gZmFsc2UpXG5cdFx0XHR7XG5cdFx0XHRcdGxldCByZXBvc2l0aW9uVHJhY2sgPSBmYWxzZTtcblxuXHRcdFx0XHRmb3IgKGxldCBheGlzIG9mIHRoaXMub3B0aW9ucy5heGVzKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dGhpcy51cGRhdGVBeGlzKGF4aXMpO1xuXHRcdFx0XHRcdGlmICh0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgXCJzY3JvbGxQb3NcIiwgYXhpcykgIT09IDApIHJlcG9zaXRpb25UcmFjayA9IHRydWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvL0lmIHdlIHN0YXJ0IG9uIGEgc2Nyb2xsIHBvc2l0aW9uXG5cdFx0XHRcdGlmIChyZXBvc2l0aW9uVHJhY2sgPT09IHRydWUpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0aGlzLmNvbnRlbnRFbG0udHJpZ2dlcignc2Nyb2xsLicgKyB0aGlzLm9wdGlvbnMuZXZlbnROYW1lc3BhY2UpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIGFkZFNjcm9sbGJhcihheGlzOkF4aXNUeXBlLCBjb250YWluZXJFbG06SlF1ZXJ5KTpTY3JvbGxiYXJDb250YWluZXJcbiAgICAgICAge1xuICAgICAgICAgICAgbGV0IHNjcm9sbGJhckVsbSwgdHJhY2tFbG07XG5cbiAgICAgICAgICAgIGNvbnRhaW5lckVsbS5hcHBlbmQoXG4gICAgICAgICAgICAgICAgc2Nyb2xsYmFyRWxtID0galF1ZXJ5KCc8ZGl2IC8+JykuYWRkQ2xhc3MoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5jc3NQcmVmaXggKyAnLXNjcm9sbGJhcicgKyAnICdcbiAgICAgICAgICAgICAgICAgICAgKyB0aGlzLm9wdGlvbnMuY3NzUHJlZml4ICsgJy1zY3JvbGxiYXItJyArIGF4aXNcbiAgICAgICAgICAgICAgICApLmFwcGVuZCh0cmFja0VsbSA9IGpRdWVyeSgnPGRpdiAvPicpLmFkZENsYXNzKHRoaXMub3B0aW9ucy5jc3NQcmVmaXggKyAnLXRyYWNrJykpXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHNjcm9sbGJhcjogc2Nyb2xsYmFyRWxtLFxuICAgICAgICAgICAgICAgIHRyYWNrOiB0cmFja0VsbVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcblxuICAgICAgICBwcml2YXRlIG9uU2Nyb2xsV2hlZWwgPSAoZXZlbnQ6SlF1ZXJ5TW91c2VFdmVudE9iamVjdCkgPT4ge1xuXG4gICAgICAgICAgICBsZXQgb3JpZ2luYWxFdmVudDpXaGVlbEV2ZW50ID0gPFdoZWVsRXZlbnQ+ZXZlbnQub3JpZ2luYWxFdmVudDtcblxuICAgICAgICAgICAgZm9yKGxldCBheGlzIG9mIHRoaXMub3B0aW9ucy5heGVzKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxldCBkZWx0YSA9IG9yaWdpbmFsRXZlbnRbJ2RlbHRhJyArIGF4aXMudG9VcHBlckNhc2UoKV07XG5cbiAgICAgICAgICAgICAgICBpZihkZWx0YSAmJiB0aGlzLnNjcm9sbGJhckVsbXNbYXhpc11cbiAgICAgICAgICAgICAgICAgICAgJiYgKGV2ZW50LnRhcmdldCA9PT0gdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdLnNjcm9sbGJhci5nZXQoMClcbiAgICAgICAgICAgICAgICAgICAgICAgIHx8IGV2ZW50LnRhcmdldCA9PT0gdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdLnRyYWNrLmdldCgwKVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG1bYXhpcyA9PT0neScgPyAnc2Nyb2xsVG9wJyA6ICdzY3JvbGxMZWZ0J10oXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgJ3Njcm9sbFBvcycsIGF4aXMpICsgZGVsdGFcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZih0aGlzLm9wdGlvbnMucHJldmVudE91dGVyU2Nyb2xsID09PSB0cnVlKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRlbHRhICE9PSAwKSB0aGlzLnByZXZlbnRPdXRlclNjcm9sbChheGlzLCAoZGVsdGEgPCAwKSA/IFwiaGVlblwiIDogXCJ3ZWVyXCIsIGV2ZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcHJpdmF0ZSBvbktleURvd24gPSAoZXZlbnQ6SlF1ZXJ5S2V5RXZlbnRPYmplY3QpID0+IHtcblxuICAgICAgICAgICAgaWYoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAhPT0gdGhpcy5jb250ZW50RWxtWzBdKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYoWzM3LDM4LDMzLDM2XS5pbmRleE9mKGV2ZW50LndoaWNoKSAhPT0gLTEgKSAvLyBoZWVuXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcmV2ZW50T3V0ZXJTY3JvbGwoXG4gICAgICAgICAgICAgICAgICAgIFszOCwzMywzNl0uaW5kZXhPZihldmVudC53aGljaCkgIT09IC0xID8gXCJ5XCIgOiBcInhcIixcbiAgICAgICAgICAgICAgICAgICAgXCJoZWVuXCIsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYoWzM5LDQwLDMyLDM0LDM1XS5pbmRleE9mKGV2ZW50LndoaWNoKSAhPT0gLTEgKSAvLyB3ZWVyXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcmV2ZW50T3V0ZXJTY3JvbGwoXG4gICAgICAgICAgICAgICAgICAgIFs0MCwzNSwzNiwzNCwzMl0uaW5kZXhPZihldmVudC53aGljaCkgIT09IC0xID8gXCJ5XCIgOiBcInhcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3ZWVyXCIsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBwcml2YXRlIHByZXZlbnRPdXRlclNjcm9sbChheGlzOkF4aXNUeXBlLCBkaXJlY3Rpb246RGlyZWN0aW9uVHlwZSwgZXZlbnQ6QmFzZUpRdWVyeUV2ZW50T2JqZWN0KVxuICAgICAgICB7XG4gICAgICAgICAgICBsZXQgc2Nyb2xsUG9zID0gdGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sIFwic2Nyb2xsUG9zXCIsIGF4aXMpO1xuICAgICAgICAgICAgc3dpdGNoKGRpcmVjdGlvbilcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwiaGVlblwiOlxuICAgICAgICAgICAgICAgICAgICBpZihzY3JvbGxQb3MgPD0gMCkgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIndlZXJcIjpcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNjcm9sbFNpemUgPSB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgXCJzY3JvbGxTaXplXCIsIGF4aXMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xpZW50U2l6ZSA9IHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCBcImNsaWVudFNpemVcIiwgYXhpcyk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYoc2Nyb2xsU2l6ZSAtIHNjcm9sbFBvcyA9PT0gY2xpZW50U2l6ZSkgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIG9mZnNldENvbnRlbnRFbG1TY3JvbGxiYXJzID0gKGZvcmNlOmJvb2xlYW4gPSBmYWxzZSkgPT4ge1xuXG4gICAgICAgICAgICBsZXQgc2Nyb2xsYmFyRGltZW5zaW9uID0gU2Nyb2xsYmFyRGltZW5zaW9ucy5jYWxjdWxhdGUoW1xuICAgICAgICAgICAgICAgICAgICB7IHRhZ05hbWU6IHRoaXMuY29udGFpbmVyRWxtLnByb3AoJ3RhZ05hbWUnKSwgY2xhc3NlczogdGhpcy5jb250YWluZXJFbG0ucHJvcCgnY2xhc3MnKSB9LFxuICAgICAgICAgICAgICAgICAgICB7IHRhZ05hbWU6IHRoaXMuY29udGVudEVsbS5wcm9wKCd0YWdOYW1lJyksIGNsYXNzZXM6IHRoaXMuY29udGVudEVsbS5wcm9wKCdjbGFzcycpIH1cbiAgICAgICAgICAgICAgICBdKSxcbiAgICAgICAgICAgICAgICBjb3JyZWN0Rm9yRmxvYXRpbmdTY3JvbGxiYXIgPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYoc2Nyb2xsYmFyRGltZW5zaW9uID09PSAwICYmIHRoaXMuaGFzVmlzaWJsZUZsb2F0aW5nU2Nyb2xsYmFyKCkgPT09IHRydWUpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY29ycmVjdEZvckZsb2F0aW5nU2Nyb2xsYmFyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBzY3JvbGxiYXJEaW1lbnNpb24gPSAyMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGNzc1ZhbHVlcyA9IHt9O1xuICAgICAgICAgICAgaWYodGhpcy5vcHRpb25zLmF4ZXMuaW5kZXhPZigneScpICE9PSAtMSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjc3NWYWx1ZXNbJ292ZXJmbG93LXknXSA9IFwic2Nyb2xsXCI7XG4gICAgICAgICAgICAgICAgaWYoc2Nyb2xsYmFyRGltZW5zaW9uKSBjc3NWYWx1ZXNbJ3JpZ2h0J10gPSAtc2Nyb2xsYmFyRGltZW5zaW9uICsgXCJweFwiO1xuICAgICAgICAgICAgICAgIGlmKGNvcnJlY3RGb3JGbG9hdGluZ1Njcm9sbGJhcikgY3NzVmFsdWVzWydwYWRkaW5nLXJpZ2h0J10gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYodGhpcy5vcHRpb25zLmF4ZXMuaW5kZXhPZigneCcpICE9PSAtMSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjc3NWYWx1ZXNbJ292ZXJmbG93LXgnXSA9IFwic2Nyb2xsXCI7XG4gICAgICAgICAgICAgICAgaWYoc2Nyb2xsYmFyRGltZW5zaW9uKSBjc3NWYWx1ZXNbJ2JvdHRvbSddID0gLXNjcm9sbGJhckRpbWVuc2lvbiArIFwicHhcIjtcbiAgICAgICAgICAgICAgICBpZihjb3JyZWN0Rm9yRmxvYXRpbmdTY3JvbGxiYXIpIGNzc1ZhbHVlc1sncGFkZGluZy1ib3R0b20nXSA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZighdGhpcy5vcmlnaW5hbENzc1ZhbHVlcykgdGhpcy5vcmlnaW5hbENzc1ZhbHVlcyA9IHRoaXMuY29udGVudEVsbS5jc3MoT2JqZWN0LmtleXMoY3NzVmFsdWVzKSk7XG5cbiAgICAgICAgICAgIGlmKGNvcnJlY3RGb3JGbG9hdGluZ1Njcm9sbGJhciAmJiBjc3NWYWx1ZXNbJ3BhZGRpbmctcmlnaHQnXSA9PT0gZmFsc2UpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY3NzVmFsdWVzWydwYWRkaW5nLXJpZ2h0J10gPSAocGFyc2VJbnQodGhpcy5vcmlnaW5hbENzc1ZhbHVlc1sncGFkZGluZy1yaWdodCddKSArIHNjcm9sbGJhckRpbWVuc2lvbikgKyBcInB4XCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKGNvcnJlY3RGb3JGbG9hdGluZ1Njcm9sbGJhciAmJiBjc3NWYWx1ZXNbJ3BhZGRpbmctYm90dG9tJ10gPT09IGZhbHNlKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNzc1ZhbHVlc1sncGFkZGluZy1ib3R0b20nXSA9IChwYXJzZUludCh0aGlzLm9yaWdpbmFsQ3NzVmFsdWVzWydwYWRkaW5nLWJvdHRvbSddKSArIHNjcm9sbGJhckRpbWVuc2lvbikgKyBcInB4XCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuY29udGVudEVsbS5jc3MoY3NzVmFsdWVzKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2Nyb2xsYmFycyBieSBkZWZhdWx0IGluIE9TWCBkb24ndCB0YWtlIHVwIHNwYWNlIGJ1dCBhcmUgZmxvYXRpbmcuIFdlIG11c3QgY29ycmVjdCBmb3IgdGhpcywgYnV0IGhvdyBkbyB3ZVxuICAgICAgICAgKiBrbm93IGlmIHdlIG11c3QgY29ycmVjdD8gV2Via2l0IGJhc2VkIGJyb3dzZXJzIGhhdmUgdGhlIHBzZXVkbyBjc3Mtc2VsZWN0b3IgOjotd2Via2l0LXNjcm9sbGJhciBieSB3aGljaCB0aGVcbiAgICAgICAgICogcHJvYmxlbSBpcyBzb2x2ZWQuIEZvciBhbGwgb3RoZXIgZW5naW5lcyBhbm90aGVyIHN0cmF0ZWd5IG11c3RcbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICBwcml2YXRlIGhhc1Zpc2libGVGbG9hdGluZ1Njcm9sbGJhcigpOmJvb2xlYW5cbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9BcHBsZVdlYktpdC9pKSA9PT0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgdXBkYXRlQXhpcyhheGlzOkF4aXNUeXBlKVxuICAgICAgICB7XG4gICAgICAgICAgICBsZXQgaGFzU2Nyb2xsID0gdGhpcy5oYXNTY3JvbGwoYXhpcyk7XG4gICAgICAgICAgICBpZihoYXNTY3JvbGwgPT09IHRydWUgJiYgdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdID09PSBudWxsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyRWxtLmFkZENsYXNzKHRoaXMub3B0aW9ucy5jc3NQcmVmaXggKyBcIi1heGlzLVwiICsgYXhpcyk7XG5cbiAgICAgICAgICAgICAgICBsZXQgZWxtcyA9IHRoaXMuYWRkU2Nyb2xsYmFyKGF4aXMsIHRoaXMuY29udGFpbmVyRWxtKSxcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsYmFyRWxtID0gZWxtcy5zY3JvbGxiYXIsXG4gICAgICAgICAgICAgICAgICAgIHRyYWNrRWxtID0gZWxtcy50cmFjaztcblxuICAgICAgICAgICAgICAgIHNjcm9sbGJhckVsbS5vbignbW91c2Vkb3duLicgKyBheGlzICsgJy4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlLCB0aGlzLm9uU2Nyb2xsYmFyTW91c2Vkb3duLmJpbmQodGhpcywgYXhpcywgc2Nyb2xsYmFyRWxtLCB0cmFja0VsbSkpO1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGVudEVsbS5vbignc2Nyb2xsLicgKyBheGlzICsgJy4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlLCB0aGlzLm9uU2Nyb2xsLmJpbmQodGhpcywgYXhpcywgc2Nyb2xsYmFyRWxtLCB0cmFja0VsbSkpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdID0gZWxtcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYoaGFzU2Nyb2xsID09PSBmYWxzZSAmJiB0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10gIT09IG51bGwpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbG0ucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmNzc1ByZWZpeCArIFwiLWF4aXMtXCIgKyBheGlzKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXS5zY3JvbGxiYXIucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIHRoaXMuY29udGVudEVsbS5vZmYoJy4nICsgYXhpcyArIFwiLlwiICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vUmVzaXplIHRyYWNrIGFjY29yZGluZyB0byBjdXJyZW50IHNjcm9sbCBkaW1lbnNpb25zXG4gICAgICAgICAgICBpZih0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10gIT09IG51bGwpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNpemVUcmFjayhheGlzLCB0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10uc2Nyb2xsYmFyLCB0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10udHJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBnZXRWYWx1ZShlbG06SlF1ZXJ5LCBwcm9wZXJ0eTpOb3JtYWxpemVkU2Nyb2xsUHJvcGVydHksIGF4aXM6QXhpc1R5cGUpOm51bWJlclxuICAgICAgICB7XG4gICAgICAgICAgICBzd2l0Y2gocHJvcGVydHkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY2FzZSAnc2l6ZSc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbG1bYXhpcyA9PT0gJ3knID8gJ291dGVySGVpZ2h0JyA6ICdvdXRlcldpZHRoJ10oKTtcbiAgICAgICAgICAgICAgICBjYXNlICdjbGllbnRTaXplJzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsbVswXVtheGlzID09PSAneScgPyAnY2xpZW50SGVpZ2h0JyA6ICdjbGllbnRXaWR0aCddO1xuICAgICAgICAgICAgICAgIGNhc2UgJ3Njcm9sbFNpemUnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZWxtWzBdW2F4aXMgPT09ICd5JyA/ICdzY3JvbGxIZWlnaHQnIDogJ3Njcm9sbFdpZHRoJ107XG4gICAgICAgICAgICAgICAgY2FzZSAnc2Nyb2xsUG9zJzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsbVtheGlzID09PSAneScgPyAnc2Nyb2xsVG9wJyA6ICdzY3JvbGxMZWZ0J10oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgaGFzU2Nyb2xsKGF4aXM6QXhpc1R5cGUpOmJvb2xlYW5cbiAgICAgICAge1xuICAgICAgICAgICAgbGV0IGNvbnRlbnRTaXplID0gTWF0aC5yb3VuZCh0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgJ3NpemUnLCBheGlzKSksXG4gICAgICAgICAgICAgICAgY29udGVudFNjcm9sbFNpemUgPSBNYXRoLnJvdW5kKHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2Nyb2xsU2l6ZScsIGF4aXMpKTtcblxuICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnRTaXplIDwgY29udGVudFNjcm9sbFNpemU7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIHJlc2l6ZVRyYWNrKGF4aXM6QXhpc1R5cGUsIHNjcm9sbGJhckVsbTpKUXVlcnksIHRyYWNrRWxtOkpRdWVyeSlcbiAgICAgICAge1xuICAgICAgICAgICAgbGV0IGNvbnRlbnRTaXplID0gdGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sICdzaXplJywgYXhpcyksXG4gICAgICAgICAgICAgICAgY29udGVudFNjcm9sbFNpemUgPSB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgJ3Njcm9sbFNpemUnLCBheGlzKTtcbiAgICBcbiAgICAgICAgICAgIGlmKGNvbnRlbnRTaXplIDwgY29udGVudFNjcm9sbFNpemUpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc2Nyb2xsYmFyRWxtLnJlbW92ZUNsYXNzKCdoaWRkZW4nKTtcbiAgICBcbiAgICAgICAgICAgICAgICBsZXQgc2Nyb2xsYmFyRGltZW5zaW9uID0gdGhpcy5nZXRWYWx1ZShzY3JvbGxiYXJFbG0sICdzaXplJywgYXhpcyk7XG4gICAgXG4gICAgICAgICAgICAgICAgdHJhY2tFbG0uY3NzKGF4aXMgPT09ICd5JyA/ICdoZWlnaHQnIDogJ3dpZHRoJyxcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsYmFyRGltZW5zaW9uICogKGNvbnRlbnRTaXplIC8gY29udGVudFNjcm9sbFNpemUpXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzY3JvbGxiYXJFbG0uYWRkQ2xhc3MoJ2hpZGRlbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBwb3NpdGlvblRyYWNrKGF4aXM6QXhpc1R5cGUsIHNjcm9sbGJhckVsbTpKUXVlcnksIHRyYWNrRWxtOkpRdWVyeSlcbiAgICAgICAge1xuICAgICAgICAgICAgbGV0IHJlbFRyYWNrUG9zID0gdGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sICdzY3JvbGxQb3MnLCBheGlzKVxuICAgICAgICAgICAgICAgICAgICAvICh0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgJ3Njcm9sbFNpemUnLCBheGlzKSAtIHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2l6ZScsIGF4aXMpKSxcbiAgICAgICAgICAgICAgICB0cmFja0RpbWVuc2lvbiA9IHRoaXMuZ2V0VmFsdWUodHJhY2tFbG0sICdzaXplJywgYXhpcyksXG4gICAgICAgICAgICAgICAgc2Nyb2xsYmFyRGltZW5zaW9uID0gdGhpcy5nZXRWYWx1ZShzY3JvbGxiYXJFbG0sICdzaXplJywgYXhpcyk7XG4gICAgXG4gICAgICAgICAgICB0cmFja0VsbS5jc3MoYXhpcyA9PT0gJ3knID8gJ3RvcCcgOiAnbGVmdCcsXG4gICAgICAgICAgICAgICAgKHNjcm9sbGJhckRpbWVuc2lvbiAtIHRyYWNrRGltZW5zaW9uKSAqIE1hdGgubWluKHJlbFRyYWNrUG9zLCAxKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgb25TY3JvbGwoYXhpczpBeGlzVHlwZSwgc2Nyb2xsYmFyRWxtOkpRdWVyeSwgdHJhY2tFbG06SlF1ZXJ5LCBldmVudDpNb3VzZUV2ZW50KVxuICAgICAgICB7XG4gICAgICAgICAgICBpZih0aGlzLnNjcm9sbENhY2hlW2F4aXNdICE9PSAodGhpcy5zY3JvbGxDYWNoZVtheGlzXSA9IHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2Nyb2xsUG9zJywgYXhpcykpKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMucG9zaXRpb25UcmFjayhheGlzLCBzY3JvbGxiYXJFbG0sIHRyYWNrRWxtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgb25TY3JvbGxiYXJNb3VzZWRvd24gPSAoYXhpczogQXhpc1R5cGUsIHNjcm9sbGJhckVsbTogSlF1ZXJ5LCB0cmFja0VsbTogSlF1ZXJ5LCBldmVudDogTW91c2VFdmVudCkgPT4ge1xuXG4gICAgICAgICAgICBpZihldmVudC50YXJnZXQgPT09IHNjcm9sbGJhckVsbVswXSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvQ2xpY2tlZFBvc2l0aW9uKGF4aXMsIGV2ZW50KTtcbiAgICAgICAgICAgICAgICB0aGlzLnRyYWNrTW91c2Vkb3duKGF4aXMsIHNjcm9sbGJhckVsbSwgZXZlbnQpOyAvL0Fsc28gc3RhcnQgZHJhZ2dpbmcgdGhlIHRyYWNrIHRvIGRvIGEgY29ycmVjdGlvbiBkcmFnIGFmdGVyIGNsaWNraW5nIHRoZSBzY3JvbGxiYXJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYoZXZlbnQudGFyZ2V0ID09PSB0cmFja0VsbVswXSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRyYWNrTW91c2Vkb3duKGF4aXMsIHNjcm9sbGJhckVsbSwgZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHByaXZhdGUgdHJhY2tNb3VzZWRvd24oYXhpczogQXhpc1R5cGUsIHNjcm9sbGJhckVsbTogSlF1ZXJ5LCBldmVudDogTW91c2VFdmVudClcbiAgICAgICAge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgbGV0IG9yaWdpbiA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRQb3M6IGV2ZW50W2F4aXMgPT09ICd5JyA/ICdwYWdlWScgOiAncGFnZVgnXSxcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRTY3JvbGw6IHRoaXMuY29udGVudEVsbVtheGlzID09PSAneScgPyAnc2Nyb2xsVG9wJyA6ICdzY3JvbGxMZWZ0J10oKSxcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsRmFjdG9yOiB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgJ3Njcm9sbFNpemUnLCBheGlzKSAvIHRoaXMuZ2V0VmFsdWUoc2Nyb2xsYmFyRWxtLCAnc2l6ZScsIGF4aXMpIC8vSG93IGJpZyBpZiB0aGUgc2Nyb2xsYmFyIGVsZW1lbnQgY29tcGFyZWQgdG8gdGhlIGNvbnRlbnQgc2Nyb2xsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAkd2luZG93ID0galF1ZXJ5KHdpbmRvdyksXG4gICAgICAgICAgICAgICAgbW92ZUhhbmRsZXIgPSB0aGlzLm9uVHJhY2tEcmFnLmJpbmQodGhpcywgYXhpcywgb3JpZ2luKTtcblxuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbG0uYWRkQ2xhc3ModGhpcy5vcHRpb25zLmNzc1ByZWZpeCArIFwiLXRyYWNrZHJhZy1cIiArIGF4aXMpO1xuXG4gICAgICAgICAgICAkd2luZG93XG4gICAgICAgICAgICAgICAgLm9uKCdtb3VzZW1vdmUuJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSwgbW92ZUhhbmRsZXIpXG4gICAgICAgICAgICAgICAgLm9uZSgnbW91c2V1cC4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlLCAoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgJHdpbmRvdy5vZmYoJ21vdXNlbW92ZScsIG1vdmVIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbG0ucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmNzc1ByZWZpeCArIFwiLXRyYWNrZHJhZy1cIiArIGF4aXMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBvblRyYWNrRHJhZyhheGlzOkF4aXNUeXBlLCBvcmlnaW4sIGV2ZW50Ok1vdXNlRXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIHRoaXMuY29udGVudEVsbVtheGlzID09PSd5JyA/ICdzY3JvbGxUb3AnIDogJ3Njcm9sbExlZnQnXShcbiAgICAgICAgICAgICAgICBvcmlnaW4uc3RhcnRTY3JvbGwgKyAoZXZlbnRbYXhpcyA9PT0gJ3knID8gJ3BhZ2VZJyA6ICdwYWdlWCddIC0gb3JpZ2luLnN0YXJ0UG9zKSAqIG9yaWdpbi5zY3JvbGxGYWN0b3JcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIHNjcm9sbFRvQ2xpY2tlZFBvc2l0aW9uKGF4aXM6QXhpc1R5cGUsIGV2ZW50Ok1vdXNlRXZlbnQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgXG4gICAgICAgICAgICBsZXQgb2Zmc2V0ID0gZXZlbnRbKGF4aXMgPT09ICd5JykgPyAnb2Zmc2V0WSc6ICdvZmZzZXRYJ107XG4gICAgXG4gICAgICAgICAgICBpZihvZmZzZXQgPD0gMTApIG9mZnNldCA9IDA7IC8vTGl0dGxlIHR3ZWFrIHRvIG1ha2UgaXQgZWFzaWVyIHRvIGdvIGJhY2sgdG8gdG9wXG4gICAgXG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG1bYXhpcyA9PT0gJ3knID8gJ3Njcm9sbFRvcCcgOiAnc2Nyb2xsTGVmdCddKFxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2Nyb2xsU2l6ZScsIGF4aXMpICogKG9mZnNldCAvIHRoaXMuZ2V0VmFsdWUoalF1ZXJ5KGV2ZW50LnRhcmdldCksICdzaXplJywgYXhpcykpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIGRlc3Ryb3koKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG0ub2ZmKCcuJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSk7XG4gICAgICAgICAgICBqUXVlcnkod2luZG93KS5vZmYoJy4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlKTtcblxuICAgICAgICAgICAgZm9yKGxldCBheGlzIGluIHRoaXMuc2Nyb2xsYmFyRWxtcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZih0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10gJiYgdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdLnNjcm9sbGJhciBpbnN0YW5jZW9mIGpRdWVyeSA9PT0gdHJ1ZSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXS5zY3JvbGxiYXIucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG0uY3NzKHRoaXMub3JpZ2luYWxDc3NWYWx1ZXMpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGluZ3MvaW5kZXguZC50c1wiIC8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiU2Nyb2xsZXJ0UGx1Z2luLnRzXCIgLz5cblxualF1ZXJ5LmZuW1Njcm9sbGVydC5QbHVnaW4uTkFNRV0gPSBmdW5jdGlvbiguLi5hcmdzKSB7XG5cbiAgICBsZXQgYWN0aW9uOnN0cmluZyA9IHR5cGVvZiBhcmdzWzBdID09PSBcInN0cmluZ1wiICA/IGFyZ3NbMF0gOiBcImluaXRcIixcbiAgICAgICAgb3B0aW9uczpTY3JvbGxlcnQuUGx1Z2luT3B0aW9ucyA9ICh0eXBlb2YgYXJnc1sxXSA9PT0gXCJvYmplY3RcIilcbiAgICAgICAgICAgID8gYXJnc1sxXVxuICAgICAgICAgICAgOiAodHlwZW9mIGFyZ3NbMF0gPT09IFwib2JqZWN0XCIpID8gYXJnc1swXSA6IHt9O1xuXG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcblxuICAgICAgICBsZXQgZWxtID0galF1ZXJ5KHRoaXMpLFxuICAgICAgICAgICAga2V5ID0gXCJwbHVnaW4tXCIgKyBTY3JvbGxlcnQuUGx1Z2luLk5BTUUsXG4gICAgICAgICAgICBwbHVnaW46U2Nyb2xsZXJ0LlBsdWdpbiA9IGVsbS5kYXRhKGtleSk7XG5cbiAgICAgICAgaWYoYWN0aW9uID09PSBcImluaXRcIiAmJiBwbHVnaW4gaW5zdGFuY2VvZiBTY3JvbGxlcnQuUGx1Z2luID09PSBmYWxzZSlcbiAgICAgICAge1xuICAgICAgICAgICAgZWxtLmRhdGEoa2V5LCBwbHVnaW4gPSBuZXcgU2Nyb2xsZXJ0LlBsdWdpbihqUXVlcnkodGhpcyksIG9wdGlvbnMpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKHBsdWdpbiBpbnN0YW5jZW9mIFNjcm9sbGVydC5QbHVnaW4gPT09IGZhbHNlKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiVGhlIFNjcm9sbGVydCBwbHVnaW4gaXMgbm90IHlldCBpbml0aWFsaXplZFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaChhY3Rpb24pXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNhc2UgXCJpbml0XCI6IC8vRG9sY2UgZmFyIG5pZW50ZVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGNhc2UgXCJ1cGRhdGVcIjpcbiAgICAgICAgICAgICAgICBwbHVnaW4udXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiZGVzdHJveVwiOlxuICAgICAgICAgICAgICAgIHBsdWdpbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgZWxtLnJlbW92ZURhdGEoa2V5KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgU2Nyb2xsZXJ0IGFjdGlvbiBcIiArIGFjdGlvbik7XG4gICAgICAgIH1cbiAgICB9KTtcblxufTsiXX0=
