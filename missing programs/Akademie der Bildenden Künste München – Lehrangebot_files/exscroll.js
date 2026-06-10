"use strict";
function exScroll(opts = {}) {
    const defaultOptions = {
        wrapperName: "[exscroll]",
        contentName: "[exscroll-content]",
        scrollerName: "[exscroll-scrollbar]",
    };
    const options = Object.assign(Object.assign({}, defaultOptions), opts);
    const containers = document.querySelectorAll(options.wrapperName);
    containers.forEach((container) => {
        const el = container.querySelector(options.contentName);
        const scrollbar = container.querySelector(options.scrollerName);
        el.classList.add("exscroll-wrapper");
        scrollbar.classList.add("exscroll-scrollbar");
        const scrollDragger = document.createElement("span");
        scrollDragger.classList.add("exscroll-dragger");
        const scrollTrack = document.createElement("div");
        scrollTrack.classList.add("exscroll-track");
        scrollTrack.appendChild(scrollDragger);
        scrollbar.appendChild(scrollTrack);
        let isScrolling = false;
        let scrollStart = 0;
        let scrollPercent = 0;
        const elScrollWidth = el.scrollWidth;
        const elVisibleWidth = el.offsetWidth;
        const elVisiblePercentage = (elVisibleWidth / elScrollWidth) * 100;
        scrollDragger.style.cssText = `width:${elVisiblePercentage}%`;
        el.addEventListener("scroll", function (e) {
            if (!isScrolling) {
                scrollPercent =
                    (el.scrollLeft / (el.scrollWidth - el.offsetWidth)) *
                        (100 - elVisiblePercentage);
                scrollDragger.style.cssText += `;left:${scrollPercent}%`;
            }
        });
        container.addEventListener("mousedown", scrollStartHandler);
        scrollDragger.addEventListener("touchstart", scrollStartHandler);
        function scrollStartHandler(event) {
            isScrolling = true;
            scrollStart =
                "touches" in event ? event.touches[0].clientX : event.clientX;
        }
        document.addEventListener("mouseup", scrollUpHandler);
        container.addEventListener("touchend", scrollUpHandler);
        function scrollUpHandler() {
            if (isScrolling) {
                scrollPercent =
                    (el.scrollLeft / (el.scrollWidth - el.offsetWidth)) *
                        (100 - elVisiblePercentage);
                isScrolling = false;
            }
        }
        document.addEventListener("mousemove", scrollMoveHandler);
        container.addEventListener("touchmove", scrollMoveHandler);
        function scrollMoveHandler(event) {
            if (isScrolling) {
                const scrollPos = "touches" in event
                    ? event.touches[0].clientX
                    : event.clientX;
                const scrollOffsetPercent = ((scrollPos - scrollStart) / scrollTrack.offsetWidth) * 100;
                if (scrollPercent + scrollOffsetPercent >= 0 &&
                    scrollPercent + scrollOffsetPercent <=
                        100 - elVisiblePercentage) {
                    scrollDragger.style.cssText += `; left: ${scrollPercent + scrollOffsetPercent}%`;
                    el.scrollLeft =
                        ((scrollPercent + scrollOffsetPercent) / 100) *
                            elScrollWidth;
                }
                else if (scrollPercent + scrollOffsetPercent < 0) {
                    scrollDragger.style.cssText += "; left: 0%";
                    el.scrollLeft = 0;
                }
                else if (scrollPercent + scrollOffsetPercent >
                    100 - elVisiblePercentage) {
                    scrollDragger.style.cssText += `; left: ${100 - elVisiblePercentage}%`;
                    el.scrollLeft = elScrollWidth;
                }
            }
        }
    });
}
