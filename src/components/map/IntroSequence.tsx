import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreativeTitleHTML } from '@/components/typography/CreativeTitleHTML';

interface IntroSequenceProps {
    onIntroComplete: () => void;
    dict: any; // Dictionary for translations
    startAnimations: boolean; // Control when animations start
}

export function IntroSequence({
    onIntroComplete,
    dict,
    startAnimations
}: IntroSequenceProps) {
    const [titleProgress, setTitleProgress] = useState(0);
    const [overlayOpacity, setOverlayOpacity] = useState(0.7); // Start with semi-transparent

    useEffect(() => {
        if (startAnimations) {
            // Start title reveal animation immediately
            let progress = 0;
            const titleAnimation = setInterval(() => {
                progress += 0.02; // Slower progress
                setTitleProgress(Math.min(progress, 1));
                if (progress >= 1) {
                    clearInterval(titleAnimation);
                    // Start fading out overlay after title is fully revealed
                    setTimeout(() => {
                        setOverlayOpacity(0);
                    }, 1500); // Wait 1.5s after title is revealed
                }
            }, 16); // ~60fps

            // Complete intro after all animations
            const timer = setTimeout(() => {
                onIntroComplete();
            }, 6000); // Match total duration with camera animation

            return () => {
                clearInterval(titleAnimation);
                clearTimeout(timer);
            };
        }
    }, [startAnimations, onIntroComplete]);

    if (!startAnimations) {
        return null;
    }

    return (
        <motion.div
            key="intro-overlay"
            initial={{ 
                opacity: 1,
                backdropFilter: "blur(10px)",
                backgroundColor: "rgba(0, 0, 0, 0.7)"
            }}
            animate={{ 
                opacity: 1,
                backdropFilter: "blur(0px)",
                backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`
            }}
            exit={{ 
                opacity: 0,
                backdropFilter: "blur(0px)",
                backgroundColor: "rgba(0, 0, 0, 0)"
            }}
            transition={{ 
                duration: 2.0,
                ease: "easeInOut",
                when: "afterChildren"
            }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center"
        >
            <div className="text-center p-8 max-w-2xl relative">
                {/* Main Title */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20, transition: { duration: 0.5, ease: "easeInOut" } }}
                    transition={{ 
                        duration: 1.0,
                        ease: "easeOut",
                        delay: 0.5
                    }}
                    className="mb-8"
                >
                    <CreativeTitleHTML
                        text={dict?.introTitle || "German Art Schools"}
                        introProgress={titleProgress}
                        fontSize={2.0}
                    />
                </motion.div>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: titleProgress > 0.5 ? 1 : 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut", delay: 0.2 } }}
                    transition={{ 
                        duration: 1.0,
                        ease: "easeOut"
                    }}
                    className="text-xl text-slate-200/90 intro-glitch"
                >
                    {dict?.introSubtitle || "Exploring German Art, Media, and Design Education."}
                </motion.p>
            </div>
        </motion.div>
    );
} 