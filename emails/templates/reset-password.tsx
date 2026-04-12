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

export const ResetPasswordEmail = () => (
  <EmailLayout preview="Reset your ScoreKeeper password">
    <EmailLogo />

    <Heading className="text-stone-900 text-xl font-bold text-center mt-0 mb-2">
      Reset your password
    </Heading>

    <Text className="text-stone-600 text-sm text-center mb-6">
      We received a request to reset the password for your ScoreKeeper account.
      Click the button below to choose a new password.
    </Text>

    <Section className="text-center mb-6">
      <Button
        href={CONFIRMATION_URL}
        className="bg-stone-900 text-white rounded-lg px-6 py-3 text-sm font-medium no-underline inline-block"
      >
        Reset password
      </Button>
    </Section>

    <Text className="text-stone-400 text-xs text-center">
      Or copy and paste this URL into your browser:
      <br />
      <span className="text-stone-500 break-all">{CONFIRMATION_URL}</span>
    </Text>

    <Hr className="border-stone-200 my-6" />

    <Text className="text-stone-400 text-xs text-center m-0">
      If you didn't request a password reset, you can safely ignore this email.
      Your password won't be changed.
    </Text>
  </EmailLayout>
);

export default ResetPasswordEmail;
