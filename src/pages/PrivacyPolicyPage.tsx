import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { getSettings, saveSettings } from '../utils/storage';
import Topbar from '../components/ui/Topbar';
import BlurBg from '../components/ui/BlurBg';

const EFFECTIVE_DATE = 'August 17, 2026';
const APP_NAME = 'ScoreKeeper';
const CONTACT_EMAIL = 'parag.ryan@gmail.com';

const SECTIONS: { heading: string; body: React.ReactNode }[] = [
  {
    heading: 'Overview',
    body: (
      <p>
        This Privacy Policy explains how {APP_NAME} ("we", "us", or "our") collects, uses, and
        protects information when you use our mobile application and website (together, the
        "App"). By using the App, you agree to the collection and use of information as
        described in this policy.
      </p>
    ),
  },
  {
    heading: 'Information We Collect',
    body: (
      <div className="flex flex-col gap-3">
        <p>We collect the following types of information:</p>
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>
            <span className="font-medium text-foreground">Account information.</span> If you
            create an account, we collect your name, email address, and password (stored in
            encrypted form). You may also add a profile photo.
          </li>
          <li>
            <span className="font-medium text-foreground">User content.</span> Game scores,
            player names, leagues, seasons, and related data you create or enter while using the
            App.
          </li>
          <li>
            <span className="font-medium text-foreground">Usage data.</span> Information about
            how you interact with the App, such as pages viewed, features used, and general
            device and diagnostic information (e.g. device type, operating system, app version),
            collected through analytics tools.
          </li>
          <li>
            <span className="font-medium text-foreground">Information from others.</span> If a
            friend invites you to a league or game, we may receive limited information such as
            your name or email address so we can facilitate that invitation.
          </li>
        </ul>
        <p>We do not knowingly collect precise location, payment card, or health data.</p>
      </div>
    ),
  },
  {
    heading: 'How We Use Information',
    body: (
      <ul className="list-disc pl-5 flex flex-col gap-1.5">
        <li>To provide, operate, and maintain the App's core features, such as scorekeeping, leagues, and leaderboards.</li>
        <li>To create and manage your account and authenticate you when you sign in.</li>
        <li>To let you connect with friends and share games or leagues you choose to participate in.</li>
        <li>To understand how the App is used so we can fix bugs and improve features.</li>
        <li>To communicate with you about your account, such as password resets or league invitations.</li>
        <li>To maintain the security and integrity of the App.</li>
      </ul>
    ),
  },
  {
    heading: 'Sharing of Information',
    body: (
      <div className="flex flex-col gap-3">
        <p>
          We do not sell your personal information. We share information only in the following
          circumstances:
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>
            <span className="font-medium text-foreground">With other users, as you direct.</span>{' '}
            Your name and game activity may be visible to other players in a shared game, league,
            or on a public profile you choose to make visible.
          </li>
          <li>
            <span className="font-medium text-foreground">Service providers.</span> We use
            trusted third-party providers to host our data and run analytics, including Supabase
            (database, authentication, and storage) and Google Analytics (usage analytics). These
            providers process data on our behalf and are not permitted to use it for their own
            purposes.
          </li>
          <li>
            <span className="font-medium text-foreground">Legal reasons.</span> If required to
            comply with applicable law, regulation, legal process, or governmental request.
          </li>
          <li>
            <span className="font-medium text-foreground">Business transfers.</span> If we are
            involved in a merger, acquisition, or sale of assets, your information may be
            transferred as part of that transaction.
          </li>
        </ul>
      </div>
    ),
  },
  {
    heading: 'Data Retention',
    body: (
      <p>
        We retain your information for as long as your account is active or as needed to provide
        you the App's features. If you delete your account, we will delete or anonymize your
        personal information within a reasonable period, except where we are required to retain
        it to comply with legal obligations, resolve disputes, or enforce our agreements.
      </p>
    ),
  },
  {
    heading: 'Your Choices and Rights',
    body: (
      <div className="flex flex-col gap-3">
        <p>Depending on where you live, you may have the right to:</p>
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>Access, correct, or update the personal information we hold about you.</li>
          <li>Request deletion of your account and associated data.</li>
          <li>Export a copy of your data.</li>
          <li>Withdraw consent, where processing is based on consent.</li>
        </ul>
        <p>
          You can update most account information directly within the App's profile settings, or
          contact us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-foreground underline underline-offset-2">
            {CONTACT_EMAIL}
          </a>{' '}
          to make a request.
        </p>
      </div>
    ),
  },
  {
    heading: 'Children’s Privacy',
    body: (
      <p>
        The App is not directed to children under the age of 13 (or the equivalent minimum age
        in your jurisdiction), and we do not knowingly collect personal information from
        children. If you believe a child has provided us with personal information, please
        contact us and we will take steps to delete it.
      </p>
    ),
  },
  {
    heading: 'Data Security',
    body: (
      <p>
        We use reasonable administrative, technical, and physical safeguards, including
        encryption in transit and secure authentication, to help protect your information.
        However, no method of transmission or storage is 100% secure, and we cannot guarantee
        absolute security.
      </p>
    ),
  },
  {
    heading: 'International Data Transfers',
    body: (
      <p>
        Your information may be stored and processed in countries other than the one in which
        you live. Where this occurs, we take steps to ensure your information receives an
        adequate level of protection.
      </p>
    ),
  },
  {
    heading: 'Third-Party Links',
    body: (
      <p>
        The App may contain links to third-party websites or services. We are not responsible
        for the privacy practices of those third parties, and we encourage you to review their
        privacy policies.
      </p>
    ),
  },
  {
    heading: 'Changes to This Policy',
    body: (
      <p>
        We may update this Privacy Policy from time to time. If we make material changes, we
        will notify you by updating the "Effective Date" below and, where appropriate, through
        the App or by other means. Your continued use of the App after changes take effect
        constitutes acceptance of the revised policy.
      </p>
    ),
  },
  {
    heading: 'Contact Us',
    body: (
      <p>
        If you have any questions about this Privacy Policy or how we handle your information,
        please contact us at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-foreground underline underline-offset-2">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    ),
  },
];

export const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const settings = getSettings();
    const dark = settings.theme === 'dark';
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveSettings({ theme: next ? 'dark' : 'light' });
  };

  return (
    <div className="relative min-h-screen w-full">
      <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate('/')} />
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary pt-12 lg:pt-16 px-4 pb-32">
        <div className="w-full max-w-3xl mx-auto mt-16 flex flex-col items-center">
          <motion.div
            className="w-full max-w-sm flex flex-col text-center items-center gap-3 mb-8 shadow-lg border border-border bg-card/50 backdrop-blur-xl p-5 rounded-xl relative transform z-0 overflow-hidden"
            initial={{ opacity: 0, y: '80px', rotate: 0 }}
            animate={{ opacity: 1, y: '48px', rotate: 2 }}
            exit={{ opacity: 0, y: '80px', rotate: 0 }}
            transition={{ duration: 0.24, delay: 0.4, type: 'spring', stiffness: 150 }}
          >
            <BlurBg />
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-b from-secondary to-muted text-muted-foreground shadow-2xl shadow-border/50 border border-black/5 dark:border-white/5">
              <ShieldCheck className="h-10 w-10" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-1">
                Privacy Policy
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Effective {EFFECTIVE_DATE}
              </p>
            </div>
          </motion.div>
          <div className="flex flex-col gap-4 w-full relative z-10">
            <motion.div
              className="w-full bg-card border border-border rounded-2xl shadow-xl overflow-hidden p-4 lg:p-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.02 }}
            >
              {SECTIONS.map((section, i) => (
                <div key={section.heading} className="flex flex-col mb-6">
                  <h2 className="text-sm font-bold text-muted-foreground mb-3">
                    {section.heading}
                  </h2>
                  <div className="text-sm text-foreground leading-6 flex flex-col gap-2">
                    {section.body}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
