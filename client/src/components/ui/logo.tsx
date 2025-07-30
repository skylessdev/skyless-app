import { motion } from 'framer-motion';

export function Logo() {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative"
    >
      <motion.div
        animate={{ 
          boxShadow: [
            '0 0 20px rgba(255, 255, 255, 0.1)',
            '0 0 30px rgba(255, 255, 255, 0.2)',
            '0 0 20px rgba(255, 255, 255, 0.1)'
          ],
          scale: [1, 1.02, 1]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="rounded-full"
      >
        <svg width="120" height="120" viewBox="0 0 120 120" className="transform transition-transform hover:scale-105">
          {/* Outer ring */}
          <motion.circle 
            cx="60" 
            cy="60" 
            r="55" 
            fill="none" 
            stroke="rgba(255,255,255,0.2)" 
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          {/* Middle ring */}
          <motion.circle 
            cx="60" 
            cy="60" 
            r="45" 
            fill="none" 
            stroke="rgba(255,255,255,0.3)" 
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.3, ease: "easeInOut" }}
          />
          {/* Inner ring */}
          <motion.circle 
            cx="60" 
            cy="60" 
            r="35" 
            fill="none" 
            stroke="rgba(255,255,255,0.4)" 
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.6, ease: "easeInOut" }}
          />
          {/* Core circle */}
          <circle 
            cx="60" 
            cy="60" 
            r="25" 
            fill="rgba(255,255,255,0.1)" 
            stroke="rgba(255,255,255,0.6)" 
            strokeWidth="2"
          />
          {/* Asterisk icon */}
          <g transform="translate(60,60)" stroke="white" strokeWidth="3" strokeLinecap="round">
            <line x1="0" y1="-12" x2="0" y2="12"/>
            <line x1="-12" y1="0" x2="12" y2="0"/>
            <line x1="-8.5" y1="-8.5" x2="8.5" y2="8.5"/>
            <line x1="-8.5" y1="8.5" x2="8.5" y2="-8.5"/>
          </g>
        </svg>
      </motion.div>
    </motion.div>
  );
}
