import React, { forwardRef, KeyboardEvent, useRef } from 'react'
import toast from 'react-hot-toast'

import { cn } from '@/lib/utils'
import { useCopyToClipboard } from '../../hooks/use-copy-to-clipboard'
import { isMetaEnter } from '../../lib/is-meta-enter'
import { LimitIndicator } from '../../lib/limit-indicator'
import { Button } from './button'
import { UIText } from './text'
import { TextareaAutosize } from './text-area-autosize'
import { Tooltip } from './tippy'

type InputType =
  | 'text'
  | 'email'
  | 'number'
  | 'password'
  | 'search'
  | 'tel'
  | 'url'
  | 'date'
  | 'datetime-local'
  | 'month'
  | 'time'
  | 'week'
  | 'currency'

interface Props {
  label?: string | React.ReactNode
  labelHidden?: boolean
  inlineError?: string | null
  helpText?: React.ReactNode
  id?: string
  name?: string
  type?: InputType
  value?: string
  placeholder?: string
  required?: boolean
  minLength?: number
  maxLength?: number
  // only applicable to multiline inputs
  minRows?: number
  // only applicable to multiline inputs
  maxRows?: number
  autoComplete?: string
  autoFocus?: boolean
  clickToCopy?: boolean | (() => void)
  readOnly?: boolean
  disabled?: boolean
  multiline?: boolean
  prefix?: string
  onChange?(value: string): void
  onPaste?(event: React.ClipboardEvent): void
  onFocus?: (event?: React.FocusEvent) => void
  onBlur?(event?: React.FocusEvent): void
  onKeyDown?(event: React.KeyboardEvent): void
  onKeyDownCapture?(event?: React.KeyboardEvent): void
  onCommandEnter?(event?: React.KeyboardEvent): void
  resize?: boolean
  indicatorThreshold?: number
  additionalClasses?: string
  containerClasses?: string
  inputClasses?: string
}

export function TextFieldLabel({
  children,
  labelHidden,
  htmlFor,
}: {
  children: React.ReactNode
  labelHidden?: boolean
  htmlFor?: string
}) {
  return (
    <UIText
      element='label'
      secondary
      weight='font-medium'
      className={cn('mb-1.5', {
        'sr-only': labelHidden,
      })}
      size='text-xs'
      htmlFor={htmlFor}>
      {children}
    </UIText>
  )
}

export function TextFieldError({ children }: { children: React.ReactNode }) {
  return (
    <UIText className='mt-2 border-l-2 border-destructive-border pl-3 text-destructive-vibrant'>
      {children}
    </UIText>
  )
}

export const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  props,
  ref
) {
  const {
    label = null,
    labelHidden,
    inlineError,
    helpText,
    id,
    name,
    type = 'text',
    value,
    placeholder,
    required,
    minLength,
    maxLength,
    minRows,
    maxRows = 100,
    autoComplete,
    autoFocus = false,
    clickToCopy = false,
    readOnly = false,
    onChange,
    onPaste,
    onKeyDown,
    onKeyDownCapture,
    onCommandEnter,
    onFocus,
    onBlur,
    disabled,
    multiline,
    prefix,
    indicatorThreshold,
    additionalClasses,
    containerClasses,
    inputClasses: inputClassesProp,
  } = props

  const inputRef = useRef<HTMLInputElement | null>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const [copy] = useCopyToClipboard()
  const [currentLength, setCurrentLength] = React.useState<number>(0)

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    if (maxLength) {
      setCurrentLength(event.currentTarget.value.length)
    }
    onChange && onChange(event.currentTarget.value)
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>
  ) {
    onKeyDown?.(event)
    if (isMetaEnter(event) && onCommandEnter) {
      onCommandEnter(event)
    }
  }

  async function handleCopyClick() {
    const input = multiline ? textAreaRef.current : inputRef.current

    input?.select()
    await copy(value as string)
    toast('Copied to clipboard')

    if (clickToCopy && typeof clickToCopy === 'function') {
      clickToCopy()
    }
  }

  const labelMarkup =
    typeof label === 'string' ? (
      <TextFieldLabel labelHidden={labelHidden} htmlFor={id ?? name}>
        {label}
      </TextFieldLabel>
    ) : (
      label
    )

  const prefixMarkup = prefix ? (
    <div className='bg-secondary relative flex min-h-full items-center rounded-l-md border border-r-0 px-2'>
      <UIText tertiary>{prefix}</UIText>
    </div>
  ) : null

  const helpMarkup = helpText ? (
    <div className='text-muted-foreground mt-2'>
      <UIText size='text-xs' inherit>
        {helpText}
      </UIText>
    </div>
  ) : null

  const errorMarkup = inlineError ? (
    <TextFieldError>{inlineError}</TextFieldError>
  ) : null

  const copyMarkup = clickToCopy ? (
    <Tooltip side='top' label='Copy'>
      <span className='absolute right-px top-px'>
        <Button
          variant='default'
          // iconOnly={<ClipboardIcon />}
          onClick={handleCopyClick}
          // accessibilityLabel='Copy to clipboard'
        />
      </span>
    </Tooltip>
  ) : null

  const inputClasses = cn(
    'border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
    'focus-visible:border-brand focus-visible:ring-brand-subtle focus-visible:ring-[2px]',
    'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
    {
      'border-red-600 focus:ring-red-100 bg-red-50 focus:border-red-600':
        inlineError,
      'pr-10': clickToCopy,
      'text-opacity-50': readOnly,
      'rounded-md': !prefix,
      'rounded-l-none': prefix,
      'opacity-50': disabled,
      'overflow-y-auto scrollbar-hide': multiline,
      truncate: !multiline,
      'resize-none': true,
      'pb-6': multiline,
      'pr-8': maxLength,
      [additionalClasses ?? '']: !!additionalClasses,
    },
    inputClassesProp
  )

  const inputMarkup = multiline ? (
    <TextareaAutosize
      id={id}
      name={name}
      readOnly={readOnly}
      className={inputClasses}
      style={{ fontFeatureSettings: "'calt' 0" }}
      value={value}
      placeholder={placeholder}
      onChange={handleChange}
      onKeyDownCapture={onKeyDownCapture}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      onClick={clickToCopy ? handleCopyClick : undefined}
      required={required}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      ref={textAreaRef}
      disabled={disabled}
      minRows={minRows}
      maxRows={maxRows}
      maxLength={maxLength}
      minLength={minLength}
    />
  ) : (
    <input
      type={type}
      id={id}
      name={name}
      readOnly={readOnly}
      className={inputClasses}
      style={{ fontFeatureSettings: "'calt' 0" }}
      value={value}
      placeholder={placeholder}
      onChange={handleChange}
      onPaste={onPaste}
      onKeyDownCapture={onKeyDownCapture}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      onClick={clickToCopy ? handleCopyClick : undefined}
      required={required}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      minLength={minLength}
      maxLength={maxLength}
      ref={(value) => {
        if (typeof ref === 'function') {
          ref(value)
        } else if (ref) {
          ref.current = value
        }

        inputRef.current = value
      }}
      disabled={disabled}
      // no reason for 1Password to interact with in-product text fields
      data-1p-ignore
    />
  )

  return (
    <div className={cn('relative flex flex-col', containerClasses)}>
      {labelMarkup}
      <div className='relative flex flex-1'>
        {prefixMarkup}
        {inputMarkup}
        {maxLength && (
          <div
            className={cn('absolute', {
              'bottom-2 right-2': multiline,
              'right-2 top-1/2 -translate-y-1/2': !multiline,
            })}>
            <LimitIndicator
              maxLength={maxLength}
              currentLength={currentLength}
              charThreshold={indicatorThreshold}
            />
          </div>
        )}

        {copyMarkup}
      </div>
      {helpMarkup}
      {errorMarkup}
    </div>
  )
})
