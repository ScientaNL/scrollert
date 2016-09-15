module Scrollert
{
    export interface ScrollbarDimensions
    {
        tagName:string;
        classes:string;
    }

    export class ScrollbarDimensions
    {
        public static calculate(containerTrail:ScrollbarDimensions[]):number
        {
            let rootElm, curElm, prevElm;

            if(containerTrail.length <= 0)
            {
                throw new TypeError("Invalid container trail specified for scrollbar dimensions calculation");
            }

            for(let container of containerTrail)
            {
                curElm = document.createElement(container.tagName);
                curElm.className = container.classes;

                (prevElm) ? prevElm.appendChild(curElm ) : rootElm = curElm;
                prevElm = curElm ;
            }

            rootElm.style.position = "fixed";
            rootElm.style.top = "0";
            rootElm.style.left = "0";
            rootElm.style.visibility = "hidden";
            rootElm.style.width = "200px";
            rootElm.style.height = "200px";

            curElm.style.overflow = "hidden";

            document.body.appendChild(rootElm);
            let withoutScrollbars = curElm.clientWidth;

            curElm.style.overflow = "scroll";
            let withScrollbars = curElm.clientWidth;

            document.body.removeChild(rootElm);

            return withoutScrollbars - withScrollbars;

        }
    }
}