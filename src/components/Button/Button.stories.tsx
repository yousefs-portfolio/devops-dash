import type {Meta, StoryObj} from '@storybook/react';
import {Button} from './Button';
import {Play, AlertTriangle, CheckCircle, Info} from 'lucide-react';

const meta: Meta<typeof Button> = {
    title: 'Components/Button',
    component: Button,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['primary', 'secondary', 'danger', 'success', 'ghost'],
        },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
        },
        disabled: {
            control: 'boolean',
        },
        loading: {
            control: 'boolean',
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
    args: {
        variant: 'primary',
        children: 'Deploy Changes',
    },
};

export const Secondary: Story = {
    args: {
        variant: 'secondary',
        children: 'View Details',
    },
};

export const Danger: Story = {
    args: {
        variant: 'danger',
        children: 'Delete Project',
    },
};

export const Success: Story = {
    args: {
        variant: 'success',
        children: 'Deployment Successful',
    },
};

export const Ghost: Story = {
    args: {
        variant: 'ghost',
        children: 'Cancel',
    },
};

export const WithIcon: Story = {
    args: {
        variant: 'primary',
        children: (
            <>
                <Play size={16}/>
                Start Pipeline
            </>
        ),
    },
};

export const Loading: Story = {
    args: {
        variant: 'primary',
        loading: true,
        children: 'Processing...',
    },
};

export const Disabled: Story = {
    args: {
        variant: 'primary',
        disabled: true,
        children: 'Unavailable',
    },
};

export const Small: Story = {
    args: {
        size: 'sm',
        variant: 'primary',
        children: 'Small Button',
    },
};

export const Large: Story = {
    args: {
        size: 'lg',
        variant: 'primary',
        children: 'Large Button',
    },
};

export const ButtonGroup: Story = {
    render: () => (
        <div style={{display: 'flex', gap: '8px'}}>
            <Button variant="primary">
                <CheckCircle size={16}/>
                Approve
            </Button>
            <Button variant="danger">
                <AlertTriangle size={16}/>
                Reject
            </Button>
            <Button variant="ghost">
                <Info size={16}/>
                More Info
            </Button>
        </div>
    ),
};