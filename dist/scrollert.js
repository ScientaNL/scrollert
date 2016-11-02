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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNjcm9sbGJhckRpbWVuc2lvbnMudHMiLCJTY3JvbGxlcnRQbHVnaW4udHMiLCJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFPLFNBQVMsQ0FpRGY7QUFqREQsV0FBTyxTQUFTLEVBQ2hCLENBQUM7SUFPRztRQUFBO1FBd0NBLENBQUM7UUF0Q2lCLDZCQUFTLEdBQXZCLFVBQXdCLGNBQW9DO1lBRXhELElBQUksT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUM7WUFFN0IsRUFBRSxDQUFBLENBQUMsY0FBYyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FDOUIsQ0FBQztnQkFDRyxNQUFNLElBQUksU0FBUyxDQUFDLHdFQUF3RSxDQUFDLENBQUM7WUFDbEcsQ0FBQztZQUVELEdBQUcsQ0FBQSxDQUFrQixVQUFjLEVBQWQsaUNBQWMsRUFBZCw0QkFBYyxFQUFkLElBQWMsQ0FBQztnQkFBaEMsSUFBSSxTQUFTLHVCQUFBO2dCQUViLE1BQU0sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDO2dCQUVyQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFFLEdBQUcsT0FBTyxHQUFHLE1BQU0sQ0FBQztnQkFDNUQsT0FBTyxHQUFHLE1BQU0sQ0FBRTthQUNyQjtZQUVELE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUNqQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7WUFDeEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1lBQ3pCLE9BQU8sQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQztZQUNwQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUM7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QUUsQ0FBQSxDQUFDLE1BQU0sWUFBWSxTQUFTLENBQUMsTUFBTSxLQUFLLEtBQUssQ0FBQyxDQUNyRCxDQUFDO1lBQ0csTUFBTSxJQUFJLFNBQVMsQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFDO1FBQ3ZFLENBQUM7UUFFRCxNQUFNLENBQUEsQ0FBQyxNQUFNLENBQUMsQ0FDZCxDQUFDO1lBQ0csS0FBSyxNQUFNO2dCQUNQLE1BQU0sQ0FBQztZQUNYLEtBQUssUUFBUTtnQkFDVCxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2hCLEtBQUssQ0FBQztZQUNWLEtBQUssU0FBUztnQkFDVixNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2pCLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3BCLEtBQUssQ0FBQztZQUNWO2dCQUNJLE1BQU0sSUFBSSxTQUFTLENBQUMsMkJBQTJCLEdBQUcsTUFBTSxDQUFDLENBQUM7UUFDbEUsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBRVAsQ0FBQyxDQUFDIiwiZmlsZSI6InNjcm9sbGVydC5qcyIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZSBTY3JvbGxlcnRcbntcbiAgICBleHBvcnQgaW50ZXJmYWNlIFNjcm9sbGJhckRpbWVuc2lvbnNcbiAgICB7XG4gICAgICAgIHRhZ05hbWU6c3RyaW5nO1xuICAgICAgICBjbGFzc2VzOnN0cmluZztcbiAgICB9XG5cbiAgICBleHBvcnQgY2xhc3MgU2Nyb2xsYmFyRGltZW5zaW9uc1xuICAgIHtcbiAgICAgICAgcHVibGljIHN0YXRpYyBjYWxjdWxhdGUoY29udGFpbmVyVHJhaWw6U2Nyb2xsYmFyRGltZW5zaW9uc1tdKTpudW1iZXJcbiAgICAgICAge1xuICAgICAgICAgICAgbGV0IHJvb3RFbG0sIGN1ckVsbSwgcHJldkVsbTtcblxuICAgICAgICAgICAgaWYoY29udGFpbmVyVHJhaWwubGVuZ3RoIDw9IDApXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgY29udGFpbmVyIHRyYWlsIHNwZWNpZmllZCBmb3Igc2Nyb2xsYmFyIGRpbWVuc2lvbnMgY2FsY3VsYXRpb25cIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvcihsZXQgY29udGFpbmVyIG9mIGNvbnRhaW5lclRyYWlsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGN1ckVsbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoY29udGFpbmVyLnRhZ05hbWUpO1xuICAgICAgICAgICAgICAgIGN1ckVsbS5jbGFzc05hbWUgPSBjb250YWluZXIuY2xhc3NlcztcblxuICAgICAgICAgICAgICAgIChwcmV2RWxtKSA/IHByZXZFbG0uYXBwZW5kQ2hpbGQoY3VyRWxtICkgOiByb290RWxtID0gY3VyRWxtO1xuICAgICAgICAgICAgICAgIHByZXZFbG0gPSBjdXJFbG0gO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByb290RWxtLnN0eWxlLnBvc2l0aW9uID0gXCJmaXhlZFwiO1xuICAgICAgICAgICAgcm9vdEVsbS5zdHlsZS50b3AgPSBcIjBcIjtcbiAgICAgICAgICAgIHJvb3RFbG0uc3R5bGUubGVmdCA9IFwiMFwiO1xuICAgICAgICAgICAgcm9vdEVsbS5zdHlsZS52aXNpYmlsaXR5ID0gXCJoaWRkZW5cIjtcbiAgICAgICAgICAgIHJvb3RFbG0uc3R5bGUud2lkdGggPSBcIjIwMHB4XCI7XG4gICAgICAgICAgICByb290RWxtLnN0eWxlLmhlaWdodCA9IFwiMjAwcHhcIjtcblxuICAgICAgICAgICAgY3VyRWxtLnN0eWxlLm92ZXJmbG93ID0gXCJoaWRkZW5cIjtcblxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChyb290RWxtKTtcbiAgICAgICAgICAgIGxldCB3aXRob3V0U2Nyb2xsYmFycyA9IGN1ckVsbS5jbGllbnRXaWR0aDtcblxuICAgICAgICAgICAgY3VyRWxtLnN0eWxlLm92ZXJmbG93ID0gXCJzY3JvbGxcIjtcbiAgICAgICAgICAgIGxldCB3aXRoU2Nyb2xsYmFycyA9IGN1ckVsbS5jbGllbnRXaWR0aDtcblxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChyb290RWxtKTtcblxuICAgICAgICAgICAgcmV0dXJuIHdpdGhvdXRTY3JvbGxiYXJzIC0gd2l0aFNjcm9sbGJhcnM7XG5cbiAgICAgICAgfVxuICAgIH1cbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vdHlwaW5ncy9pbmRleC5kLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJTY3JvbGxiYXJEaW1lbnNpb25zLnRzXCIgLz5cblxubW9kdWxlIFNjcm9sbGVydCB7XG5cbiAgICBleHBvcnQgdHlwZSBBeGlzVHlwZSA9IFwieFwiIHwgXCJ5XCI7XG4gICAgdHlwZSBOb3JtYWxpemVkU2Nyb2xsUHJvcGVydHkgPSBcInNpemVcIiB8IFwic2Nyb2xsU2l6ZVwiIHwgXCJzY3JvbGxQb3NcIiB8IFwiY2xpZW50U2l6ZVwiO1xuICAgIHR5cGUgRGlyZWN0aW9uVHlwZSA9IFwiaGVlblwiIHwgXCJ3ZWVyXCI7IC8vQUtBICBmb3J0aCBhbmQgYmFjayAoaHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1YN1YwOVRtc3UtMClcblxuICAgIGludGVyZmFjZSBTY3JvbGxiYXJDb250YWluZXJcbiAgICB7XG4gICAgICAgIHNjcm9sbGJhcjpKUXVlcnk7XG4gICAgICAgIHRyYWNrOkpRdWVyeTtcbiAgICB9XG5cbiAgICBleHBvcnQgaW50ZXJmYWNlIFBsdWdpbk9wdGlvbnNcbiAgICB7XG4gICAgICAgIGF4ZXM/OkF4aXNUeXBlW107XG4gICAgICAgIHByZXZlbnRPdXRlclNjcm9sbD86Ym9vbGVhbjtcbiAgICAgICAgY3NzUHJlZml4PzpzdHJpbmc7XG4gICAgICAgIGV2ZW50TmFtZXNwYWNlPzpzdHJpbmc7XG4gICAgICAgIGNvbnRlbnRTZWxlY3Rvcj86c3RyaW5nO1xuICAgIH1cblxuICAgIGV4cG9ydCBjbGFzcyBQbHVnaW5cbiAgICB7XG4gICAgICAgIHB1YmxpYyBzdGF0aWMgTkFNRTpzdHJpbmcgPSAnc2Nyb2xsZXJ0JztcblxuICAgICAgICBwcml2YXRlIG9wdGlvbnM6UGx1Z2luT3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGF4ZXM6IFsneCcsICd5J10sXG4gICAgICAgICAgICBwcmV2ZW50T3V0ZXJTY3JvbGw6IGZhbHNlLFxuICAgICAgICAgICAgY3NzUHJlZml4OiAnc2Nyb2xsZXJ0JyxcbiAgICAgICAgICAgIGV2ZW50TmFtZXNwYWNlOiAnc2Nyb2xsZXJ0JyxcbiAgICAgICAgICAgIGNvbnRlbnRTZWxlY3RvcjogbnVsbFxuICAgICAgICB9O1xuXG4gICAgICAgIHByaXZhdGUgY29udGVudEVsbTpKUXVlcnk7XG5cbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgZXZlbnROYW1lc3BhY2VJZCA9IDA7XG5cbiAgICAgICAgcHJpdmF0ZSBzY3JvbGxiYXJFbG1zOnsgW2lkOiBzdHJpbmddIDogU2Nyb2xsYmFyQ29udGFpbmVyIH0gPSB7XG4gICAgICAgICAgICB4OiBudWxsLFxuICAgICAgICAgICAgeTogbnVsbFxuICAgICAgICB9O1xuXG4gICAgICAgIHByaXZhdGUgc2Nyb2xsQ2FjaGUgPSB7XG4gICAgICAgICAgICB4OiBudWxsLFxuICAgICAgICAgICAgeTogbnVsbFxuICAgICAgICB9O1xuXG4gICAgICAgIHByaXZhdGUgb3JpZ2luYWxDc3NWYWx1ZXM6eyBbaWQ6IHN0cmluZ10gOiBzdHJpbmc7IH07XG5cbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBjb250YWluZXJFbG06SlF1ZXJ5LCBvcHRpb25zPzpQbHVnaW5PcHRpb25zKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMgPSBqUXVlcnkuZXh0ZW5kKCB7fSwgdGhpcy5vcHRpb25zLCBvcHRpb25zICk7XG5cbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSA9IHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSArICsrUGx1Z2luLmV2ZW50TmFtZXNwYWNlSWQ7XG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG0gPSB0aGlzLmNvbnRhaW5lckVsbS5jaGlsZHJlbih0aGlzLm9wdGlvbnMuY29udGVudFNlbGVjdG9yIHx8ICcuJyArIHRoaXMub3B0aW9ucy5jc3NQcmVmaXggKyctY29udGVudCcpO1xuXG4gICAgICAgICAgICB0aGlzLm9mZnNldENvbnRlbnRFbG1TY3JvbGxiYXJzKCk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuXG4gICAgICAgICAgICAvLyBSZWxheSBzY3JvbGwgZXZlbnQgb24gc2Nyb2xsYmFyL3RyYWNrIHRvIGNvbnRlbnQgYW5kIHByZXZlbnQgb3V0ZXIgc2Nyb2xsLlxuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbG0ub24oJ3doZWVsLicgKyB0aGlzLm9wdGlvbnMuZXZlbnROYW1lc3BhY2UsIHRoaXMub25TY3JvbGxXaGVlbCk7XG5cbiAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgKiBAdG9kbyBUaGUga2V5ZG93biBvdXRlciBzY3JvbGwgcHJldmVudGlvbiBpcyBub3Qgd29ya2luZyB5ZXQuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGlmKHRoaXMub3B0aW9ucy5wcmV2ZW50T3V0ZXJTY3JvbGwgPT09IHRydWUpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgLy8gUHJldmVudCBvdXRlciBzY3JvbGwgb24ga2V5IGRvd25cbiAgICAgICAgICAgICAgICAvL3RoaXMuY29udGVudEVsbS5vbigna2V5ZG93bi4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlLCB0aGlzLm9uS2V5RG93bik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vVGhlcmUgY291bGQgYmUgYSB6b29tIGNoYW5nZS4gWm9vbSBpcyBhbG1vc3Qgbm90IGluZGlzdGluZ3Vpc2hhYmxlIGZyb20gcmVzaXplIGV2ZW50cy4gU28gb24gd2luZG93IHJlc2l6ZSwgcmVjYWxjdWxhdGUgY29udGVudEVsbSBvZmZldFxuICAgICAgICAgICAgalF1ZXJ5KHdpbmRvdykub24oJ3Jlc2l6ZS4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlLCB0aGlzLm9mZnNldENvbnRlbnRFbG1TY3JvbGxiYXJzLmJpbmQodGhpcywgdHJ1ZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIHVwZGF0ZSgpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxldCByZXBvc2l0aW9uVHJhY2sgPSBmYWxzZTtcblxuICAgICAgICAgICAgZm9yKGxldCBheGlzIG9mIHRoaXMub3B0aW9ucy5heGVzKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQXhpcyhheGlzKTtcbiAgICAgICAgICAgICAgICBpZih0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgXCJzY3JvbGxQb3NcIiwgYXhpcykgIT09IDApIHJlcG9zaXRpb25UcmFjayA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vSWYgd2Ugc3RhcnQgb24gYSBzY3JvbGwgcG9zaXRpb25cbiAgICAgICAgICAgIGlmKHJlcG9zaXRpb25UcmFjayA9PT0gdHJ1ZSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG0udHJpZ2dlcignc2Nyb2xsLicgKyB0aGlzLm9wdGlvbnMuZXZlbnROYW1lc3BhY2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBhZGRTY3JvbGxiYXIoYXhpczpBeGlzVHlwZSwgY29udGFpbmVyRWxtOkpRdWVyeSk6U2Nyb2xsYmFyQ29udGFpbmVyXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxldCBzY3JvbGxiYXJFbG0sIHRyYWNrRWxtO1xuXG4gICAgICAgICAgICBjb250YWluZXJFbG0uYXBwZW5kKFxuICAgICAgICAgICAgICAgIHNjcm9sbGJhckVsbSA9IGpRdWVyeSgnPGRpdiAvPicpLmFkZENsYXNzKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuY3NzUHJlZml4ICsgJy1zY3JvbGxiYXInICsgJyAnXG4gICAgICAgICAgICAgICAgICAgICsgdGhpcy5vcHRpb25zLmNzc1ByZWZpeCArICctc2Nyb2xsYmFyLScgKyBheGlzXG4gICAgICAgICAgICAgICAgKS5hcHBlbmQodHJhY2tFbG0gPSBqUXVlcnkoJzxkaXYgLz4nKS5hZGRDbGFzcyh0aGlzLm9wdGlvbnMuY3NzUHJlZml4ICsgJy10cmFjaycpKVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzY3JvbGxiYXI6IHNjcm9sbGJhckVsbSxcbiAgICAgICAgICAgICAgICB0cmFjazogdHJhY2tFbG1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG5cbiAgICAgICAgcHJpdmF0ZSBvblNjcm9sbFdoZWVsID0gKGV2ZW50OkpRdWVyeU1vdXNlRXZlbnRPYmplY3QpID0+IHtcblxuICAgICAgICAgICAgbGV0IG9yaWdpbmFsRXZlbnQ6V2hlZWxFdmVudCA9IDxXaGVlbEV2ZW50PmV2ZW50Lm9yaWdpbmFsRXZlbnQ7XG5cbiAgICAgICAgICAgIGZvcihsZXQgYXhpcyBvZiB0aGlzLm9wdGlvbnMuYXhlcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsZXQgZGVsdGEgPSBvcmlnaW5hbEV2ZW50WydkZWx0YScgKyBheGlzLnRvVXBwZXJDYXNlKCldO1xuXG4gICAgICAgICAgICAgICAgaWYoZGVsdGEgJiYgdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdXG4gICAgICAgICAgICAgICAgICAgICYmIChldmVudC50YXJnZXQgPT09IHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXS5zY3JvbGxiYXIuZ2V0KDApXG4gICAgICAgICAgICAgICAgICAgICAgICB8fCBldmVudC50YXJnZXQgPT09IHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXS50cmFjay5nZXQoMClcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250ZW50RWxtW2F4aXMgPT09J3knID8gJ3Njcm9sbFRvcCcgOiAnc2Nyb2xsTGVmdCddKFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sICdzY3JvbGxQb3MnLCBheGlzKSArIGRlbHRhXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYodGhpcy5vcHRpb25zLnByZXZlbnRPdXRlclNjcm9sbCA9PT0gdHJ1ZSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkZWx0YSAhPT0gMCkgdGhpcy5wcmV2ZW50T3V0ZXJTY3JvbGwoYXhpcywgKGRlbHRhIDwgMCkgPyBcImhlZW5cIiA6IFwid2VlclwiLCBldmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHByaXZhdGUgb25LZXlEb3duID0gKGV2ZW50OkpRdWVyeUtleUV2ZW50T2JqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIGlmKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgIT09IHRoaXMuY29udGVudEVsbVswXSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKFszNywzOCwzMywzNl0uaW5kZXhPZihldmVudC53aGljaCkgIT09IC0xICkgLy8gaGVlblxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMucHJldmVudE91dGVyU2Nyb2xsKFxuICAgICAgICAgICAgICAgICAgICBbMzgsMzMsMzZdLmluZGV4T2YoZXZlbnQud2hpY2gpICE9PSAtMSA/IFwieVwiIDogXCJ4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaGVlblwiLFxuICAgICAgICAgICAgICAgICAgICBldmVudFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmKFszOSw0MCwzMiwzNCwzNV0uaW5kZXhPZihldmVudC53aGljaCkgIT09IC0xICkgLy8gd2VlclxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMucHJldmVudE91dGVyU2Nyb2xsKFxuICAgICAgICAgICAgICAgICAgICBbNDAsMzUsMzYsMzQsMzJdLmluZGV4T2YoZXZlbnQud2hpY2gpICE9PSAtMSA/IFwieVwiIDogXCJ4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwid2VlclwiLFxuICAgICAgICAgICAgICAgICAgICBldmVudFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcHJpdmF0ZSBwcmV2ZW50T3V0ZXJTY3JvbGwoYXhpczpBeGlzVHlwZSwgZGlyZWN0aW9uOkRpcmVjdGlvblR5cGUsIGV2ZW50OkJhc2VKUXVlcnlFdmVudE9iamVjdClcbiAgICAgICAge1xuICAgICAgICAgICAgbGV0IHNjcm9sbFBvcyA9IHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCBcInNjcm9sbFBvc1wiLCBheGlzKTtcbiAgICAgICAgICAgIHN3aXRjaChkaXJlY3Rpb24pXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY2FzZSBcImhlZW5cIjpcbiAgICAgICAgICAgICAgICAgICAgaWYoc2Nyb2xsUG9zIDw9IDApIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJ3ZWVyXCI6XG4gICAgICAgICAgICAgICAgICAgIGxldCBzY3JvbGxTaXplID0gdGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sIFwic2Nyb2xsU2l6ZVwiLCBheGlzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsaWVudFNpemUgPSB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgXCJjbGllbnRTaXplXCIsIGF4aXMpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmKHNjcm9sbFNpemUgLSBzY3JvbGxQb3MgPT09IGNsaWVudFNpemUpIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBvZmZzZXRDb250ZW50RWxtU2Nyb2xsYmFycyA9IChmb3JjZTpib29sZWFuID0gZmFsc2UpID0+IHtcblxuICAgICAgICAgICAgbGV0IHNjcm9sbGJhckRpbWVuc2lvbiA9IFNjcm9sbGJhckRpbWVuc2lvbnMuY2FsY3VsYXRlKFtcbiAgICAgICAgICAgICAgICAgICAgeyB0YWdOYW1lOiB0aGlzLmNvbnRhaW5lckVsbS5wcm9wKCd0YWdOYW1lJyksIGNsYXNzZXM6IHRoaXMuY29udGFpbmVyRWxtLnByb3AoJ2NsYXNzJykgfSxcbiAgICAgICAgICAgICAgICAgICAgeyB0YWdOYW1lOiB0aGlzLmNvbnRlbnRFbG0ucHJvcCgndGFnTmFtZScpLCBjbGFzc2VzOiB0aGlzLmNvbnRlbnRFbG0ucHJvcCgnY2xhc3MnKSB9XG4gICAgICAgICAgICAgICAgXSksXG4gICAgICAgICAgICAgICAgY29ycmVjdEZvckZsb2F0aW5nU2Nyb2xsYmFyID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGlmKHNjcm9sbGJhckRpbWVuc2lvbiA9PT0gMCAmJiB0aGlzLmhhc1Zpc2libGVGbG9hdGluZ1Njcm9sbGJhcigpID09PSB0cnVlKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNvcnJlY3RGb3JGbG9hdGluZ1Njcm9sbGJhciA9IHRydWU7XG4gICAgICAgICAgICAgICAgc2Nyb2xsYmFyRGltZW5zaW9uID0gMjA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBjc3NWYWx1ZXMgPSB7fTtcbiAgICAgICAgICAgIGlmKHRoaXMub3B0aW9ucy5heGVzLmluZGV4T2YoJ3knKSAhPT0gLTEpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY3NzVmFsdWVzWydvdmVyZmxvdy15J10gPSBcInNjcm9sbFwiO1xuICAgICAgICAgICAgICAgIGlmKHNjcm9sbGJhckRpbWVuc2lvbikgY3NzVmFsdWVzWydyaWdodCddID0gLXNjcm9sbGJhckRpbWVuc2lvbiArIFwicHhcIjtcbiAgICAgICAgICAgICAgICBpZihjb3JyZWN0Rm9yRmxvYXRpbmdTY3JvbGxiYXIpIGNzc1ZhbHVlc1sncGFkZGluZy1yaWdodCddID0gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKHRoaXMub3B0aW9ucy5heGVzLmluZGV4T2YoJ3gnKSAhPT0gLTEpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY3NzVmFsdWVzWydvdmVyZmxvdy14J10gPSBcInNjcm9sbFwiO1xuICAgICAgICAgICAgICAgIGlmKHNjcm9sbGJhckRpbWVuc2lvbikgY3NzVmFsdWVzWydib3R0b20nXSA9IC1zY3JvbGxiYXJEaW1lbnNpb24gKyBcInB4XCI7XG4gICAgICAgICAgICAgICAgaWYoY29ycmVjdEZvckZsb2F0aW5nU2Nyb2xsYmFyKSBjc3NWYWx1ZXNbJ3BhZGRpbmctYm90dG9tJ10gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYoIXRoaXMub3JpZ2luYWxDc3NWYWx1ZXMpIHRoaXMub3JpZ2luYWxDc3NWYWx1ZXMgPSB0aGlzLmNvbnRlbnRFbG0uY3NzKE9iamVjdC5rZXlzKGNzc1ZhbHVlcykpO1xuXG4gICAgICAgICAgICBpZihjb3JyZWN0Rm9yRmxvYXRpbmdTY3JvbGxiYXIgJiYgY3NzVmFsdWVzWydwYWRkaW5nLXJpZ2h0J10gPT09IGZhbHNlKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNzc1ZhbHVlc1sncGFkZGluZy1yaWdodCddID0gKHBhcnNlSW50KHRoaXMub3JpZ2luYWxDc3NWYWx1ZXNbJ3BhZGRpbmctcmlnaHQnXSkgKyBzY3JvbGxiYXJEaW1lbnNpb24pICsgXCJweFwiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZihjb3JyZWN0Rm9yRmxvYXRpbmdTY3JvbGxiYXIgJiYgY3NzVmFsdWVzWydwYWRkaW5nLWJvdHRvbSddID09PSBmYWxzZSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjc3NWYWx1ZXNbJ3BhZGRpbmctYm90dG9tJ10gPSAocGFyc2VJbnQodGhpcy5vcmlnaW5hbENzc1ZhbHVlc1sncGFkZGluZy1ib3R0b20nXSkgKyBzY3JvbGxiYXJEaW1lbnNpb24pICsgXCJweFwiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG0uY3NzKGNzc1ZhbHVlcyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNjcm9sbGJhcnMgYnkgZGVmYXVsdCBpbiBPU1ggZG9uJ3QgdGFrZSB1cCBzcGFjZSBidXQgYXJlIGZsb2F0aW5nLiBXZSBtdXN0IGNvcnJlY3QgZm9yIHRoaXMsIGJ1dCBob3cgZG8gd2VcbiAgICAgICAgICoga25vdyBpZiB3ZSBtdXN0IGNvcnJlY3Q/IFdlYmtpdCBiYXNlZCBicm93c2VycyBoYXZlIHRoZSBwc2V1ZG8gY3NzLXNlbGVjdG9yIDo6LXdlYmtpdC1zY3JvbGxiYXIgYnkgd2hpY2ggdGhlXG4gICAgICAgICAqIHByb2JsZW0gaXMgc29sdmVkLiBGb3IgYWxsIG90aGVyIGVuZ2luZXMgYW5vdGhlciBzdHJhdGVneSBtdXN0XG4gICAgICAgICAqXG4gICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgcHJpdmF0ZSBoYXNWaXNpYmxlRmxvYXRpbmdTY3JvbGxiYXIoKTpib29sZWFuXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQXBwbGVXZWJLaXQvaSkgPT09IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIHVwZGF0ZUF4aXMoYXhpczpBeGlzVHlwZSlcbiAgICAgICAge1xuICAgICAgICAgICAgbGV0IGhhc1Njcm9sbCA9IHRoaXMuaGFzU2Nyb2xsKGF4aXMpO1xuICAgICAgICAgICAgaWYoaGFzU2Nyb2xsID09PSB0cnVlICYmIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXSA9PT0gbnVsbClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lckVsbS5hZGRDbGFzcyh0aGlzLm9wdGlvbnMuY3NzUHJlZml4ICsgXCItYXhpcy1cIiArIGF4aXMpO1xuXG4gICAgICAgICAgICAgICAgbGV0IGVsbXMgPSB0aGlzLmFkZFNjcm9sbGJhcihheGlzLCB0aGlzLmNvbnRhaW5lckVsbSksXG4gICAgICAgICAgICAgICAgICAgIHNjcm9sbGJhckVsbSA9IGVsbXMuc2Nyb2xsYmFyLFxuICAgICAgICAgICAgICAgICAgICB0cmFja0VsbSA9IGVsbXMudHJhY2s7XG5cbiAgICAgICAgICAgICAgICBzY3JvbGxiYXJFbG0ub24oJ21vdXNlZG93bi4nICsgYXhpcyArICcuJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSwgdGhpcy5vblNjcm9sbGJhck1vdXNlZG93bi5iaW5kKHRoaXMsIGF4aXMsIHNjcm9sbGJhckVsbSwgdHJhY2tFbG0pKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG0ub24oJ3Njcm9sbC4nICsgYXhpcyArICcuJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSwgdGhpcy5vblNjcm9sbC5iaW5kKHRoaXMsIGF4aXMsIHNjcm9sbGJhckVsbSwgdHJhY2tFbG0pKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXSA9IGVsbXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmKGhhc1Njcm9sbCA9PT0gZmFsc2UgJiYgdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdICE9PSBudWxsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyRWxtLnJlbW92ZUNsYXNzKHRoaXMub3B0aW9ucy5jc3NQcmVmaXggKyBcIi1heGlzLVwiICsgYXhpcyk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10uc2Nyb2xsYmFyLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXSA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG0ub2ZmKCcuJyArIGF4aXMgKyBcIi5cIiArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL1Jlc2l6ZSB0cmFjayBhY2NvcmRpbmcgdG8gY3VycmVudCBzY3JvbGwgZGltZW5zaW9uc1xuICAgICAgICAgICAgaWYodGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdICE9PSBudWxsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMucmVzaXplVHJhY2soYXhpcywgdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdLnNjcm9sbGJhciwgdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdLnRyYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgZ2V0VmFsdWUoZWxtOkpRdWVyeSwgcHJvcGVydHk6Tm9ybWFsaXplZFNjcm9sbFByb3BlcnR5LCBheGlzOkF4aXNUeXBlKTpudW1iZXJcbiAgICAgICAge1xuICAgICAgICAgICAgc3dpdGNoKHByb3BlcnR5KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3NpemUnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZWxtW2F4aXMgPT09ICd5JyA/ICdvdXRlckhlaWdodCcgOiAnb3V0ZXJXaWR0aCddKCk7XG4gICAgICAgICAgICAgICAgY2FzZSAnY2xpZW50U2l6ZSc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbG1bMF1bYXhpcyA9PT0gJ3knID8gJ2NsaWVudEhlaWdodCcgOiAnY2xpZW50V2lkdGgnXTtcbiAgICAgICAgICAgICAgICBjYXNlICdzY3JvbGxTaXplJzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsbVswXVtheGlzID09PSAneScgPyAnc2Nyb2xsSGVpZ2h0JyA6ICdzY3JvbGxXaWR0aCddO1xuICAgICAgICAgICAgICAgIGNhc2UgJ3Njcm9sbFBvcyc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbG1bYXhpcyA9PT0gJ3knID8gJ3Njcm9sbFRvcCcgOiAnc2Nyb2xsTGVmdCddKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIGhhc1Njcm9sbChheGlzOkF4aXNUeXBlKTpib29sZWFuXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxldCBjb250ZW50U2l6ZSA9IHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2l6ZScsIGF4aXMpLFxuICAgICAgICAgICAgICAgIGNvbnRlbnRTY3JvbGxTaXplID0gdGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sICdzY3JvbGxTaXplJywgYXhpcyk7XG4gICAgXG4gICAgICAgICAgICByZXR1cm4gY29udGVudFNpemUgPCBjb250ZW50U2Nyb2xsU2l6ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgcmVzaXplVHJhY2soYXhpczpBeGlzVHlwZSwgc2Nyb2xsYmFyRWxtOkpRdWVyeSwgdHJhY2tFbG06SlF1ZXJ5KVxuICAgICAgICB7XG4gICAgICAgICAgICBsZXQgY29udGVudFNpemUgPSB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgJ3NpemUnLCBheGlzKSxcbiAgICAgICAgICAgICAgICBjb250ZW50U2Nyb2xsU2l6ZSA9IHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2Nyb2xsU2l6ZScsIGF4aXMpO1xuICAgIFxuICAgICAgICAgICAgaWYoY29udGVudFNpemUgPCBjb250ZW50U2Nyb2xsU2l6ZSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzY3JvbGxiYXJFbG0ucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpO1xuICAgIFxuICAgICAgICAgICAgICAgIGxldCBzY3JvbGxiYXJEaW1lbnNpb24gPSB0aGlzLmdldFZhbHVlKHNjcm9sbGJhckVsbSwgJ3NpemUnLCBheGlzKTtcbiAgICBcbiAgICAgICAgICAgICAgICB0cmFja0VsbS5jc3MoYXhpcyA9PT0gJ3knID8gJ2hlaWdodCcgOiAnd2lkdGgnLFxuICAgICAgICAgICAgICAgICAgICBzY3JvbGxiYXJEaW1lbnNpb24gKiAoY29udGVudFNpemUgLyBjb250ZW50U2Nyb2xsU2l6ZSlcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNjcm9sbGJhckVsbS5hZGRDbGFzcygnaGlkZGVuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIHBvc2l0aW9uVHJhY2soYXhpczpBeGlzVHlwZSwgc2Nyb2xsYmFyRWxtOkpRdWVyeSwgdHJhY2tFbG06SlF1ZXJ5KVxuICAgICAgICB7XG4gICAgICAgICAgICBsZXQgcmVsVHJhY2tQb3MgPSB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgJ3Njcm9sbFBvcycsIGF4aXMpXG4gICAgICAgICAgICAgICAgICAgIC8gKHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2Nyb2xsU2l6ZScsIGF4aXMpIC0gdGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sICdzaXplJywgYXhpcykpLFxuICAgICAgICAgICAgICAgIHRyYWNrRGltZW5zaW9uID0gdGhpcy5nZXRWYWx1ZSh0cmFja0VsbSwgJ3NpemUnLCBheGlzKSxcbiAgICAgICAgICAgICAgICBzY3JvbGxiYXJEaW1lbnNpb24gPSB0aGlzLmdldFZhbHVlKHNjcm9sbGJhckVsbSwgJ3NpemUnLCBheGlzKTtcbiAgICBcbiAgICAgICAgICAgIHRyYWNrRWxtLmNzcyhheGlzID09PSAneScgPyAndG9wJyA6ICdsZWZ0JyxcbiAgICAgICAgICAgICAgICAoc2Nyb2xsYmFyRGltZW5zaW9uIC0gdHJhY2tEaW1lbnNpb24pICogcmVsVHJhY2tQb3NcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIG9uU2Nyb2xsKGF4aXM6QXhpc1R5cGUsIHNjcm9sbGJhckVsbTpKUXVlcnksIHRyYWNrRWxtOkpRdWVyeSwgZXZlbnQ6TW91c2VFdmVudClcbiAgICAgICAge1xuICAgICAgICAgICAgaWYodGhpcy5zY3JvbGxDYWNoZVtheGlzXSAhPT0gKHRoaXMuc2Nyb2xsQ2FjaGVbYXhpc10gPSB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgJ3Njcm9sbFBvcycsIGF4aXMpKSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBvc2l0aW9uVHJhY2soYXhpcywgc2Nyb2xsYmFyRWxtLCB0cmFja0VsbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIG9uU2Nyb2xsYmFyTW91c2Vkb3duID0gKGF4aXM6IEF4aXNUeXBlLCBzY3JvbGxiYXJFbG06IEpRdWVyeSwgdHJhY2tFbG06IEpRdWVyeSwgZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcblxuICAgICAgICAgICAgaWYoZXZlbnQudGFyZ2V0ID09PSBzY3JvbGxiYXJFbG1bMF0pXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUb0NsaWNrZWRQb3NpdGlvbihheGlzLCBldmVudCk7XG4gICAgICAgICAgICAgICAgdGhpcy50cmFja01vdXNlZG93bihheGlzLCBzY3JvbGxiYXJFbG0sIGV2ZW50KTsgLy9BbHNvIHN0YXJ0IGRyYWdnaW5nIHRoZSB0cmFjayB0byBkbyBhIGNvcnJlY3Rpb24gZHJhZyBhZnRlciBjbGlja2luZyB0aGUgc2Nyb2xsYmFyXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmKGV2ZW50LnRhcmdldCA9PT0gdHJhY2tFbG1bMF0pXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy50cmFja01vdXNlZG93bihheGlzLCBzY3JvbGxiYXJFbG0sIGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBwcml2YXRlIHRyYWNrTW91c2Vkb3duKGF4aXM6IEF4aXNUeXBlLCBzY3JvbGxiYXJFbG06IEpRdWVyeSwgZXZlbnQ6IE1vdXNlRXZlbnQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIGxldCBvcmlnaW4gPSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0UG9zOiBldmVudFtheGlzID09PSAneScgPyAncGFnZVknIDogJ3BhZ2VYJ10sXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0U2Nyb2xsOiB0aGlzLmNvbnRlbnRFbG1bYXhpcyA9PT0gJ3knID8gJ3Njcm9sbFRvcCcgOiAnc2Nyb2xsTGVmdCddKCksXG4gICAgICAgICAgICAgICAgICAgIHNjcm9sbEZhY3RvcjogdGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sICdzY3JvbGxTaXplJywgYXhpcykgLyB0aGlzLmdldFZhbHVlKHNjcm9sbGJhckVsbSwgJ3NpemUnLCBheGlzKSAvL0hvdyBiaWcgaWYgdGhlIHNjcm9sbGJhciBlbGVtZW50IGNvbXBhcmVkIHRvIHRoZSBjb250ZW50IHNjcm9sbFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJHdpbmRvdyA9IGpRdWVyeSh3aW5kb3cpLFxuICAgICAgICAgICAgICAgIG1vdmVIYW5kbGVyID0gdGhpcy5vblRyYWNrRHJhZy5iaW5kKHRoaXMsIGF4aXMsIG9yaWdpbik7XG5cbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyRWxtLmFkZENsYXNzKHRoaXMub3B0aW9ucy5jc3NQcmVmaXggKyBcIi10cmFja2RyYWctXCIgKyBheGlzKTtcblxuICAgICAgICAgICAgJHdpbmRvd1xuICAgICAgICAgICAgICAgIC5vbignbW91c2Vtb3ZlLicgKyB0aGlzLm9wdGlvbnMuZXZlbnROYW1lc3BhY2UsIG1vdmVIYW5kbGVyKVxuICAgICAgICAgICAgICAgIC5vbmUoJ21vdXNldXAuJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSwgKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICR3aW5kb3cub2ZmKCdtb3VzZW1vdmUnLCBtb3ZlSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyRWxtLnJlbW92ZUNsYXNzKHRoaXMub3B0aW9ucy5jc3NQcmVmaXggKyBcIi10cmFja2RyYWctXCIgKyBheGlzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgb25UcmFja0RyYWcoYXhpczpBeGlzVHlwZSwgb3JpZ2luLCBldmVudDpNb3VzZUV2ZW50KSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG1bYXhpcyA9PT0neScgPyAnc2Nyb2xsVG9wJyA6ICdzY3JvbGxMZWZ0J10oXG4gICAgICAgICAgICAgICAgb3JpZ2luLnN0YXJ0U2Nyb2xsICsgKGV2ZW50W2F4aXMgPT09ICd5JyA/ICdwYWdlWScgOiAncGFnZVgnXSAtIG9yaWdpbi5zdGFydFBvcykgKiBvcmlnaW4uc2Nyb2xsRmFjdG9yXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBzY3JvbGxUb0NsaWNrZWRQb3NpdGlvbihheGlzOkF4aXNUeXBlLCBldmVudDpNb3VzZUV2ZW50KVxuICAgICAgICB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIFxuICAgICAgICAgICAgbGV0IG9mZnNldCA9IGV2ZW50WyhheGlzID09PSAneScpID8gJ29mZnNldFknOiAnb2Zmc2V0WCddO1xuICAgIFxuICAgICAgICAgICAgaWYob2Zmc2V0IDw9IDEwKSBvZmZzZXQgPSAwOyAvL0xpdHRsZSB0d2VhayB0byBtYWtlIGl0IGVhc2llciB0byBnbyBiYWNrIHRvIHRvcFxuICAgIFxuICAgICAgICAgICAgdGhpcy5jb250ZW50RWxtW2F4aXMgPT09ICd5JyA/ICdzY3JvbGxUb3AnIDogJ3Njcm9sbExlZnQnXShcbiAgICAgICAgICAgICAgICB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgJ3Njcm9sbFNpemUnLCBheGlzKSAqIChvZmZzZXQgLyB0aGlzLmdldFZhbHVlKGpRdWVyeShldmVudC50YXJnZXQpLCAnc2l6ZScsIGF4aXMpKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBkZXN0cm95KClcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5jb250ZW50RWxtLm9mZignLicgKyB0aGlzLm9wdGlvbnMuZXZlbnROYW1lc3BhY2UpO1xuICAgICAgICAgICAgalF1ZXJ5KHdpbmRvdykub2ZmKCcuJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSk7XG5cbiAgICAgICAgICAgIGZvcihsZXQgYXhpcyBpbiB0aGlzLnNjcm9sbGJhckVsbXMpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYodGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdICYmIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXS5zY3JvbGxiYXIgaW5zdGFuY2VvZiBqUXVlcnkgPT09IHRydWUpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10uc2Nyb2xsYmFyLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10gPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5jb250ZW50RWxtLmNzcyh0aGlzLm9yaWdpbmFsQ3NzVmFsdWVzKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90eXBpbmdzL2luZGV4LmQudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIlNjcm9sbGVydFBsdWdpbi50c1wiIC8+XG5cbmpRdWVyeS5mbltTY3JvbGxlcnQuUGx1Z2luLk5BTUVdID0gZnVuY3Rpb24oLi4uYXJncykge1xuXG4gICAgbGV0IGFjdGlvbjpzdHJpbmcgPSB0eXBlb2YgYXJnc1swXSA9PT0gXCJzdHJpbmdcIiAgPyBhcmdzWzBdIDogXCJpbml0XCIsXG4gICAgICAgIG9wdGlvbnM6U2Nyb2xsZXJ0LlBsdWdpbk9wdGlvbnMgPSAodHlwZW9mIGFyZ3NbMV0gPT09IFwib2JqZWN0XCIpXG4gICAgICAgICAgICA/IGFyZ3NbMV1cbiAgICAgICAgICAgIDogKHR5cGVvZiBhcmdzWzBdID09PSBcIm9iamVjdFwiKSA/IGFyZ3NbMF0gOiB7fTtcblxuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgbGV0IGVsbSA9IGpRdWVyeSh0aGlzKSxcbiAgICAgICAgICAgIGtleSA9IFwicGx1Z2luLVwiICsgU2Nyb2xsZXJ0LlBsdWdpbi5OQU1FLFxuICAgICAgICAgICAgcGx1Z2luOlNjcm9sbGVydC5QbHVnaW4gPSBlbG0uZGF0YShrZXkpO1xuXG4gICAgICAgIGlmKGFjdGlvbiA9PT0gXCJpbml0XCIgJiYgcGx1Z2luIGluc3RhbmNlb2YgU2Nyb2xsZXJ0LlBsdWdpbiA9PT0gZmFsc2UpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGVsbS5kYXRhKGtleSwgcGx1Z2luID0gbmV3IFNjcm9sbGVydC5QbHVnaW4oalF1ZXJ5KHRoaXMpLCBvcHRpb25zKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZihwbHVnaW4gaW5zdGFuY2VvZiBTY3JvbGxlcnQuUGx1Z2luID09PSBmYWxzZSlcbiAgICAgICAge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlRoZSBTY3JvbGxlcnQgcGx1Z2luIGlzIG5vdCB5ZXQgaW5pdGlhbGl6ZWRcIik7XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2goYWN0aW9uKVxuICAgICAgICB7XG4gICAgICAgICAgICBjYXNlIFwiaW5pdFwiOiAvL0RvbGNlIGZhciBuaWVudGVcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBjYXNlIFwidXBkYXRlXCI6XG4gICAgICAgICAgICAgICAgcGx1Z2luLnVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImRlc3Ryb3lcIjpcbiAgICAgICAgICAgICAgICBwbHVnaW4uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgIGVsbS5yZW1vdmVEYXRhKGtleSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIFNjcm9sbGVydCBhY3Rpb24gXCIgKyBhY3Rpb24pO1xuICAgICAgICB9XG4gICAgfSk7XG5cbn07Il19
