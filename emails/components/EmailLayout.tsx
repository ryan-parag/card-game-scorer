import {
  Body,
  Container,
  Font,
  Head,
  Html,
  Preview,
  Tailwind,
} from '@react-email/components';
import * as React from 'react';

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export const EmailLayout = ({ preview, children }: EmailLayoutProps) => (
  <Html>
    <Head>
      <Font
        fontFamily="Inter"
        fallbackFontFamily="Arial"
        webFont={{
          url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
          format: 'woff2',
        }}
        fontWeight={400}
        fontStyle="normal"
      />
    </Head>
    <Preview>{preview}</Preview>
    <Tailwind>
      <Body className="bg-stone-100 font-sans my-auto mx-auto">
        <Container className="bg-white rounded-2xl my-10 mx-auto p-8 max-w-[480px] shadow-sm border border-stone-200">
          {children}
        </Container>
      </Body>
    </Tailwind>
  </Html>
);
