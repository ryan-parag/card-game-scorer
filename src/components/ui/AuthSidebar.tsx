'use client';
import { useState } from 'react';
import { getSettings, saveSettings } from '@/utils/storage';
import { Drawer } from 'vaul';
import { Button } from './button';
import { CircleUserRound, Trophy, ShieldHalf, ClipboardCheck, History, LayoutDashboard, BadgePlus, Users, Palette, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NeutralSelector, NeutralKey } from '@/components/ui/NeutralSelector';
import { motion, AnimatePresence } from 'framer-motion';
 
export default function AuthSidebar({ user, handleSignOut }: { user: any, handleSignOut: () => void }) {
  const navigate = useNavigate();
  const [neutral, setNeutral] = useState<NeutralKey>(getSettings().neutral || 'stone');
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const handleNeutralChange = (key: NeutralKey) => {
    setNeutral(key);
    document.documentElement.setAttribute('data-neutral', key);
    saveSettings({ neutral: key });
  };

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
      <Drawer.Overlay className="fixed z-40 inset-0 bg-foreground/40" />
      <Drawer.Content
        className="right-2 top-2 bottom-2 fixed z-50 outline-none w-full max-w-xs flex"
        // The gap between the edge of the screen and the drawer is 8px in this case.
        style={{ '--initial-transform': 'calc(100% + 8px)' } as React.CSSProperties}
      >
        <div className="bg-card border border-border h-full w-full grow flex flex-col rounded-[16px] overflow-hidden">
          <div className="mx-auto w-full relative z-10 h-full relative">
            <Drawer.Title className="px-5 pt-5 font-medium mb-2 text-muted-foreground text-sm">Navigation</Drawer.Title>
            <div className="flex flex-col w-full items-start justify-start h-full">
              <div className="flex flex-col w-full">
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
                            className={`px-2 w-full justify-start ${isActive ? 'bg-secondary hover:bg-secondary text-foreground font-medium' : 'text-muted-foreground'}`}
                            onClick={() => navigate(item.page)}
                          >
                            <div className={`p-1 rounded-md bg-muted mr-2 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                              {item.icon}
                            </div>
                            {item.label}
                          </Button>
                        </li>
                      );
                    })
                  }
                </ul>
                <div className="h-px bg-border mt-4 w-full"/>
                <div className="flex flex-col items-center justify-between">
                  <button
                    onClick={() => { setOpen(!open); }}
                    className="px-6 py-3 hover:bg-muted/70 text-sm flex items-center w-full text-black/70 dark:text-white/70 hover:text-black dark:text-white"
                  >
                    <div className="flex items-center w-full flex-1">
                      <Palette className="w-4 h-4 mr-2"/>
                      Change Theme
                    </div>
                    <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${open ? 'rotate-90' : ''}`}/>
                  </button>
                  <AnimatePresence>
                    {open && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden px-6 py-2 w-full"
                      >
                        <NeutralSelector value={neutral} onChange={handleNeutralChange}/>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="h-px bg-border mb-4 w-full"/>
              </div>
              <Drawer.Description className="w-full text-foreground absolute bottom-0 left-0 right-0 border-t border-black/5 dark:border-white/5 py-4 bg-black/5 dark:bg-white/5">
              <div className="flex w-full gap-3 items-start px-5">
                <div className="mt-2 w-12 h-12 rounded-full overflow-hidden bg-muted">
                  {
                    user.user_metadata.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt={'image'} className="w-full h-full rounded-full"/>
                    )
                    :
                    (
                      <div className="w-full h-full rounded-full overflow-hidden p-0 text-muted-foreground">
                        <CircleUserRound className="w-full h-full" />
                      </div>
                    )
                  }
                </div>
                <div className="flex flex-col flex-1 w-full items-start gap-1 text-sm">
                  {user.email}
                  <div className="flex gap-2 items-center">
                    <Button
                      onClick={handleSignOut}
                      size="xs"
                      variant="default"
                    >Sign out</Button>
                  </div>
                </div>
              </div>
            </Drawer.Description>
            </div>
          </div>
          <div className="rounded-[16px] absolute bg-gradient-to-b from-transparent to-secondary bottom-0 left-0 right-0 h-screen"/>
        </div>
      </Drawer.Content>
    </Drawer.Portal>
  );
}