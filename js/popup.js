import { localeMeta, translator } from './locales.js';
import { numberThreshold } from './rules.js';
import { load, save } from './storage.js';
const $ = (id) => document.getElementById(id);
let settings, stats, score = 0, combo = 0, level = 1, current, deadline = 0, timer = 0, nextTimer = 0, t = (x, p) => x;
const difficultyFactor = { easy: 1.2, normal: 1, hard: .75 };
function formatNumber(n) { return new Intl.NumberFormat(localeMeta[settings.language].intl).format(n); }
function renderStatic() { const meta = localeMeta[settings.language]; document.documentElement.lang = settings.language; document.documentElement.dir = meta.rtl ? 'rtl' : 'ltr'; document.body.classList.toggle('rtl', meta.rtl); document.querySelector('h1').textContent = t('appName'); document.title = t('appName'); document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n)); $('language').value = settings.language; $('difficulty').value = settings.difficulty; $('sound').checked = settings.sound; $('accuracyLabel').textContent = t('accuracy', { value: stats.attempts ? Math.round(stats.correct / stats.attempts * 100) : 0 }); }
function renderStats() { $('score').textContent = String(score); $('combo').textContent = String(combo); $('accuracyLabel').textContent = t('accuracy', { value: stats.attempts ? Math.round(stats.correct / stats.attempts * 100) : 0 }); }
function itemTime() { return Math.max(900, (4200 - (level - 1) * 190) * difficultyFactor[settings.difficulty]); }
function next() { clearInterval(timer); clearTimeout(nextTimer); current = numberThreshold.create(level); const labels = numberThreshold.labels(current.context, formatNumber); $('item').textContent = formatNumber(current.item.value); $('ruleDescription').textContent = t('threshold', { value: formatNumber(current.context.threshold) }); $('leftLabel').textContent = t('smaller', { value: formatNumber(current.context.threshold) }); $('rightLabel').textContent = t('atLeast', { value: formatNumber(current.context.threshold) }); $('feedback').textContent = ''; $('feedback').className = 'feedback'; deadline = Date.now() + itemTime(); updateClock(); timer = window.setInterval(updateClock, 50); }
function updateClock() {
    const remaining = Math.max(0, deadline - Date.now()); $('time').textContent = (remaining / 1000).toFixed(1); if (remaining <= 0)
        answer(null);
}
function beep(ok) {
    if (!settings.sound)
        return; const Ctx = window.AudioContext; if (!Ctx)
        return; const c = new Ctx(), o = c.createOscillator(), g = c.createGain(); o.frequency.value = ok ? 660 : 180; g.gain.value = .04; o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + .08);
}
async function answer(left) {
    if (!current)
        return; const wasLeft = left === true; const correct = left !== null && wasLeft === numberThreshold.isLeft(current.item, current.context); current = undefined; clearInterval(timer); stats.attempts++; if (correct) {
            stats.correct++;
            score++;
            combo++;
            level = 1 + Math.floor(score / 4);
            stats.highScore = Math.max(stats.highScore, score);
            stats.longestStreak = Math.max(stats.longestStreak, combo);
            $('feedback').textContent = t('correct');
            $('feedback').className = 'feedback correct';
            beep(true);
            await save('stats', stats);
            renderStats();
            nextTimer = window.setTimeout(next, 140);
        }
    else {
        combo = 0;
        $('feedback').textContent = t('incorrect');
        $('feedback').className = 'feedback incorrect';
        beep(false);
        await save('stats', stats);
        renderStats();
        nextTimer = window.setTimeout(next, 500);
    }
}
async function init() {
    [settings, stats] = await Promise.all([load('settings'), load('stats')]); t = translator(settings.language); const select = $('language'); Object.entries(localeMeta).forEach(([id, m]) => select.add(new Option(m.name, id))); renderStatic(); renderStats(); next(); $('leftButton').onclick = () => answer(true); $('rightButton').onclick = () => answer(false); document.addEventListener('keydown', e => {
        if (['ArrowLeft', 'a', 'A'].includes(e.key)) {
            e.preventDefault();
            answer(true);
        } if (['ArrowRight', 'd', 'D'].includes(e.key)) {
            e.preventDefault();
            answer(false);
        }
    }); select.onchange = async () => { settings.language = select.value; t = translator(settings.language); await save('settings', settings); renderStatic(); next(); }; $('difficulty').onchange = async (e) => { settings.difficulty = e.target.value; await save('settings', settings); next(); }; $('sound').onchange = async (e) => { settings.sound = e.target.checked; await save('settings', settings); }; $('resetButton').onclick = async () => { clearInterval(timer); clearTimeout(nextTimer); current = undefined; deadline = 0; stats = { highScore: 0, longestStreak: 0, correct: 0, attempts: 0 }; score = 0; combo = 0; level = 1; await save('stats', stats); renderStatic(); renderStats(); next(); };
}
init();
