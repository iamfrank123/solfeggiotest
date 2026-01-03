'use client';

import { useEffect, useRef, useState } from 'react';
import { GeneratedNote, KeySignature } from '@/lib/generator/types';
import { getKeySignatureInfo } from '@/lib/generator/note-generator';
import { Vex } from 'vexflow';

const { Factory, StaveNote, Voice, Formatter } = Vex.Flow;

interface ScrollingStaffProps {
    notes: GeneratedNote[];
    currentNoteIndex: number;
    keySignature: KeySignature;
    feedbackStatus: 'idle' | 'correct' | 'incorrect';
}

export default function ScrollingStaff({
    notes,
    currentNoteIndex,
    keySignature,
    feedbackStatus
}: ScrollingStaffProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    // Measure container width on mount and resize
    useEffect(() => {
        if (!containerRef.current) return;

        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };

        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    useEffect(() => {
        if (!containerRef.current || containerWidth === 0) {
            return;
        }

        if (notes.length === 0) {
            return;
        }

        // Clear previous rendering
        containerRef.current.innerHTML = '';

        try {
            const uniqueId = 'vexflow-scroll-' + Math.random().toString(36).substr(2, 9);
            const renderDiv = document.createElement('div');
            renderDiv.id = uniqueId;
            renderDiv.style.overflowX = 'auto';
            renderDiv.style.overflowY = 'hidden';
            renderDiv.style.width = '100%';
            containerRef.current.appendChild(renderDiv);

            const VF = Vex.Flow;
            const renderer = new VF.Renderer(renderDiv, VF.Renderer.Backends.SVG);

            // Responsive width calculation
            // On mobile: fit to screen, on desktop: allow horizontal scroll
            const isMobile = containerWidth < 768;
            const notesPerScreen = isMobile ? 4 : 8;
            const noteWidth = isMobile ? 80 : 120;
            const displayNotes = notes.slice(0, 20);
            const totalWidth = Math.max(containerWidth, displayNotes.length * noteWidth + 100);
            
            const width = totalWidth;
            const height = 250;
            
            renderer.resize(width, height);
            const context = renderer.getContext();

            // Create a stave
            const stave = new VF.Stave(10, 40, width - 20);
            const clef = 'treble';

            stave.addClef(clef);

            const keyStr = keySignature === 'Bb' || keySignature === 'Eb' || keySignature === 'Ab'
                ? keySignature
                : keySignature;
            stave.addKeySignature(keyStr);

            stave.setContext(context).draw();

            // Create notes
            const vfNotes = displayNotes.map(note => {
                const accidentalStr = note.accidental === '#' ? '#' : note.accidental === 'b' ? 'b' : '';
                const noteStr = `${note.note.toLowerCase()}${accidentalStr}/${note.octave}`;

                const staveNote = new StaveNote({
                    clef: clef,
                    keys: [noteStr],
                    duration: 'w'
                });

                if (note.accidental) {
                    staveNote.addModifier(new VF.Accidental(note.accidental));
                }

                return staveNote;
            });

            // Create a voice
            const voice = new Voice({ num_beats: vfNotes.length * 4, beat_value: 4 });
            voice.addTickables(vfNotes);

            // Format and draw
            new Formatter().joinVoices([voice]).format([voice], width - 100);
            voice.draw(context, stave);

            // Add smooth transition and colors
            const svg = renderDiv.querySelector('svg');
            if (svg) {
                svg.style.transition = 'all 0.3s ease-out';

                const noteheads = svg.querySelectorAll('.vf-notehead');
                noteheads.forEach((notehead, index) => {
                    if (index === currentNoteIndex) {
                        if (feedbackStatus === 'correct') {
                            notehead.setAttribute('fill', '#22c55e');
                            notehead.setAttribute('stroke', '#22c55e');
                        } else if (feedbackStatus === 'incorrect') {
                            notehead.setAttribute('fill', '#ef4444');
                            notehead.setAttribute('stroke', '#ef4444');
                        } else {
                            notehead.setAttribute('fill', '#3b82f6');
                            notehead.setAttribute('stroke', '#3b82f6');
                        }
                    } else if (index < currentNoteIndex) {
                        notehead.setAttribute('fill', '#9ca3af');
                        notehead.setAttribute('stroke', '#9ca3af');
                        notehead.setAttribute('opacity', '0.5');
                    } else {
                        notehead.setAttribute('fill', '#000000');
                        notehead.setAttribute('stroke', '#000000');
                    }
                });
            }

            // Auto-scroll to current note on mobile
            if (isMobile && currentNoteIndex > 2) {
                const scrollPosition = (currentNoteIndex - 2) * noteWidth;
                renderDiv.scrollTo({ left: scrollPosition, behavior: 'smooth' });
            }

        } catch (error) {
            console.error('❌ VexFlow rendering error:', error);
            if (containerRef.current) {
                containerRef.current.innerHTML = `
                    <div style="color: red; padding: 20px; font-size: 14px;">
                        <strong>Errore rendering:</strong> ${error}
                    </div>
                `;
            }
        }

    }, [notes, currentNoteIndex, keySignature, feedbackStatus, containerWidth]);

    return (
        <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 lg:p-8 mb-4 sm:mb-6 w-full max-w-full overflow-hidden">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 text-center">
                🎵 Pentagramma
            </h2>

            {notes.length > 0 ? (
                <>
                    <div
                        ref={containerRef}
                        className="flex justify-start items-center min-h-[250px] overflow-x-auto overflow-y-hidden border-2 border-gray-200 rounded-lg w-full"
                        style={{ maxWidth: '100%' }}
                    />

                    <div className="text-center mt-3 sm:mt-4 text-gray-600 space-y-1">
                        <p className="text-xs sm:text-sm">
                            <span className="inline-block w-3 h-3 sm:w-4 sm:h-4 bg-blue-600 rounded-full mr-2"></span>
                            Nota corrente
                        </p>
                        <p className="text-xs sm:text-sm">
                            <span className="inline-block w-3 h-3 sm:w-4 sm:h-4 bg-gray-400 rounded-full mr-2"></span>
                            Già suonate
                        </p>
                    </div>
                </>
            ) : (
                <div className="text-center text-gray-500 py-12 sm:py-20">
                    <p className="text-base sm:text-xl">Premi <strong>START</strong> per iniziare</p>
                </div>
            )}
        </div>
    );
}
