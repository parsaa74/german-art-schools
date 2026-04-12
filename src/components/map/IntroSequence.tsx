import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CreativeTitleHTML } from '@/components/typography/CreativeTitleHTML';

interface IntroSequenceProps {
    onIntroComplete: () => void;
    dict: any;
    startAnimations: boolean;
}

export function IntroSequence({
    onIntroComplete,
    dict,
    startAnimations
}: IntroSequenceProps) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(window.matchMedia('(pointer: coarse)').matches);
    }, []);

    useEffect(() => {
        if (!startAnimations) return;

        const timer = setTimeout(() => {
            onIntroComplete();
        }, 3200);

        return () => clearTimeout(timer);
    }, [startAnimations, onIntroComplete]);

    if (!startAnimations) return null;

    return (
        <motion.div
            key="intro-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black"
        >
            <div className="flex flex-col items-center gap-10">
                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.0, ease: 'easeOut', delay: 0.3 }}
                >
                    <CreativeTitleHTML
                        text={dict?.introTitle || 'German Art Schools'}
                        introProgress={1}
                        fontSize={2.4}
                    />
                </motion.div>

                {/* Pulsing dots */}
                <div className="flex items-center gap-3">
                    {[0, 1, 2].map((i) => (
                        <motion.span
                            key={i}
                            className="block w-1.5 h-1.5 rounded-full bg-blue-300/70"
                            animate={{ opacity: [0.2, 1, 0.2] }}
                            transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                delay: i * 0.25,
                                ease: 'easeInOut',
                            }}
                        />
                    ))}
                </div>

                {/* Control hint */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.0, ease: 'easeOut', delay: 1.2 }}
                    className="text-xs tracking-widest uppercase text-slate-500 select-none"
                >
                    {isMobile
                        ? 'Pinch to zoom · Drag to pan · Tap to explore'
                        : 'Scroll to zoom · Drag to pan · Click to explore'}
                </motion.p>
            </div>
        </motion.div>
    );
}
