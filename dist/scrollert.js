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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNjcm9sbGJhckRpbWVuc2lvbnMudHMiLCJTY3JvbGxlcnRQbHVnaW4udHMiLCJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFPLFNBQVMsQ0FpRGY7QUFqREQsV0FBTyxTQUFTLEVBQ2hCLENBQUM7SUFPRztRQUFBO1FBd0NBLENBQUM7UUF0Q2lCLDZCQUFTLEdBQXZCLFVBQXdCLGNBQW9DO1lBRXhELElBQUksT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUM7WUFFN0IsRUFBRSxDQUFBLENBQUMsY0FBYyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FDOUIsQ0FBQztnQkFDRyxNQUFNLElBQUksU0FBUyxDQUFDLHdFQUF3RSxDQUFDLENBQUM7WUFDbEcsQ0FBQztZQUVELEdBQUcsQ0FBQSxDQUFrQixVQUFjLEVBQWQsaUNBQWMsRUFBZCw0QkFBYyxFQUFkLElBQWMsQ0FBQztnQkFBaEMsSUFBSSxTQUFTLHVCQUFBO2dCQUViLE1BQU0sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDO2dCQUVyQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFFLEdBQUcsT0FBTyxHQUFHLE1BQU0sQ0FBQztnQkFDNUQsT0FBTyxHQUFHLE1BQU0sQ0FBRTthQUNyQjtZQUVELE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUNqQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7WUFDeEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1lBQ3pCLE9BQU8sQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQztZQUNwQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUM7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QyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDeEUsQ0FBQztRQUNELElBQUksQ0FBQyxFQUFFLENBQUEsQ0FBQyxNQUFNLFlBQVksU0FBUyxDQUFDLE1BQU0sS0FBSyxLQUFLLENBQUMsQ0FDckQsQ0FBQztZQUNHLE1BQU0sSUFBSSxTQUFTLENBQUMsNkNBQTZDLENBQUMsQ0FBQztRQUN2RSxDQUFDO1FBRUQsTUFBTSxDQUFBLENBQUMsTUFBTSxDQUFDLENBQ2QsQ0FBQztZQUNHLEtBQUssTUFBTTtnQkFDUCxNQUFNLENBQUM7WUFDWCxLQUFLLFFBQVE7Z0JBQ1QsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNoQixLQUFLLENBQUM7WUFDVixLQUFLLFNBQVM7Z0JBQ1YsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNqQixHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNwQixLQUFLLENBQUM7WUFDVjtnQkFDSSxNQUFNLElBQUksU0FBUyxDQUFDLDJCQUEyQixHQUFHLE1BQU0sQ0FBQyxDQUFDO1FBQ2xFLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUVQLENBQUMsQ0FBQyIsImZpbGUiOiJzY3JvbGxlcnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUgU2Nyb2xsZXJ0XG57XG4gICAgZXhwb3J0IGludGVyZmFjZSBTY3JvbGxiYXJEaW1lbnNpb25zXG4gICAge1xuICAgICAgICB0YWdOYW1lOnN0cmluZztcbiAgICAgICAgY2xhc3NlczpzdHJpbmc7XG4gICAgfVxuXG4gICAgZXhwb3J0IGNsYXNzIFNjcm9sbGJhckRpbWVuc2lvbnNcbiAgICB7XG4gICAgICAgIHB1YmxpYyBzdGF0aWMgY2FsY3VsYXRlKGNvbnRhaW5lclRyYWlsOlNjcm9sbGJhckRpbWVuc2lvbnNbXSk6bnVtYmVyXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxldCByb290RWxtLCBjdXJFbG0sIHByZXZFbG07XG5cbiAgICAgICAgICAgIGlmKGNvbnRhaW5lclRyYWlsLmxlbmd0aCA8PSAwKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIGNvbnRhaW5lciB0cmFpbCBzcGVjaWZpZWQgZm9yIHNjcm9sbGJhciBkaW1lbnNpb25zIGNhbGN1bGF0aW9uXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IobGV0IGNvbnRhaW5lciBvZiBjb250YWluZXJUcmFpbClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjdXJFbG0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGNvbnRhaW5lci50YWdOYW1lKTtcbiAgICAgICAgICAgICAgICBjdXJFbG0uY2xhc3NOYW1lID0gY29udGFpbmVyLmNsYXNzZXM7XG5cbiAgICAgICAgICAgICAgICAocHJldkVsbSkgPyBwcmV2RWxtLmFwcGVuZENoaWxkKGN1ckVsbSApIDogcm9vdEVsbSA9IGN1ckVsbTtcbiAgICAgICAgICAgICAgICBwcmV2RWxtID0gY3VyRWxtIDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcm9vdEVsbS5zdHlsZS5wb3NpdGlvbiA9IFwiZml4ZWRcIjtcbiAgICAgICAgICAgIHJvb3RFbG0uc3R5bGUudG9wID0gXCIwXCI7XG4gICAgICAgICAgICByb290RWxtLnN0eWxlLmxlZnQgPSBcIjBcIjtcbiAgICAgICAgICAgIHJvb3RFbG0uc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XG4gICAgICAgICAgICByb290RWxtLnN0eWxlLndpZHRoID0gXCIyMDBweFwiO1xuICAgICAgICAgICAgcm9vdEVsbS5zdHlsZS5oZWlnaHQgPSBcIjIwMHB4XCI7XG5cbiAgICAgICAgICAgIGN1ckVsbS5zdHlsZS5vdmVyZmxvdyA9IFwiaGlkZGVuXCI7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocm9vdEVsbSk7XG4gICAgICAgICAgICBsZXQgd2l0aG91dFNjcm9sbGJhcnMgPSBjdXJFbG0uY2xpZW50V2lkdGg7XG5cbiAgICAgICAgICAgIGN1ckVsbS5zdHlsZS5vdmVyZmxvdyA9IFwic2Nyb2xsXCI7XG4gICAgICAgICAgICBsZXQgd2l0aFNjcm9sbGJhcnMgPSBjdXJFbG0uY2xpZW50V2lkdGg7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQocm9vdEVsbSk7XG5cbiAgICAgICAgICAgIHJldHVybiB3aXRob3V0U2Nyb2xsYmFycyAtIHdpdGhTY3JvbGxiYXJzO1xuXG4gICAgICAgIH1cbiAgICB9XG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGluZ3MvaW5kZXguZC50c1wiIC8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiU2Nyb2xsYmFyRGltZW5zaW9ucy50c1wiIC8+XG5cbm1vZHVsZSBTY3JvbGxlcnQge1xuXG4gICAgZXhwb3J0IHR5cGUgQXhpc1R5cGUgPSBcInhcIiB8IFwieVwiO1xuICAgIHR5cGUgTm9ybWFsaXplZFNjcm9sbFByb3BlcnR5ID0gXCJzaXplXCIgfCBcInNjcm9sbFNpemVcIiB8IFwic2Nyb2xsUG9zXCIgfCBcImNsaWVudFNpemVcIjtcbiAgICB0eXBlIERpcmVjdGlvblR5cGUgPSBcImhlZW5cIiB8IFwid2VlclwiOyAvL0FLQSAgZm9ydGggYW5kIGJhY2sgKGh0dHBzOi8vd3d3LnlvdXR1YmUuY29tL3dhdGNoP3Y9WDdWMDlUbXN1LTApXG5cbiAgICBpbnRlcmZhY2UgU2Nyb2xsYmFyQ29udGFpbmVyXG4gICAge1xuICAgICAgICBzY3JvbGxiYXI6SlF1ZXJ5O1xuICAgICAgICB0cmFjazpKUXVlcnk7XG4gICAgfVxuXG4gICAgZXhwb3J0IGludGVyZmFjZSBQbHVnaW5PcHRpb25zXG4gICAge1xuICAgICAgICBheGVzPzpBeGlzVHlwZVtdO1xuICAgICAgICBwcmV2ZW50T3V0ZXJTY3JvbGw/OmJvb2xlYW47XG4gICAgICAgIGNzc1ByZWZpeD86c3RyaW5nO1xuICAgICAgICBldmVudE5hbWVzcGFjZT86c3RyaW5nO1xuICAgICAgICBjb250ZW50U2VsZWN0b3I/OnN0cmluZztcbiAgICB9XG5cbiAgICBleHBvcnQgY2xhc3MgUGx1Z2luXG4gICAge1xuICAgICAgICBwdWJsaWMgc3RhdGljIE5BTUU6c3RyaW5nID0gJ3Njcm9sbGVydCc7XG5cbiAgICAgICAgcHJpdmF0ZSBvcHRpb25zOlBsdWdpbk9wdGlvbnMgPSB7XG4gICAgICAgICAgICBheGVzOiBbJ3gnLCAneSddLFxuICAgICAgICAgICAgcHJldmVudE91dGVyU2Nyb2xsOiBmYWxzZSxcbiAgICAgICAgICAgIGNzc1ByZWZpeDogJ3Njcm9sbGVydCcsXG4gICAgICAgICAgICBldmVudE5hbWVzcGFjZTogJ3Njcm9sbGVydCcsXG4gICAgICAgICAgICBjb250ZW50U2VsZWN0b3I6IG51bGxcbiAgICAgICAgfTtcblxuICAgICAgICBwcml2YXRlIGNvbnRlbnRFbG06SlF1ZXJ5O1xuXG4gICAgICAgIHByaXZhdGUgc3RhdGljIGV2ZW50TmFtZXNwYWNlSWQgPSAwO1xuXG4gICAgICAgIHByaXZhdGUgc2Nyb2xsYmFyRWxtczp7IFtpZDogc3RyaW5nXSA6IFNjcm9sbGJhckNvbnRhaW5lciB9ID0ge1xuICAgICAgICAgICAgeDogbnVsbCxcbiAgICAgICAgICAgIHk6IG51bGxcbiAgICAgICAgfTtcblxuICAgICAgICBwcml2YXRlIHNjcm9sbENhY2hlID0ge1xuICAgICAgICAgICAgeDogbnVsbCxcbiAgICAgICAgICAgIHk6IG51bGxcbiAgICAgICAgfTtcblxuICAgICAgICBwcml2YXRlIG9yaWdpbmFsQ3NzVmFsdWVzOnsgW2lkOiBzdHJpbmddIDogc3RyaW5nOyB9O1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgY29udGFpbmVyRWxtOkpRdWVyeSwgb3B0aW9ucz86UGx1Z2luT3B0aW9ucylcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zID0galF1ZXJ5LmV4dGVuZCgge30sIHRoaXMub3B0aW9ucywgb3B0aW9ucyApO1xuXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuZXZlbnROYW1lc3BhY2UgPSB0aGlzLm9wdGlvbnMuZXZlbnROYW1lc3BhY2UgKyArK1BsdWdpbi5ldmVudE5hbWVzcGFjZUlkO1xuICAgICAgICAgICAgdGhpcy5jb250ZW50RWxtID0gdGhpcy5jb250YWluZXJFbG0uY2hpbGRyZW4odGhpcy5vcHRpb25zLmNvbnRlbnRTZWxlY3RvciB8fCAnLicgKyB0aGlzLm9wdGlvbnMuY3NzUHJlZml4ICsnLWNvbnRlbnQnKTtcblxuICAgICAgICAgICAgdGhpcy5vZmZzZXRDb250ZW50RWxtU2Nyb2xsYmFycygpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGUoKTtcblxuICAgICAgICAgICAgLy8gUmVsYXkgc2Nyb2xsIGV2ZW50IG9uIHNjcm9sbGJhci90cmFjayB0byBjb250ZW50IGFuZCBwcmV2ZW50IG91dGVyIHNjcm9sbC5cbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyRWxtLm9uKCd3aGVlbC4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlLCB0aGlzLm9uU2Nyb2xsV2hlZWwpO1xuXG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgICogQHRvZG8gVGhlIGtleWRvd24gb3V0ZXIgc2Nyb2xsIHByZXZlbnRpb24gaXMgbm90IHdvcmtpbmcgeWV0LlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpZih0aGlzLm9wdGlvbnMucHJldmVudE91dGVyU2Nyb2xsID09PSB0cnVlKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIC8vIFByZXZlbnQgb3V0ZXIgc2Nyb2xsIG9uIGtleSBkb3duXG4gICAgICAgICAgICAgICAgLy90aGlzLmNvbnRlbnRFbG0ub24oJ2tleWRvd24uJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSwgdGhpcy5vbktleURvd24pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL1RoZXJlIGNvdWxkIGJlIGEgem9vbSBjaGFuZ2UuIFpvb20gaXMgYWxtb3N0IG5vdCBpbmRpc3Rpbmd1aXNoYWJsZSBmcm9tIHJlc2l6ZSBldmVudHMuIFNvIG9uIHdpbmRvdyByZXNpemUsIHJlY2FsY3VsYXRlIGNvbnRlbnRFbG0gb2ZmZXRcbiAgICAgICAgICAgIGpRdWVyeSh3aW5kb3cpLm9uKCdyZXNpemUuJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSwgdGhpcy5vZmZzZXRDb250ZW50RWxtU2Nyb2xsYmFycy5iaW5kKHRoaXMsIHRydWUpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyB1cGRhdGUoKVxuICAgICAgICB7XG4gICAgICAgICAgICBsZXQgcmVwb3NpdGlvblRyYWNrID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGZvcihsZXQgYXhpcyBvZiB0aGlzLm9wdGlvbnMuYXhlcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUF4aXMoYXhpcyk7XG4gICAgICAgICAgICAgICAgaWYodGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sIFwic2Nyb2xsUG9zXCIsIGF4aXMpICE9PSAwKSByZXBvc2l0aW9uVHJhY2sgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL0lmIHdlIHN0YXJ0IG9uIGEgc2Nyb2xsIHBvc2l0aW9uXG4gICAgICAgICAgICBpZihyZXBvc2l0aW9uVHJhY2sgPT09IHRydWUpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZW50RWxtLnRyaWdnZXIoJ3Njcm9sbC4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgYWRkU2Nyb2xsYmFyKGF4aXM6QXhpc1R5cGUsIGNvbnRhaW5lckVsbTpKUXVlcnkpOlNjcm9sbGJhckNvbnRhaW5lclxuICAgICAgICB7XG4gICAgICAgICAgICBsZXQgc2Nyb2xsYmFyRWxtLCB0cmFja0VsbTtcblxuICAgICAgICAgICAgY29udGFpbmVyRWxtLmFwcGVuZChcbiAgICAgICAgICAgICAgICBzY3JvbGxiYXJFbG0gPSBqUXVlcnkoJzxkaXYgLz4nKS5hZGRDbGFzcyhcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmNzc1ByZWZpeCArICctc2Nyb2xsYmFyJyArICcgJ1xuICAgICAgICAgICAgICAgICAgICArIHRoaXMub3B0aW9ucy5jc3NQcmVmaXggKyAnLXNjcm9sbGJhci0nICsgYXhpc1xuICAgICAgICAgICAgICAgICkuYXBwZW5kKHRyYWNrRWxtID0galF1ZXJ5KCc8ZGl2IC8+JykuYWRkQ2xhc3ModGhpcy5vcHRpb25zLmNzc1ByZWZpeCArICctdHJhY2snKSlcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc2Nyb2xsYmFyOiBzY3JvbGxiYXJFbG0sXG4gICAgICAgICAgICAgICAgdHJhY2s6IHRyYWNrRWxtXG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuXG4gICAgICAgIHByaXZhdGUgb25TY3JvbGxXaGVlbCA9IChldmVudDpKUXVlcnlNb3VzZUV2ZW50T2JqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIGxldCBvcmlnaW5hbEV2ZW50OldoZWVsRXZlbnQgPSA8V2hlZWxFdmVudD5ldmVudC5vcmlnaW5hbEV2ZW50O1xuXG4gICAgICAgICAgICBmb3IobGV0IGF4aXMgb2YgdGhpcy5vcHRpb25zLmF4ZXMpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGV0IGRlbHRhID0gb3JpZ2luYWxFdmVudFsnZGVsdGEnICsgYXhpcy50b1VwcGVyQ2FzZSgpXTtcblxuICAgICAgICAgICAgICAgIGlmKGRlbHRhICYmIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXVxuICAgICAgICAgICAgICAgICAgICAmJiAoZXZlbnQudGFyZ2V0ID09PSB0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10uc2Nyb2xsYmFyLmdldCgwKVxuICAgICAgICAgICAgICAgICAgICAgICAgfHwgZXZlbnQudGFyZ2V0ID09PSB0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10udHJhY2suZ2V0KDApXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGVudEVsbVtheGlzID09PSd5JyA/ICdzY3JvbGxUb3AnIDogJ3Njcm9sbExlZnQnXShcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2Nyb2xsUG9zJywgYXhpcykgKyBkZWx0YVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmKHRoaXMub3B0aW9ucy5wcmV2ZW50T3V0ZXJTY3JvbGwgPT09IHRydWUpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGVsdGEgIT09IDApIHRoaXMucHJldmVudE91dGVyU2Nyb2xsKGF4aXMsIChkZWx0YSA8IDApID8gXCJoZWVuXCIgOiBcIndlZXJcIiwgZXZlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBwcml2YXRlIG9uS2V5RG93biA9IChldmVudDpKUXVlcnlLZXlFdmVudE9iamVjdCkgPT4ge1xuXG4gICAgICAgICAgICBpZihkb2N1bWVudC5hY3RpdmVFbGVtZW50ICE9PSB0aGlzLmNvbnRlbnRFbG1bMF0pXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZihbMzcsMzgsMzMsMzZdLmluZGV4T2YoZXZlbnQud2hpY2gpICE9PSAtMSApIC8vIGhlZW5cbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnByZXZlbnRPdXRlclNjcm9sbChcbiAgICAgICAgICAgICAgICAgICAgWzM4LDMzLDM2XS5pbmRleE9mKGV2ZW50LndoaWNoKSAhPT0gLTEgPyBcInlcIiA6IFwieFwiLFxuICAgICAgICAgICAgICAgICAgICBcImhlZW5cIixcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZihbMzksNDAsMzIsMzQsMzVdLmluZGV4T2YoZXZlbnQud2hpY2gpICE9PSAtMSApIC8vIHdlZXJcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnByZXZlbnRPdXRlclNjcm9sbChcbiAgICAgICAgICAgICAgICAgICAgWzQwLDM1LDM2LDM0LDMyXS5pbmRleE9mKGV2ZW50LndoaWNoKSAhPT0gLTEgPyBcInlcIiA6IFwieFwiLFxuICAgICAgICAgICAgICAgICAgICBcIndlZXJcIixcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHByaXZhdGUgcHJldmVudE91dGVyU2Nyb2xsKGF4aXM6QXhpc1R5cGUsIGRpcmVjdGlvbjpEaXJlY3Rpb25UeXBlLCBldmVudDpCYXNlSlF1ZXJ5RXZlbnRPYmplY3QpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxldCBzY3JvbGxQb3MgPSB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgXCJzY3JvbGxQb3NcIiwgYXhpcyk7XG4gICAgICAgICAgICBzd2l0Y2goZGlyZWN0aW9uKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNhc2UgXCJoZWVuXCI6XG4gICAgICAgICAgICAgICAgICAgIGlmKHNjcm9sbFBvcyA8PSAwKSBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwid2VlclwiOlxuICAgICAgICAgICAgICAgICAgICBsZXQgc2Nyb2xsU2l6ZSA9IHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCBcInNjcm9sbFNpemVcIiwgYXhpcyksXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGllbnRTaXplID0gdGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sIFwiY2xpZW50U2l6ZVwiLCBheGlzKTtcblxuICAgICAgICAgICAgICAgICAgICBpZihzY3JvbGxTaXplIC0gc2Nyb2xsUG9zID09PSBjbGllbnRTaXplKSBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgb2Zmc2V0Q29udGVudEVsbVNjcm9sbGJhcnMgPSAoZm9yY2U6Ym9vbGVhbiA9IGZhbHNlKSA9PiB7XG5cbiAgICAgICAgICAgIGxldCBzY3JvbGxiYXJEaW1lbnNpb24gPSBTY3JvbGxiYXJEaW1lbnNpb25zLmNhbGN1bGF0ZShbXG4gICAgICAgICAgICAgICAgICAgIHsgdGFnTmFtZTogdGhpcy5jb250YWluZXJFbG0ucHJvcCgndGFnTmFtZScpLCBjbGFzc2VzOiB0aGlzLmNvbnRhaW5lckVsbS5wcm9wKCdjbGFzcycpIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgdGFnTmFtZTogdGhpcy5jb250ZW50RWxtLnByb3AoJ3RhZ05hbWUnKSwgY2xhc3NlczogdGhpcy5jb250ZW50RWxtLnByb3AoJ2NsYXNzJykgfVxuICAgICAgICAgICAgICAgIF0pLFxuICAgICAgICAgICAgICAgIGNvcnJlY3RGb3JGbG9hdGluZ1Njcm9sbGJhciA9IGZhbHNlO1xuXG4gICAgICAgICAgICBpZihzY3JvbGxiYXJEaW1lbnNpb24gPT09IDAgJiYgdGhpcy5oYXNWaXNpYmxlRmxvYXRpbmdTY3JvbGxiYXIoKSA9PT0gdHJ1ZSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjb3JyZWN0Rm9yRmxvYXRpbmdTY3JvbGxiYXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHNjcm9sbGJhckRpbWVuc2lvbiA9IDIwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgY3NzVmFsdWVzID0ge307XG4gICAgICAgICAgICBpZih0aGlzLm9wdGlvbnMuYXhlcy5pbmRleE9mKCd5JykgIT09IC0xKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNzc1ZhbHVlc1snb3ZlcmZsb3cteSddID0gXCJzY3JvbGxcIjtcbiAgICAgICAgICAgICAgICBpZihzY3JvbGxiYXJEaW1lbnNpb24pIGNzc1ZhbHVlc1sncmlnaHQnXSA9IC1zY3JvbGxiYXJEaW1lbnNpb24gKyBcInB4XCI7XG4gICAgICAgICAgICAgICAgaWYoY29ycmVjdEZvckZsb2F0aW5nU2Nyb2xsYmFyKSBjc3NWYWx1ZXNbJ3BhZGRpbmctcmlnaHQnXSA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZih0aGlzLm9wdGlvbnMuYXhlcy5pbmRleE9mKCd4JykgIT09IC0xKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNzc1ZhbHVlc1snb3ZlcmZsb3cteCddID0gXCJzY3JvbGxcIjtcbiAgICAgICAgICAgICAgICBpZihzY3JvbGxiYXJEaW1lbnNpb24pIGNzc1ZhbHVlc1snYm90dG9tJ10gPSAtc2Nyb2xsYmFyRGltZW5zaW9uICsgXCJweFwiO1xuICAgICAgICAgICAgICAgIGlmKGNvcnJlY3RGb3JGbG9hdGluZ1Njcm9sbGJhcikgY3NzVmFsdWVzWydwYWRkaW5nLWJvdHRvbSddID0gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKCF0aGlzLm9yaWdpbmFsQ3NzVmFsdWVzKSB0aGlzLm9yaWdpbmFsQ3NzVmFsdWVzID0gdGhpcy5jb250ZW50RWxtLmNzcyhPYmplY3Qua2V5cyhjc3NWYWx1ZXMpKTtcblxuICAgICAgICAgICAgaWYoY29ycmVjdEZvckZsb2F0aW5nU2Nyb2xsYmFyICYmIGNzc1ZhbHVlc1sncGFkZGluZy1yaWdodCddID09PSBmYWxzZSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjc3NWYWx1ZXNbJ3BhZGRpbmctcmlnaHQnXSA9IChwYXJzZUludCh0aGlzLm9yaWdpbmFsQ3NzVmFsdWVzWydwYWRkaW5nLXJpZ2h0J10pICsgc2Nyb2xsYmFyRGltZW5zaW9uKSArIFwicHhcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYoY29ycmVjdEZvckZsb2F0aW5nU2Nyb2xsYmFyICYmIGNzc1ZhbHVlc1sncGFkZGluZy1ib3R0b20nXSA9PT0gZmFsc2UpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY3NzVmFsdWVzWydwYWRkaW5nLWJvdHRvbSddID0gKHBhcnNlSW50KHRoaXMub3JpZ2luYWxDc3NWYWx1ZXNbJ3BhZGRpbmctYm90dG9tJ10pICsgc2Nyb2xsYmFyRGltZW5zaW9uKSArIFwicHhcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5jb250ZW50RWxtLmNzcyhjc3NWYWx1ZXMpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTY3JvbGxiYXJzIGJ5IGRlZmF1bHQgaW4gT1NYIGRvbid0IHRha2UgdXAgc3BhY2UgYnV0IGFyZSBmbG9hdGluZy4gV2UgbXVzdCBjb3JyZWN0IGZvciB0aGlzLCBidXQgaG93IGRvIHdlXG4gICAgICAgICAqIGtub3cgaWYgd2UgbXVzdCBjb3JyZWN0PyBXZWJraXQgYmFzZWQgYnJvd3NlcnMgaGF2ZSB0aGUgcHNldWRvIGNzcy1zZWxlY3RvciA6Oi13ZWJraXQtc2Nyb2xsYmFyIGJ5IHdoaWNoIHRoZVxuICAgICAgICAgKiBwcm9ibGVtIGlzIHNvbHZlZC4gRm9yIGFsbCBvdGhlciBlbmdpbmVzIGFub3RoZXIgc3RyYXRlZ3kgbXVzdFxuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIHByaXZhdGUgaGFzVmlzaWJsZUZsb2F0aW5nU2Nyb2xsYmFyKCk6Ym9vbGVhblxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0FwcGxlV2ViS2l0L2kpID09PSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSB1cGRhdGVBeGlzKGF4aXM6QXhpc1R5cGUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxldCBoYXNTY3JvbGwgPSB0aGlzLmhhc1Njcm9sbChheGlzKTtcbiAgICAgICAgICAgIGlmKGhhc1Njcm9sbCA9PT0gdHJ1ZSAmJiB0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10gPT09IG51bGwpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbG0uYWRkQ2xhc3ModGhpcy5vcHRpb25zLmNzc1ByZWZpeCArIFwiLWF4aXMtXCIgKyBheGlzKTtcblxuICAgICAgICAgICAgICAgIGxldCBlbG1zID0gdGhpcy5hZGRTY3JvbGxiYXIoYXhpcywgdGhpcy5jb250YWluZXJFbG0pLFxuICAgICAgICAgICAgICAgICAgICBzY3JvbGxiYXJFbG0gPSBlbG1zLnNjcm9sbGJhcixcbiAgICAgICAgICAgICAgICAgICAgdHJhY2tFbG0gPSBlbG1zLnRyYWNrO1xuXG4gICAgICAgICAgICAgICAgc2Nyb2xsYmFyRWxtLm9uKCdtb3VzZWRvd24uJyArIGF4aXMgKyAnLicgKyB0aGlzLm9wdGlvbnMuZXZlbnROYW1lc3BhY2UsIHRoaXMub25TY3JvbGxiYXJNb3VzZWRvd24uYmluZCh0aGlzLCBheGlzLCBzY3JvbGxiYXJFbG0sIHRyYWNrRWxtKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZW50RWxtLm9uKCdzY3JvbGwuJyArIGF4aXMgKyAnLicgKyB0aGlzLm9wdGlvbnMuZXZlbnROYW1lc3BhY2UsIHRoaXMub25TY3JvbGwuYmluZCh0aGlzLCBheGlzLCBzY3JvbGxiYXJFbG0sIHRyYWNrRWxtKSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10gPSBlbG1zO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZihoYXNTY3JvbGwgPT09IGZhbHNlICYmIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXSAhPT0gbnVsbClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lckVsbS5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMuY3NzUHJlZml4ICsgXCItYXhpcy1cIiArIGF4aXMpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdLnNjcm9sbGJhci5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10gPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZW50RWxtLm9mZignLicgKyBheGlzICsgXCIuXCIgKyB0aGlzLm9wdGlvbnMuZXZlbnROYW1lc3BhY2UgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9SZXNpemUgdHJhY2sgYWNjb3JkaW5nIHRvIGN1cnJlbnQgc2Nyb2xsIGRpbWVuc2lvbnNcbiAgICAgICAgICAgIGlmKHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXSAhPT0gbnVsbClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2l6ZVRyYWNrKGF4aXMsIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXS5zY3JvbGxiYXIsIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXS50cmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIGdldFZhbHVlKGVsbTpKUXVlcnksIHByb3BlcnR5Ok5vcm1hbGl6ZWRTY3JvbGxQcm9wZXJ0eSwgYXhpczpBeGlzVHlwZSk6bnVtYmVyXG4gICAgICAgIHtcbiAgICAgICAgICAgIHN3aXRjaChwcm9wZXJ0eSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjYXNlICdzaXplJzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsbVtheGlzID09PSAneScgPyAnb3V0ZXJIZWlnaHQnIDogJ291dGVyV2lkdGgnXSgpO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2NsaWVudFNpemUnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZWxtWzBdW2F4aXMgPT09ICd5JyA/ICdjbGllbnRIZWlnaHQnIDogJ2NsaWVudFdpZHRoJ107XG4gICAgICAgICAgICAgICAgY2FzZSAnc2Nyb2xsU2l6ZSc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbG1bMF1bYXhpcyA9PT0gJ3knID8gJ3Njcm9sbEhlaWdodCcgOiAnc2Nyb2xsV2lkdGgnXTtcbiAgICAgICAgICAgICAgICBjYXNlICdzY3JvbGxQb3MnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZWxtW2F4aXMgPT09ICd5JyA/ICdzY3JvbGxUb3AnIDogJ3Njcm9sbExlZnQnXSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBoYXNTY3JvbGwoYXhpczpBeGlzVHlwZSk6Ym9vbGVhblxuICAgICAgICB7XG4gICAgICAgICAgICBsZXQgY29udGVudFNpemUgPSBNYXRoLnJvdW5kKHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2l6ZScsIGF4aXMpKSxcbiAgICAgICAgICAgICAgICBjb250ZW50U2Nyb2xsU2l6ZSA9IE1hdGgucm91bmQodGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sICdzY3JvbGxTaXplJywgYXhpcykpO1xuXG4gICAgICAgICAgICByZXR1cm4gY29udGVudFNpemUgPCBjb250ZW50U2Nyb2xsU2l6ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgcmVzaXplVHJhY2soYXhpczpBeGlzVHlwZSwgc2Nyb2xsYmFyRWxtOkpRdWVyeSwgdHJhY2tFbG06SlF1ZXJ5KVxuICAgICAgICB7XG4gICAgICAgICAgICBsZXQgY29udGVudFNpemUgPSB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgJ3NpemUnLCBheGlzKSxcbiAgICAgICAgICAgICAgICBjb250ZW50U2Nyb2xsU2l6ZSA9IHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2Nyb2xsU2l6ZScsIGF4aXMpO1xuICAgIFxuICAgICAgICAgICAgaWYoY29udGVudFNpemUgPCBjb250ZW50U2Nyb2xsU2l6ZSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzY3JvbGxiYXJFbG0ucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpO1xuICAgIFxuICAgICAgICAgICAgICAgIGxldCBzY3JvbGxiYXJEaW1lbnNpb24gPSB0aGlzLmdldFZhbHVlKHNjcm9sbGJhckVsbSwgJ3NpemUnLCBheGlzKTtcbiAgICBcbiAgICAgICAgICAgICAgICB0cmFja0VsbS5jc3MoYXhpcyA9PT0gJ3knID8gJ2hlaWdodCcgOiAnd2lkdGgnLFxuICAgICAgICAgICAgICAgICAgICBzY3JvbGxiYXJEaW1lbnNpb24gKiAoY29udGVudFNpemUgLyBjb250ZW50U2Nyb2xsU2l6ZSlcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNjcm9sbGJhckVsbS5hZGRDbGFzcygnaGlkZGVuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIHBvc2l0aW9uVHJhY2soYXhpczpBeGlzVHlwZSwgc2Nyb2xsYmFyRWxtOkpRdWVyeSwgdHJhY2tFbG06SlF1ZXJ5KVxuICAgICAgICB7XG4gICAgICAgICAgICBsZXQgcmVsVHJhY2tQb3MgPSB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgJ3Njcm9sbFBvcycsIGF4aXMpXG4gICAgICAgICAgICAgICAgICAgIC8gKHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2Nyb2xsU2l6ZScsIGF4aXMpIC0gdGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sICdzaXplJywgYXhpcykpLFxuICAgICAgICAgICAgICAgIHRyYWNrRGltZW5zaW9uID0gdGhpcy5nZXRWYWx1ZSh0cmFja0VsbSwgJ3NpemUnLCBheGlzKSxcbiAgICAgICAgICAgICAgICBzY3JvbGxiYXJEaW1lbnNpb24gPSB0aGlzLmdldFZhbHVlKHNjcm9sbGJhckVsbSwgJ3NpemUnLCBheGlzKTtcbiAgICBcbiAgICAgICAgICAgIHRyYWNrRWxtLmNzcyhheGlzID09PSAneScgPyAndG9wJyA6ICdsZWZ0JyxcbiAgICAgICAgICAgICAgICAoc2Nyb2xsYmFyRGltZW5zaW9uIC0gdHJhY2tEaW1lbnNpb24pICogTWF0aC5taW4ocmVsVHJhY2tQb3MsIDEpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBvblNjcm9sbChheGlzOkF4aXNUeXBlLCBzY3JvbGxiYXJFbG06SlF1ZXJ5LCB0cmFja0VsbTpKUXVlcnksIGV2ZW50Ok1vdXNlRXZlbnQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGlmKHRoaXMuc2Nyb2xsQ2FjaGVbYXhpc10gIT09ICh0aGlzLnNjcm9sbENhY2hlW2F4aXNdID0gdGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sICdzY3JvbGxQb3MnLCBheGlzKSkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5wb3NpdGlvblRyYWNrKGF4aXMsIHNjcm9sbGJhckVsbSwgdHJhY2tFbG0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBvblNjcm9sbGJhck1vdXNlZG93biA9IChheGlzOiBBeGlzVHlwZSwgc2Nyb2xsYmFyRWxtOiBKUXVlcnksIHRyYWNrRWxtOiBKUXVlcnksIGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB7XG5cbiAgICAgICAgICAgIGlmKGV2ZW50LnRhcmdldCA9PT0gc2Nyb2xsYmFyRWxtWzBdKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9DbGlja2VkUG9zaXRpb24oYXhpcywgZXZlbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMudHJhY2tNb3VzZWRvd24oYXhpcywgc2Nyb2xsYmFyRWxtLCBldmVudCk7IC8vQWxzbyBzdGFydCBkcmFnZ2luZyB0aGUgdHJhY2sgdG8gZG8gYSBjb3JyZWN0aW9uIGRyYWcgYWZ0ZXIgY2xpY2tpbmcgdGhlIHNjcm9sbGJhclxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZihldmVudC50YXJnZXQgPT09IHRyYWNrRWxtWzBdKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMudHJhY2tNb3VzZWRvd24oYXhpcywgc2Nyb2xsYmFyRWxtLCBldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcHJpdmF0ZSB0cmFja01vdXNlZG93bihheGlzOiBBeGlzVHlwZSwgc2Nyb2xsYmFyRWxtOiBKUXVlcnksIGV2ZW50OiBNb3VzZUV2ZW50KVxuICAgICAgICB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgICBsZXQgb3JpZ2luID0ge1xuICAgICAgICAgICAgICAgICAgICBzdGFydFBvczogZXZlbnRbYXhpcyA9PT0gJ3knID8gJ3BhZ2VZJyA6ICdwYWdlWCddLFxuICAgICAgICAgICAgICAgICAgICBzdGFydFNjcm9sbDogdGhpcy5jb250ZW50RWxtW2F4aXMgPT09ICd5JyA/ICdzY3JvbGxUb3AnIDogJ3Njcm9sbExlZnQnXSgpLFxuICAgICAgICAgICAgICAgICAgICBzY3JvbGxGYWN0b3I6IHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2Nyb2xsU2l6ZScsIGF4aXMpIC8gdGhpcy5nZXRWYWx1ZShzY3JvbGxiYXJFbG0sICdzaXplJywgYXhpcykgLy9Ib3cgYmlnIGlmIHRoZSBzY3JvbGxiYXIgZWxlbWVudCBjb21wYXJlZCB0byB0aGUgY29udGVudCBzY3JvbGxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICR3aW5kb3cgPSBqUXVlcnkod2luZG93KSxcbiAgICAgICAgICAgICAgICBtb3ZlSGFuZGxlciA9IHRoaXMub25UcmFja0RyYWcuYmluZCh0aGlzLCBheGlzLCBvcmlnaW4pO1xuXG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lckVsbS5hZGRDbGFzcyh0aGlzLm9wdGlvbnMuY3NzUHJlZml4ICsgXCItdHJhY2tkcmFnLVwiICsgYXhpcyk7XG5cbiAgICAgICAgICAgICR3aW5kb3dcbiAgICAgICAgICAgICAgICAub24oJ21vdXNlbW92ZS4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlLCBtb3ZlSGFuZGxlcilcbiAgICAgICAgICAgICAgICAub25lKCdtb3VzZXVwLicgKyB0aGlzLm9wdGlvbnMuZXZlbnROYW1lc3BhY2UsICgpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAkd2luZG93Lm9mZignbW91c2Vtb3ZlJywgbW92ZUhhbmRsZXIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lckVsbS5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMuY3NzUHJlZml4ICsgXCItdHJhY2tkcmFnLVwiICsgYXhpcyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIG9uVHJhY2tEcmFnKGF4aXM6QXhpc1R5cGUsIG9yaWdpbiwgZXZlbnQ6TW91c2VFdmVudCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgdGhpcy5jb250ZW50RWxtW2F4aXMgPT09J3knID8gJ3Njcm9sbFRvcCcgOiAnc2Nyb2xsTGVmdCddKFxuICAgICAgICAgICAgICAgIG9yaWdpbi5zdGFydFNjcm9sbCArIChldmVudFtheGlzID09PSAneScgPyAncGFnZVknIDogJ3BhZ2VYJ10gLSBvcmlnaW4uc3RhcnRQb3MpICogb3JpZ2luLnNjcm9sbEZhY3RvclxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgc2Nyb2xsVG9DbGlja2VkUG9zaXRpb24oYXhpczpBeGlzVHlwZSwgZXZlbnQ6TW91c2VFdmVudClcbiAgICAgICAge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBcbiAgICAgICAgICAgIGxldCBvZmZzZXQgPSBldmVudFsoYXhpcyA9PT0gJ3knKSA/ICdvZmZzZXRZJzogJ29mZnNldFgnXTtcbiAgICBcbiAgICAgICAgICAgIGlmKG9mZnNldCA8PSAxMCkgb2Zmc2V0ID0gMDsgLy9MaXR0bGUgdHdlYWsgdG8gbWFrZSBpdCBlYXNpZXIgdG8gZ28gYmFjayB0byB0b3BcbiAgICBcbiAgICAgICAgICAgIHRoaXMuY29udGVudEVsbVtheGlzID09PSAneScgPyAnc2Nyb2xsVG9wJyA6ICdzY3JvbGxMZWZ0J10oXG4gICAgICAgICAgICAgICAgdGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sICdzY3JvbGxTaXplJywgYXhpcykgKiAob2Zmc2V0IC8gdGhpcy5nZXRWYWx1ZShqUXVlcnkoZXZlbnQudGFyZ2V0KSwgJ3NpemUnLCBheGlzKSlcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgZGVzdHJveSgpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuY29udGVudEVsbS5vZmYoJy4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlKTtcbiAgICAgICAgICAgIGpRdWVyeSh3aW5kb3cpLm9mZignLicgKyB0aGlzLm9wdGlvbnMuZXZlbnROYW1lc3BhY2UpO1xuXG4gICAgICAgICAgICBmb3IobGV0IGF4aXMgaW4gdGhpcy5zY3JvbGxiYXJFbG1zKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmKHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXSAmJiB0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10uc2Nyb2xsYmFyIGluc3RhbmNlb2YgalF1ZXJ5ID09PSB0cnVlKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdLnNjcm9sbGJhci5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuY29udGVudEVsbS5jc3ModGhpcy5vcmlnaW5hbENzc1ZhbHVlcyk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vdHlwaW5ncy9pbmRleC5kLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJTY3JvbGxlcnRQbHVnaW4udHNcIiAvPlxuXG5qUXVlcnkuZm5bU2Nyb2xsZXJ0LlBsdWdpbi5OQU1FXSA9IGZ1bmN0aW9uKC4uLmFyZ3MpIHtcblxuICAgIGxldCBhY3Rpb246c3RyaW5nID0gdHlwZW9mIGFyZ3NbMF0gPT09IFwic3RyaW5nXCIgID8gYXJnc1swXSA6IFwiaW5pdFwiLFxuICAgICAgICBvcHRpb25zOlNjcm9sbGVydC5QbHVnaW5PcHRpb25zID0gKHR5cGVvZiBhcmdzWzFdID09PSBcIm9iamVjdFwiKVxuICAgICAgICAgICAgPyBhcmdzWzFdXG4gICAgICAgICAgICA6ICh0eXBlb2YgYXJnc1swXSA9PT0gXCJvYmplY3RcIikgPyBhcmdzWzBdIDoge307XG5cbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGxldCBlbG0gPSBqUXVlcnkodGhpcyksXG4gICAgICAgICAgICBrZXkgPSBcInBsdWdpbi1cIiArIFNjcm9sbGVydC5QbHVnaW4uTkFNRSxcbiAgICAgICAgICAgIHBsdWdpbjpTY3JvbGxlcnQuUGx1Z2luID0gZWxtLmRhdGEoa2V5KTtcblxuICAgICAgICBpZihhY3Rpb24gPT09IFwiaW5pdFwiICYmIHBsdWdpbiBpbnN0YW5jZW9mIFNjcm9sbGVydC5QbHVnaW4gPT09IGZhbHNlKVxuICAgICAgICB7XG4gICAgICAgICAgICBlbG0uZGF0YShrZXksIHBsdWdpbiA9IG5ldyBTY3JvbGxlcnQuUGx1Z2luKGpRdWVyeSh0aGlzKSwgb3B0aW9ucykpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYocGx1Z2luIGluc3RhbmNlb2YgU2Nyb2xsZXJ0LlBsdWdpbiA9PT0gZmFsc2UpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJUaGUgU2Nyb2xsZXJ0IHBsdWdpbiBpcyBub3QgeWV0IGluaXRpYWxpemVkXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3dpdGNoKGFjdGlvbilcbiAgICAgICAge1xuICAgICAgICAgICAgY2FzZSBcImluaXRcIjogLy9Eb2xjZSBmYXIgbmllbnRlXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgY2FzZSBcInVwZGF0ZVwiOlxuICAgICAgICAgICAgICAgIHBsdWdpbi51cGRhdGUoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJkZXN0cm95XCI6XG4gICAgICAgICAgICAgICAgcGx1Z2luLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICBlbG0ucmVtb3ZlRGF0YShrZXkpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBTY3JvbGxlcnQgYWN0aW9uIFwiICsgYWN0aW9uKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG59OyJdfQ==
