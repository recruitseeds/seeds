'use client'

import {
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Modal,
  ModalOverlay,
  Button,
  Heading
} from 'react-aria-components'
import { XIcon } from 'lucide-react'
import * as React from 'react'

import { cn } from './lib/utils'

interface DialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function Dialog({ children, open, onOpenChange }: DialogProps) {
  if (open !== undefined && onOpenChange !== undefined) {
    
    return (
      <AriaDialogTrigger isOpen={open} onOpenChange={onOpenChange}>
        {children}
      </AriaDialogTrigger>
    )
  }

  
  return <AriaDialogTrigger>{children}</AriaDialogTrigger>
}

function DialogTrigger({ 
  children, 
  ...props 
}: React.ComponentProps<typeof Button>) {
  return (
    <Button data-slot="dialog-trigger" {...props}>
      {children}
    </Button>
  )
}

interface DialogContentProps {
  className?: string
  children: React.ReactNode
}

function DialogContent({ className, children, ...props }: DialogContentProps) {
  return (
    <ModalOverlay
      data-slot="dialog-overlay"
      className={cn(
        
        'fixed inset-0 z-[100] bg-black/80',
        
        'entering:animate-in entering:fade-in-0',
        'exiting:animate-out exiting:fade-out-0',
        
        'focus:outline-none focus-visible:outline-none'
      )}
    >
      <Modal
        data-slot="dialog-modal"
        className={cn(
          
          'fixed top-[50%] left-[50%] z-[100] grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%]',
          
          'gap-4 rounded-lg border bg-background p-6 shadow-lg',
          
          'sm:max-w-lg',
          
          'entering:animate-in entering:fade-in-0 entering:zoom-in-95 entering:duration-200',
          'exiting:animate-out exiting:fade-out-0 exiting:zoom-out-95 exiting:duration-200',
          
          'focus:outline-none focus-visible:outline-none',
          className
        )}
        {...props}
      >
        <AriaDialog data-slot="dialog-content" className="focus:outline-none focus-visible:outline-none">
          {children}
          {/* Close button matching Radix styling */}
          <Button
            slot="close"
            className="ring-offset-background data-[hovered]:bg-accent data-[hovered]:text-muted-foreground absolute top-4 right-4 rounded-sm focus:outline-2 focus:outline-offset-1 focus:outline-brand-subtle focus:ring-brand focus:ring-[1px] disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </Button>
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof Heading>) {
  return (
    <Heading
      slot="title"
      data-slot="dialog-title"
      className={cn('text-lg leading-none font-semibold', className)}
      {...props}
    />
  )
}

function DialogDescription({ className, children, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    >
      {children}
    </p>
  )
}


function DialogClose({ 
  children, 
  ...props 
}: React.ComponentProps<typeof Button>) {
  return (
    <Button slot="close" data-slot="dialog-close" {...props}>
      {children}
    </Button>
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
}