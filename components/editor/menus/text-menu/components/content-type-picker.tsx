import { DropdownButton, DropdownCategoryTitle } from '@/components/ui/dropdown'
import { Icon } from '@/components/ui/icon'
import { Surface } from '@/components/ui/surface'
import { Toolbar } from '@/components/ui/toolbar'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { icons } from 'lucide-react'
import { useMemo } from 'react'

export type ContentTypePickerOption = {
  label: string
  id: string
  type: 'option'
  disabled: () => boolean
  isActive: () => boolean
  onClick: () => void
  icon: keyof typeof icons
}

export type ContentTypePickerCategory = {
  label: string
  id: string
  type: 'category'
}

export type ContentPickerOptions = Array<
  ContentTypePickerOption | ContentTypePickerCategory
>

export type ContentTypePickerProps = {
  options: ContentPickerOptions
  onOpenChange?: (open: boolean) => void
}

const isOption = (
  option: ContentTypePickerOption | ContentTypePickerCategory
): option is ContentTypePickerOption => option.type === 'option'
const isCategory = (
  option: ContentTypePickerOption | ContentTypePickerCategory
): option is ContentTypePickerCategory => option.type === 'category'

export const ContentTypePicker = ({
  options,
  onOpenChange,
}: ContentTypePickerProps) => {
  const activeItem = useMemo(
    () =>
      options.find((option) => option.type === 'option' && option.isActive()),
    [options]
  )

  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open)
    }
  }

  return (
    <Dropdown.Root onOpenChange={handleOpenChange}>
      <Dropdown.Trigger asChild>
        <Toolbar.Button
          active={activeItem?.id !== 'paragraph' && !!activeItem?.type}>
          <Icon
            name={
              (activeItem?.type === 'option' && activeItem.icon) || 'Pilcrow'
            }
          />
          <Icon name='ChevronDown' className='w-2 h-2' />
        </Toolbar.Button>
      </Dropdown.Trigger>
      <Dropdown.Content asChild>
        <Surface className='flex flex-col gap-1 px-2 py-4'>
          {options.map((option) => {
            if (isOption(option)) {
              return (
                <DropdownButton key={option.id} isActive={option.isActive()}>
                  <Icon name={option.icon} className='w-4 h-4 mr-1' />
                  {option.label}
                </DropdownButton>
              )
            } else if (isCategory(option)) {
              return (
                <div className='mt-2 first:mt-0' key={option.id}>
                  <DropdownCategoryTitle key={option.id}>
                    {option.label}
                  </DropdownCategoryTitle>
                </div>
              )
            }
          })}
        </Surface>
      </Dropdown.Content>
    </Dropdown.Root>
  )
}
