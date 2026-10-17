import {
  Body,
  Container,
  Font,
  Head,
  Html,
  Preview,
  Tailwind,
} from 'react-email';
import * as React from 'react';
import { tailwindConfig } from '../tailwind.config.js';

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
    <Tailwind config={tailwindConfig}>
      <Body className="bg-stone-100 font-sans my-auto mx-auto">
        {/* No shadow: Tailwind's shadows compile to CSS variables, and Gmail drops
            the whole style attribute (background, width, border) when it sees one. */}
        <Container className="bg-white rounded-2xl my-10 mx-auto p-8 max-w-[480px] border border-solid border-stone-200">
          {children}
        </Container>
      </Body>
    </Tailwind>
  </Html>
);
