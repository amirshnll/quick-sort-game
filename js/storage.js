const defaults = { settings: { language: 'en', difficulty: 'normal', sound: true }, stats: { highScore: 0, longestStreak: 0, correct: 0, attempts: 0 } };
const api = (typeof browser !== 'undefined' ? browser.storage?.local : undefined) ?? (typeof chrome !== 'undefined' ? chrome.storage?.local : undefined);
export async function load(key) {
    if (!api)
        return defaults[key]; const value = await api.get(key); return { ...defaults[key], ...value[key] };
}
export async function save(key, value) {
    if (api)
        await api.set({ [key]: value });
}
