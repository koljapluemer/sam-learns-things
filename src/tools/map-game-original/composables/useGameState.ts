import { ref, computed } from 'vue';
import type { Country, GameStats, Feedback, CountryStats, ConfusionPair } from '../types';

const STORAGE_PREFIX = 'map-game-original-';

interface StoredCountryStats {
    failures: number;
    consecutiveFailures: number;
    lastAttemptDate: string | null;
}

interface StoredGameStats extends Omit<GameStats, 'countryStats'> {
    countryStats: Record<string, StoredCountryStats>;
}

export function useGameState() {
    const countries = ref<Country[]>([]);
    const targetCountry = ref<Country | null>(null);
    const lastRevealTime = ref<Date | null>(null);
    const feedback = ref<Feedback | null>(null);
    const waitingForClick = ref(false);
    const includeTinyCountries = ref(false);

    const stats = ref<GameStats>({
        globalStreak: 0,
        correctGuesses: 0,
        incorrectGuesses: 0,
        trainingUnits: 0,
        trainingUnitsThisSession: 0,
        trainingUnitsLastSession: '0',
        thinkingTimes: [],
        countryStats: new Map<string, CountryStats>(),
        confusionPairs: [],
        nemesis: '',
        averageThinkingTime: 0,
        hardestCountry: null,
        mostConfusedA: null,
        mostConfusedB: null
    });

    const accuracy = computed(() => {
        const total = stats.value.correctGuesses + stats.value.incorrectGuesses;
        return total === 0 ? 0 : Math.round((stats.value.correctGuesses / total) * 100);
    });

    const dueCountries = computed(() => {
        return countries.value.filter(country => country.dueAt && country.dueAt <= new Date()).length;
    });

    function updateCountryStats(countryName: string, isCorrect: boolean): void {
        const currentStats = stats.value.countryStats.get(countryName) || {
            failures: 0,
            consecutiveFailures: 0,
            lastAttemptDate: null
        };

        if (!isCorrect) {
            currentStats.failures++;
            currentStats.consecutiveFailures++;
        } else {
            currentStats.consecutiveFailures = 0;
        }

        currentStats.lastAttemptDate = new Date();
        stats.value.countryStats.set(countryName, currentStats);

        // Update hardest country
        if (!isCorrect) {
            const entries = Array.from(stats.value.countryStats.entries());
            const hardestCountry = entries.reduce((prev, curr) => 
                (curr[1].failures > (prev[1]?.failures || 0)) ? curr : prev
            );
            stats.value.hardestCountry = hardestCountry[0];
        }

        // Update nemesis (country with highest consecutive failures)
        const entries = Array.from(stats.value.countryStats.entries());
        const currentNemesis = entries.reduce((prev, curr) => 
            (curr[1].consecutiveFailures > (prev[1]?.consecutiveFailures || 0)) ? curr : prev
        );
        stats.value.nemesis = currentNemesis[1].consecutiveFailures > 0 ? currentNemesis[0] : '';
    }

    function updateConfusionStats(countryA: string, countryB: string): void {
        const sortedCountries = [countryA, countryB].sort();
        const existingPair = stats.value.confusionPairs.find(
            pair => pair.countryA === sortedCountries[0] && pair.countryB === sortedCountries[1]
        );

        if (existingPair) {
            existingPair.count++;
        } else {
            stats.value.confusionPairs.push({
                countryA: sortedCountries[0],
                countryB: sortedCountries[1],
                count: 1
            });
        }

        // Sort confusion pairs by count and update most confused
        stats.value.confusionPairs.sort((a, b) => b.count - a.count);
        if (stats.value.confusionPairs.length > 0) {
            const mostConfused = stats.value.confusionPairs[0];
            stats.value.mostConfusedA = mostConfused.countryA;
            stats.value.mostConfusedB = mostConfused.countryB;
        }
    }

    function handleGuess(countryName: string): void {
        if (!targetCountry.value) return;

        const isCorrect = countryName === targetCountry.value.name;
        const now = new Date();
        const thinkingTime = lastRevealTime.value ? (now.getTime() - lastRevealTime.value.getTime()) / 1000 : 0;

        // Update basic stats
        stats.value.trainingUnits++;
        stats.value.trainingUnitsThisSession++;
        stats.value.thinkingTimes.push(Math.min(thinkingTime, 60));

        if (isCorrect) {
            stats.value.correctGuesses++;
            stats.value.globalStreak++;
            feedback.value = {
                type: 'correct',
                message: 'Correct!'
            };
        } else {
            stats.value.incorrectGuesses++;
            stats.value.globalStreak = 0;
            feedback.value = {
                type: 'incorrect',
                message: 'Incorrect!'
            };
        }

        // Update country data
        const country = countries.value.find(c => c.name === countryName);
        if (country) {
            country.repetitions.push({
                grade: isCorrect ? 1 : 0,
                date: now,
                mixedUpWith: isCorrect ? null : targetCountry.value.name,
                thinkingTime: Math.min(thinkingTime, 60)
            });
        }

        // Update statistics
        updateCountryStats(countryName, isCorrect);
        if (!isCorrect && targetCountry.value) {
            updateConfusionStats(countryName, targetCountry.value.name);
        }

        // Update average thinking time
        stats.value.averageThinkingTime = Math.round(
            stats.value.thinkingTimes.reduce((a, b) => a + b, 0) / stats.value.thinkingTimes.length
        );

        waitingForClick.value = false;
        setTimeout(() => {
            feedback.value = null;
            pickRandomChallenge();
        }, 1000);
    }

    function loadFromStorage(): void {
        const storedCountries = localStorage.getItem(STORAGE_PREFIX + 'countries');
        const storedStats = localStorage.getItem(STORAGE_PREFIX + 'stats');
        
        if (storedCountries) {
            const parsedCountries = JSON.parse(storedCountries);
            countries.value = parsedCountries.map((country: any) => ({
                ...country,
                dueAt: country.dueAt ? new Date(country.dueAt) : null,
                repetitions: country.repetitions.map((rep: any) => ({
                    ...rep,
                    date: new Date(rep.date)
                }))
            }));
        }

        if (storedStats) {
            const parsedStats = JSON.parse(storedStats) as StoredGameStats;
            // Convert stored objects back to Map
            const countryStats = new Map(Object.entries(parsedStats.countryStats || {}).map(
                ([key, value]: [string, StoredCountryStats]) => [key, { 
                    failures: value.failures,
                    consecutiveFailures: value.consecutiveFailures,
                    lastAttemptDate: value.lastAttemptDate ? new Date(value.lastAttemptDate) : null
                }]
            ));
            stats.value = {
                ...parsedStats,
                countryStats,
                thinkingTimes: parsedStats.thinkingTimes || []
            };
        }
    }

    function saveToStorage(): void {
        const statsForStorage = {
            ...stats.value,
            countryStats: Object.fromEntries(stats.value.countryStats)
        };
        localStorage.setItem(STORAGE_PREFIX + 'countries', JSON.stringify(countries.value));
        localStorage.setItem(STORAGE_PREFIX + 'stats', JSON.stringify(statsForStorage));
    }

    function pickRandomChallenge(): void {
        const now = new Date();
        const dueCountries = countries.value.filter(country => 
            country.dueAt && country.dueAt <= now
        );

        if (dueCountries.length === 0) {
            targetCountry.value = null;
            return;
        }

        const randomIndex = Math.floor(Math.random() * dueCountries.length);
        targetCountry.value = dueCountries[randomIndex];
        lastRevealTime.value = now;
        waitingForClick.value = true;
    }

    return {
        countries,
        targetCountry,
        lastRevealTime,
        feedback,
        waitingForClick,
        includeTinyCountries,
        stats,
        accuracy,
        dueCountries,
        handleGuess,
        pickRandomChallenge,
        loadFromStorage,
        saveToStorage
    };
} 