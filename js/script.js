const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = window.matchMedia('(max-width: 900px)');
const EASE = 'cubic-bezier(0.25, 1, 0.5, 1)';
const $ = (id) => document.getElementById(id);

function store(key, value) {
    try {
        if (value === undefined) return localStorage.getItem(key);
        localStorage.setItem(key, value);
    } catch (e) { /* storage blocked: ignore */ }
    return null;
}

let lang = store('lang') || (navigator.language.startsWith('fr') ? 'fr' : 'en');
let activeWork = 'passport';
const t = () => CONTENT[lang];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ext = (href, label) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;

// Each section header shows a command the shell understands.
const SECTION_CMDS = { profile: 'whoami', work: 'inspect', career: 'git log', stack: 'cat stack.json', lab: 'ls ./lab', contact: 'mail cyril' };

function stackJson() {
    const lines = STACK.map(([k, tools], i) => {
        const vals = tools.split(', ').map((v) => `<span class="j-str">"${esc(v)}"</span>`).join(', ');
        return `  <span class="j-key">"${k}"</span>: [${vals}]${i < STACK.length - 1 ? ',' : ''}`;
    });
    return `{\n${lines.join('\n')}\n}`;
}

// --- Rendering --------------------------------------------------------------
function renderRail() {
    const ids = Object.keys(t().sections);
    $('nav').innerHTML = ids.map((id, i) => `
        <a href="#${id}" data-section="${id}"><span class="num">0${i + 1}</span><span class="lbl">${esc(t().sections[id])}</span></a>`).join('')
        + '<span class="rail-indicator" id="rail-indicator" aria-hidden="true"></span>';
    document.querySelectorAll('.sec').forEach((sec) => {
        const i = ids.indexOf(sec.id);
        sec.querySelector('.sec-head').innerHTML = `
            <span class="sec-num">0${i + 1}</span>
            <h2 class="sec-title">${esc(t().sections[sec.id])}</h2>
            <button class="sec-cmd" type="button" data-cmd="${SECTION_CMDS[sec.id]}">$ ${SECTION_CMDS[sec.id]}</button>`;
    });
    $('lang-toggle').innerHTML = `<span class="${lang === 'en' ? 'on' : ''}">EN</span>/<span class="${lang === 'fr' ? 'on' : ''}">FR</span>`;
}

function renderProfile() {
    const h = t().hero;
    $('hero-role').textContent = h.role;
    $('hero-pitch').textContent = h.pitch;
    $('hero-meta').innerHTML = h.meta.map((m, i) => `<li${i === 0 ? ' class="is-status"' : ''}>${esc(m)}</li>`).join('');
    $('cta-mail').textContent = h.mail;
    $('cta-mail').href = `mailto:${CONTACT.email}?subject=Hello%20Cyril`;
    $('cta-work').textContent = h.work;
    $('hero-stats').innerHTML = h.stats.map((st) => `
        <div><dt class="stat-n" data-n="${st.n}" data-prefix="${st.prefix || ''}" data-suffix="${st.suffix || ''}">${st.prefix || ''}${st.n}${st.suffix || ''}</dt><dd>${esc(st.label)}</dd></div>`).join('');
    $('stats-source').textContent = `# ${h.statsSource}`;
    $('selected-title').textContent = `// ${h.selectedTitle}`;
    $('selected-list').innerHTML = h.selected.map((s, i) => `
        <li style="--i:${i}"><button type="button" data-target="${s.target}">
            <span class="sel-num">0${i + 1}</span><span class="sel-text">${esc(s.text)}</span><span class="sel-arrow" aria-hidden="true">→</span>
        </button></li>`).join('');
}

function renderWorkList() {
    // On mobile the panel lives inside the list: move it out before re-rendering.
    document.querySelector('.inspector').appendChild($('work-panel'));
    $('work-list').innerHTML = t().work.map((w, i) => `
        <button type="button" role="tab" class="work-tab" id="tab-${w.id}" data-work="${w.id}" aria-selected="${w.id === activeWork}">
            <span class="wt-num">0${i + 1}</span>
            <span class="wt-title">${esc(w.title)}</span>
            <span class="wt-where">${esc(w.where)}</span>
        </button>`).join('');
}

function video(src, poster) {
    return `<video src="${src}" poster="${poster}" muted loop playsinline preload="none"${reducedMotion ? ' controls' : ''}></video>`;
}

function mediaHtml(key) {
    const m = MEDIA[key];
    if (!m) return '';
    if (m.type === 'phones') {
        return `<div class="phones">${m.items.map((it) => `
            <figure class="phone">${video(it.src, it.poster)}<figcaption>${esc(it.label)}</figcaption></figure>`).join('')}</div>`;
    }
    return `
        <figure class="browser">
            <div class="browser-bar"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="browser-url">${esc(m.url)}</span></div>
            ${video(m.src, m.poster)}
        </figure>`;
}

function panelHtml(w) {
    const l = t().labels;
    const fact = (key, text) => (text ? `<div class="f-${key}"><dt>${l[key]}</dt><dd>${esc(text)}</dd></div>` : '');
    const diff = w.diff ? `
        <div class="code">
            <p class="code-cmd">$ git diff before..after</p>
            <pre class="diff">${w.diff.map(([sign, line], i) => `<span class="d-line ${sign === '+' ? 'd-plus' : 'd-minus'}" style="--i:${i}">${sign} ${esc(line)}</span>`).join('')}</pre>
        </div>` : '';
    const tree = w.tree ? `
        <div class="code">
            <p class="code-cmd">$ tree -L 2</p>
            <pre class="tree">${w.tree.map(([path, note], i) => `<span class="d-line" style="--i:${i}"><span class="t-path">${esc(path)}</span>${note ? `<span class="t-note"># ${esc(note)}</span>` : ''}</span>`).join('')}</pre>
        </div>` : '';
    return `
        <div class="panel-inner">
            <p class="panel-where">${esc(w.where)}</p>
            <h3 class="panel-title">${esc(w.headline)}</h3>
            ${w.media ? mediaHtml(w.media) : ''}${diff}${tree}
            <dl class="facts">
                ${fact('problem', w.problem)}
                ${fact('role', w.role)}
                ${fact('decision', w.decision)}
                ${fact('result', w.result)}
            </dl>
            ${w.stack.length ? `<ul class="chips">${w.stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
            ${w.url ? `<p class="panel-link">${ext(w.url, `$ open ${esc(w.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))} ↗`)}</p>` : ''}
        </div>`;
}

function placePanel() {
    const panel = $('work-panel');
    const tab = $(`tab-${activeWork}`);
    if (mobile.matches) tab.after(panel);
    else document.querySelector('.inspector').appendChild(panel);
}

function selectWork(id, animate = true) {
    if (!t().work.some((w) => w.id === id)) return false;
    activeWork = id;
    document.querySelectorAll('.work-tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.work === id)));
    const panel = $('work-panel');
    panel.setAttribute('aria-labelledby', `tab-${id}`);
    panel.innerHTML = panelHtml(t().work.find((w) => w.id === id));
    placePanel();
    watchVideos(panel);
    if (animate && !reducedMotion) {
        panel.firstElementChild.animate(
            [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
            { duration: 320, easing: EASE },
        );
    }
    return true;
}

function renderCareer() {
    const l = t().labels;
    const commits = (list) => list.map(([scope, msg]) => `<li><span class="c-scope">${esc(scope)}</span><span class="c-msg">${esc(msg)}</span></li>`).join('');
    $('gitlog').innerHTML = t().career.map((job) => `
        <article class="job${job.head ? ' is-head' : ''}">
            <span class="node" aria-hidden="true"></span>
            <header class="job-head">
                <h3 class="job-company">${esc(job.company)}</h3>
                ${job.head ? '<span class="ref">HEAD → main</span>' : ''}
                <span class="job-role">${esc(job.role)}</span>
                <span class="job-period">${esc(job.period)}</span>
            </header>
            <p class="job-about">${esc(job.about)}</p>
            ${job.main.length ? `<ul class="commits">${commits(job.main)}</ul>` : ''}
            ${job.more.length ? `
                <details class="more">
                    <summary data-more="${esc(l.more)}" data-less="${esc(l.less)}"></summary>
                    <ul class="commits">${commits(job.more)}</ul>
                </details>` : ''}
        </article>`).join('');
}

function renderStack() {
    const c = t();
    $('stack-body').innerHTML = `
        <table class="stack-table">
            <thead><tr>${c.stackHead.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
            <tbody>${STACK.map(([k, tools], i) => `<tr><td class="s-key">${k}</td><td>${esc(tools)}</td><td class="s-use">${esc(c.stackUse[i])}</td></tr>`).join('')}</tbody>
        </table>
        <details class="more json-wrap">
            <summary data-more="$ ${esc(c.stackJson)}" data-less="$ ${esc(c.stackJson)}"></summary>
            <pre class="json">${stackJson()}</pre>
        </details>`;
}

function renderLab() {
    $('lab-list').innerHTML = t().lab.map((p) => `
        <article class="lab-item" id="lab-${p.id}">
            <div class="lab-head">
                <h3>${esc(p.title)}</h3>
                <span class="lab-stack">${esc(p.stack)}</span>
            </div>
            <p class="lab-desc">${esc(p.desc)}</p>
            ${p.media ? mediaHtml(p.media) : ''}
            ${p.links.length ? `<p class="lab-links">${p.links.map(([label, href]) => ext(href, `$ open ${esc(label)} ↗`)).join('')}</p>` : ''}
        </article>`).join('');
}

function renderContact() {
    const c = t();
    $('contact-body').innerHTML = `
        <p class="contact-title">${esc(c.contact.title)}</p>
        <p class="contact-sub">${esc(c.contact.sub)}</p>
        <dl class="contact-rows">
            <div><dt>email</dt><dd><a href="mailto:${CONTACT.email}?subject=Hello%20Cyril">${CONTACT.email}</a>
                <button type="button" class="copy" id="copy-email">${esc(c.labels.copy)}</button></dd></div>
            <div><dt>linkedin</dt><dd>${ext(CONTACT.linkedin, 'in/cyril-cartoux ↗')}</dd></div>
            <div><dt>github</dt><dd>${ext(CONTACT.github, '@CyrilCartoux ↗')}</dd></div>
        </dl>`;
    $('copy-email').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        try { await navigator.clipboard.writeText(CONTACT.email); } catch (err) { return; }
        btn.textContent = t().labels.copied;
        btn.classList.add('is-done');
        setTimeout(() => { btn.textContent = t().labels.copy; btn.classList.remove('is-done'); }, 1600);
    });
}

function render() {
    document.documentElement.lang = lang;
    renderRail();
    renderProfile();
    renderWorkList();
    selectWork(activeWork, false);
    renderCareer();
    renderStack();
    renderLab();
    renderContact();
    watchVideos(document);
    setActive(currentSection);
}

// Videos only play while on screen.
const videoIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
        if (e.isIntersecting) e.target.play().catch(() => {});
        else e.target.pause();
    });
}, { threshold: 0.35 });

function watchVideos(root) {
    if (reducedMotion) return;
    root.querySelectorAll('video').forEach((v) => videoIO.observe(v));
}

// Hero numbers count up once, when the profile first appears.
function countUp() {
    document.querySelectorAll('.stat-n').forEach((el, i) => {
        const n = Number(el.dataset.n);
        const { prefix, suffix } = el.dataset;
        if (reducedMotion) return;
        const start = performance.now() + i * 90;
        const dur = 1100;
        const tick = (now) => {
            const k = Math.max(0, Math.min((now - start) / dur, 1));
            const eased = 1 - Math.pow(2, -10 * k);
            el.textContent = `${prefix}${Math.round(n * (k === 1 ? 1 : eased))}${suffix}`;
            if (k < 1) requestAnimationFrame(tick);
        };
        el.textContent = `${prefix}0${suffix}`;
        requestAnimationFrame(tick);
    });
}

function setLang(next) {
    if (!CONTENT[next]) return false;
    lang = next;
    store('lang', next);
    render();
    return true;
}

// --- Rail: active section + progress ----------------------------------------
let currentSection = 'profile';

function setActive(id) {
    currentSection = id;
    let activeLink = null;
    document.querySelectorAll('.rail-nav a').forEach((a) => {
        const on = a.dataset.section === id;
        a.classList.toggle('active', on);
        if (on) activeLink = a;
    });
    const ind = $('rail-indicator');
    if (!ind || !activeLink) return;
    if (mobile.matches) {
        ind.style.transform = `translateX(${activeLink.offsetLeft}px) scaleX(${activeLink.offsetWidth / 100})`;
        activeLink.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    } else {
        ind.style.transform = `translateY(${activeLink.offsetTop}px) scaleY(${activeLink.offsetHeight / 100})`;
    }
}

function watchScroll() {
    const spy = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('.sec').forEach((s) => spy.observe(s));

    let ticking = false;
    const progress = () => {
        const max = document.documentElement.scrollHeight - innerHeight;
        $('progress').style.setProperty('--p', max > 0 ? Math.min(scrollY / max, 1) : 0);
        ticking = false;
    };
    addEventListener('scroll', () => {
        if (!ticking) { ticking = true; requestAnimationFrame(progress); }
    }, { passive: true });
    progress();

    const reveal = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add('in');
            if (e.target.id === 'profile') countUp();
            reveal.unobserve(e.target);
        });
    }, { rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('.sec').forEach((s) => reveal.observe(s));
}

// --- Events -------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    render();
    watchScroll();

    $('lang-toggle').addEventListener('click', () => setLang(lang === 'en' ? 'fr' : 'en'));

    document.addEventListener('click', (e) => {
        const sel = e.target.closest('[data-target]');
        if (sel) {
            selectWork(sel.dataset.target);
            $('work').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
            return;
        }
        const tab = e.target.closest('.work-tab');
        if (tab) {
            selectWork(tab.dataset.work);
            if (mobile.matches) tab.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
            return;
        }
        const cmd = e.target.closest('.sec-cmd');
        if (cmd) runInShell(cmd.dataset.cmd);
    });

    $('work-list').addEventListener('keydown', (e) => {
        if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;
        e.preventDefault();
        const ids = t().work.map((w) => w.id);
        const next = ids[(ids.indexOf(activeWork) + (e.key === 'ArrowDown' ? 1 : ids.length - 1)) % ids.length];
        selectWork(next);
        $(`tab-${next}`).focus();
    });

    mobile.addEventListener('change', () => { placePanel(); setActive(currentSection); });
    addEventListener('resize', () => setActive(currentSection));
});
