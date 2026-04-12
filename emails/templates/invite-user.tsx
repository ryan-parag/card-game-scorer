import {
  Button,
  Heading,
  Hr,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from '../components/EmailLayout';
import { EmailLogo } from '../components/EmailLogo';

// Supabase injects these variables when sending
// See: https://supabase.com/docs/guides/auth/auth-email-templates
const CONFIRMATION_URL = '{{ .ConfirmationURL }}';

export const InviteUserEmail = () => (
  <EmailLayout preview="You've been invited to ScoreKeeper">
    <EmailLogo />

    <Heading className="text-stone-900 text-xl font-black text-center mt-0 mb-2">
      You're invited to ScoreKeeper
    </Heading>

    <Text className="text-stone-600 text-sm text-center mb-6">
      Someone has invited you to join ScoreKeeper — the easiest way to track
      scores for card games and board games with friends.
    </Text>

    <Section className="text-center mb-6">
      <Button
        href={CONFIRMATION_URL}
        className="bg-stone-900 text-white rounded-lg px-6 py-3 text-sm font-medium no-underline inline-block"
      >
        Accept invitation
      </Button>
    </Section>

    <Text className="text-stone-400 text-xs text-center">
      Or copy and paste this URL into your browser:
      <br />
      <span className="text-stone-500 break-all">{CONFIRMATION_URL}</span>
    </Text>

    <Hr className="border-stone-200 my-6" />

    <Text className="text-stone-400 text-xs text-center m-0">
      If you didn't expect this invitation, you can safely ignore this email.
    </Text>
  </EmailLayout>
);

export default InviteUserEmail;
