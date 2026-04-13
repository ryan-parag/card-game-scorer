'use client';
 
import { Drawer } from 'vaul';
import { Button } from './button';
import { CircleUserRound, Trophy, ShieldHalf, ClipboardCheck, History, LayoutDashboard, BadgePlus, Users } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
 
export default function AuthSidebar({ user, handleSignOut }: { user: any, handleSignOut: () => void }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const iconSize = 16;

  const navItems =[
    { label: 'Home', page: '/', icon: <LayoutDashboard size={iconSize}/> },
    { label: 'Game History', page: '/history', icon: <History size={iconSize}/> },
    { label: 'Leaderboard', page: '/leaderboard', icon: <Trophy size={iconSize}/> },
    { label: 'Leagues',page: '/leagues', icon: <ShieldHalf size={iconSize}/> },
    { label: 'Scoring System', page: '/scoring-system', icon: <ClipboardCheck size={iconSize}/> },
    { label: 'Friends', page: '/friends', icon: <Users size={iconSize}/> },
    { label: 'Profile', page: '/profile', icon: <CircleUserRound size={iconSize}/> },
  ]

  return (
    <Drawer.Portal>
      <Drawer.Overlay className="fixed z-40 inset-0 bg-stone-800/50" />
      <Drawer.Content
        className="right-2 top-2 bottom-2 fixed z-50 outline-none w-full max-w-xs flex"
        // The gap between the edge of the screen and the drawer is 8px in this case.
        style={{ '--initial-transform': 'calc(100% + 8px)' } as React.CSSProperties}
      >
        <div className="bg-white dark:bg-stone-900 border border-black/10 dark:border-white/5 h-full w-full grow flex flex-col rounded-[16px]">
          <div className="mx-auto w-full">
            <Drawer.Title className="px-5 pt-5 font-medium mb-2 text-stone-500 dark:text-stone-600 text-sm">Navigation</Drawer.Title>
            <ul className="px-3 flex flex-col gap-px">
              <li className="px-2">
                <Button
                  variant="secondary"
                  className="px-2 my-2 w-full"
                  onClick={() => navigate('/new-game')}
                >
                  <div className="mr-2">
                    <BadgePlus size={20}/>
                  </div>
                  New Game
                </Button> 
              </li>
              {
                navItems.map((item, index) => {
                  const isActive = item.page === '/' ? pathname === '/' : pathname.startsWith(item.page);
                  return (
                    <li key={index}>
                      <Button
                        variant="ghost"
                        className={`px-2 w-full justify-start ${isActive ? 'bg-stone-200 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-950 dark:text-white font-medium' : 'text-stone-700 dark:text-stone-300'}`}
                        onClick={() => navigate(item.page)}
                      >
                        <div className={`p-1 rounded-md bg-stone-200 dark:bg-stone-800 mr-2 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                          {item.icon}
                        </div>
                        {item.label}
                      </Button>
                    </li>
                  );
                })
              }
            </ul>
            <div className="h-px bg-black/10 dark:bg-white/10 my-4 w-full"/>
            <Drawer.Description className="w-full dark:text-stone-200 text-stone-700 mb-2">
              <div className="flex w-full gap-3 items-start px-5">
                <div className="mt-2 w-14 h-14 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-700">
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
                </div>
                <div className="flex flex-col flex-1 w-full items-start gap-2">
                  {user.email}
                  <div className="flex gap-2 items-center">
                    <Button
                      onClick={handleSignOut}
                      size="sm"
                      variant="secondary"
                    >Sign out</Button>
                  </div>
                </div>
              </div>
            </Drawer.Description>
          </div>
        </div>
      </Drawer.Content>
    </Drawer.Portal>
  );
}