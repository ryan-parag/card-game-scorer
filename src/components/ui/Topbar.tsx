import FeedbackPopover from "./FeedbackPopover";
import ThemeToggle from "./ThemeToggle";
import { Button } from "./button";
import { ArrowLeft } from "lucide-react";

const Topbar = ({ toggleTheme, isDark, onBack }: { toggleTheme: () => void, isDark: boolean, onBack: () => void }) => {
	return (
		<div className="flex items-start justify-between px-4 pt-4 w-full absolute top-0 left-0 right-0 z-50">
			<div className="flex items-center gap-2 relative">
				<FeedbackPopover back={onBack}/>
				{
					onBack && (
						<Button
							onClick={onBack}
							variant="outline"
							size="icon"
							className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-white overflow-hidden rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform active:scale-[97%] active:shadow-inner hover:bg-stone-100 dark:hover:bg-stone-700"
						>
							<ArrowLeft className="w-6 h-6 text-stone-800 dark:text-stone-300" />
						</Button>
					)
				}
			</div>
			<ThemeToggle toggleTheme={toggleTheme} isDark={isDark} />
		</div>
	)
}

export default Topbar;