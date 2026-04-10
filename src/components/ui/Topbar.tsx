import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import FeedbackPopover from "./FeedbackPopover";
import ThemeToggle from "./ThemeToggle";
import { Button } from "./button";
import { ArrowLeft, CircleUserRound } from "lucide-react";
import { supabase } from "../../lib/supabase";

const Topbar = ({ toggleTheme, isDark, onBack }: { toggleTheme: () => void, isDark: boolean, onBack?: () => void }) => {
	const navigate = useNavigate();
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		if (!supabase) return;

		supabase.auth.getUser().then(({ data }) => {
			setUser(data.user);
		});

		const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
		});

		return () => subscription.unsubscribe();
	}, []);

	const handleSignOut = async () => {
		if (!supabase) return;
		await supabase.auth.signOut();
		setUser(null);
	};

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
			<div className="flex items-center gap-2">
				<ThemeToggle toggleTheme={toggleTheme} isDark={isDark} />
				{supabase && !user && (
					<Button
						onClick={() => navigate('/signin')}
						size="sm"
						variant={'secondary'}
						className="rounded-full"
					>
						Sign in
					</Button>
				)}
				{supabase && user && (
					<Button
						onClick={handleSignOut}
						size="sm"
						variant="secondary"
						className="rounded-full p-0"
					>
						{
							user.user_metadata.avatar_url ? (
								<img src={user.user_metadata.avatar_url} alt={'image'} className="w-full h-full rounded-full"/>
							)
							:
							(
								<div className="w-full h-full rounded-full overflow-hidden p-0 dark:text-stone-400 text-stone-600">
									<CircleUserRound className="w-full h-full" />
								</div>
							)
						}
					</Button>
				)}
			</div>
		</div>
	)
}

export default Topbar;
