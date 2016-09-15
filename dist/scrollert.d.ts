/// <reference path="../typings/index.d.ts" />
declare module Scrollert {
    interface ScrollbarDimensions {
        tagName: string;
        classes: string;
    }
    class ScrollbarDimensions {
        static calculate(containerTrail: ScrollbarDimensions[]): number;
    }
}
declare module Scrollert {
    type AxisType = "x" | "y";
    interface PluginOptions {
        axes?: AxisType[];
        preventOuterScroll?: boolean;
        cssPrefix?: string;
        eventNamespace?: string;
        contentSelector?: string;
    }
    class Plugin {
        private containerElm;
        static NAME: string;
        private options;
        private contentElm;
        private static eventNamespaceId;
        private scrollbarElms;
        private scrollCache;
        private originalCssValues;
        constructor(containerElm: JQuery, options?: PluginOptions);
        update(): void;
        private addScrollbar(axis, containerElm);
        private onScrollWheel;
        private onKeyDown;
        private preventOuterScroll(axis, direction, event);
        private offsetContentElmScrollbars;
        private initAxis(axis);
        private getValue(elm, property, axis);
        private hasScroll(axis);
        private resizeTrack(axis, scrollbarElm, trackElm);
        private positionTrack(axis, scrollbarElm, trackElm);
        private onScroll(axis, scrollbarElm, trackElm, event);
        private onScrollbarMousedown;
        private trackMousedown(axis, scrollbarElm, event);
        private onTrackDrag(axis, origin, event);
        private scrollToClickedPosition(axis, event);
        destroy(): void;
    }
}
