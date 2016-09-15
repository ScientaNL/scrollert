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
                if (this.scrollbarElms.hasOwnProperty(axis) === true && this.scrollbarElms[axis].scrollbar instanceof jQuery === true) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNjcm9sbGJhckRpbWVuc2lvbnMudHMiLCJTY3JvbGxlcnRQbHVnaW4udHMiLCJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFPLFNBQVMsQ0FpRGY7QUFqREQsV0FBTyxTQUFTLEVBQ2hCLENBQUM7SUFPRztRQUFBO1FBd0NBLENBQUM7UUF0Q2lCLDZCQUFTLEdBQXZCLFVBQXdCLGNBQW9DO1lBRXhELElBQUksT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUM7WUFFN0IsRUFBRSxDQUFBLENBQUMsY0FBYyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FDOUIsQ0FBQztnQkFDRyxNQUFNLElBQUksU0FBUyxDQUFDLHdFQUF3RSxDQUFDLENBQUM7WUFDbEcsQ0FBQztZQUVELEdBQUcsQ0FBQSxDQUFrQixVQUFjLEVBQWQsaUNBQWMsRUFBZCw0QkFBYyxFQUFkLElBQWMsQ0FBQztnQkFBaEMsSUFBSSxTQUFTLHVCQUFBO2dCQUViLE1BQU0sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDO2dCQUVyQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFFLEdBQUcsT0FBTyxHQUFHLE1BQU0sQ0FBQztnQkFDNUQsT0FBTyxHQUFHLE1BQU0sQ0FBRTthQUNyQjtZQUVELE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUNqQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7WUFDeEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1lBQ3pCLE9BQU8sQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQztZQUNwQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUM7WUFDOUIsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDO1lBRS9CLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztZQUVqQyxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNuQyxJQUFJLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7WUFFM0MsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1lBQ2pDLElBQUksY0FBYyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7WUFFeEMsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFbkMsTUFBTSxDQUFDLGlCQUFpQixHQUFHLGNBQWMsQ0FBQztRQUU5QyxDQUFDO1FBQ0wsMEJBQUM7SUFBRCxDQXhDQSxBQXdDQyxJQUFBO0lBeENZLDZCQUFtQixzQkF3Qy9CLENBQUE7QUFDTCxDQUFDLEVBakRNLFNBQVMsS0FBVCxTQUFTLFFBaURmOztBQ2pERCw4Q0FBOEM7QUFDOUMsK0NBQStDO0FBRS9DLElBQU8sU0FBUyxDQWlXZjtBQWpXRCxXQUFPLFNBQVMsRUFBQyxDQUFDO0lBcUJkO1FBNEJJLGdCQUFvQixZQUFtQixFQUFFLE9BQXNCO1lBNUJuRSxpQkEyVUM7WUEvU3VCLGlCQUFZLEdBQVosWUFBWSxDQUFPO1lBeEIvQixZQUFPLEdBQWlCO2dCQUM1QixJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO2dCQUNoQixrQkFBa0IsRUFBRSxLQUFLO2dCQUN6QixTQUFTLEVBQUUsV0FBVztnQkFDdEIsY0FBYyxFQUFFLFdBQVc7Z0JBQzNCLGVBQWUsRUFBRSxJQUFJO2FBQ3hCLENBQUM7WUFNTSxrQkFBYSxHQUF5QztnQkFDMUQsQ0FBQyxFQUFFLElBQUk7Z0JBQ1AsQ0FBQyxFQUFFLElBQUk7YUFDVixDQUFDO1lBRU0sZ0JBQVcsR0FBRztnQkFDbEIsQ0FBQyxFQUFFLElBQUk7Z0JBQ1AsQ0FBQyxFQUFFLElBQUk7YUFDVixDQUFDO1lBaUVNLGtCQUFhLEdBQUcsVUFBQyxLQUE0QjtnQkFFakQsSUFBSSxhQUFhLEdBQTBCLEtBQUssQ0FBQyxhQUFhLENBQUM7Z0JBRS9ELEdBQUcsQ0FBQSxDQUFhLFVBQWlCLEVBQWpCLEtBQUEsS0FBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQWpCLGNBQWlCLEVBQWpCLElBQWlCLENBQUM7b0JBQTlCLElBQUksSUFBSSxTQUFBO29CQUVSLElBQUksS0FBSyxHQUFHLGFBQWEsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7b0JBQ3hELEVBQUUsQ0FBQSxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUM7d0JBQUMsS0FBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLEdBQUcsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO2lCQUN2RjtZQUNMLENBQUMsQ0FBQztZQUVNLGNBQVMsR0FBRyxVQUFDLEtBQTBCO2dCQUUzQyxFQUFFLENBQUEsQ0FBQyxRQUFRLENBQUMsYUFBYSxLQUFLLEtBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FDakQsQ0FBQztvQkFDRyxNQUFNLENBQUM7Z0JBQ1gsQ0FBQztnQkFFRCxFQUFFLENBQUEsQ0FBQyxDQUFDLEVBQUUsRUFBQyxFQUFFLEVBQUMsRUFBRSxFQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFFLENBQUMsQ0FDOUMsQ0FBQztvQkFDRyxLQUFJLENBQUMsa0JBQWtCLENBQ25CLENBQUMsRUFBRSxFQUFDLEVBQUUsRUFBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLEVBQ2xELE1BQU0sRUFDTixLQUFLLENBQ1IsQ0FBQztnQkFDTixDQUFDO2dCQUNELElBQUksQ0FBQyxFQUFFLENBQUEsQ0FBQyxDQUFDLEVBQUUsRUFBQyxFQUFFLEVBQUMsRUFBRSxFQUFDLEVBQUUsRUFBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBRSxDQUFDLENBQ3RELENBQUM7b0JBQ0csS0FBSSxDQUFDLGtCQUFrQixDQUNuQixDQUFDLEVBQUUsRUFBQyxFQUFFLEVBQUMsRUFBRSxFQUFDLEVBQUUsRUFBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLEVBQ3hELE1BQU0sRUFDTixLQUFLLENBQ1IsQ0FBQztnQkFDTixDQUFDO1lBQ0wsQ0FBQyxDQUFDO1lBbUJNLCtCQUEwQixHQUFHLFVBQUMsS0FBcUI7Z0JBQXJCLHFCQUFxQixHQUFyQixhQUFxQjtnQkFFdkQsSUFBSSxrQkFBa0IsR0FBRyw2QkFBbUIsQ0FBQyxTQUFTLENBQUM7b0JBQ25ELEVBQUUsT0FBTyxFQUFFLEtBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRTtvQkFDeEYsRUFBRSxPQUFPLEVBQUUsS0FBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsT0FBTyxFQUFFLEtBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFO2lCQUN2RixDQUFDLENBQUM7Z0JBRUgsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDO2dCQUNuQixFQUFFLENBQUEsQ0FBQyxLQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FDekMsQ0FBQztvQkFDRyxTQUFTLENBQUMsWUFBWSxDQUFDLEdBQUcsUUFBUSxDQUFDO29CQUNuQyxFQUFFLENBQUEsQ0FBQyxrQkFBa0IsQ0FBQzt3QkFBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUM7Z0JBQzNFLENBQUM7Z0JBRUQsRUFBRSxDQUFBLENBQUMsS0FBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQ3pDLENBQUM7b0JBQ0csU0FBUyxDQUFDLFlBQVksQ0FBQyxHQUFHLFFBQVEsQ0FBQztvQkFDbkMsRUFBRSxDQUFBLENBQUMsa0JBQWtCLENBQUM7d0JBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO2dCQUM1RSxDQUFDO2dCQUVELEVBQUUsQ0FBQSxDQUFDLENBQUMsS0FBSSxDQUFDLGlCQUFpQixDQUFDO29CQUFDLEtBQUksQ0FBQyxpQkFBaUIsR0FBRyxLQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBRWpHLEtBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ25DLENBQUMsQ0FBQztZQW1HTSx5QkFBb0IsR0FBRyxVQUFDLElBQWMsRUFBRSxZQUFvQixFQUFFLFFBQWdCLEVBQUUsS0FBaUI7Z0JBRXJHLEVBQUUsQ0FBQSxDQUFDLEtBQUssQ0FBQyxNQUFNLEtBQUssWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQ3BDLENBQUM7b0JBQ0csS0FBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDMUMsS0FBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsb0ZBQW9GO2dCQUN4SSxDQUFDO2dCQUNELElBQUksQ0FBQyxFQUFFLENBQUEsQ0FBQyxLQUFLLENBQUMsTUFBTSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUNyQyxDQUFDO29CQUNHLEtBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDbkQsQ0FBQztZQUNMLENBQUMsQ0FBQztZQXJQRSxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFFLENBQUM7WUFFMUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEdBQUcsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLENBQUM7WUFDdEYsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUUsVUFBVSxDQUFDLENBQUM7WUFFdkgsSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7WUFDbEMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBRWQsRUFBRSxDQUFBLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsS0FBSyxJQUFJLENBQUMsQ0FDNUMsQ0FBQztnQkFDRyxzREFBc0Q7Z0JBQ3RELElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7WUFPbkYsQ0FBQztZQUdELDBJQUEwSTtZQUMxSSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2pILENBQUM7UUFFTSx1QkFBTSxHQUFiO1lBRUksSUFBSSxlQUFlLEdBQUcsS0FBSyxDQUFDO1lBRTVCLEdBQUcsQ0FBQSxDQUFhLFVBQWlCLEVBQWpCLEtBQUEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQWpCLGNBQWlCLEVBQWpCLElBQWlCLENBQUM7Z0JBQTlCLElBQUksSUFBSSxTQUFBO2dCQUVSLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3RCLEVBQUUsQ0FBQSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7YUFDdEY7WUFFRCxrQ0FBa0M7WUFDbEMsRUFBRSxDQUFBLENBQUMsZUFBZSxLQUFLLElBQUksQ0FBQyxDQUM1QixDQUFDO2dCQUNHLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3JFLENBQUM7UUFDTCxDQUFDO1FBRU8sNkJBQVksR0FBcEIsVUFBcUIsSUFBYSxFQUFFLFlBQW1CO1lBRW5ELElBQUksWUFBWSxFQUFFLFFBQVEsQ0FBQztZQUUzQixZQUFZLENBQUMsTUFBTSxDQUNmLFlBQVksR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsUUFBUSxDQUNyQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxZQUFZLEdBQUcsR0FBRztrQkFDekMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsYUFBYSxHQUFHLElBQUksQ0FDbEQsQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FDckYsQ0FBQztZQUVGLE1BQU0sQ0FBQztnQkFDSCxTQUFTLEVBQUUsWUFBWTtnQkFDdkIsS0FBSyxFQUFFLFFBQVE7YUFDbEIsQ0FBQztRQUNOLENBQUM7O1FBc0NPLG1DQUFrQixHQUExQixVQUEyQixJQUFhLEVBQUUsU0FBdUIsRUFBRSxLQUEyQjtZQUUxRixJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sQ0FBQSxDQUFDLFNBQVMsQ0FBQyxDQUNqQixDQUFDO2dCQUNHLEtBQUssTUFBTTtvQkFDUCxFQUFFLENBQUEsQ0FBQyxTQUFTLElBQUksQ0FBQyxDQUFDO3dCQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztvQkFDMUMsS0FBSyxDQUFDO2dCQUNWLEtBQUssTUFBTTtvQkFDUCxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxFQUMvRCxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFFcEUsRUFBRSxDQUFBLENBQUMsVUFBVSxHQUFHLFNBQVMsS0FBSyxVQUFVLENBQUM7d0JBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO29CQUNqRSxLQUFLLENBQUM7WUFDZCxDQUFDO1FBQ0wsQ0FBQztRQTJCTywyQkFBVSxHQUFsQixVQUFtQixJQUFhO1lBRTVCLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDckMsRUFBRSxDQUFBLENBQUMsU0FBUyxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUMzRCxDQUFDO2dCQUNHLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLFFBQVEsR0FBRyxJQUFJLENBQUMsQ0FBQztnQkFFckUsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUNqRCxZQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFDN0IsUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7Z0JBRTFCLFlBQVksQ0FBQyxFQUFFLENBQUMsWUFBWSxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUM3SSxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUVqSSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztZQUNwQyxDQUFDO1lBQ0QsSUFBSSxDQUFDLEVBQUUsQ0FBQSxDQUFDLFNBQVMsS0FBSyxLQUFLLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FDakUsQ0FBQztnQkFDRyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxRQUFRLEdBQUcsSUFBSSxDQUFDLENBQUM7Z0JBRXhFLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUM1QyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFFaEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUUsQ0FBQztZQUN6RSxDQUFDO1lBRUQscURBQXFEO1lBQ3JELEVBQUUsQ0FBQSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLENBQ3JDLENBQUM7Z0JBQ0csSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMvRixDQUFDO1FBQ0wsQ0FBQztRQUVPLHlCQUFRLEdBQWhCLFVBQWlCLEdBQVUsRUFBRSxRQUFpQyxFQUFFLElBQWE7WUFFekUsTUFBTSxDQUFBLENBQUMsUUFBUSxDQUFDLENBQ2hCLENBQUM7Z0JBQ0csS0FBSyxNQUFNO29CQUNQLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsR0FBRyxhQUFhLEdBQUcsWUFBWSxDQUFDLEVBQUUsQ0FBQztnQkFDOUQsS0FBSyxZQUFZO29CQUNiLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLEdBQUcsR0FBRyxjQUFjLEdBQUcsYUFBYSxDQUFDLENBQUM7Z0JBQ2pFLEtBQUssWUFBWTtvQkFDYixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxHQUFHLEdBQUcsY0FBYyxHQUFHLGFBQWEsQ0FBQyxDQUFDO2dCQUNqRSxLQUFLLFdBQVc7b0JBQ1osTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxHQUFHLFdBQVcsR0FBRyxZQUFZLENBQUMsRUFBRSxDQUFDO1lBQ2hFLENBQUM7UUFDTCxDQUFDO1FBRU8sMEJBQVMsR0FBakIsVUFBa0IsSUFBYTtZQUUzQixJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxFQUMxRCxpQkFBaUIsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRTNFLE1BQU0sQ0FBQyxXQUFXLEdBQUcsaUJBQWlCLENBQUM7UUFDM0MsQ0FBQztRQUVPLDRCQUFXLEdBQW5CLFVBQW9CLElBQWEsRUFBRSxZQUFtQixFQUFFLFFBQWU7WUFFbkUsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFDMUQsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUUzRSxFQUFFLENBQUEsQ0FBQyxXQUFXLEdBQUcsaUJBQWlCLENBQUMsQ0FDbkMsQ0FBQztnQkFDRyxZQUFZLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUVuQyxJQUFJLGtCQUFrQixHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFbkUsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxHQUFHLFFBQVEsR0FBRyxPQUFPLEVBQzFDLGtCQUFrQixHQUFHLENBQUMsV0FBVyxHQUFHLGlCQUFpQixDQUFDLENBQ3pELENBQUM7WUFDTixDQUFDO1lBQ0QsSUFBSSxDQUNKLENBQUM7Z0JBQ0csWUFBWSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNwQyxDQUFDO1FBQ0wsQ0FBQztRQUVPLDhCQUFhLEdBQXJCLFVBQXNCLElBQWEsRUFBRSxZQUFtQixFQUFFLFFBQWU7WUFFckUsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUM7a0JBQ3pELENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFlBQVksRUFBRSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQ3pHLGNBQWMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQ3RELGtCQUFrQixHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVuRSxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLEdBQUcsS0FBSyxHQUFHLE1BQU0sRUFDdEMsQ0FBQyxrQkFBa0IsR0FBRyxjQUFjLENBQUMsR0FBRyxXQUFXLENBQ3RELENBQUM7UUFDTixDQUFDO1FBRU8seUJBQVEsR0FBaEIsVUFBaUIsSUFBYSxFQUFFLFlBQW1CLEVBQUUsUUFBZSxFQUFFLEtBQWdCO1lBRWxGLEVBQUUsQ0FBQSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUMzRyxDQUFDO2dCQUNHLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNyRCxDQUFDO1FBQ0wsQ0FBQztRQWVPLCtCQUFjLEdBQXRCLFVBQXVCLElBQWMsRUFBRSxZQUFvQixFQUFFLEtBQWlCO1lBRTFFLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUV2QixJQUFJLE1BQU0sR0FBRztnQkFDTCxRQUFRLEVBQUUsS0FBSyxDQUFDLElBQUksS0FBSyxHQUFHLEdBQUcsT0FBTyxHQUFHLE9BQU8sQ0FBQztnQkFDakQsV0FBVyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxLQUFLLEdBQUcsR0FBRyxXQUFXLEdBQUcsWUFBWSxDQUFDLEVBQUU7Z0JBQ3pFLFlBQVksRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQyxpRUFBaUU7YUFDakwsRUFDRCxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUN4QixXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUU1RCxPQUFPO2lCQUNGLEVBQUUsQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsV0FBVyxDQUFDO2lCQUMzRCxHQUFHLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLGNBQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUEsQ0FBQSxDQUFDLENBQUMsQ0FBQztRQUN0RyxDQUFDO1FBRU8sNEJBQVcsR0FBbkIsVUFBb0IsSUFBYSxFQUFFLE1BQU0sRUFBRSxLQUFnQjtZQUN2RCxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7WUFFdkIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEtBQUksR0FBRyxHQUFHLFdBQVcsR0FBRyxZQUFZLENBQUMsQ0FDckQsTUFBTSxDQUFDLFdBQVcsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssR0FBRyxHQUFHLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FDekcsQ0FBQztRQUNOLENBQUM7UUFFTyx3Q0FBdUIsR0FBL0IsVUFBZ0MsSUFBYSxFQUFFLEtBQWdCO1lBRTNELEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUV2QixJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLEdBQUcsU0FBUyxHQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRTFELEVBQUUsQ0FBQSxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUM7Z0JBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLGtEQUFrRDtZQUUvRSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksS0FBSyxHQUFHLEdBQUcsV0FBVyxHQUFHLFlBQVksQ0FBQyxDQUN0RCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FDcEgsQ0FBQztRQUNOLENBQUM7UUFFTSx3QkFBTyxHQUFkO1lBRUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDdkQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUV0RCxHQUFHLENBQUEsQ0FBQyxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQ25DLENBQUM7Z0JBQ0csRUFBRSxDQUFBLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsU0FBUyxZQUFZLE1BQU0sS0FBSyxJQUFJLENBQUMsQ0FDckgsQ0FBQztvQkFDRyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDNUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7Z0JBQ3BDLENBQUM7WUFDTCxDQUFDO1lBRUQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDaEQsQ0FBQztRQXhVYSxXQUFJLEdBQVUsV0FBVyxDQUFDO1FBWXpCLHVCQUFnQixHQUFHLENBQUMsQ0FBQztRQTZUeEMsYUFBQztJQUFELENBM1VBLEFBMlVDLElBQUE7SUEzVVksZ0JBQU0sU0EyVWxCLENBQUE7QUFDTCxDQUFDLEVBaldNLFNBQVMsS0FBVCxTQUFTLFFBaVdmOztBQ3BXRCw4Q0FBOEM7QUFDOUMsMkNBQTJDO0FBRTNDLE1BQU0sQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRztJQUFTLGNBQU87U0FBUCxXQUFPLENBQVAsc0JBQU8sQ0FBUCxJQUFPO1FBQVAsNkJBQU87O0lBRS9DLElBQUksTUFBTSxHQUFVLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLFFBQVEsR0FBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxFQUMvRCxPQUFPLEdBQTJCLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxDQUFDO1VBQ3pELElBQUksQ0FBQyxDQUFDLENBQUM7VUFDUCxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7SUFFdkQsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7UUFFYixJQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQ2xCLEdBQUcsR0FBRyxTQUFTLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQ3ZDLE1BQU0sR0FBb0IsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUU1QyxFQUFFLENBQUEsQ0FBQyxNQUFNLEtBQUssTUFBTSxJQUFJLE1BQU0sWUFBWSxTQUFTLENBQUMsTUFBTSxLQUFLLEtBQUssQ0FBQyxDQUNyRSxDQUFDO1lBQ0csR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsTUFBTSxHQUFHLElBQUksU0FBUyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUN4RSxDQUFDO1FBQ0QsSUFBSSxDQUFDLEVBQUUsQ0FBQSxDQUFDLE1BQU0sWUFBWSxTQUFTLENBQUMsTUFBTSxLQUFLLEtBQUssQ0FBQyxDQUNyRCxDQUFDO1lBQ0csTUFBTSxJQUFJLFNBQVMsQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFDO1FBQ3ZFLENBQUM7UUFFRCxNQUFNLENBQUEsQ0FBQyxNQUFNLENBQUMsQ0FDZCxDQUFDO1lBQ0csS0FBSyxNQUFNO2dCQUNQLE1BQU0sQ0FBQztZQUNYLEtBQUssUUFBUTtnQkFDVCxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2hCLEtBQUssQ0FBQztZQUNWLEtBQUssU0FBUztnQkFDVixNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2pCLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3BCLEtBQUssQ0FBQztZQUNWO2dCQUNJLE1BQU0sSUFBSSxTQUFTLENBQUMsMkJBQTJCLEdBQUcsTUFBTSxDQUFDLENBQUM7UUFDbEUsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBRVAsQ0FBQyxDQUFDIiwiZmlsZSI6InNjcm9sbGVydC5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZSBTY3JvbGxlcnRcbntcbiAgICBleHBvcnQgaW50ZXJmYWNlIFNjcm9sbGJhckRpbWVuc2lvbnNcbiAgICB7XG4gICAgICAgIHRhZ05hbWU6c3RyaW5nO1xuICAgICAgICBjbGFzc2VzOnN0cmluZztcbiAgICB9XG5cbiAgICBleHBvcnQgY2xhc3MgU2Nyb2xsYmFyRGltZW5zaW9uc1xuICAgIHtcbiAgICAgICAgcHVibGljIHN0YXRpYyBjYWxjdWxhdGUoY29udGFpbmVyVHJhaWw6U2Nyb2xsYmFyRGltZW5zaW9uc1tdKTpudW1iZXJcbiAgICAgICAge1xuICAgICAgICAgICAgbGV0IHJvb3RFbG0sIGN1ckVsbSwgcHJldkVsbTtcblxuICAgICAgICAgICAgaWYoY29udGFpbmVyVHJhaWwubGVuZ3RoIDw9IDApXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgY29udGFpbmVyIHRyYWlsIHNwZWNpZmllZCBmb3Igc2Nyb2xsYmFyIGRpbWVuc2lvbnMgY2FsY3VsYXRpb25cIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvcihsZXQgY29udGFpbmVyIG9mIGNvbnRhaW5lclRyYWlsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGN1ckVsbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoY29udGFpbmVyLnRhZ05hbWUpO1xuICAgICAgICAgICAgICAgIGN1ckVsbS5jbGFzc05hbWUgPSBjb250YWluZXIuY2xhc3NlcztcblxuICAgICAgICAgICAgICAgIChwcmV2RWxtKSA/IHByZXZFbG0uYXBwZW5kQ2hpbGQoY3VyRWxtICkgOiByb290RWxtID0gY3VyRWxtO1xuICAgICAgICAgICAgICAgIHByZXZFbG0gPSBjdXJFbG0gO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByb290RWxtLnN0eWxlLnBvc2l0aW9uID0gXCJmaXhlZFwiO1xuICAgICAgICAgICAgcm9vdEVsbS5zdHlsZS50b3AgPSBcIjBcIjtcbiAgICAgICAgICAgIHJvb3RFbG0uc3R5bGUubGVmdCA9IFwiMFwiO1xuICAgICAgICAgICAgcm9vdEVsbS5zdHlsZS52aXNpYmlsaXR5ID0gXCJoaWRkZW5cIjtcbiAgICAgICAgICAgIHJvb3RFbG0uc3R5bGUud2lkdGggPSBcIjIwMHB4XCI7XG4gICAgICAgICAgICByb290RWxtLnN0eWxlLmhlaWdodCA9IFwiMjAwcHhcIjtcblxuICAgICAgICAgICAgY3VyRWxtLnN0eWxlLm92ZXJmbG93ID0gXCJoaWRkZW5cIjtcblxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChyb290RWxtKTtcbiAgICAgICAgICAgIGxldCB3aXRob3V0U2Nyb2xsYmFycyA9IGN1ckVsbS5jbGllbnRXaWR0aDtcblxuICAgICAgICAgICAgY3VyRWxtLnN0eWxlLm92ZXJmbG93ID0gXCJzY3JvbGxcIjtcbiAgICAgICAgICAgIGxldCB3aXRoU2Nyb2xsYmFycyA9IGN1ckVsbS5jbGllbnRXaWR0aDtcblxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChyb290RWxtKTtcblxuICAgICAgICAgICAgcmV0dXJuIHdpdGhvdXRTY3JvbGxiYXJzIC0gd2l0aFNjcm9sbGJhcnM7XG5cbiAgICAgICAgfVxuICAgIH1cbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vdHlwaW5ncy9pbmRleC5kLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJTY3JvbGxiYXJEaW1lbnNpb25zLnRzXCIgLz5cblxubW9kdWxlIFNjcm9sbGVydCB7XG5cbiAgICBleHBvcnQgdHlwZSBBeGlzVHlwZSA9IFwieFwiIHwgXCJ5XCI7XG4gICAgdHlwZSBOb3JtYWxpemVkU2Nyb2xsUHJvcGVydHkgPSBcInNpemVcIiB8IFwic2Nyb2xsU2l6ZVwiIHwgXCJzY3JvbGxQb3NcIiB8IFwiY2xpZW50U2l6ZVwiO1xuICAgIHR5cGUgRGlyZWN0aW9uVHlwZSA9IFwiaGVlblwiIHwgXCJ3ZWVyXCI7IC8vQUtBICBmb3J0aCBhbmQgYmFjayAoaHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1YN1YwOVRtc3UtMClcblxuICAgIGludGVyZmFjZSBTY3JvbGxiYXJDb250YWluZXJcbiAgICB7XG4gICAgICAgIHNjcm9sbGJhcjpKUXVlcnk7XG4gICAgICAgIHRyYWNrOkpRdWVyeTtcbiAgICB9XG5cbiAgICBleHBvcnQgaW50ZXJmYWNlIFBsdWdpbk9wdGlvbnNcbiAgICB7XG4gICAgICAgIGF4ZXM/OkF4aXNUeXBlW107XG4gICAgICAgIHByZXZlbnRPdXRlclNjcm9sbD86Ym9vbGVhbjtcbiAgICAgICAgY3NzUHJlZml4PzpzdHJpbmc7XG4gICAgICAgIGV2ZW50TmFtZXNwYWNlPzpzdHJpbmc7XG4gICAgICAgIGNvbnRlbnRTZWxlY3Rvcj86c3RyaW5nO1xuICAgIH1cblxuICAgIGV4cG9ydCBjbGFzcyBQbHVnaW5cbiAgICB7XG4gICAgICAgIHB1YmxpYyBzdGF0aWMgTkFNRTpzdHJpbmcgPSAnc2Nyb2xsZXJ0JztcblxuICAgICAgICBwcml2YXRlIG9wdGlvbnM6UGx1Z2luT3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGF4ZXM6IFsneCcsICd5J10sXG4gICAgICAgICAgICBwcmV2ZW50T3V0ZXJTY3JvbGw6IGZhbHNlLFxuICAgICAgICAgICAgY3NzUHJlZml4OiAnc2Nyb2xsZXJ0JyxcbiAgICAgICAgICAgIGV2ZW50TmFtZXNwYWNlOiAnc2Nyb2xsZXJ0JyxcbiAgICAgICAgICAgIGNvbnRlbnRTZWxlY3RvcjogbnVsbFxuICAgICAgICB9O1xuXG4gICAgICAgIHByaXZhdGUgY29udGVudEVsbTpKUXVlcnk7XG5cbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgZXZlbnROYW1lc3BhY2VJZCA9IDA7XG5cbiAgICAgICAgcHJpdmF0ZSBzY3JvbGxiYXJFbG1zOnsgW2lkOiBzdHJpbmddIDogU2Nyb2xsYmFyQ29udGFpbmVyIH0gPSB7XG4gICAgICAgICAgICB4OiBudWxsLFxuICAgICAgICAgICAgeTogbnVsbFxuICAgICAgICB9O1xuXG4gICAgICAgIHByaXZhdGUgc2Nyb2xsQ2FjaGUgPSB7XG4gICAgICAgICAgICB4OiBudWxsLFxuICAgICAgICAgICAgeTogbnVsbFxuICAgICAgICB9O1xuXG4gICAgICAgIHByaXZhdGUgb3JpZ2luYWxDc3NWYWx1ZXM6eyBbaWQ6IHN0cmluZ10gOiBzdHJpbmc7IH07XG5cbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBjb250YWluZXJFbG06SlF1ZXJ5LCBvcHRpb25zPzpQbHVnaW5PcHRpb25zKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMgPSBqUXVlcnkuZXh0ZW5kKCB7fSwgdGhpcy5vcHRpb25zLCBvcHRpb25zICk7XG5cbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSA9IHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSArICsrUGx1Z2luLmV2ZW50TmFtZXNwYWNlSWQ7XG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG0gPSB0aGlzLmNvbnRhaW5lckVsbS5jaGlsZHJlbih0aGlzLm9wdGlvbnMuY29udGVudFNlbGVjdG9yIHx8ICcuJyArIHRoaXMub3B0aW9ucy5jc3NQcmVmaXggKyctY29udGVudCcpO1xuXG4gICAgICAgICAgICB0aGlzLm9mZnNldENvbnRlbnRFbG1TY3JvbGxiYXJzKCk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuXG4gICAgICAgICAgICBpZih0aGlzLm9wdGlvbnMucHJldmVudE91dGVyU2Nyb2xsID09PSB0cnVlKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIC8vIFByZXZlbnQgb3V0ZXIgc2Nyb2xsIHdoaWxlIHNjcm9sbGluZyB0aGUgY29udGVudEVsbVxuICAgICAgICAgICAgICAgIHRoaXMuY29udGVudEVsbS5vbignd2hlZWwuJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSwgdGhpcy5vblNjcm9sbFdoZWVsKTtcblxuICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICogQHRvZG8gVGhlIGtleWRvd24gb3V0ZXIgc2Nyb2xsIHByZXZlbnRpb24gaXMgbm90IHdvcmtpbmcgeWV0LlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIC8vIFByZXZlbnQgb3V0ZXIgc2Nyb2xsIG9uIGtleSBkb3duXG4gICAgICAgICAgICAgICAgLyp0aGlzLmNvbnRlbnRFbG0ub24oJ2tleWRvd24uJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSwgdGhpcy5vbktleURvd24pOyovXG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgLy9UaGVyZSBjb3VsZCBiZSBhIHpvb20gY2hhbmdlLiBab29tIGlzIGFsbW9zdCBub3QgaW5kaXN0aW5ndWlzaGFibGUgZnJvbSByZXNpemUgZXZlbnRzLiBTbyBvbiB3aW5kb3cgcmVzaXplLCByZWNhbGN1bGF0ZSBjb250ZW50RWxtIG9mZmV0XG4gICAgICAgICAgICBqUXVlcnkod2luZG93KS5vbigncmVzaXplLicgKyB0aGlzLm9wdGlvbnMuZXZlbnROYW1lc3BhY2UsIHRoaXMub2Zmc2V0Q29udGVudEVsbVNjcm9sbGJhcnMuYmluZCh0aGlzLCB0cnVlKSk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgdXBkYXRlKClcbiAgICAgICAge1xuICAgICAgICAgICAgbGV0IHJlcG9zaXRpb25UcmFjayA9IGZhbHNlO1xuXG4gICAgICAgICAgICBmb3IobGV0IGF4aXMgb2YgdGhpcy5vcHRpb25zLmF4ZXMpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVBeGlzKGF4aXMpO1xuICAgICAgICAgICAgICAgIGlmKHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCBcInNjcm9sbFBvc1wiLCBheGlzKSAhPT0gMCkgcmVwb3NpdGlvblRyYWNrID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9JZiB3ZSBzdGFydCBvbiBhIHNjcm9sbCBwb3NpdGlvblxuICAgICAgICAgICAgaWYocmVwb3NpdGlvblRyYWNrID09PSB0cnVlKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGVudEVsbS50cmlnZ2VyKCdzY3JvbGwuJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIGFkZFNjcm9sbGJhcihheGlzOkF4aXNUeXBlLCBjb250YWluZXJFbG06SlF1ZXJ5KTpTY3JvbGxiYXJDb250YWluZXJcbiAgICAgICAge1xuICAgICAgICAgICAgbGV0IHNjcm9sbGJhckVsbSwgdHJhY2tFbG07XG5cbiAgICAgICAgICAgIGNvbnRhaW5lckVsbS5hcHBlbmQoXG4gICAgICAgICAgICAgICAgc2Nyb2xsYmFyRWxtID0galF1ZXJ5KCc8ZGl2IC8+JykuYWRkQ2xhc3MoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5jc3NQcmVmaXggKyAnLXNjcm9sbGJhcicgKyAnICdcbiAgICAgICAgICAgICAgICAgICAgKyB0aGlzLm9wdGlvbnMuY3NzUHJlZml4ICsgJy1zY3JvbGxiYXItJyArIGF4aXNcbiAgICAgICAgICAgICAgICApLmFwcGVuZCh0cmFja0VsbSA9IGpRdWVyeSgnPGRpdiAvPicpLmFkZENsYXNzKHRoaXMub3B0aW9ucy5jc3NQcmVmaXggKyAnLXRyYWNrJykpXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHNjcm9sbGJhcjogc2Nyb2xsYmFyRWxtLFxuICAgICAgICAgICAgICAgIHRyYWNrOiB0cmFja0VsbVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcblxuICAgICAgICBwcml2YXRlIG9uU2Nyb2xsV2hlZWwgPSAoZXZlbnQ6SlF1ZXJ5TW91c2VFdmVudE9iamVjdCkgPT4ge1xuXG4gICAgICAgICAgICBsZXQgb3JpZ2luYWxFdmVudDpXaGVlbEV2ZW50ID0gPFdoZWVsRXZlbnQ+ZXZlbnQub3JpZ2luYWxFdmVudDtcblxuICAgICAgICAgICAgZm9yKGxldCBheGlzIG9mIHRoaXMub3B0aW9ucy5heGVzKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxldCBkZWx0YSA9IG9yaWdpbmFsRXZlbnRbJ2RlbHRhJyArIGF4aXMudG9VcHBlckNhc2UoKV07XG4gICAgICAgICAgICAgICAgaWYoZGVsdGEgIT09IDApIHRoaXMucHJldmVudE91dGVyU2Nyb2xsKGF4aXMsIChkZWx0YSA8IDApID8gXCJoZWVuXCIgOiBcIndlZXJcIiwgZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHByaXZhdGUgb25LZXlEb3duID0gKGV2ZW50OkpRdWVyeUtleUV2ZW50T2JqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIGlmKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgIT09IHRoaXMuY29udGVudEVsbVswXSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKFszNywzOCwzMywzNl0uaW5kZXhPZihldmVudC53aGljaCkgIT09IC0xICkgLy8gaGVlblxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMucHJldmVudE91dGVyU2Nyb2xsKFxuICAgICAgICAgICAgICAgICAgICBbMzgsMzMsMzZdLmluZGV4T2YoZXZlbnQud2hpY2gpICE9PSAtMSA/IFwieVwiIDogXCJ4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaGVlblwiLFxuICAgICAgICAgICAgICAgICAgICBldmVudFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmKFszOSw0MCwzMiwzNCwzNV0uaW5kZXhPZihldmVudC53aGljaCkgIT09IC0xICkgLy8gd2VlclxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMucHJldmVudE91dGVyU2Nyb2xsKFxuICAgICAgICAgICAgICAgICAgICBbNDAsMzUsMzYsMzQsMzJdLmluZGV4T2YoZXZlbnQud2hpY2gpICE9PSAtMSA/IFwieVwiIDogXCJ4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwid2VlclwiLFxuICAgICAgICAgICAgICAgICAgICBldmVudFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcHJpdmF0ZSBwcmV2ZW50T3V0ZXJTY3JvbGwoYXhpczpBeGlzVHlwZSwgZGlyZWN0aW9uOkRpcmVjdGlvblR5cGUsIGV2ZW50OkJhc2VKUXVlcnlFdmVudE9iamVjdClcbiAgICAgICAge1xuICAgICAgICAgICAgbGV0IHNjcm9sbFBvcyA9IHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCBcInNjcm9sbFBvc1wiLCBheGlzKTtcbiAgICAgICAgICAgIHN3aXRjaChkaXJlY3Rpb24pXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY2FzZSBcImhlZW5cIjpcbiAgICAgICAgICAgICAgICAgICAgaWYoc2Nyb2xsUG9zIDw9IDApIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJ3ZWVyXCI6XG4gICAgICAgICAgICAgICAgICAgIGxldCBzY3JvbGxTaXplID0gdGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sIFwic2Nyb2xsU2l6ZVwiLCBheGlzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsaWVudFNpemUgPSB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgXCJjbGllbnRTaXplXCIsIGF4aXMpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmKHNjcm9sbFNpemUgLSBzY3JvbGxQb3MgPT09IGNsaWVudFNpemUpIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBvZmZzZXRDb250ZW50RWxtU2Nyb2xsYmFycyA9IChmb3JjZTpib29sZWFuID0gZmFsc2UpID0+IHtcblxuICAgICAgICAgICAgbGV0IHNjcm9sbGJhckRpbWVuc2lvbiA9IFNjcm9sbGJhckRpbWVuc2lvbnMuY2FsY3VsYXRlKFtcbiAgICAgICAgICAgICAgICB7IHRhZ05hbWU6IHRoaXMuY29udGFpbmVyRWxtLnByb3AoJ3RhZ05hbWUnKSwgY2xhc3NlczogdGhpcy5jb250YWluZXJFbG0ucHJvcCgnY2xhc3MnKSB9LFxuICAgICAgICAgICAgICAgIHsgdGFnTmFtZTogdGhpcy5jb250ZW50RWxtLnByb3AoJ3RhZ05hbWUnKSwgY2xhc3NlczogdGhpcy5jb250ZW50RWxtLnByb3AoJ2NsYXNzJykgfVxuICAgICAgICAgICAgXSk7XG5cbiAgICAgICAgICAgIGxldCBjc3NWYWx1ZXMgPSB7fTtcbiAgICAgICAgICAgIGlmKHRoaXMub3B0aW9ucy5heGVzLmluZGV4T2YoJ3knKSAhPT0gLTEpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY3NzVmFsdWVzWydvdmVyZmxvdy15J10gPSBcInNjcm9sbFwiO1xuICAgICAgICAgICAgICAgIGlmKHNjcm9sbGJhckRpbWVuc2lvbikgY3NzVmFsdWVzWydyaWdodCddID0gLXNjcm9sbGJhckRpbWVuc2lvbiArIFwicHhcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYodGhpcy5vcHRpb25zLmF4ZXMuaW5kZXhPZigneCcpICE9PSAtMSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjc3NWYWx1ZXNbJ292ZXJmbG93LXgnXSA9IFwic2Nyb2xsXCI7XG4gICAgICAgICAgICAgICAgaWYoc2Nyb2xsYmFyRGltZW5zaW9uKSBjc3NWYWx1ZXNbJ2JvdHRvbSddID0gLXNjcm9sbGJhckRpbWVuc2lvbiArIFwicHhcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYoIXRoaXMub3JpZ2luYWxDc3NWYWx1ZXMpIHRoaXMub3JpZ2luYWxDc3NWYWx1ZXMgPSB0aGlzLmNvbnRlbnRFbG0uY3NzKE9iamVjdC5rZXlzKGNzc1ZhbHVlcykpO1xuXG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG0uY3NzKGNzc1ZhbHVlcyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgcHJpdmF0ZSB1cGRhdGVBeGlzKGF4aXM6QXhpc1R5cGUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxldCBoYXNTY3JvbGwgPSB0aGlzLmhhc1Njcm9sbChheGlzKTtcbiAgICAgICAgICAgIGlmKGhhc1Njcm9sbCA9PT0gdHJ1ZSAmJiB0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10gPT09IG51bGwpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbG0uYWRkQ2xhc3ModGhpcy5vcHRpb25zLmNzc1ByZWZpeCArIFwiLWF4aXMtXCIgKyBheGlzKTtcblxuICAgICAgICAgICAgICAgIGxldCBlbG1zID0gdGhpcy5hZGRTY3JvbGxiYXIoYXhpcywgdGhpcy5jb250YWluZXJFbG0pLFxuICAgICAgICAgICAgICAgICAgICBzY3JvbGxiYXJFbG0gPSBlbG1zLnNjcm9sbGJhcixcbiAgICAgICAgICAgICAgICAgICAgdHJhY2tFbG0gPSBlbG1zLnRyYWNrO1xuXG4gICAgICAgICAgICAgICAgc2Nyb2xsYmFyRWxtLm9uKCdtb3VzZWRvd24uJyArIGF4aXMgKyAnLicgKyB0aGlzLm9wdGlvbnMuZXZlbnROYW1lc3BhY2UsIHRoaXMub25TY3JvbGxiYXJNb3VzZWRvd24uYmluZCh0aGlzLCBheGlzLCBzY3JvbGxiYXJFbG0sIHRyYWNrRWxtKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZW50RWxtLm9uKCdzY3JvbGwuJyArIGF4aXMgKyAnLicgKyB0aGlzLm9wdGlvbnMuZXZlbnROYW1lc3BhY2UsIHRoaXMub25TY3JvbGwuYmluZCh0aGlzLCBheGlzLCBzY3JvbGxiYXJFbG0sIHRyYWNrRWxtKSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10gPSBlbG1zO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZihoYXNTY3JvbGwgPT09IGZhbHNlICYmIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXSAhPT0gbnVsbClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lckVsbS5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMuY3NzUHJlZml4ICsgXCItYXhpcy1cIiArIGF4aXMpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdLnNjcm9sbGJhci5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10gPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZW50RWxtLm9mZignLicgKyBheGlzICsgXCIuXCIgKyB0aGlzLm9wdGlvbnMuZXZlbnROYW1lc3BhY2UgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9SZXNpemUgdHJhY2sgYWNjb3JkaW5nIHRvIGN1cnJlbnQgc2Nyb2xsIGRpbWVuc2lvbnNcbiAgICAgICAgICAgIGlmKHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXSAhPT0gbnVsbClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2l6ZVRyYWNrKGF4aXMsIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXS5zY3JvbGxiYXIsIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXS50cmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIGdldFZhbHVlKGVsbTpKUXVlcnksIHByb3BlcnR5Ok5vcm1hbGl6ZWRTY3JvbGxQcm9wZXJ0eSwgYXhpczpBeGlzVHlwZSk6bnVtYmVyXG4gICAgICAgIHtcbiAgICAgICAgICAgIHN3aXRjaChwcm9wZXJ0eSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjYXNlICdzaXplJzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsbVtheGlzID09PSAneScgPyAnb3V0ZXJIZWlnaHQnIDogJ291dGVyV2lkdGgnXSgpO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2NsaWVudFNpemUnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZWxtWzBdW2F4aXMgPT09ICd5JyA/ICdjbGllbnRIZWlnaHQnIDogJ2NsaWVudFdpZHRoJ107XG4gICAgICAgICAgICAgICAgY2FzZSAnc2Nyb2xsU2l6ZSc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbG1bMF1bYXhpcyA9PT0gJ3knID8gJ3Njcm9sbEhlaWdodCcgOiAnc2Nyb2xsV2lkdGgnXTtcbiAgICAgICAgICAgICAgICBjYXNlICdzY3JvbGxQb3MnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZWxtW2F4aXMgPT09ICd5JyA/ICdzY3JvbGxUb3AnIDogJ3Njcm9sbExlZnQnXSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBoYXNTY3JvbGwoYXhpczpBeGlzVHlwZSk6Ym9vbGVhblxuICAgICAgICB7XG4gICAgICAgICAgICBsZXQgY29udGVudFNpemUgPSB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgJ3NpemUnLCBheGlzKSxcbiAgICAgICAgICAgICAgICBjb250ZW50U2Nyb2xsU2l6ZSA9IHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2Nyb2xsU2l6ZScsIGF4aXMpO1xuICAgIFxuICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnRTaXplIDwgY29udGVudFNjcm9sbFNpemU7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIHJlc2l6ZVRyYWNrKGF4aXM6QXhpc1R5cGUsIHNjcm9sbGJhckVsbTpKUXVlcnksIHRyYWNrRWxtOkpRdWVyeSlcbiAgICAgICAge1xuICAgICAgICAgICAgbGV0IGNvbnRlbnRTaXplID0gdGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sICdzaXplJywgYXhpcyksXG4gICAgICAgICAgICAgICAgY29udGVudFNjcm9sbFNpemUgPSB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgJ3Njcm9sbFNpemUnLCBheGlzKTtcbiAgICBcbiAgICAgICAgICAgIGlmKGNvbnRlbnRTaXplIDwgY29udGVudFNjcm9sbFNpemUpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc2Nyb2xsYmFyRWxtLnJlbW92ZUNsYXNzKCdoaWRkZW4nKTtcbiAgICBcbiAgICAgICAgICAgICAgICBsZXQgc2Nyb2xsYmFyRGltZW5zaW9uID0gdGhpcy5nZXRWYWx1ZShzY3JvbGxiYXJFbG0sICdzaXplJywgYXhpcyk7XG4gICAgXG4gICAgICAgICAgICAgICAgdHJhY2tFbG0uY3NzKGF4aXMgPT09ICd5JyA/ICdoZWlnaHQnIDogJ3dpZHRoJyxcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsYmFyRGltZW5zaW9uICogKGNvbnRlbnRTaXplIC8gY29udGVudFNjcm9sbFNpemUpXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzY3JvbGxiYXJFbG0uYWRkQ2xhc3MoJ2hpZGRlbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBwb3NpdGlvblRyYWNrKGF4aXM6QXhpc1R5cGUsIHNjcm9sbGJhckVsbTpKUXVlcnksIHRyYWNrRWxtOkpRdWVyeSlcbiAgICAgICAge1xuICAgICAgICAgICAgbGV0IHJlbFRyYWNrUG9zID0gdGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sICdzY3JvbGxQb3MnLCBheGlzKVxuICAgICAgICAgICAgICAgICAgICAvICh0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgJ3Njcm9sbFNpemUnLCBheGlzKSAtIHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2l6ZScsIGF4aXMpKSxcbiAgICAgICAgICAgICAgICB0cmFja0RpbWVuc2lvbiA9IHRoaXMuZ2V0VmFsdWUodHJhY2tFbG0sICdzaXplJywgYXhpcyksXG4gICAgICAgICAgICAgICAgc2Nyb2xsYmFyRGltZW5zaW9uID0gdGhpcy5nZXRWYWx1ZShzY3JvbGxiYXJFbG0sICdzaXplJywgYXhpcyk7XG4gICAgXG4gICAgICAgICAgICB0cmFja0VsbS5jc3MoYXhpcyA9PT0gJ3knID8gJ3RvcCcgOiAnbGVmdCcsXG4gICAgICAgICAgICAgICAgKHNjcm9sbGJhckRpbWVuc2lvbiAtIHRyYWNrRGltZW5zaW9uKSAqIHJlbFRyYWNrUG9zXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBvblNjcm9sbChheGlzOkF4aXNUeXBlLCBzY3JvbGxiYXJFbG06SlF1ZXJ5LCB0cmFja0VsbTpKUXVlcnksIGV2ZW50Ok1vdXNlRXZlbnQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGlmKHRoaXMuc2Nyb2xsQ2FjaGVbYXhpc10gIT09ICh0aGlzLnNjcm9sbENhY2hlW2F4aXNdID0gdGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sICdzY3JvbGxQb3MnLCBheGlzKSkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5wb3NpdGlvblRyYWNrKGF4aXMsIHNjcm9sbGJhckVsbSwgdHJhY2tFbG0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBvblNjcm9sbGJhck1vdXNlZG93biA9IChheGlzOiBBeGlzVHlwZSwgc2Nyb2xsYmFyRWxtOiBKUXVlcnksIHRyYWNrRWxtOiBKUXVlcnksIGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB7XG5cbiAgICAgICAgICAgIGlmKGV2ZW50LnRhcmdldCA9PT0gc2Nyb2xsYmFyRWxtWzBdKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9DbGlja2VkUG9zaXRpb24oYXhpcywgZXZlbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMudHJhY2tNb3VzZWRvd24oYXhpcywgc2Nyb2xsYmFyRWxtLCBldmVudCk7IC8vQWxzbyBzdGFydCBkcmFnZ2luZyB0aGUgdHJhY2sgdG8gZG8gYSBjb3JyZWN0aW9uIGRyYWcgYWZ0ZXIgY2xpY2tpbmcgdGhlIHNjcm9sbGJhclxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZihldmVudC50YXJnZXQgPT09IHRyYWNrRWxtWzBdKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMudHJhY2tNb3VzZWRvd24oYXhpcywgc2Nyb2xsYmFyRWxtLCBldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcHJpdmF0ZSB0cmFja01vdXNlZG93bihheGlzOiBBeGlzVHlwZSwgc2Nyb2xsYmFyRWxtOiBKUXVlcnksIGV2ZW50OiBNb3VzZUV2ZW50KVxuICAgICAgICB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgICBsZXQgb3JpZ2luID0ge1xuICAgICAgICAgICAgICAgICAgICBzdGFydFBvczogZXZlbnRbYXhpcyA9PT0gJ3knID8gJ3BhZ2VZJyA6ICdwYWdlWCddLFxuICAgICAgICAgICAgICAgICAgICBzdGFydFNjcm9sbDogdGhpcy5jb250ZW50RWxtW2F4aXMgPT09ICd5JyA/ICdzY3JvbGxUb3AnIDogJ3Njcm9sbExlZnQnXSgpLFxuICAgICAgICAgICAgICAgICAgICBzY3JvbGxGYWN0b3I6IHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2Nyb2xsU2l6ZScsIGF4aXMpIC8gdGhpcy5nZXRWYWx1ZShzY3JvbGxiYXJFbG0sICdzaXplJywgYXhpcykgLy9Ib3cgYmlnIGlmIHRoZSBzY3JvbGxiYXIgZWxlbWVudCBjb21wYXJlZCB0byB0aGUgY29udGVudCBzY3JvbGxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICR3aW5kb3cgPSBqUXVlcnkod2luZG93KSxcbiAgICAgICAgICAgICAgICBtb3ZlSGFuZGxlciA9IHRoaXMub25UcmFja0RyYWcuYmluZCh0aGlzLCBheGlzLCBvcmlnaW4pO1xuXG4gICAgICAgICAgICAkd2luZG93XG4gICAgICAgICAgICAgICAgLm9uKCdtb3VzZW1vdmUuJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSwgbW92ZUhhbmRsZXIpXG4gICAgICAgICAgICAgICAgLm9uZSgnbW91c2V1cC4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlLCAoKSA9PiB7JHdpbmRvdy5vZmYoJ21vdXNlbW92ZScsIG1vdmVIYW5kbGVyKX0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBvblRyYWNrRHJhZyhheGlzOkF4aXNUeXBlLCBvcmlnaW4sIGV2ZW50Ok1vdXNlRXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIHRoaXMuY29udGVudEVsbVtheGlzID09PSd5JyA/ICdzY3JvbGxUb3AnIDogJ3Njcm9sbExlZnQnXShcbiAgICAgICAgICAgICAgICBvcmlnaW4uc3RhcnRTY3JvbGwgKyAoZXZlbnRbYXhpcyA9PT0gJ3knID8gJ3BhZ2VZJyA6ICdwYWdlWCddIC0gb3JpZ2luLnN0YXJ0UG9zKSAqIG9yaWdpbi5zY3JvbGxGYWN0b3JcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIHNjcm9sbFRvQ2xpY2tlZFBvc2l0aW9uKGF4aXM6QXhpc1R5cGUsIGV2ZW50Ok1vdXNlRXZlbnQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgXG4gICAgICAgICAgICBsZXQgb2Zmc2V0ID0gZXZlbnRbKGF4aXMgPT09ICd5JykgPyAnb2Zmc2V0WSc6ICdvZmZzZXRYJ107XG4gICAgXG4gICAgICAgICAgICBpZihvZmZzZXQgPD0gMTApIG9mZnNldCA9IDA7IC8vTGl0dGxlIHR3ZWFrIHRvIG1ha2UgaXQgZWFzaWVyIHRvIGdvIGJhY2sgdG8gdG9wXG4gICAgXG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG1bYXhpcyA9PT0gJ3knID8gJ3Njcm9sbFRvcCcgOiAnc2Nyb2xsTGVmdCddKFxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2Nyb2xsU2l6ZScsIGF4aXMpICogKG9mZnNldCAvIHRoaXMuZ2V0VmFsdWUoalF1ZXJ5KGV2ZW50LnRhcmdldCksICdzaXplJywgYXhpcykpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIGRlc3Ryb3koKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG0ub2ZmKCcuJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSk7XG4gICAgICAgICAgICBqUXVlcnkod2luZG93KS5vZmYoJy4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlKTtcblxuICAgICAgICAgICAgZm9yKGxldCBheGlzIGluIHRoaXMuc2Nyb2xsYmFyRWxtcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZih0aGlzLnNjcm9sbGJhckVsbXMuaGFzT3duUHJvcGVydHkoYXhpcykgPT09IHRydWUgJiYgdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdLnNjcm9sbGJhciBpbnN0YW5jZW9mIGpRdWVyeSA9PT0gdHJ1ZSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXS5zY3JvbGxiYXIucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG0uY3NzKHRoaXMub3JpZ2luYWxDc3NWYWx1ZXMpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGluZ3MvaW5kZXguZC50c1wiIC8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiU2Nyb2xsZXJ0UGx1Z2luLnRzXCIgLz5cblxualF1ZXJ5LmZuW1Njcm9sbGVydC5QbHVnaW4uTkFNRV0gPSBmdW5jdGlvbiguLi5hcmdzKSB7XG5cbiAgICBsZXQgYWN0aW9uOnN0cmluZyA9IHR5cGVvZiBhcmdzWzBdID09PSBcInN0cmluZ1wiICA/IGFyZ3NbMF0gOiBcImluaXRcIixcbiAgICAgICAgb3B0aW9uczpTY3JvbGxlcnQuUGx1Z2luT3B0aW9ucyA9ICh0eXBlb2YgYXJnc1sxXSA9PT0gXCJvYmplY3RcIilcbiAgICAgICAgICAgID8gYXJnc1sxXVxuICAgICAgICAgICAgOiAodHlwZW9mIGFyZ3NbMF0gPT09IFwib2JqZWN0XCIpID8gYXJnc1swXSA6IHt9O1xuXG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcblxuICAgICAgICBsZXQgZWxtID0galF1ZXJ5KHRoaXMpLFxuICAgICAgICAgICAga2V5ID0gXCJwbHVnaW4tXCIgKyBTY3JvbGxlcnQuUGx1Z2luLk5BTUUsXG4gICAgICAgICAgICBwbHVnaW46U2Nyb2xsZXJ0LlBsdWdpbiA9IGVsbS5kYXRhKGtleSk7XG5cbiAgICAgICAgaWYoYWN0aW9uID09PSBcImluaXRcIiAmJiBwbHVnaW4gaW5zdGFuY2VvZiBTY3JvbGxlcnQuUGx1Z2luID09PSBmYWxzZSlcbiAgICAgICAge1xuICAgICAgICAgICAgZWxtLmRhdGEoa2V5LCBwbHVnaW4gPSBuZXcgU2Nyb2xsZXJ0LlBsdWdpbihqUXVlcnkodGhpcyksIG9wdGlvbnMpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKHBsdWdpbiBpbnN0YW5jZW9mIFNjcm9sbGVydC5QbHVnaW4gPT09IGZhbHNlKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiVGhlIFNjcm9sbGVydCBwbHVnaW4gaXMgbm90IHlldCBpbml0aWFsaXplZFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaChhY3Rpb24pXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNhc2UgXCJpbml0XCI6IC8vRG9sY2UgZmFyIG5pZW50ZVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGNhc2UgXCJ1cGRhdGVcIjpcbiAgICAgICAgICAgICAgICBwbHVnaW4udXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiZGVzdHJveVwiOlxuICAgICAgICAgICAgICAgIHBsdWdpbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgZWxtLnJlbW92ZURhdGEoa2V5KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgU2Nyb2xsZXJ0IGFjdGlvbiBcIiArIGFjdGlvbik7XG4gICAgICAgIH1cbiAgICB9KTtcblxufTsiXX0=
