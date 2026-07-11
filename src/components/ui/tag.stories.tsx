import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag, TagLink } from './tag';

const meta = {
  title: 'UI/Tag',
  component: Tag,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['default', 'error', 'success', 'warning', 'info', 'secondary'],
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

export const Success: Story = {
  args: {
    children: 'Won',
    color: 'success',
  },
};

export const Error: Story = {
  args: {
    children: 'Lost',
    color: 'error',
  },
};

export const Warning: Story = {
  args: {
    children: 'Pending',
    color: 'warning',
  },
};

export const AllColors: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Tag color="default">Default</Tag>
        <Tag color="success">Success</Tag>
        <Tag color="error">Error</Tag>
        <Tag color="warning">Warning</Tag>
        <Tag color="info">Info</Tag>
        <Tag color="secondary">Secondary</Tag>
      </div>
      <div className="flex gap-2">
        <Tag color="default" size="sm">Default</Tag>
        <Tag color="success" size="sm">Success</Tag>
        <Tag color="error" size="sm">Error</Tag>
        <Tag color="warning" size="sm">Warning</Tag>
        <Tag color="info" size="sm">Info</Tag>
        <Tag color="secondary" size="sm">Secondary</Tag>
      </div>
      <div className="flex gap-2">
        <Tag color="default" type="link">Link</Tag>
        <Tag color="success" type="link">Link</Tag>
        <Tag color="error" type="link">Link</Tag>
        <Tag color="warning" type="link">Link</Tag>
        <Tag color="info" type="link">Link</Tag>
        <Tag color="secondary" type="link">Link</Tag>
      </div>
      <div className="flex gap-2">
        <Tag color="default" size="sm" type="link">Link</Tag>
        <Tag color="success" size="sm" type="link">Link</Tag>
        <Tag color="error" size="sm" type="link">Link</Tag>
        <Tag color="warning" size="sm" type="link">Link</Tag>
        <Tag color="info" size="sm" type="link">Link</Tag>
        <Tag color="secondary" size="sm" type="link">Link</Tag>
      </div>
    </div>
  ),
};

export const Link = () => (
  <TagLink href="https://storybook.js.org">External link</TagLink>
);
