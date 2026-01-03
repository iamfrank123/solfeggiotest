'use client';

import { useState } from 'react';
import { KeySignature, NoteRange } from '@/lib/generator/types';
import { useTranslation } from '@/context/LanguageContext';

interface SettingsProps {
    keySignature: KeySignature;
    noteRange: NoteRange;
    onKeySignatureChange: (key: KeySignature) => void;
    onNoteRangeChange: (range: NoteRange) => void;
    isExerciseActive: boolean;
    onStartExercise: () => void;
    onStopExercise: () => void;
}

const NOTE_OPTIONS = [
    'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3',
    'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
    'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5',
    'C6', 'D6', 'E6', 'F6', 'G6', 'A6', 'B6',
];

const KEY_SIGNATURES: KeySignature[] = ['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Eb', 'Ab'];

export default function Settings({
    keySignature,
    noteRange,
    onKeySignatureChange,
    onNoteRangeChange,
    isExerciseActive,
    onStartExercise,
    onStopExercise,
}: SettingsProps) {
    const { t } = useTranslation();
    const [lowNote, setLowNote] = useState(noteRange.low);
    const [highNote, setHighNote] = useState(noteRange.high);
    const [error, setError] = useState<string | null>(null);

    const KEY_SIGNATURE_LABELS: Record<KeySignature, string> = {
        'C': `C ${t('settings.major')}`,
        'G': `G ${t('settings.major')} (1♯)`,
        'D': `D ${t('settings.major')} (2♯)`,
        'A': `A ${t('settings.major')} (3♯)`,
        'E': `E ${t('settings.major')} (4♯)`,
        'F': `F ${t('settings.major')} (1♭)`,
        'Bb': `B♭ ${t('settings.major')} (2♭)`,
        'Eb': `E♭ ${t('settings.major')} (3♭)`,
        'Ab': `A♭ ${t('settings.major')} (4♭)`,
    };

    const handleLowNoteChange = (value: string) => {
        setLowNote(value);
        validateAndUpdate(value, highNote);
    };

    const handleHighNoteChange = (value: string) => {
        setHighNote(value);
        validateAndUpdate(lowNote, value);
    };

    const validateAndUpdate = (low: string, high: string) => {
        const lowIndex = NOTE_OPTIONS.indexOf(low);
        const highIndex = NOTE_OPTIONS.indexOf(high);

        if (lowIndex >= highIndex) {
            setError(t('settings.error_range'));
            return;
        }

        setError(null);
        onNoteRangeChange({ low, high });
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 w-full max-w-full overflow-hidden">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
                {t('settings.title')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Key Signature Selection */}
                <div className="min-w-0">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                        {t('settings.key_signature')}
                    </label>
                    <select
                        value={keySignature}
                        onChange={(e) => onKeySignatureChange(e.target.value as KeySignature)}
                        disabled={isExerciseActive}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-sm sm:text-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                        {KEY_SIGNATURES.map((key) => (
                            <option key={key} value={key}>
                                {KEY_SIGNATURE_LABELS[key]}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Note Range Selection */}
                <div className="min-w-0">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                        {t('settings.note_range')}
                    </label>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <select
                            value={lowNote}
                            onChange={(e) => handleLowNoteChange(e.target.value)}
                            disabled={isExerciseActive}
                            className="flex-1 min-w-0 px-2 sm:px-3 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-sm sm:text-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            {NOTE_OPTIONS.map((note) => (
                                <option key={note} value={note}>
                                    {note}
                                </option>
                            ))}
                        </select>

                        <span className="text-gray-500 font-bold text-sm sm:text-lg flex-shrink-0">→</span>

                        <select
                            value={highNote}
                            onChange={(e) => handleHighNoteChange(e.target.value)}
                            disabled={isExerciseActive}
                            className="flex-1 min-w-0 px-2 sm:px-3 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-sm sm:text-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            {NOTE_OPTIONS.map((note) => (
                                <option key={note} value={note}>
                                    {note}
                                </option>
                            ))}
                        </select>
                    </div>

                    {error && (
                        <p className="mt-2 text-xs sm:text-sm text-red-600">⚠️ {error}</p>
                    )}
                </div>
            </div>

            {/* START/STOP Button */}
            <div className="mt-4 sm:mt-6 text-center">
                {!isExerciseActive ? (
                    <button
                        onClick={onStartExercise}
                        className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-base sm:text-xl rounded-lg shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        disabled={!!error}
                    >
                        {t('settings.start_exercise')}
                    </button>
                ) : (
                    <button
                        onClick={onStopExercise}
                        className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-base sm:text-xl rounded-lg shadow-lg transition-all transform hover:scale-105 active:scale-95"
                    >
                        {t('settings.stop_exercise')}
                    </button>
                )}
            </div>
        </div>
    );
}
