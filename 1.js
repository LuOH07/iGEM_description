document.addEventListener('DOMContentLoaded', () => {
    const tocNav = document.getElementById('tocNav');
    const mainContainer = document.getElementById('mainContainer');
    const sideContainer = document.getElementById('sideContainer');

    if (!tocNav || !mainContainer) return;

    if (sideContainer) {
        sideContainer.style.position = 'fixed';
        sideContainer.style.left = '0';
        sideContainer.style.marginTop = '0';
        sideContainer.style.height = '60vh';

        const updateSidebarPosition = () => {
            const mainRect = mainContainer.getBoundingClientRect();
            const targetTop = window.innerHeight * 0.15;
            if (mainRect.top > targetTop) {
                sideContainer.style.top = `${mainRect.top}px`;
            } else {
                sideContainer.style.top = '15vh';
            }
        };

        window.addEventListener('scroll', updateSidebarPosition, { passive: true });
        window.addEventListener('resize', updateSidebarPosition, { passive: true });
        updateSidebarPosition();
    }

    const headings = mainContainer.querySelectorAll('h1.heading-1, h2.heading-2, h3.heading-3, h1.heading-reference');
    if (headings.length === 0) return;

    tocNav.innerHTML = '';

    let h1Index = 0;
    let h2Index = 0;
    let h3Index = 0;
    let refIndex = 0;

    const activeChainMap = {};
    let currentH1Id = null;
    let currentH2Id = null;

    headings.forEach((heading) => {
        const isH1 = heading.matches('h1.heading-1');
        const isH2 = heading.matches('h2.heading-2');
        const isH3 = heading.matches('h3.heading-3');
        const isRef = heading.matches('h1.heading-reference');

        if (!heading.id) {
            if (isH1) {
                h1Index++;
                heading.id = `heading-1-${h1Index}`;
            } else if (isH2) {
                h2Index++;
                heading.id = `heading-2-${h2Index}`;
            } else if (isH3) {
                h3Index++;
                heading.id = `heading-3-${h3Index}`;
            } else if (isRef) {
                refIndex++;
                heading.id = `heading-reference-${refIndex}`;
            }
        }

        if (isH1 || isRef) {
            currentH1Id = heading.id;
            currentH2Id = null;
            activeChainMap[heading.id] = [heading.id];
        } else if (isH2) {
            currentH2Id = heading.id;
            activeChainMap[heading.id] = currentH1Id ? [currentH1Id, heading.id] : [heading.id];
        } else if (isH3) {
            const chain = [];
            if (currentH1Id) chain.push(currentH1Id);
            if (currentH2Id) chain.push(currentH2Id);
            chain.push(heading.id);
            activeChainMap[heading.id] = chain;
        }

        const tocItem = document.createElement('a');
        if (isH1 || isRef) {
            tocItem.className = 'toc-item toc-item-h1';
        } else if (isH2) {
            tocItem.className = 'toc-item toc-item-h2';
        } else {
            tocItem.className = 'toc-item toc-item-h3';
        }
        tocItem.href = `#${heading.id}`;
        tocItem.setAttribute('data-target', heading.id);
        tocItem.title = heading.textContent.trim();

        if (isH1 || isRef) {
            const circle = document.createElement('span');
            circle.className = 'toc-circle';
            circle.setAttribute('aria-hidden', 'true');

            const text = document.createElement('span');
            text.className = 'toc-text';
            text.textContent = heading.textContent.trim();

            tocItem.appendChild(circle);
            tocItem.appendChild(text);
        } else if (isH2) {
            const text = document.createElement('span');
            text.className = 'toc-text';
            text.textContent = heading.textContent.trim();

            const triangle = document.createElement('span');
            triangle.className = 'toc-triangle';
            triangle.setAttribute('aria-hidden', 'true');

            tocItem.appendChild(text);
            tocItem.appendChild(triangle);
        } else if (isH3) {
            const text = document.createElement('span');
            text.className = 'toc-text';
            text.textContent = heading.textContent.trim();

            tocItem.appendChild(text);
        }

        tocItem.addEventListener('click', (e) => {
            e.preventDefault();
            const targetEl = document.getElementById(heading.id);
            if (targetEl) {
                targetEl.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                if (history.pushState) {
                    history.pushState(null, '', `#${heading.id}`);
                }
                centerTocItemInSidebar(tocItem);
            }
        });

        tocNav.appendChild(tocItem);
    });

    const centerTocItemInSidebar = (item) => {
        if (!sideContainer || !item) return;
        const containerRect = sideContainer.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();
        const itemCenterOffset = (itemRect.top - containerRect.top) + (itemRect.height / 2);
        const containerCenter = containerRect.height / 2;
        const targetScrollTop = sideContainer.scrollTop + (itemCenterOffset - containerCenter);

        sideContainer.scrollTo({
            top: Math.max(0, targetScrollTop),
            behavior: 'smooth'
        });
    };

    let lastActiveId = null;

    const updateActiveToc = () => {
        const triggerPoint = window.innerHeight * 0.25;
        let currentHeading = null;

        const isBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;
        if (isBottom) {
            currentHeading = headings[headings.length - 1];
        } else {
            for (let i = 0; i < headings.length; i++) {
                const rect = headings[i].getBoundingClientRect();
                if (rect.top <= triggerPoint) {
                    currentHeading = headings[i];
                } else {
                    break;
                }
            }
        }

        if (!currentHeading && headings.length > 0) {
            const firstRect = headings[0].getBoundingClientRect();
            if (firstRect.top <= window.innerHeight * 0.8) {
                currentHeading = headings[0];
            }
        }

        const activeIds = currentHeading ? (activeChainMap[currentHeading.id] || []) : [];
        const allTocItems = tocNav.querySelectorAll('.toc-item');
        allTocItems.forEach((item) => {
            const targetId = item.getAttribute('data-target');
            if (activeIds.includes(targetId)) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        if (currentHeading && currentHeading.id !== lastActiveId) {
            lastActiveId = currentHeading.id;
            const activeItem = tocNav.querySelector(`.toc-item[data-target="${currentHeading.id}"]`);
            if (activeItem) {
                centerTocItemInSidebar(activeItem);
            }
        } else if (!currentHeading && lastActiveId !== null) {
            lastActiveId = null;
            if (sideContainer) {
                sideContainer.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        }
    };

    window.addEventListener('scroll', updateActiveToc, { passive: true });
    window.addEventListener('resize', updateActiveToc, { passive: true });
    updateActiveToc();

    let sword = document.querySelector('.scroll-sword') || document.getElementById('scrollSword');
    let scabbard = document.querySelector('.scroll-scabbard') || document.getElementById('scrollScabbard');
    let backToTop = document.querySelector('.scroll-back-to-top') || document.getElementById('scrollBackToTop');

    if (!sword) {
        sword = document.createElement('img');
        sword.className = 'scroll-sword';
        sword.id = 'scrollSword';
        sword.src = 'https://static.igem.wiki/teams/6059/wiki/description/sword.avif';
        sword.alt = 'Sword Scroll Track';
        document.body.appendChild(sword);
    }

    if (!scabbard) {
        scabbard = document.createElement('img');
        scabbard.className = 'scroll-scabbard';
        scabbard.id = 'scrollScabbard';
        scabbard.src = 'https://static.igem.wiki/teams/6059/wiki/description/scabbard.avif';
        scabbard.alt = 'Scabbard Scroll Thumb';
        document.body.appendChild(scabbard);
    }

    if (!backToTop) {
        backToTop = document.createElement('div');
        backToTop.className = 'scroll-back-to-top';
        backToTop.id = 'scrollBackToTop';
        backToTop.textContent = 'BACK TO TOP';
        document.body.appendChild(backToTop);
    }

    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    const getScrollBounds = () => {
        const targetTop = window.innerHeight * 0.10;
        const mainRect = mainContainer.getBoundingClientRect();
        const startScroll = mainRect.top + window.scrollY - targetTop;
        const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
        const scrollRange = Math.max(maxScroll - startScroll, 1);
        return { startScroll, maxScroll, scrollRange, targetTop, mainRect };
    };

    const updateSwordScabbardPosition = () => {
        if (!sword || !scabbard || !mainContainer) return;

        const { startScroll, scrollRange, targetTop, mainRect } = getScrollBounds();
        const sword20PercentOffsetPx = window.innerHeight * 0.1;

        if (mainRect.top > targetTop) {
            sword.style.top = `${mainRect.top}px`;
            scabbard.style.top = `${mainRect.top + sword20PercentOffsetPx}px`;
        } else {
            sword.style.top = '10vh';

            let progress = 0;
            if (scrollRange > 0) {
                progress = Math.min(Math.max((window.scrollY - startScroll) / scrollRange, 0), 1);
            }

            const minTop = 20;
            const currentTop = Math.max(minTop, minTop + progress * 25);
            scabbard.style.top = `${currentTop}vh`;
        }

        if (backToTop) {
            const scabbardRect = scabbard.getBoundingClientRect();
            const scabbardCenterY = scabbardRect.top + scabbardRect.height / 2;
            backToTop.style.top = `${scabbardCenterY}px`;
            backToTop.style.transform = 'translateY(-50%)';

            if (scabbardRect.width > 0 && scabbardRect.left > 0) {
                const offsetRight = window.innerWidth - scabbardRect.left - 3;
                backToTop.style.right = `${offsetRight}px`;
            }
        }
    };

    let isDragging = false;
    let startDragY = 0;
    let startScrollY = 0;
    let cachedBounds = null;
    let dragRafId = null;
    let latestClientY = 0;

    scabbard.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        isDragging = true;
        startDragY = e.clientY;
        latestClientY = e.clientY;
        startScrollY = window.scrollY;
        
        cachedBounds = getScrollBounds();
        document.documentElement.style.scrollBehavior = 'auto';
        
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach((f) => { f.style.pointerEvents = 'none'; });

        scabbard.classList.add('dragging');
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging || !cachedBounds) return;
        latestClientY = e.clientY;

        if (!dragRafId) {
            dragRafId = requestAnimationFrame(() => {
                dragRafId = null;
                if (!isDragging || !cachedBounds) return;

                const deltaY = latestClientY - startDragY;
                const travelDistancePx = window.innerHeight * 0.25;
                const scrollDelta = (deltaY / travelDistancePx) * cachedBounds.scrollRange;

                window.scrollTo({
                    top: Math.max(0, Math.min(cachedBounds.maxScroll, startScrollY + scrollDelta)),
                    behavior: 'auto'
                });
            });
        }
    });

    const stopDragging = () => {
        if (isDragging) {
            isDragging = false;
            cachedBounds = null;
            if (dragRafId) {
                cancelAnimationFrame(dragRafId);
                dragRafId = null;
            }

            document.documentElement.style.scrollBehavior = '';
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach((f) => { f.style.pointerEvents = ''; });

            scabbard.classList.remove('dragging');
            document.body.style.userSelect = '';
        }
    };

    window.addEventListener('mouseup', stopDragging);
    window.addEventListener('mouseleave', stopDragging);

    sword.addEventListener('click', (e) => {
        if (e.target === scabbard) return;
        const { startScroll, scrollRange } = getScrollBounds();
        const swordRect = sword.getBoundingClientRect();
        const clickOffset = e.clientY - swordRect.top;
        const minClickOffset = swordRect.height * 0.2;
        const effectiveRange = swordRect.height * 0.5;

        const targetProgress = Math.min(Math.max((clickOffset - minClickOffset) / effectiveRange, 0), 1);

        window.scrollTo({
            top: startScroll + targetProgress * scrollRange,
            behavior: 'smooth'
        });
    });

    scabbard.addEventListener('load', updateSwordScabbardPosition);
    window.addEventListener('scroll', updateSwordScabbardPosition, { passive: true });
    window.addEventListener('resize', updateSwordScabbardPosition, { passive: true });
    updateSwordScabbardPosition();
});