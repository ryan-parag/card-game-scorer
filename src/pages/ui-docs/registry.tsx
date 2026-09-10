import React from 'react';
import { GuidelinesDoc } from './guidelines';
import { FoundationsDoc } from './foundations';
import { ProductPatternsDoc } from './product-patterns';
import {
  ButtonDoc,
  TagDoc,
  InputDoc,
  NumberInputDoc,
  CheckboxDoc,
  SelectDoc,
  DatePickerDoc,
  TooltipDoc,
  HoverCardDoc,
  DropdownMenuDoc,
  TableDoc,
} from './components';
import { ThemeToggleDoc, NeutralSelectorDoc, AvatarsDoc, PageHeroDoc, FixedActionBarDoc } from './patterns';

export type DocGroup = 'Overview' | 'Components' | 'Patterns';

export interface DocEntry {
  slug: string;
  label: string;
  group: DocGroup;
  Component: React.FC;
}

export const docsRegistry: DocEntry[] = [
  { slug: 'guidelines', label: 'Guidelines', group: 'Overview', Component: GuidelinesDoc },
  { slug: 'foundations', label: 'Foundations', group: 'Overview', Component: FoundationsDoc },
  { slug: 'product-patterns', label: 'Product Patterns', group: 'Overview', Component: ProductPatternsDoc },

  { slug: 'button', label: 'Button', group: 'Components', Component: ButtonDoc },
  { slug: 'tag', label: 'Tag', group: 'Components', Component: TagDoc },
  { slug: 'input', label: 'Input', group: 'Components', Component: InputDoc },
  { slug: 'number-input', label: 'Number Input', group: 'Components', Component: NumberInputDoc },
  { slug: 'checkbox', label: 'Checkbox', group: 'Components', Component: CheckboxDoc },
  { slug: 'select', label: 'Select', group: 'Components', Component: SelectDoc },
  { slug: 'date-picker', label: 'Date Picker', group: 'Components', Component: DatePickerDoc },
  { slug: 'tooltip', label: 'Tooltip', group: 'Components', Component: TooltipDoc },
  { slug: 'hover-card', label: 'Hover Card', group: 'Components', Component: HoverCardDoc },
  { slug: 'dropdown-menu', label: 'Dropdown Menu', group: 'Components', Component: DropdownMenuDoc },
  { slug: 'table', label: 'Table', group: 'Components', Component: TableDoc },

  { slug: 'page-hero', label: 'Page Hero', group: 'Patterns', Component: PageHeroDoc },
  { slug: 'theme-toggle', label: 'Theme Toggle', group: 'Patterns', Component: ThemeToggleDoc },
  { slug: 'neutral-selector', label: 'Neutral Selector', group: 'Patterns', Component: NeutralSelectorDoc },
  { slug: 'avatars', label: 'Avatars', group: 'Patterns', Component: AvatarsDoc },
  { slug: 'fixed-action-bar', label: 'Fixed Action Bar', group: 'Patterns', Component: FixedActionBarDoc },
];

export const docGroups: DocGroup[] = ['Overview', 'Components', 'Patterns'];
