// Interactive shell overlay: ` or Ctrl+K to open, Esc to close.
// Every command shown in a section header works here.
let runInShell = () => {};

(() => {
    const shell = $('shell');
    const out = $('shell-out');
    const input = $('shell-input');
    const body = $('shell-body');
    const history = [];
    let cursor = 0;
    let opener = null;

    const fr = () => lang === 'fr';
    const print = (html, cls = '') => {
        const line = document.createElement('div');
        line.className = `sh-line ${cls}`;
        line.innerHTML = html;
        out.appendChild(line);
        body.scrollTop = body.scrollHeight;
    };
    const go = (id) => {
        close();
        $(id).scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    };

    const COMMANDS = {
        help: {
            desc: ['list commands', 'liste des commandes'],
            run: () => {
                const rows = Object.entries(COMMANDS)
                    .filter(([, c]) => c.desc)
                    .map(([name, c]) => `  <span class="sh-cmd">${(c.usage || name).padEnd(18)}</span>${esc(c.desc[fr() ? 1 : 0])}`);
                print(rows.join('\n'), 'pre');
                print(fr() ? 'astuce : Tab complète, ↑/↓ pour l\'historique, Échap pour fermer'
                    : 'tip: Tab completes, ↑/↓ for history, Esc to close', 'dim');
            },
        },
        whoami: {
            desc: ['who is Cyril', 'qui est Cyril'],
            run: () => {
                const h = t().hero;
                print(`<span class="sh-hl">Cyril Cartoux</span> — ${esc(h.role)}\n${esc(h.pitch)}\n<span class="dim">${esc(h.meta.join(' · '))}</span>`, 'pre');
            },
        },
        inspect: {
            usage: 'inspect [id]',
            desc: ['open a case study', 'ouvre une réalisation'],
            run: (arg) => {
                if (!arg) {
                    t().work.forEach((w) => print(`  <span class="sh-cmd">${w.id.padEnd(10)}</span>${esc(w.title)} <span class="dim">— ${esc(w.where)}</span>`, 'pre'));
                    print(fr() ? '→ inspect &lt;id&gt;' : '→ inspect &lt;id&gt;', 'dim');
                    return;
                }
                if (!selectWork(arg)) return print(`inspect: ${esc(arg)}: ${fr() ? 'introuvable' : 'not found'}`, 'err');
                go('work');
            },
        },
        git: {
            usage: 'git log',
            desc: ['career as a git log', 'parcours en git log'],
            run: (arg) => {
                if (arg !== 'log') return print(`git: '${esc(arg)}' — ${fr() ? 'essaie' : 'try'} git log`, 'err');
                t().career.forEach((job) => {
                    print(`<span class="sh-warn">* ${esc(job.company)}</span> — ${esc(job.role)} <span class="dim">(${esc(job.period)})</span>`);
                    [...job.main, ...job.more].forEach(([scope, msg]) => print(`  <span class="sh-cmd">${esc(scope)}</span> ${esc(msg)}`));
                });
            },
        },
        cat: {
            usage: 'cat stack.json',
            desc: ['tech stack', 'stack technique'],
            run: (arg) => {
                if (arg !== 'stack.json') return print(`cat: ${esc(arg || '')}: ${fr() ? 'fichier introuvable' : 'no such file'}`, 'err');
                print(stackJson(), 'pre');
            },
        },
        ls: {
            usage: 'ls ./lab',
            desc: ['side projects', 'projets perso'],
            run: (arg) => {
                if (!arg || arg === '.' || arg === '~') return print('profile.md  work/  career.log  stack.json  <span class="sh-cmd">lab/</span>  contact.txt', 'pre');
                t().lab.forEach((p) => print(`  <span class="sh-cmd">${p.id.padEnd(12)}</span>${esc(p.title)} <span class="dim">— ${esc(p.stack)}</span>`, 'pre'));
                print('→ open &lt;id&gt;', 'dim');
            },
        },
        open: {
            usage: 'open <id>',
            desc: ['open a project', 'ouvre un projet'],
            run: (arg) => {
                const p = t().lab.find((x) => x.id === arg);
                if (!p) {
                    if (selectWork(arg)) return go('work');
                    return print(`open: ${esc(arg || '?')}: ${fr() ? 'introuvable' : 'not found'}`, 'err');
                }
                print(`<span class="sh-hl">${esc(p.title)}</span>\n${esc(p.desc)}`, 'pre');
                p.links.forEach(([label, href]) => print(`→ <a href="${href}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`));
            },
        },
        mail: {
            usage: 'mail cyril',
            desc: ['write to me', 'm\'écrire'],
            run: () => {
                print(fr() ? 'ouverture du client mail…' : 'opening mail client…', 'ok');
                window.location.href = `mailto:${CONTACT.email}?subject=Hello%20Cyril`;
            },
        },
        contact: {
            desc: ['all my links', 'tous mes liens'],
            run: () => {
                print(`email     <a href="mailto:${CONTACT.email}">${CONTACT.email}</a>`, 'pre');
                print(`linkedin  <a href="${CONTACT.linkedin}" target="_blank" rel="noopener noreferrer">in/cyril-cartoux</a>`, 'pre');
                print(`github    <a href="${CONTACT.github}" target="_blank" rel="noopener noreferrer">@CyrilCartoux</a>`, 'pre');
            },
        },
        cv: {
            desc: ['one-screen résumé', 'CV en un écran'],
            run: () => {
                COMMANDS.whoami.run();
                t().career.slice(0, 2).forEach((job) => print(`• ${esc(job.company)} — ${esc(job.role)} <span class="dim">${esc(job.period)}</span>`));
                t().work.forEach((w) => print(`  ✓ ${esc(w.headline)}`));
                COMMANDS.contact.run();
            },
        },
        lang: {
            usage: 'lang en|fr',
            desc: ['switch language', 'changer de langue'],
            run: (arg) => {
                if (!setLang(arg)) return print('usage: lang en | lang fr', 'err');
                print(arg === 'fr' ? 'langue : français ✓' : 'language: english ✓', 'ok');
            },
        },
        crt: {
            desc: ['retro CRT mode', 'mode écran CRT rétro'],
            run: () => {
                const on = document.body.classList.toggle('crt');
                print(on ? 'CRT: on' : 'CRT: off', 'ok');
            },
        },
        clear: {
            desc: ['clear the screen', 'efface l\'écran'],
            run: () => { out.innerHTML = ''; },
        },
        exit: {
            desc: ['close the shell', 'ferme le shell'],
            run: () => close(),
        },
        sudo: {
            run: (arg) => {
                if (arg === 'hire-me') {
                    print(fr() ? '[sudo] mot de passe pour recruteur : ********' : '[sudo] password for recruiter: ********', 'dim');
                    print(fr() ? '✔ Autorisation accordée. Ouverture du client mail…' : '✔ Permission granted. Opening mail client…', 'ok');
                    setTimeout(() => { window.location.href = `mailto:${CONTACT.email}?subject=Hello%20Cyril`; }, 700);
                } else {
                    print(fr() ? 'joli essai. essaie plutôt : sudo hire-me' : 'nice try. try: sudo hire-me', 'err');
                }
            },
        },
        rm: { run: () => print(fr() ? 'rm: permission refusée. ce portfolio est en lecture seule 😉' : 'rm: permission denied. this portfolio is read-only 😉', 'err') },
        pwd: { run: () => print('/home/cyril') },
        echo: { run: (arg) => print(esc(arg)) },
    };

    const CHIPS = ['whoami', 'inspect', 'git log', 'cat stack.json', 'ls ./lab', 'mail cyril', 'help'];

    function exec(raw) {
        const line = raw.trim();
        print(`<span class="ps1">cyril@cartoux:~$</span> ${esc(line)}`);
        if (!line) return;
        history.push(line);
        cursor = history.length;
        const [name, ...rest] = line.split(/\s+/);
        const cmd = COMMANDS[name.toLowerCase()];
        if (!cmd) return print(`zsh: command not found: ${esc(name)} — ${fr() ? 'tape' : 'try'} <span class="sh-cmd">help</span>`, 'err');
        cmd.run(rest.join(' '));
    }

    function open() {
        if (!shell.hidden) return;
        opener = document.activeElement;
        shell.hidden = false;
        document.body.classList.add('shell-open');
        $('shell-chips').innerHTML = CHIPS.map((c) => `<button type="button" data-run="${c}">${c}</button>`).join('');
        if (!out.childElementCount) {
            print(fr()
                ? 'Bienvenue. Tape <span class="sh-cmd">help</span>, ou clique une commande ci-dessous.'
                : 'Welcome. Type <span class="sh-cmd">help</span>, or click a command below.');
        }
        input.focus();
    }

    function close() {
        if (shell.hidden) return;
        const win = shell.querySelector('.shell-window');
        const done = () => {
            shell.hidden = true;
            document.body.classList.remove('shell-open');
            if (opener && document.contains(opener)) opener.focus();
        };
        if (reducedMotion) return done();
        win.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(8px) scale(0.985)' }], { duration: 160, easing: 'ease-in' }).onfinish = done;
    }

    runInShell = (line) => {
        open();
        exec(line);
    };

    $('shell-form').addEventListener('submit', (e) => {
        e.preventDefault();
        exec(input.value);
        input.value = '';
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp' && cursor > 0) {
            input.value = history[--cursor];
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            cursor = Math.min(cursor + 1, history.length);
            input.value = history[cursor] || '';
            e.preventDefault();
        } else if (e.key === 'Tab' && !e.shiftKey && input.value.trim()) {
            // Autocomplete only when there is something to complete; otherwise Tab moves focus.
            e.preventDefault();
            const [name, arg] = input.value.split(/\s+/);
            if (arg !== undefined) {
                const ids = name === 'inspect' ? t().work.map((w) => w.id) : name === 'open' ? t().lab.map((p) => p.id) : [];
                const hit = ids.filter((id) => id.startsWith(arg));
                if (hit.length === 1) input.value = `${name} ${hit[0]}`;
            } else {
                const hit = Object.keys(COMMANDS).filter((c) => c.startsWith(name));
                if (hit.length === 1) input.value = `${hit[0]} `;
                else if (hit.length > 1) print(hit.join('  '), 'dim');
            }
        }
    });

    // Focus trap inside the dialog.
    shell.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab' || e.defaultPrevented) return;
        const items = [...shell.querySelectorAll('button, a[href], input')].filter((el) => el.offsetParent !== null);
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    document.addEventListener('keydown', (e) => {
        const typing = e.target instanceof HTMLInputElement;
        if (!shell.hidden && e.key === 'Escape') close();
        else if (shell.hidden && !typing && (e.key === '`' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'))) {
            e.preventDefault();
            open();
        }
    });

    $('shell-chips').addEventListener('click', (e) => {
        const b = e.target.closest('[data-run]');
        if (b) { exec(b.dataset.run); input.focus(); }
    });
    $('shell-open').addEventListener('click', open);
    $('shell-close').addEventListener('click', close);
    shell.addEventListener('click', (e) => { if (e.target === shell) close(); });
    body.addEventListener('click', (e) => { if (!e.target.closest('a') && !getSelection().toString()) input.focus(); });
})();
