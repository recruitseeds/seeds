import { DropdownButton } from '@/components/ui/dropdown'
import { Icon } from '@/components/ui/icon'
import { Surface } from '@/components/ui/surface'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Command, MenuListProps } from './types'

export const MenuList = React.forwardRef(function MenuList(
  props: MenuListProps,
  ref
) {
  const scrollContainer = useRef<HTMLDivElement>(null)
  const activeItem = useRef<HTMLButtonElement>(null)

  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0)
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)

  // Reset selection when items change
  useEffect(() => {
    setSelectedGroupIndex(0)
    setSelectedCommandIndex(0)
  }, [props.items])

  const selectItem = useCallback(
    (groupIndex: number, commandIndex: number) => {
      const command = props.items[groupIndex].commands[commandIndex]
      props.command(command)
    },
    [props]
  )

  React.useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: React.KeyboardEvent }) => {
      if (event.key === 'ArrowDown') {
        if (!props.items.length) return false

        const commands = props.items[selectedGroupIndex].commands
        let newCommandIndex = selectedCommandIndex + 1
        let newGroupIndex = selectedGroupIndex

        if (newCommandIndex > commands.length - 1) {
          newCommandIndex = 0
          newGroupIndex = selectedGroupIndex + 1
        }
        if (newGroupIndex > props.items.length - 1) {
          newGroupIndex = 0
        }

        setSelectedCommandIndex(newCommandIndex)
        setSelectedGroupIndex(newGroupIndex)
        return true
      }

      if (event.key === 'ArrowUp') {
        if (!props.items.length) return false

        let newCommandIndex = selectedCommandIndex - 1
        let newGroupIndex = selectedGroupIndex

        if (newCommandIndex < 0) {
          newGroupIndex = selectedGroupIndex - 1
          if (newGroupIndex < 0) {
            newGroupIndex = props.items.length - 1
          }
          newCommandIndex = props.items[newGroupIndex].commands.length - 1 || 0
        }

        setSelectedCommandIndex(newCommandIndex)
        setSelectedGroupIndex(newGroupIndex)
        return true
      }

      if (event.key === 'Enter') {
        if (
          !props.items.length ||
          selectedGroupIndex === -1 ||
          selectedCommandIndex === -1
        ) {
          return false
        }
        selectItem(selectedGroupIndex, selectedCommandIndex)
        return true
      }

      return false
    },
  }))

  // Auto-scroll to active item
  useEffect(() => {
    if (activeItem.current && scrollContainer.current) {
      const offsetTop = activeItem.current.offsetTop
      const offsetHeight = activeItem.current.offsetHeight
      scrollContainer.current.scrollTop = offsetTop - offsetHeight
    }
  }, [selectedCommandIndex, selectedGroupIndex])

  const createCommandClickHandler = useCallback(
    (groupIndex: number, commandIndex: number) => {
      return () => {
        selectItem(groupIndex, commandIndex)
      }
    },
    [selectItem]
  )

  if (!props.items.length) {
    return null
  }

  return (
    <Surface
      ref={scrollContainer}
      className='max-h-[min(80vh,24rem)] overflow-auto flex-wrap mb-8 p-2'>
      <div className='grid grid-cols-1 gap-0.5'>
        {props.items.map((group, groupIndex) => (
          <React.Fragment key={`${group.title}-wrapper`}>
            <div
              className='text-[0.65rem] col-[1/-1] mx-2 mt-4 font-semibold tracking-wider select-none uppercase first:mt-0.5'
              key={`${group.title}`}>
              {group.title}
            </div>
            {group.commands.map((command: Command, commandIndex: number) => {
              const isActive =
                selectedGroupIndex === groupIndex &&
                selectedCommandIndex === commandIndex

              return (
                <DropdownButton
                  key={`${command.label}`}
                  ref={isActive ? activeItem : null}
                  isActive={isActive}
                  className='text-foreground [&_svg]:text-muted-foreground'
                  onClick={createCommandClickHandler(groupIndex, commandIndex)}>
                  <Icon name={command.iconName} className='mr-1' />
                  {command.label}
                </DropdownButton>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </Surface>
  )
})

MenuList.displayName = 'MenuList'

export default MenuList
