export interface Country {
    name: string;
    path: SVGPathElement;
    interval: number;
    dueAt: Date | null;
    repetitions: Repetition[];
}

export interface Repetition {
    grade: number;
    date: Date;
    mixedUpWith: string | null;
    thinkingTime: number;
}

export interface CountryStats {
    failures: number;
    consecutiveFailures: number;
    lastAttemptDate: Date | null;
}

export interface ConfusionPair {
    countryA: string;
    countryB: string;
    count: number;
}

export interface GameStats {
    globalStreak: number;
    correctGuesses: number;
    incorrectGuesses: number;
    trainingUnits: number;
    trainingUnitsThisSession: number;
    trainingUnitsLastSession: string;
    thinkingTimes: number[];
    countryStats: Map<string, CountryStats>;
    confusionPairs: ConfusionPair[];
    nemesis: string;
    averageThinkingTime: number;
    hardestCountry: string | null;
    mostConfusedA: string | null;
    mostConfusedB: string | null;
}

export interface PanZoomInstance {
    getPan: () => { x: number; y: number };
    reset: () => void;
    resetZoom: () => void;
    resetPan: () => void;
    zoom: (level: number) => void;
    pan: (coordinates: { x: number; y: number }) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    destroy: () => void;
}

export interface MapPosition {
    x: number;
    y: number;
    zoom: number;
}

export interface Feedback {
    type: 'correct' | 'incorrect';
    message: string;
}

export interface GameState {
    countries: Country[];
    targetCountry: Country | null;
    lastRevealTime: Date | null;
    feedback: Feedback | null;
    waitingForClick: boolean;
    includeTinyCountries: boolean;
    stats: GameStats;
    accuracy: number;
    dueCountries: number;
} 