import {
  Check as CheckIcon,
  ExternalLink as ExternalLinkIcon,
  Trash as TrashIcon,
} from 'lucide-react'
import Link from 'next/link'
import { isValidUrl } from './lib/is-valid-url'
import { Button } from '@seeds/ui/button'
import { TextField } from '@seeds/ui/text-field'

export interface AnyEvent {
  preventDefault: () => void
  stopPropagation: () => void
}

interface Props {
  url: string
  onChangeUrl: (value: string) => void
  onSaveLink: (e: AnyEvent) => void
  onRemoveLink: (e: AnyEvent) => void
}

export function LinkEditor({
  url,
  onChangeUrl,
  onSaveLink,
  onRemoveLink,
}: Props) {
  function handleEnter(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()
    onSaveLink(e)
  }

  return (
    <div className='flex items-center gap-1'>
      <div onClickCapture={(e) => e.stopPropagation()}>
        <TextField
          placeholder='Enter a url...'
          autoFocus
          value={url}
          onChange={onChangeUrl}
          onKeyDownCapture={(e) => {
            if (e?.key === 'Enter') {
              e.preventDefault()
              e.stopPropagation()
              onSaveLink(e)
            }
          }}
        />
      </div>
      <Button
        type='button'
        size='icon'
        variant='default'
        onClick={handleEnter}
        className='size-7 bg-primary hover:bg-primary-hover active:bg-primary-active'>
        <CheckIcon className='size-4' />
      </Button>
      <Button
        type='button'
        size='icon'
        variant='ghost'
        onClick={onRemoveLink}
        className='size-7 hover:bg-destructive-subtle hover:text-destructive-vibrant border border-transparent hover:border-destructive-border'>
        <TrashIcon className='size-4' />
      </Button>
      {!!url && isValidUrl(url) && (
        <Button asChild className='hover:bg-secondary size-7' variant='ghost'>
          <Link href={url} target='_blank'>
            <ExternalLinkIcon className='size-4' />
          </Link>
        </Button>
      )}
    </div>
  )
}
