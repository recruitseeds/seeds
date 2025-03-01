import { Icon } from '@/components/ui/icon'
import { Surface } from '@/components/ui/surface'
import { Toolbar } from '@/components/ui/toolbar'
import { Tooltip } from '@/components/ui/tooltip'

export type LinkPreviewPanelProps = {
  url: string
  onEdit: () => void
  onClear: () => void
}

export const LinkPreviewPanel = ({
  onClear,
  onEdit,
  url,
}: LinkPreviewPanelProps) => {
  const sanitizedLink = url?.startsWith('javascript:') ? '' : url
  return (
    <Surface className='flex items-center gap-2 p-2'>
      <a
        href={sanitizedLink}
        target='_blank'
        rel='noopener noreferrer'
        className='text-sm underline break-all'>
        {url}
      </a>
      <Toolbar.Divider />
      <Tooltip title='Edit link'>
        <Toolbar.Button onClick={onEdit}>
          <Icon name='Pen' />
        </Toolbar.Button>
      </Tooltip>
      <Tooltip title='Remove link'>
        <Toolbar.Button onClick={onClear}>
          <Icon name='Trash2' />
        </Toolbar.Button>
      </Tooltip>
    </Surface>
  )
}
