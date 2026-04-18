import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import HoverShim from './HoverShim';

const ThemeToggle = ({ toggleTheme, isDark }: { toggleTheme: () => void, isDark: boolean }) => {
  return (
    <motion.button
			className={`rounded-full w-14 h-8 p-0.5 border border-border bg-secondary hover:bg-muted hover:border-input shadow-inner relative z-30 transition-all duration-200 overflow-hidden flex items-center group ${isDark ? 'justify-start' : 'justify-end'}`}
			onClick={toggleTheme}
    >
    <motion.div
			className="transition rounded-full h-[26px] w-[26px] bg-background shadow-sm"
			layout
			transition={{
			duration: 0.1
      }}
    />
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.24, delay: .1, type: "spring", stiffness: 150 }}
				className="absolute top-1/2 -translate-y-1/2 right-[6.5px] z-10"
			>
				<Sun className="w-4 h-4 text-yellow-700 dark:text-yellow-500" />
			</motion.div>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.24, delay: .1, type: "spring", stiffness: 150 }}
				className="absolute top-1/2 -translate-y-1/2 left-[6.5px]"
			>
				<Moon className="w-4 h-4 text-foreground/70 z-10" />
			</motion.div>
			<HoverShim/>
    </motion.button>
  );
};

export default ThemeToggle;