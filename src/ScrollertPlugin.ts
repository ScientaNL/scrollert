/// <reference path="../typings/index.d.ts" />
/// <reference path="ScrollbarDimensions.ts" />

module Scrollert {

    export type AxisType = "x" | "y";
    type NormalizedScrollProperty = "size" | "scrollSize" | "scrollPos" | "clientSize";
    type DirectionType = "heen" | "weer"; //AKA  forth and back (https://www.youtube.com/watch?v=X7V09Tmsu-0)

    interface ScrollbarContainer
    {
        scrollbar:JQuery;
        track:JQuery;
    }

    export interface PluginOptions
    {
        axes?:AxisType[];
        preventOuterScroll?:boolean;
        cssPrefix?:string;
        eventNamespace?:string;
        contentSelector?:string;
    }

    export class Plugin
    {
        public static NAME:string = 'scrollert';

        private options:PluginOptions = {
            axes: ['x', 'y'],
            preventOuterScroll: false,
            cssPrefix: 'scrollert',
            eventNamespace: 'scrollert',
            contentSelector: null
        };

        private contentElm:JQuery;

        private static eventNamespaceId = 0;

        private scrollbarElms:{ [id: string] : ScrollbarContainer } = {
            x: null,
            y: null
        };

        private scrollCache = {
            x: null,
            y: null
        };

        private originalCssValues:{ [id: string] : string; };

        constructor(private containerElm:JQuery, options?:PluginOptions)
        {
            this.options = jQuery.extend( {}, this.options, options );

            this.options.eventNamespace = this.options.eventNamespace + ++Plugin.eventNamespaceId;
            this.contentElm = this.containerElm.children(this.options.contentSelector || '.' + this.options.cssPrefix +'-content');

            this.offsetContentElmScrollbars();
            this.update();

            // Relay scroll event on scrollbar/track to content and prevent outer scroll.
            this.containerElm.on('wheel.' + this.options.eventNamespace, this.onScrollWheel);

            /*
             * @todo The keydown outer scroll prevention is not working yet.
             */
            if(this.options.preventOuterScroll === true)
            {
                // Prevent outer scroll on key down
                //this.contentElm.on('keydown.' + this.options.eventNamespace, this.onKeyDown);
            }

            //There could be a zoom change. Zoom is almost not indistinguishable from resize events. So on window resize, recalculate contentElm offet
            jQuery(window).on('resize.' + this.options.eventNamespace, this.offsetContentElmScrollbars.bind(this, true));
        }

        public update()
        {
            let repositionTrack = false;

            for(let axis of this.options.axes)
            {
                this.updateAxis(axis);
                if(this.getValue(this.contentElm, "scrollPos", axis) !== 0) repositionTrack = true;
            }

            //If we start on a scroll position
            if(repositionTrack === true)
            {
                this.contentElm.trigger('scroll.' + this.options.eventNamespace);
            }
        }

        private addScrollbar(axis:AxisType, containerElm:JQuery):ScrollbarContainer
        {
            let scrollbarElm, trackElm;

            containerElm.append(
                scrollbarElm = jQuery('<div />').addClass(
                    this.options.cssPrefix + '-scrollbar' + ' '
                    + this.options.cssPrefix + '-scrollbar-' + axis
                ).append(trackElm = jQuery('<div />').addClass(this.options.cssPrefix + '-track'))
            );

            return {
                scrollbar: scrollbarElm,
                track: trackElm
            };
        };

        private onScrollWheel = (event:JQueryMouseEventObject) => {

            let originalEvent:WheelEvent = <WheelEvent>event.originalEvent;

            for(let axis of this.options.axes)
            {
                let delta = originalEvent['delta' + axis.toUpperCase()];

                if(delta && this.scrollbarElms[axis]
                    && (event.target === this.scrollbarElms[axis].scrollbar.get(0)
                        || event.target === this.scrollbarElms[axis].track.get(0)
                    )
                )
                {
                    event.preventDefault();

                    this.contentElm[axis ==='y' ? 'scrollTop' : 'scrollLeft'](
                        this.getValue(this.contentElm, 'scrollPos', axis) + delta
                    );
                }
                else if(this.options.preventOuterScroll === true)
                {
                    if (delta !== 0) this.preventOuterScroll(axis, (delta < 0) ? "heen" : "weer", event);
                }
            }
        };

        private onKeyDown = (event:JQueryKeyEventObject) => {

            if(document.activeElement !== this.contentElm[0])
            {
                return;
            }

            if([37,38,33,36].indexOf(event.which) !== -1 ) // heen
            {
                this.preventOuterScroll(
                    [38,33,36].indexOf(event.which) !== -1 ? "y" : "x",
                    "heen",
                    event
                );
            }
            else if([39,40,32,34,35].indexOf(event.which) !== -1 ) // weer
            {
                this.preventOuterScroll(
                    [40,35,36,34,32].indexOf(event.which) !== -1 ? "y" : "x",
                    "weer",
                    event
                );
            }
        };

        private preventOuterScroll(axis:AxisType, direction:DirectionType, event:BaseJQueryEventObject)
        {
            let scrollPos = this.getValue(this.contentElm, "scrollPos", axis);
            switch(direction)
            {
                case "heen":
                    if(scrollPos <= 0) event.preventDefault();
                    break;
                case "weer":
                    let scrollSize = this.getValue(this.contentElm, "scrollSize", axis),
                        clientSize = this.getValue(this.contentElm, "clientSize", axis);

                    if(scrollSize - scrollPos === clientSize) event.preventDefault();
                    break;
            }
        }

        private offsetContentElmScrollbars = (force:boolean = false) => {

            let scrollbarDimension = ScrollbarDimensions.calculate([
                    { tagName: this.containerElm.prop('tagName'), classes: this.containerElm.prop('class') },
                    { tagName: this.contentElm.prop('tagName'), classes: this.contentElm.prop('class') }
                ]),
                correctForFloatingScrollbar = false;

            if(scrollbarDimension === 0 && this.hasVisibleFloatingScrollbar() === true)
            {
                correctForFloatingScrollbar = true;
                scrollbarDimension = 20;
            }

            let cssValues = {};
            if(this.options.axes.indexOf('y') !== -1)
            {
                cssValues['overflow-y'] = "scroll";
                if(scrollbarDimension) cssValues['right'] = -scrollbarDimension + "px";
                if(correctForFloatingScrollbar) cssValues['padding-right'] = false;
            }

            if(this.options.axes.indexOf('x') !== -1)
            {
                cssValues['overflow-x'] = "scroll";
                if(scrollbarDimension) cssValues['bottom'] = -scrollbarDimension + "px";
                if(correctForFloatingScrollbar) cssValues['padding-bottom'] = false;
            }

            if(!this.originalCssValues) this.originalCssValues = this.contentElm.css(Object.keys(cssValues));

            if(correctForFloatingScrollbar && cssValues['padding-right'] === false)
            {
                cssValues['padding-right'] = (parseInt(this.originalCssValues['padding-right']) + scrollbarDimension) + "px";
            }

            if(correctForFloatingScrollbar && cssValues['padding-bottom'] === false)
            {
                cssValues['padding-bottom'] = (parseInt(this.originalCssValues['padding-bottom']) + scrollbarDimension) + "px";
            }

            this.contentElm.css(cssValues);
        };

        /**
         * Scrollbars by default in OSX don't take up space but are floating. We must correct for this, but how do we
         * know if we must correct? Webkit based browsers have the pseudo css-selector ::-webkit-scrollbar by which the
         * problem is solved. For all other engines another strategy must
         *
         * @returns {boolean}
         */
        private hasVisibleFloatingScrollbar():boolean
        {
            return window.navigator.userAgent.match(/AppleWebKit/i) === null;
        }

        private updateAxis(axis:AxisType)
        {
            let hasScroll = this.hasScroll(axis);
            if(hasScroll === true && this.scrollbarElms[axis] === null)
            {
                this.containerElm.addClass(this.options.cssPrefix + "-axis-" + axis);

                let elms = this.addScrollbar(axis, this.containerElm),
                    scrollbarElm = elms.scrollbar,
                    trackElm = elms.track;

                scrollbarElm.on('mousedown.' + axis + '.' + this.options.eventNamespace, this.onScrollbarMousedown.bind(this, axis, scrollbarElm, trackElm));
                this.contentElm.on('scroll.' + axis + '.' + this.options.eventNamespace, this.onScroll.bind(this, axis, scrollbarElm, trackElm));

                this.scrollbarElms[axis] = elms;
            }
            else if(hasScroll === false && this.scrollbarElms[axis] !== null)
            {
                this.containerElm.removeClass(this.options.cssPrefix + "-axis-" + axis);

                this.scrollbarElms[axis].scrollbar.remove();
                this.scrollbarElms[axis] = null;

                this.contentElm.off('.' + axis + "." + this.options.eventNamespace );
            }

            //Resize track according to current scroll dimensions
            if(this.scrollbarElms[axis] !== null)
            {
                this.resizeTrack(axis, this.scrollbarElms[axis].scrollbar, this.scrollbarElms[axis].track);
            }
        }

        private getValue(elm:JQuery, property:NormalizedScrollProperty, axis:AxisType):number
        {
            switch(property)
            {
                case 'size':
                    return elm[axis === 'y' ? 'outerHeight' : 'outerWidth']();
                case 'clientSize':
                    return elm[0][axis === 'y' ? 'clientHeight' : 'clientWidth'];
                case 'scrollSize':
                    return elm[0][axis === 'y' ? 'scrollHeight' : 'scrollWidth'];
                case 'scrollPos':
                    return elm[axis === 'y' ? 'scrollTop' : 'scrollLeft']();
            }
        }

        private hasScroll(axis:AxisType):boolean
        {
            let contentSize = Math.round(this.getValue(this.contentElm, 'size', axis)),
                contentScrollSize = Math.round(this.getValue(this.contentElm, 'scrollSize', axis));

            return contentSize < contentScrollSize;
        }

        private resizeTrack(axis:AxisType, scrollbarElm:JQuery, trackElm:JQuery)
        {
            let contentSize = this.getValue(this.contentElm, 'size', axis),
                contentScrollSize = this.getValue(this.contentElm, 'scrollSize', axis);
    
            if(contentSize < contentScrollSize)
            {
                scrollbarElm.removeClass('hidden');
    
                let scrollbarDimension = this.getValue(scrollbarElm, 'size', axis);
    
                trackElm.css(axis === 'y' ? 'height' : 'width',
                    scrollbarDimension * (contentSize / contentScrollSize)
                );
            }
            else
            {
                scrollbarElm.addClass('hidden');
            }
        }

        private positionTrack(axis:AxisType, scrollbarElm:JQuery, trackElm:JQuery)
        {
            let relTrackPos = this.getValue(this.contentElm, 'scrollPos', axis)
                    / (this.getValue(this.contentElm, 'scrollSize', axis) - this.getValue(this.contentElm, 'size', axis)),
                trackDimension = this.getValue(trackElm, 'size', axis),
                scrollbarDimension = this.getValue(scrollbarElm, 'size', axis);
    
            trackElm.css(axis === 'y' ? 'top' : 'left',
                (scrollbarDimension - trackDimension) * Math.min(relTrackPos, 1)
            );
        }

        private onScroll(axis:AxisType, scrollbarElm:JQuery, trackElm:JQuery, event:MouseEvent)
        {
            if(this.scrollCache[axis] !== (this.scrollCache[axis] = this.getValue(this.contentElm, 'scrollPos', axis)))
            {
                this.positionTrack(axis, scrollbarElm, trackElm);
            }
        }

        private onScrollbarMousedown = (axis: AxisType, scrollbarElm: JQuery, trackElm: JQuery, event: MouseEvent) => {

            if(event.target === scrollbarElm[0])
            {
                this.scrollToClickedPosition(axis, event);
                this.trackMousedown(axis, scrollbarElm, event); //Also start dragging the track to do a correction drag after clicking the scrollbar
            }
            else if(event.target === trackElm[0])
            {
                this.trackMousedown(axis, scrollbarElm, event);
            }
        };

        private trackMousedown(axis: AxisType, scrollbarElm: JQuery, event: MouseEvent)
        {
            event.preventDefault();

            let origin = {
                    startPos: event[axis === 'y' ? 'pageY' : 'pageX'],
                    startScroll: this.contentElm[axis === 'y' ? 'scrollTop' : 'scrollLeft'](),
                    scrollFactor: this.getValue(this.contentElm, 'scrollSize', axis) / this.getValue(scrollbarElm, 'size', axis) //How big if the scrollbar element compared to the content scroll
                },
                $window = jQuery(window),
                moveHandler = this.onTrackDrag.bind(this, axis, origin);

            this.containerElm.addClass(this.options.cssPrefix + "-trackdrag-" + axis);

            $window
                .on('mousemove.' + this.options.eventNamespace, moveHandler)
                .one('mouseup.' + this.options.eventNamespace, () => {

                    $window.off('mousemove', moveHandler);
                    this.containerElm.removeClass(this.options.cssPrefix + "-trackdrag-" + axis);
                });
        }

        private onTrackDrag(axis:AxisType, origin, event:MouseEvent) {
            event.preventDefault();

            this.contentElm[axis ==='y' ? 'scrollTop' : 'scrollLeft'](
                origin.startScroll + (event[axis === 'y' ? 'pageY' : 'pageX'] - origin.startPos) * origin.scrollFactor
            );
        }

        private scrollToClickedPosition(axis:AxisType, event:MouseEvent)
        {
            event.preventDefault();
    
            let offset = event[(axis === 'y') ? 'offsetY': 'offsetX'];
    
            if(offset <= 10) offset = 0; //Little tweak to make it easier to go back to top
    
            this.contentElm[axis === 'y' ? 'scrollTop' : 'scrollLeft'](
                this.getValue(this.contentElm, 'scrollSize', axis) * (offset / this.getValue(jQuery(event.target), 'size', axis))
            );
        }

        public destroy()
        {
            this.contentElm.off('.' + this.options.eventNamespace);
            jQuery(window).off('.' + this.options.eventNamespace);

            for(let axis in this.scrollbarElms)
            {
                if(this.scrollbarElms[axis] && this.scrollbarElms[axis].scrollbar instanceof jQuery === true)
                {
                    this.scrollbarElms[axis].scrollbar.remove();
                    this.scrollbarElms[axis] = null;
                }
            }

            this.contentElm.css(this.originalCssValues);
        }
    }
}
