function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
export const numberThreshold = {
    id: 'number-threshold',
    create(level) {
        const advanced = level >= 8; const range = 9 + level * 4; const threshold = advanced ? randomInt(-range + 2, range - 2) : randomInt(2, Math.max(3, range - 2)); let value = randomInt(advanced ? -range : 0, range); if (value === threshold)
            value += 1; return { context: { threshold }, item: { value } };
    },
    isLeft(item, context) { return item.value < context.threshold; },
    labels(context, f) { const threshold = f(context.threshold); return { prompt: `threshold:${threshold}`, left: `smaller:${threshold}`, right: `atLeast:${threshold}` }; }
};
export const ruleRegistry = { [numberThreshold.id]: numberThreshold };
