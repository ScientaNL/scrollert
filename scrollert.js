window.scrollert = function(containerElm) {

    var cssPrefix = "scrollert";
    var eventNamespace = "scrollert";
    var scrollbarStrategy = "addRemove";

    var contentElm = containerElm.children('.' + cssPrefix +'-content'),

        eventsAttached = {
            x: {mousedown: false, scroll: false},
            y: {mousedown: false, scroll: false}
        };


    var scrollbarStrategies = {
        hideShow: {
            add: function(axis, containerElm) {
                var scrollbarElm = containerElm.children('.' + cssPrefix + '-scrollbar-' + axis);

                return {
                    scrollbar: scrollbarElm,
                    track: scrollbarElm.children('.' + cssPrefix + '-track')
                };

            },
            remove: function(axis, containerElm) {
                containerElm.children('.' + cssPrefix + '-scrollbar-' + axis).addClass('hidden');
            }
        },
        addRemove: {
            add: function(axis, containerElm) {
                var scrollbarElm, trackElm;

                containerElm.append(
                    scrollbarElm = jQuery('<div />').addClass(cssPrefix + '-scrollbar-' + axis)
                        .append(trackElm = jQuery('<div />').addClass(cssPrefix + '-track'))
                );

                return {
                    scrollbar: scrollbarElm,
                    track: trackElm
                };

            },
            remove: function(axis, containerElm) {
                containerElm.children('.' + cssPrefix + '-scrollbar-' + axis).remove();
            }
        }
    };

    function getValue(elm, property, axis)
    {
        switch(property)
        {
            case 'size':
                return elm[axis === 'y' ? 'height' : 'width']();
            case 'scrollSize':
                return elm[0][axis === 'y' ? 'scrollHeight' : 'scrollWidth'];
            case 'scrollPos':
                return elm[axis === 'y' ? 'scrollTop' : 'scrollLeft']();
                break;
        }
    }

    function hasScroll(axis)
    {
        var contentSize = getValue(contentElm, 'size', axis),
            contentScrollSize = getValue(contentElm, 'scrollSize', axis);

        return contentSize < contentScrollSize;
    }

    function resizeTrack(axis, scrollbarElm, trackElm)
    {
        var contentSize = getValue(contentElm, 'size', axis),
            contentScrollSize = getValue(contentElm, 'scrollSize', axis);

        if(contentSize < contentScrollSize)
        {
            scrollbarElm.removeClass('hidden');

            var scrollbarDimension = getValue(scrollbarElm, 'size', axis);

            trackElm.css(axis === 'y' ? 'height' : 'width',
                scrollbarDimension * (contentSize / contentScrollSize)
            );

            return true;
        }
        else
        {
            scrollbarElm.addClass('hidden');
            return false;
        }
    }

    function positionTrack(axis, scrollbarElm, trackElm) {

        var relTrackPos = getValue(contentElm, 'scrollPos', axis)
                / (getValue(contentElm, 'scrollSize', axis) - getValue(contentElm, 'size', axis)),
            trackDimension = getValue(trackElm, 'size', axis),
            scrollbarDimension = getValue(scrollbarElm, 'size', axis);

        trackElm.css(axis === 'y' ? 'top' : 'left',
            (scrollbarDimension - trackDimension) * relTrackPos
        );
    }

    function onScrollbarMousedown(scrollbarElm, trackElm, axis, event) {

        if(event.target === scrollbarElm[0])
        {
            scrollToClickedPosition(event, axis);
            trackMousedown(scrollbarElm, axis, event); //Also start dragging the track to do a correction drag after clicking the scrollbar
        }
        else if(event.target === trackElm[0])
        {
            trackMousedown(scrollbarElm, axis, event);
        }
    }

    function trackMousedown(scrollbarElm, axis, event) {

        event.preventDefault();

        var origin = {
            startPos: event[axis === 'y' ? 'pageY' : 'pageX'],
            startScroll: contentElm[axis === 'y' ? 'scrollTop' : 'scrollLeft'](),
            scrollFactor: getValue(contentElm, 'scrollSize', axis) / getValue(scrollbarElm, 'size', axis) //How big if the scrollbar element compared to the content scroll
        };

        var $window = jQuery(window),
            moveHandler = function(event) {

                event.preventDefault();

                contentElm[axis ==='y' ? 'scrollTop' : 'scrollLeft'](
                    origin.startScroll + (event[axis === 'y' ? 'pageY' : 'pageX'] - origin.startPos) * origin.scrollFactor
                );
            };

        $window.on('mousemove.' + eventNamespace, moveHandler)
            .one('mouseup.' + eventNamespace, function() {$window.off('mousemove', moveHandler)});
    }

    function scrollToClickedPosition(event, axis)
    {
        event.preventDefault();

        var offset = event[(axis === 'y') ? 'offsetY': 'offsetX'];

        if(offset <= 10) offset = 0; //Little tweak to make it easier to go back to top

        contentElm[axis === 'y' ? 'scrollTop' : 'scrollLeft'](
            getValue(contentElm, 'scrollSize', axis) * (offset / getValue(jQuery(event.target), 'size', axis))
        );
    }

    function initAxis(axis)
    {
        if(hasScroll(axis) === true)
        {
            var elms = scrollbarStrategies[scrollbarStrategy].add(axis, containerElm);
            var scrollbarElm = elms.scrollbar,
                trackElm = elms.track;

            resizeTrack(axis, scrollbarElm, trackElm);

            if(eventsAttached[axis].mousedown !== true)
            {
                scrollbarElm.on('mousedown.' + eventNamespace, onScrollbarMousedown.bind(null, scrollbarElm, trackElm, axis));
                eventsAttached[axis].mousedown = true;
            }

            if(eventsAttached[axis].scroll !== true)
            {
                var scrollCache = null;
                contentElm.on('scroll.' + eventNamespace, function(event) {

                    if(scrollCache !== (scrollCache = getValue(contentElm, 'scrollPos', axis)))
                    {
                        positionTrack(axis, scrollbarElm, trackElm);
                    }
                });

                eventsAttached[axis].scroll = true;
            }

            if(getValue(contentElm, "scrollPos", axis) !== 0)
            {
                contentElm.trigger('scroll.' + eventNamespace);
            }
        }
        else
        {
            scrollbarStrategies[scrollbarStrategy].remove(axis, containerElm);
        }
    }

    function init()
    {
        var axes = ['y', 'x'],
            repositionTrack = false;

        for(var axis of axes)
        {
            initAxis(axis);

            if(getValue(contentElm, "scrollPos", axis) !== 0)
                repositionTrack = true;
        }

        if(repositionTrack === true)
            contentElm.trigger('scroll.' + eventNamespace);
    }

    init();

};