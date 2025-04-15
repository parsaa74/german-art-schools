import { motion } from 'framer-motion';

interface SchoolInfoProps {
    school: {
        name: string;
        description: string;
        founded: string;
        location: string;
    } | null;
    onClose: () => void;
}

export default function SchoolInfo({ school, onClose }: SchoolInfoProps) {
    if (!school) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur-md rounded-lg p-4 text-white"
        >
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold">{school.name}</h3>
                <button
                    onClick={onClose}
                    className="text-white/70 hover:text-white"
                >
                    ×
                </button>
            </div>
            <p className="text-sm text-white/70 mb-2">{school.description}</p>
            <div className="text-xs text-white/50">
                <p>Founded: {school.founded}</p>
                <p>Location: {school.location}</p>
            </div>
        </motion.div>
    );
} 