import { Button } from '@/components/ui/button'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: [
        'brand',
        'default',
        'destructive',
        'secondary',
        'outline',
        'ghost',
        'link',
      ],
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
}

export default meta

type Story = StoryObj<typeof Button>

export const Brand: Story = {
  args: {
    children: 'Brand Button',
    variant: 'brand',
  },
}

export const Default: Story = {
  args: {
    children: 'Default Button',
    variant: 'default',
  },
}

export const Destructive: Story = {
  args: {
    children: 'Destructive Button',
    variant: 'destructive',
  },
}

export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
  },
}

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
}

export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
}

export const Link: Story = {
  args: {
    children: 'Link Button',
    variant: 'link',
  },
}

export const Sizes: Story = {
  render: () => (
    <div className='flex gap-2 items-center'>
      <Button size='sm'>Small Button</Button>
      <Button size='default'>Default Button</Button>
      <Button size='lg'>Large Button</Button>
      <Button size='icon'>Icon</Button>
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
}

export const WithIcon: Story = {
  render: () => (
    <div className='flex gap-2'>
      <Button>
        <span>Button with Icon</span>
      </Button>
      {/* Add more icon variations as needed */}
    </div>
  ),
}
