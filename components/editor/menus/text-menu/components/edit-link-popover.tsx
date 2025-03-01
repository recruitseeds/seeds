import { Icon } from '@/components/ui/icon'
import { Toolbar } from '@/components/ui/toolbar'
import * as Popover from '@radix-ui/react-popover'
import { LinkEditorPanel } from '../../../panels/link-editor-panel'

export type EditLinkPopoverProps = {
  onSetLink: (link: string, openInNewTab?: boolean) => void
}

export const EditLinkPopover = ({ onSetLink }: EditLinkPopoverProps) => {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Toolbar.Button tooltip='Set Link'>
          <Icon name='Link' />
        </Toolbar.Button>
      </Popover.Trigger>
      <Popover.Content>
        <LinkEditorPanel onSetLink={onSetLink} />
      </Popover.Content>
    </Popover.Root>
  )
}
