import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ActiveFiltersProps {
  activeFilters: {
    programTypes: string[];
    regions: string[];
    institutionTypes: string[];
    language: string | null;
  };
  onRemoveFilter: (type: 'programTypes' | 'regions' | 'institutionTypes' | 'language', value: string) => void;
}

const filterColors = {
  programTypes: ['#00ffd5', '#00ffaa', '#80ffea'],
  regions: ['#ff00ff', '#ff00aa', '#ff80ea'],
  institutionTypes: ['#ffff00', '#ffaa00', '#ffcc80'],
  language: ['#00ffff', '#00aaff', '#80eaff']
} as const;

export function ActiveFilters({ activeFilters, onRemoveFilter }: ActiveFiltersProps) {
  const hasActiveFilters = Object.values(activeFilters).some(v => 
    Array.isArray(v) ? v.length > 0 : v !== null
  );

  if (!hasActiveFilters) return null;

  const getFilterStyle = (type: keyof typeof filterColors) => {
    const [color1, color2, color3] = filterColors[type];
    return {
      background: `linear-gradient(135deg, 
        ${color1}15 0%, 
        ${color2}20 50%,
        ${color3}15 100%
      )`,
      boxShadow: `
        0 0 20px ${color1}20,
        inset 0 0 10px ${color2}20
      `,
      border: `1px solid ${color1}30`
    };
  };

  return (
    <motion.div 
      className="
        flex flex-wrap gap-3 p-4 rounded-xl
        bg-black/60 backdrop-blur-2xl
        border border-white/20
        shadow-[0_0_50px_rgba(0,255,255,0.1)]
      "
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <AnimatePresence mode="popLayout">
        {Object.entries(activeFilters).map(([type, values]) => {
          const filterType = type as keyof typeof activeFilters;
          const filterValues = Array.isArray(values) ? values : (values ? [values] : []);
          
          return filterValues.map((value, index) => (
            <motion.div
              key={`${type}-${value}`}
              layout
              initial={{ scale: 0, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: 20 }}
              transition={{ 
                type: "spring", 
                stiffness: 500, 
                damping: 25, 
                delay: index * 0.05 
              }}
            >
              <Badge
                className="
                  backdrop-blur-xl 
                  flex items-center gap-2 px-3 py-1.5
                  text-white/90 hover:text-white
                  transition-all duration-500
                  hover:scale-105
                  group
                "
                style={getFilterStyle(filterType)}
                variant="secondary"
              >
                <span className="
                  opacity-70 text-xs font-medium
                  bg-white/10 px-2 py-0.5 rounded-md
                ">
                  {type.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="font-semibold tracking-wide">
                  {value}
                </span>
                <motion.button
                  whileHover={{ scale: 1.2, rotate: 90 }}
                  whileTap={{ scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  onClick={() => onRemoveFilter(filterType, value)}
                  className="
                    ml-1 p-1 rounded-full
                    bg-white/5 hover:bg-white/20
                    transition-colors duration-300
                    shadow-lg
                  "
                >
                  <X size={14} className="text-white/90" />
                </motion.button>
              </Badge>
            </motion.div>
          ));
        })}
      </AnimatePresence>
    </motion.div>
  );
}