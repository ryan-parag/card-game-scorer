import type { Preview } from '@storybook/react-vite'
import React, { useEffect } from 'react'
import '../src/index.css'

const NEUTRALS = ['stone', 'slate', 'gray', 'zinc', 'neutral', 'olive', 'mist', 'mauve', 'taupe', 'oatmeal'] as const

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    },

    backgrounds: {
      disable: true,
    },
  },

  globalTypes: {
    theme: {
      description: 'App theme',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    neutral: {
      description: 'Neutral color palette',
      toolbar: {
        title: 'Neutral',
        icon: 'paintbrush',
        items: NEUTRALS.map((n) => ({ value: n, title: n })),
        dynamicTitle: true,
      },
    },
  },

  initialGlobals: {
    theme: 'dark',
    neutral: 'stone',
  },

  decorators: [
    (Story, context) => {
      const { theme, neutral } = context.globals

      useEffect(() => {
        const root = document.documentElement
        root.classList.toggle('dark', theme === 'dark')
        root.setAttribute('data-neutral', neutral)
      }, [theme, neutral])

      return (
        <div className="bg-background text-foreground min-h-[100px] p-4 font-sans">
          <Story />
        </div>
      )
    },
  ],
};

export default preview;
