'use client';

import { useState, useCallback, useRef } from 'react';
import Header from '@/components/Layout/Header';
import ScoreStats from '@/components/Feedback/ScoreStats';
import Settings from '@/components/Settings/Settings';
import ScrollingStaff from '@/components/Staff/ScrollingStaff';
import FeedbackIndicator from '@/components/Feedback/FeedbackIndicator';
import { KeySignature, NoteRange } from '@/lib/generator/types';
import { NoteQueueManager } from '@/lib/generator/queue-manager';
import { checkNoteMatch } from '@/lib/generator/note-generator';
import { useMIDIInput } from '@/hooks/useMIDIInput';
import { MIDINoteEvent } from '@/lib/types/midi';

export default function HomePage() {
    // Settings state
    const [keySignature, setKeySignature] = useState<KeySignature>('C');
    const [noteRange, setNoteRange] = useState<NoteRange>({ low: 'C4', high: 'C5' });

    // Exercise state
    const [isExerciseActive, setIsExerciseActive] = useState(false);
    const [noteQueue, setNoteQueue] = useState<any[]>([]);
    const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
    const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');

    // Queue manager ref
    const queueManagerRef = useRef<NoteQueueManager | null>(null);

    // Progress tracking
    const [stats, setStats] = useState({ perfect: 0, good: 0, miss: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Lock for async operations
    const isProcessingRef = useRef(false);

    // Start exercise
    const handleStartExercise = useCallback(() => {
        // Create new queue manager with current settings
        const manager = new NoteQueueManager(keySignature, noteRange);
        manager.initializeQueue(10);

        queueManagerRef.current = manager;
        setNoteQueue(manager.getAllNotes());
        setCurrentNoteIndex(0);
        setIsExerciseActive(true);
        setFeedbackStatus('idle');
        setStats({ perfect: 0, good: 0, miss: 0 });

        setTimeout(() => {
            containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }, [keySignature, noteRange]);

    // Stop exercise
    const handleStopExercise = useCallback(() => {
        setIsExerciseActive(false);
        setNoteQueue([]);
        setCurrentNoteIndex(0);
        setFeedbackStatus('idle');
        queueManagerRef.current = null;
    }, []);

    // Handle MIDI input
    const handleMIDINote = useCallback((event: MIDINoteEvent) => {
        if (!isExerciseActive || !queueManagerRef.current || event.type !== 'noteOn') return;

        if (isProcessingRef.current) return;

        const manager = queueManagerRef.current;
        const currentNote = manager.getCurrentNote();

        if (!currentNote) return;

        const isCorrect = checkNoteMatch(event.pitch, currentNote);

        if (isCorrect) {
            isProcessingRef.current = true;
            setTimeout(() => { isProcessingRef.current = false; }, 100);

            setStats(s => ({ ...s, perfect: s.perfect + 1 }));
            manager.shiftQueue();
            setNoteQueue([...manager.getAllNotes()]);
            setFeedbackStatus('correct');
            setTimeout(() => setFeedbackStatus('idle'), 500);

        } else {
            isProcessingRef.current = true;
            setTimeout(() => { isProcessingRef.current = false; }, 200);

            setFeedbackStatus('incorrect');
            setStats(s => ({ ...s, miss: s.miss + 1 }));

            setTimeout(() => {
                setFeedbackStatus('idle');
            }, 500);
        }
    }, [isExerciseActive]);

    const { isConnected, error: midiError } = useMIDIInput(handleMIDINote);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-x-hidden">
            <Header />

            <main className="w-full max-w-full overflow-x-hidden px-2 sm:px-4 py-4 sm:py-8">
                <div className="max-w-6xl mx-auto">
                    {/* Title */}
                    <div className="text-center mb-4 sm:mb-8">
                        <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2 px-2">
                            🎹 Lettura Musicale Continua
                        </h1>
                        <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-3 sm:mb-4 px-2">
                            Esercizio continuo di lettura musicale a scorrimento
                        </p>

                        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 mx-2 sm:mx-auto max-w-2xl mb-4 sm:mb-8 text-left flex items-start">
                            <span className="text-xl sm:text-2xl mr-2 sm:mr-3 flex-shrink-0">🎹</span>
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-blue-800 text-sm sm:text-base">Modalità MIDI</p>
                                <p className="text-blue-700 text-xs sm:text-sm break-words">
                                    Questo esercizio funziona <strong>solo</strong> con uno strumento connesso tramite cavo MIDI.
                                    Suona le note corrette sulla tua tastiera quando appaiono evidenziate.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* MIDI Status */}
                    <div className="mb-4 sm:mb-6 h-4"></div>

                    {/* Settings - wrapped in container */}
                    <div className="w-full max-w-full overflow-x-hidden">
                        <Settings
                            keySignature={keySignature}
                            noteRange={noteRange}
                            onKeySignatureChange={setKeySignature}
                            onNoteRangeChange={setNoteRange}
                            isExerciseActive={isExerciseActive}
                            onStartExercise={handleStartExercise}
                            onStopExercise={handleStopExercise}
                        />
                    </div>

                    {/* Scrolling Staff Display - CRITICAL: force contain */}
                    <div ref={containerRef} className="relative w-full max-w-full overflow-x-hidden">
                        {isExerciseActive && (
                            <div className="absolute top-0 left-0 right-0 flex justify-center -mt-6 sm:-mt-8 z-10 pointer-events-none px-2">
                                <div className="bg-white/90 backdrop-blur px-3 sm:px-6 py-1.5 sm:py-2 rounded-full shadow-md border border-gray-200 flex gap-3 sm:gap-8">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] sm:text-xs font-bold text-green-600 uppercase whitespace-nowrap">Corrette</span>
                                        <span className="text-lg sm:text-2xl font-bold text-green-700">{stats.perfect}</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] sm:text-xs font-bold text-red-500 uppercase whitespace-nowrap">Sbagliate</span>
                                        <span className="text-lg sm:text-2xl font-bold text-red-600">{stats.miss}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="w-full max-w-full overflow-x-auto">
                            <ScrollingStaff
                                notes={noteQueue}
                                currentNoteIndex={currentNoteIndex}
                                keySignature={keySignature}
                                feedbackStatus={feedbackStatus}
                            />
                        </div>
                    </div>

                    {/* Instructions */}
                    {!isExerciseActive && (
                        <div className="mt-4 sm:mt-8 bg-white rounded-xl shadow-lg p-4 sm:p-6 mx-2 sm:mx-0">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
                                📖 Come funziona
                            </h3>
                            <ul className="space-y-2 sm:space-y-3 text-gray-700 text-xs sm:text-base">
                                <li className="flex items-start">
                                    <span className="text-blue-600 mr-2 text-base sm:text-xl flex-shrink-0">1.</span>
                                    <span className="min-w-0 flex-1">
                                        <strong>Configura:</strong> Scegli tonalità e range
                                    </span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-blue-600 mr-2 text-base sm:text-xl flex-shrink-0">2.</span>
                                    <span className="min-w-0 flex-1">
                                        <strong>Premi START:</strong> Vedrai 8-10 note sul pentagramma
                                    </span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-blue-600 mr-2 text-base sm:text-xl flex-shrink-0">3.</span>
                                    <span className="min-w-0 flex-1">
                                        <strong>Suona la PRIMA nota (BLU)</strong>
                                    </span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-blue-600 mr-2 text-base sm:text-xl flex-shrink-0">4.</span>
                                    <span className="min-w-0 flex-1">
                                        <strong>Procedi automaticamente:</strong> L'esercizio avanza
                                    </span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-blue-600 mr-2 text-base sm:text-xl flex-shrink-0">5.</span>
                                    <span className="min-w-0 flex-1">
                                        <strong>Esercizio infinito</strong> fino a STOP
                                    </span>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </main>

            {/* Feedback Overlay */}
            <FeedbackIndicator status={feedbackStatus} />
        </div>
    );
}
