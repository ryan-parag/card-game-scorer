import { Button, Heading, Hr, Link, Section, Text } from 'react-email';
import * as React from 'react';
import { EmailLayout } from './EmailLayout.js';
import { EmailLogo } from './EmailLogo.js';

// Shared frame for the notification emails we send through Resend (as opposed
// to the auth emails pasted into Supabase). Imports use .js extensions because
// these files also run on the server as plain ES modules.

export const SITE_URL = 'https://scorekeeper.ryanparag.com';

export interface NotificationLinks {
  // Turns off this kind of email in one click.
  unsubscribeUrl: string;
  // Profile page with all email settings.
  settingsUrl: string;
}

interface NotificationLayoutProps extends NotificationLinks {
  preview: string;
  heading: string;
  children: React.ReactNode;
  cta?: { label: string; href: string };
  // Why they're getting it, e.g. "You're a member of Thursday Card Club."
  reason: string;
  // What the unsubscribe link turns off, e.g. "league updates".
  category: string;
}

export const NotificationLayout = ({
  preview,
  heading,
  children,
  cta,
  reason,
  category,
  unsubscribeUrl,
  settingsUrl,
}: NotificationLayoutProps) => (
  <EmailLayout preview={preview}>
    <EmailLogo src={`${SITE_URL}/images/scorekeeper-logo.png`} />

    <Heading className="text-stone-900 text-xl font-black text-center mt-0 mb-3">
      {heading}
    </Heading>

    {children}

    {cta && (
      <Section className="text-center mt-6 mb-2">
        <Button
          href={cta.href}
          className="bg-stone-900 text-white rounded-lg px-6 py-3 text-sm font-medium no-underline inline-block"
        >
          {cta.label}
        </Button>
      </Section>
    )}

    <Hr className="border-stone-200 my-6" />

    <Text className="text-stone-400 text-xs text-center m-0">
      {reason}{' '}
      <Link href={unsubscribeUrl} className="text-stone-500 underline">
        Stop {category} emails
      </Link>
      {' · '}
      <Link href={settingsUrl} className="text-stone-500 underline">
        Email settings
      </Link>
    </Text>
  </EmailLayout>
);

export const Paragraph = ({ children }: { children: React.ReactNode }) => (
  <Text className="text-stone-600 text-sm text-center my-2">{children}</Text>
);

export const previewLinks: NotificationLinks = {
  unsubscribeUrl: `${SITE_URL}/api/notifications/unsubscribe`,
  settingsUrl: `${SITE_URL}/profile`,
};
