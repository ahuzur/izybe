(() => {
    "use strict";
    const $ = s => document.querySelector(s);
    const $$ = s => [...document.querySelectorAll(s)];
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = matchMedia("(pointer: fine)").matches;
    const behavior = () => (reduced ? "auto" : "smooth");

    $("#year").textContent = new Date().getFullYear();

    /* ---------- Header state + scroll progress ---------- */
    const header = $("#header");
    const progress = $("#progress");
    const fab = $("#to-top");
    let ticking = false;
    function onScroll() {
        const y = scrollY;
        header.classList.toggle("scrolled", y > 30);
        const max = document.documentElement.scrollHeight - innerHeight;
        progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
        if (fab) {
            fab.classList.toggle("show", y > 600);
            fab.style.setProperty("--fab", String(1 - (max > 0 ? y / max : 0)));
        }
        ticking = false;
    }
    addEventListener("scroll", () => {
        if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
    onScroll();

    /* ---------- Mobile menu ---------- */
    const menuBtn = $("#menu-btn");
    const menu = $("#mobile-menu");
    const main = $("main"), footer = $("footer");
    function setMenu(open, focusBack = false) {
        menuBtn.setAttribute("aria-expanded", String(open));
        menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        menuBtn.querySelector("use").setAttribute("href", open ? "#i-x" : "#i-menu");
        menu.hidden = !open;
        document.body.classList.toggle("menu-open", open);
        main.inert = open;
        footer.inert = open;
        if (open) menu.querySelector("a").focus();
        else if (focusBack) menuBtn.focus();
    }
    menuBtn.addEventListener("click", () => setMenu(menuBtn.getAttribute("aria-expanded") !== "true"));
    menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && !menu.hidden) setMenu(false, true);
    });
    matchMedia("(min-width: 1025px)").addEventListener("change", e => { if (e.matches) setMenu(false); });

    /* ---------- Active nav link ---------- */
    const navLinks = $$(".nav a");
    if ("IntersectionObserver" in window) {
        const map = new Map(navLinks.map(a => [a.getAttribute("href").slice(1), a]));
        const spy = new IntersectionObserver(entries => {
            entries.forEach(en => {
                if (!en.isIntersecting) return;
                navLinks.forEach(a => a.classList.remove("active"));
                const link = map.get(en.target.id);
                if (link) link.classList.add("active");
            });
        }, { rootMargin: "-45% 0px -50% 0px" });
        map.forEach((_, id) => { const el = document.getElementById(id); if (el) spy.observe(el); });
    }

    /* ---------- Hero word rotator ---------- */
    const words = $$(".rotator span");
    if (words.length && !reduced) {
        let w = 0;
        setInterval(() => {
            const cur = words[w];
            cur.classList.remove("on"); cur.classList.add("out");
            w = (w + 1) % words.length;
            const next = words[w];
            next.classList.remove("out"); next.classList.add("on");
            setTimeout(() => cur.classList.remove("out"), 650);
        }, 2400);
    }

    /* ---------- Hero: live activity feed (transform/opacity only) ---------- */
    const feed = $("#hx-feed-list");
    if (feed) {
        const events = [
            { ico: "i-list", tone: "t-lime", title: "Opening checklist completed", meta: "Kitchen · 10/10 items", score: true },
            { ico: "i-alert", tone: "t-coral", title: "Broken item logged", meta: "2 wine glasses · Bar" },
            { ico: "i-leaf", tone: "t-mint", title: "Allergen record updated", meta: "Mushroom risotto · Gluten-free" },
            { ico: "i-clock", tone: "t-ink", title: "Maria clocked in", meta: "Front of house · 08:02" },
            { ico: "i-cal", tone: "t-violet", title: "Shift plan published", meta: "Next week · 18 staff" },
            { ico: "i-cart", tone: "t-amber", title: "Market order approved", meta: "Main Stock → Bar" },
            { ico: "i-check", tone: "t-lime", title: "Fridge temperature logged", meta: "Cold room · 3.2 °C", score: true },
            { ico: "i-msg", tone: "t-ink", title: "New team poll", meta: "Staff meal · 12 votes" }
        ];
        const ages = ["now", "2m", "6m", "11m", "15m"];
        const scoreEl = $("#hx-score-val"), barEl = $("#hx-bar-fill");
        let score = 86, n = 4, feedTimer = null, inView = true;

        const itemHTML = e =>
            `<span class="hx-ico ${e.tone}"><svg class="icon" aria-hidden="true"><use href="#${e.ico}"/></svg></span>` +
            `<span class="hx-txt"><b>${e.title}</b><small>${e.meta}</small></span><time></time>`;

        const pings = $("#hx-pings");
        const spots = [
            { y: "22%", x: "40%" }, { y: "40%", x: "46%" },
            { y: "30%", x: "30%" }, { y: "14%", x: "26%" }
        ];
        let spot = 0;
        function spawnPing(text) {
            if (!pings) return;
            const s = spots[spot++ % spots.length];
            const el = document.createElement("span");
            el.className = "hx-ping";
            el.textContent = text;
            el.style.setProperty("--y", s.y);
            el.style.setProperty("--x", s.x);
            el.addEventListener("animationend", ev => { if (ev.animationName === "hxPingLife") el.remove(); });
            pings.appendChild(el);
            while (pings.children.length > 2) pings.firstElementChild.remove();
        }

        function stamp() {
            [...feed.children].forEach((li, i) => { li.querySelector("time").textContent = ages[i] || ""; });
        }
        stamp();

        function tick() {
            const e = events[n++ % events.length];
            const li = document.createElement("li");
            li.className = "is-new";
            li.innerHTML = itemHTML(e);
            feed.prepend(li);
            const step = li.offsetHeight + (parseFloat(getComputedStyle(feed).rowGap) || 10);
            feed.style.transition = "none";
            feed.style.transform = `translate3d(0, ${-step}px, 0)`;
            void feed.offsetHeight;
            feed.style.transition = "";
            feed.style.transform = "";
            spawnPing(e.title);
            stamp();
            setTimeout(() => {
                li.classList.remove("is-new");
                while (feed.children.length > 5) feed.lastElementChild.remove();
            }, 700);
            if (e.score && scoreEl && barEl) {
                score = score >= 97 ? 82 : score + 3;
                scoreEl.textContent = `${score}%`;
                barEl.style.transform = `scaleX(${score / 100})`;
            }
        }
        function startFeed() {
            if (reduced || feedTimer || !inView || document.hidden) return;
            feedTimer = setInterval(tick, 2800);
        }
        function stopFeed() { clearInterval(feedTimer); feedTimer = null; }

        if ("IntersectionObserver" in window) {
            new IntersectionObserver(([en]) => {
                inView = en.isIntersecting;
                inView ? startFeed() : stopFeed();
            }).observe(feed);
        } else {
            startFeed();
        }
        document.addEventListener("visibilitychange", () => { document.hidden ? stopFeed() : startFeed(); });
    }

    /* ---------- Module spotlight ---------- */
    if (finePointer) {
        $$(".mod").forEach(card => {
            card.addEventListener("pointermove", e => {
                const r = card.getBoundingClientRect();
                card.style.setProperty("--x", `${e.clientX - r.left}px`);
                card.style.setProperty("--y", `${e.clientY - r.top}px`);
            });
        });
    }

    /* ---------- Screenshot explorer ---------- */
    const screens = [
        {
            key: "lists", label: "LISTS", title: "Today's priorities at a glance.", description: "Review active lists, pending items and completion status.", alt: "izybe.app active lists screen with categories and completion statistics",
            points: ["Search and filter by category, date and frequency", "Low, medium and high priorities", "Completed lists retained in history"]
        },
        {
            key: "checklist", label: "CHECKLIST", title: "Every step accounted for.", description: "Track checklist items, measurements and stock-linked quantities.", alt: "izybe.app checklist detail with numbered items and measurement controls",
            points: ["Temperature, weight, quantity and volume fields", "Stock-linked tracked items", "Finish and archive in one flow"]
        },
        {
            key: "stock", label: "STOCK", title: "Every item in its place.", description: "See location-based stock and product status in a dedicated inventory view.", alt: "izybe.app stock screen with statistics and color-coded locations",
            points: ["Location-based inventory", "Purchases, transfers and reservations", "Low-stock alerts"]
        },
        {
            key: "work", label: "STAFF", title: "The working day starts here.", description: "A focused interface for staff clock-in and working-time management.", alt: "izybe.app staff start-work dialog with identification and time controls",
            points: ["Personal PIN sign-in", "Start work, breaks and clock-out", "Clock reports with net working time"]
        },
        {
            key: "messages", label: "MESSAGES", title: "Team communication, built in.", description: "Follow real-time conversations without leaving the application.", alt: "izybe.app messaging screen with a conversation and message composer",
            points: ["Direct conversations and broadcasts", "Team polls with live results", "Unread counts and typing indicators"]
        },
        {
            key: "damage", label: "DAMAGE", title: "Make losses visible.", description: "Review tracked products and access their damage records.", alt: "izybe.app damage reports screen showing tracked products",
            points: ["Track damage by product and type", "Time-based statistics", "Export as Excel, PDF or TXT"]
        }
    ];
    const tabs = $$(".tab");
    const img = $("#screen-image"), fallback = $("#screen-fallback");
    const textBox = $("#screen-text"), showWrap = $("#show-wrap"), panel = $("#screen-panel");
    const check = '<svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>';
    let current = 0, timer = null, autoplay = !reduced;

    img.addEventListener("error", () => { img.hidden = true; fallback.hidden = false; });
    img.addEventListener("load", () => { img.hidden = false; fallback.hidden = true; img.classList.remove("swapping"); });

    // Preload screenshots for instant switching
    if ("requestIdleCallback" in window) {
        requestIdleCallback(() => screens.forEach(s => { const p = new Image(); p.src = `images/optimized/${s.key}-720.webp`; }));
    }

    function restart() {
        clearTimeout(timer);
        if (autoplay) timer = setTimeout(() => show(current + 1), 6500);
    }
    function show(i, focus = false) {
        current = (i + screens.length) % screens.length;
        const s = screens[current];
        tabs.forEach((t, n) => {
            const on = n === current;
            t.setAttribute("aria-selected", String(on));
            t.tabIndex = on ? 0 : -1;
            const bar = t.querySelector(".bar");
            bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = "";
        });
        if (focus) tabs[current].focus();
        panel.setAttribute("aria-labelledby", tabs[current].id);
        textBox.classList.add("swapping");
        img.classList.add("swapping");
        setTimeout(() => {
            $("#screen-number").textContent = String(current + 1).padStart(2, "0");
            $("#screen-title").textContent = s.title;
            $("#screen-description").textContent = s.description;
            $("#screen-points").innerHTML = s.points.map(p => `<li>${check}${p}</li>`).join("");
            $("#device-label").textContent = `IZYBE.APP / ${s.label}`;
            img.alt = s.alt;
            img.srcset = `images/optimized/${s.key}-360.webp 360w, images/optimized/${s.key}-720.webp 720w`;
            img.src = `images/optimized/${s.key}-720.webp`;
            textBox.classList.remove("swapping");
            if (img.complete && img.naturalWidth) img.classList.remove("swapping");
        }, 220);
        restart();
    }
    function stopAuto() {
        autoplay = false; clearTimeout(timer);
        showWrap.classList.add("no-autoplay");
    }
    if (!autoplay) showWrap.classList.add("no-autoplay");

    tabs.forEach((t, n) => t.addEventListener("click", () => { stopAuto(); show(n); }));
    $("#tabs").addEventListener("keydown", e => {
        const k = e.key;
        if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(k)) return;
        e.preventDefault(); stopAuto();
        if (k === "Home") show(0, true);
        else if (k === "End") show(screens.length - 1, true);
        else show(current + (k === "ArrowRight" || k === "ArrowDown" ? 1 : -1), true);
    });
    $("#prev-screen").addEventListener("click", () => { stopAuto(); show(current - 1); });
    $("#next-screen").addEventListener("click", () => { stopAuto(); show(current + 1); });
    showWrap.addEventListener("pointerenter", () => { if (autoplay) { clearTimeout(timer); showWrap.classList.add("paused"); } });
    showWrap.addEventListener("pointerleave", () => { if (autoplay) { showWrap.classList.remove("paused"); restart(); } });

    if ("IntersectionObserver" in window) {
        new IntersectionObserver(([en]) => {
            if (!autoplay) return;
            if (en.isIntersecting) restart(); else clearTimeout(timer);
        }, { threshold: .3 }).observe(showWrap);
    }

    /* ---------- Guide: search, index, expand ---------- */
    const search = $("#guide-search");
    const items = $$(".wiki-item");
    const indexLinks = $$("#g-index a");
    const norm = v => v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const idx = items.map(el => ({ el, text: norm(el.textContent) }));

    function filterGuide() {
        const q = norm(search.value.trim()).split(/\s+/).filter(Boolean);
        let n = 0;
        idx.forEach(({ el, text }, i) => {
            const ok = q.every(w => text.includes(w));
            el.hidden = !ok;
            if (indexLinks[i]) indexLinks[i].parentElement.hidden = !ok;
            if (ok) { n++; if (q.length) el.open = true; }
        });
        $("#search-count").textContent = `${n} / ${items.length}`;
        $("#no-results").hidden = n !== 0;
    }
    $("#guide-search-control").hidden = false;
    search.addEventListener("input", filterGuide);
    $("#expand-all").addEventListener("click", () => items.forEach(d => { if (!d.hidden) d.open = true; }));
    $("#collapse-all").addEventListener("click", () => items.forEach(d => (d.open = false)));

    if ("IntersectionObserver" in window) {
        const guideSpy = new IntersectionObserver(entries => {
            entries.forEach(en => {
                if (!en.isIntersecting) return;
                indexLinks.forEach(a => a.classList.toggle("current", a.getAttribute("href") === `#${en.target.id}`));
            });
        }, { rootMargin: "-30% 0px -60% 0px" });
        items.forEach(i => guideSpy.observe(i));
    }

    function revealGuide(target, instant = false) {
        if (search.value) { search.value = ""; filterGuide(); }
        target.open = true;
        target.scrollIntoView({ behavior: instant ? "auto" : behavior(), block: "start" });
        target.querySelector("summary").focus({ preventScroll: true });
    }
    document.addEventListener("click", e => {
        const link = e.target.closest('a[href^="#guide-"]');
        if (!link || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        const target = document.getElementById(link.getAttribute("href").slice(1));
        if (!target || !target.matches("details.wiki-item")) return;
        e.preventDefault();
        try { history.pushState(null, "", link.getAttribute("href")); } catch (err) { /* ignore */ }
        revealGuide(target);
    });
    function handleHash(instant) {
        const t = location.hash && document.getElementById(location.hash.slice(1));
        if (t && t.matches("details.wiki-item")) revealGuide(t, instant);
    }
    addEventListener("hashchange", () => handleHash(false));

    /* ---------- FAQ filter ---------- */
    const chips = $$(".chip"), faqs = $$(".faq-q");
    $("#faq-chips").hidden = false;
    chips.forEach(c => c.addEventListener("click", () => {
        const f = c.dataset.filter;
        chips.forEach(x => x.setAttribute("aria-pressed", String(x === c)));
        faqs.forEach(q => { q.hidden = f !== "all" && q.dataset.cat !== f; });
    }));

    /* ---------- Copy email ---------- */
    const copyBtn = $("#copy-email");
    if (navigator.clipboard && window.isSecureContext) {
        copyBtn.hidden = false;
        copyBtn.addEventListener("click", async () => {
            const label = copyBtn.querySelector("span");
            try {
                await navigator.clipboard.writeText("info@izybe.app");
                label.textContent = "Copied!";
                setTimeout(() => (label.textContent = "Copy email"), 1800);
            } catch (err) { /* ignore */ }
        });
    }

    /* ---------- Scroll reveal v2: directional, staggered, self-cleaning ---------- */
    if ("IntersectionObserver" in window && !reduced) try {
        document.documentElement.classList.add("motion-ready");

        const ZOOM = ".show-wrap, .wf, .ai-box, .contact-box, .closing .container, .timeline";
        const LEFT = ".guide-side, .faq-side, .journey-top";

        $$(".reveal").forEach(el => {
            if (el.dataset.reveal) return;
            if (el.classList.contains("head")) { el.dataset.reveal = "split"; return; }
            if (el.matches(ZOOM)) { el.dataset.reveal = "zoom"; return; }
            if (el.matches(LEFT)) { el.dataset.reveal = "left"; return; }

            const parent = el.parentElement;
            const sibs = [...parent.children].filter(c => c.classList.contains("reveal"));
            if (sibs.length < 2) { el.dataset.reveal = "up"; return; }

            // Grid item: direction from its column, stagger from its order in the row
            const pr = parent.getBoundingClientRect();
            const r = el.getBoundingClientRect();
            const off = (r.left + r.width / 2 - (pr.left + pr.width / 2)) / pr.width;
            el.dataset.reveal = off < -.12 ? "left" : off > .12 ? "right" : "up";
            const row = sibs.filter(s => Math.abs(s.getBoundingClientRect().top - r.top) < 8);
            el.style.setProperty("--d", `${row.indexOf(el) * .09}s`);
        });

        const cleanup = el => {
            const d = parseFloat(getComputedStyle(el).getPropertyValue("--d")) || 0;
            setTimeout(() => {
                el.classList.remove("reveal", "in");
                el.removeAttribute("data-reveal");
            }, 1300 + d * 1000 + (el.dataset.reveal === "split" ? 200 : 0));
        };

        const ro = new IntersectionObserver(entries => {
            entries.forEach(en => {
                if (!en.isIntersecting) return;
                en.target.classList.add("in");
                cleanup(en.target);
                ro.unobserve(en.target);
            });
        }, { threshold: .12, rootMargin: "0px 0px -60px 0px" });
        $$(".reveal").forEach(el => ro.observe(el));
    } catch (err) {
        // Safety net: never leave content hidden if anything above fails
        document.documentElement.classList.remove("motion-ready");
    }

    /* ---------- Launch toast (non-blocking, once per session) ---------- */
    const toast = $("#toast");
    function hideToast() {
        toast.classList.remove("show");
        document.body.classList.remove("toast-open");
        toast.setAttribute("aria-hidden", "true");
        try { sessionStorage.setItem("izybe-toast", "1"); } catch (err) { /* ignore */ }
    }
    let seen = false;
    try { seen = sessionStorage.getItem("izybe-toast") === "1"; } catch (err) { /* ignore */ }
    if (!seen) {
        setTimeout(() => {
            toast.classList.add("show");
            document.body.classList.add("toast-open");
            toast.setAttribute("aria-hidden", "false");
        }, 2600);
    }
    $("#toast-close").addEventListener("click", hideToast);
    $("#toast-later").addEventListener("click", hideToast);
    $("#toast-updates").addEventListener("click", hideToast);
    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && toast.classList.contains("show")) hideToast();
    });

    /* ---------- Daily workflow player (rAF + transforms only) ---------- */
    const wf = document.querySelector(".wf");
    if (wf) {
        const tabs = [...wf.querySelectorAll(".wf-step")];
        const scenes = [...wf.querySelectorAll(".wf-scene")];
        const segs = [...wf.querySelectorAll(".wf-seg i")];
        const progs = tabs.map(tab => tab.querySelector(".wf-prog i"));
        const clock = wf.querySelector(".wf-clock");
        const phase = wf.querySelector(".wf-phase");
        const stateTxt = wf.querySelector(".wf-state span");
        const D = 7000;
        const ranges = [[360, 600], [600, 1200], [1200, 1380]];
        const names = ["Plan", "Operate", "Review"];
        const offTimers = [];
        let t = 0, cur = -1, last = 0, raf = 0, visible = false, paused = false, started = false, lastClock = "";

        function setStep(i) {
            if (i === cur) return;
            cur = i;
            tabs.forEach((tab, k) => {
                const on = k === i;
                tab.classList.toggle("is-active", on);
                if (on) tab.setAttribute("aria-current", "step"); else tab.removeAttribute("aria-current");
            });
            phase.textContent = names[i];
            scenes.forEach((s, k) => {
                if (k === i) {
                    clearTimeout(offTimers[k]);
                    s.classList.remove("is-play");
                    void s.offsetWidth;
                    s.classList.add("is-on", "is-play");
                } else if (s.classList.contains("is-on")) {
                    s.classList.remove("is-on");
                    offTimers[k] = setTimeout(() => s.classList.remove("is-play"), 650);
                }
            });
        }

        function render() {
            const i = Math.min(2, Math.floor(t / D));
            const f = Math.min(1, (t - i * D) / D);
            setStep(i);
            const sx = k => `scaleX(${k < i ? 1 : k === i ? f.toFixed(4) : 0})`;
            segs.forEach((s, k) => { s.style.transform = sx(k); });
            progs.forEach((p, k) => { p.style.transform = sx(k); });
            const [a, b] = ranges[i];
            const m = Math.round((a + (b - a) * f) / 5) * 5;
            const txt = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
            if (txt !== lastClock) { clock.textContent = txt; lastClock = txt; }
        }

        function frame(now) {
            if (!last) last = now;
            t += Math.min(64, now - last);
            last = now;
            if (t >= 3 * D) t = 0;
            render();
            raf = requestAnimationFrame(frame);
        }
        function play() {
            if (reduced || raf || !visible || paused || document.hidden) return;
            last = 0;
            raf = requestAnimationFrame(frame);
        }
        function stop() { cancelAnimationFrame(raf); raf = 0; }
        function setPaused(p) {
            paused = p;
            wf.classList.toggle("is-paused", p);
            if (stateTxt) stateTxt.textContent = p ? "Paused" : "Auto-play";
            p ? stop() : play();
        }
        function goTo(i) {
            t = i * D + (reduced ? D - 1 : 0);
            cur = -1;
            render();
        }

        tabs.forEach((tab, i) => tab.addEventListener("click", () => goTo(i)));
        wf.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") setPaused(true); });
        wf.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") setPaused(false); });
        wf.addEventListener("focusin", () => setPaused(true));
        wf.addEventListener("focusout", e => { if (!wf.contains(e.relatedTarget)) setPaused(false); });

        function start() {
            if (started) return;
            started = true;
            goTo(0);
        }

        if (reduced) {
            start();
        } else if ("IntersectionObserver" in window) {
            new IntersectionObserver(([en]) => {
                visible = en.isIntersecting;
                if (visible) { start(); play(); } else stop();
            }, { threshold: .35 }).observe(wf);
        } else {
            visible = true;
            start();
            play();
        }
        document.addEventListener("visibilitychange", () => { document.hidden ? stop() : play(); });
    }

    /* ---------- Back to top ---------- */
    if (fab) {
        fab.addEventListener("click", e => {
            e.preventDefault();
            scrollTo({ top: 0, behavior: behavior() });
            try { history.replaceState(null, "", location.pathname + location.search); } catch (err) { /* ignore */ }
            const brand = $(".header .brand");
            if (brand) brand.focus({ preventScroll: true });
        });
    }

    if (location.hash) handleHash(true);
})();
