import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag, TagLink } from './tag';
import { User, Info } from 'lucide-react';

const meta = {
  title: 'UI/Tag',
  component: Tag,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['default', 'error', 'success', 'warning', 'info', 'secondary'],
    },
    type: {
      control: 'select',
      options: ['default', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg'],
    },
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Default',
    color: 'default',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex gap-2">
      <Tag color="default" size={"lg"}>Large</Tag>
      <Tag color="default">Default</Tag>
      <Tag color="default" size={"sm"}>Small</Tag>
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="flex gap-2">
      <Tag color="default">Default</Tag>
      <Tag color="success">Success</Tag>
      <Tag color="error">Error</Tag>
      <Tag color="warning">Warning</Tag>
      <Tag color="info">Info</Tag>
      <Tag color="secondary">Secondary</Tag>
    </div>
  ),
};

export const Link = () => (
  <TagLink href="https://scorekeeper.ryanparag.com">Go to ScoreKeeper</TagLink>
);

export const Icon = () => (
  <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Tag leadingIcon={<User />}>Kimi Raikkonen</Tag>
        <Tag trailingIcon={<Info />}>More Info</Tag>
      </div>
    </div>
);
