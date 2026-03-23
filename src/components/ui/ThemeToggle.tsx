import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = ({ toggleTheme, isDark }: { toggleTheme: () => void, isDark: boolean }) => {
  return (
    <motion.button
			className={`rounded-full w-14 h-8 p-0.5 border border-stone-300 dark:border-stone-800 dark:hover:border-stone-700 bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 shadow-inner hover:border-stone-400 hover:bg-stone-300 absolute top-8 right-6 lg:right-8 z-50 transition-all duration-200 overflow-hidden flex items-center ${isDark ? 'justify-start' : 'justify-end'}`}
			onClick={toggleTheme}
    >
    <motion.div
			className="rounded-full h-[26px] w-[26px] bg-white dark:bg-stone-950 shadow-sm"
			layout
			transition={{
			duration: 0.1
      }}
    />
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.24, delay: 1, type: "spring", stiffness: 150 }}
				className="absolute top-1/2 -translate-y-1/2 right-[6.5px] z-10"
			>
				<Sun className="w-4 h-4 text-yellow-700 dark:text-yellow-500" />
			</motion.div>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.24, delay: 1, type: "spring", stiffness: 150 }}
				className="absolute top-1/2 -translate-y-1/2 left-[6.5px]"
			>
				<Moon className="w-4 h-4 text-stone-700 dark:text-stone-200 z-10" />
			</motion.div>
    </motion.button>
  );
};

export default ThemeToggle;