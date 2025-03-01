'use client'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Surface } from '@/components/ui/surface'
import { Toggle } from '@/components/ui/toggle'
import { useCallback, useMemo, useState } from 'react'

export type LinkEditorPanelProps = {
  initialUrl?: string
  initialOpenInNewTab?: boolean
  onSetLink: (url: string, openInNewTab?: boolean) => void
}

export const useLinkEditorState = ({
  initialUrl,
  initialOpenInNewTab,
  onSetLink,
}: LinkEditorPanelProps) => {
  const [url, setUrl] = useState(initialUrl || '')
  const [openInNewTab, setOpenInNewTab] = useState(initialOpenInNewTab || false)

  const onChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value)
  }, [])

  const isValidUrl = useMemo(() => /^(\S+):(\/\/)?\S+$/.test(url), [url])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (isValidUrl) {
        onSetLink(url, openInNewTab)
      }
    },
    [url, isValidUrl, openInNewTab, onSetLink]
  )

  return {
    url,
    setUrl,
    openInNewTab,
    setOpenInNewTab,
    onChange,
    handleSubmit,
    isValidUrl,
  }
}

export const LinkEditorPanel = ({
  onSetLink,
  initialOpenInNewTab,
  initialUrl,
}: LinkEditorPanelProps) => {
  const state = useLinkEditorState({
    onSetLink,
    initialOpenInNewTab,
    initialUrl,
  })

  const [toggle1, setToggle1] = useState(false)

  return (
    <Surface className='p-2'>
      <form onSubmit={state.handleSubmit} className='flex items-center gap-2'>
        <label className='flex items-center gap-2 p-2 rounded-lg dark:bg-neutral-900 cursor-text'>
          <Icon name='Link' className='flex-none text-black dark:text-white' />
          <Input
            type='url'
            placeholder='Enter URL'
            value={state.url}
            onChange={state.onChange}
          />
        </label>
        <Button
          variant='default'
          size='sm'
          type='submit'
          disabled={!state.isValidUrl}>
          Set Link
        </Button>
      </form>
      <div className='mt-3'>
        <label className='flex items-center justify-start gap-2 text-sm font-semibold cursor-pointer select-none text-neutral-500 dark:text-neutral-400'>
          Open in new tab
          <Toggle
            pressed={toggle1}
            onPressedChange={setToggle1}
            aria-label='Toggle bold'
          />
        </label>
      </div>
    </Surface>
  )
}
