import {
  createContext,
  forwardRef,
  ForwardRefExoticComponent,
  HTMLAttributes,
  isValidElement,
  LabelHTMLAttributes,
  ReactNode,
  RefAttributes,
  useContext,
  useRef,
  useState,
} from 'react'

type InputRef = { current: HTMLInputElement | null }
type TagRefs = { current: (HTMLElement | null)[] }

interface TagsInputContextType {
  tags: string[]
  addTag: (tag: string) => void
  removeTag: (index: number) => void
  clearTags: () => void
  focusedTagIndex: number
  setFocusedTagIndex: (index: number) => void
  handleTagKeyDown: (e: React.KeyboardEvent, index: number) => void
  registerTagRef: (index: number, ref: HTMLElement | null) => HTMLElement | null
  registerInput: (ref: HTMLInputElement | null) => HTMLInputElement | null
  inputRef: InputRef
  tagRefs: TagRefs
}

// Context to share state and handlers
const TagsInputContext = createContext<TagsInputContextType | null>(null)

const useTagsInputContext = (): TagsInputContextType => {
  const context = useContext(TagsInputContext)
  if (!context) {
    throw new Error(
      'TagsInput sub-components must be used within TagsInput.Root'
    )
  }
  return context
}

// Root Component
interface RootProps {
  children: ReactNode
  value?: string[]
  defaultValue?: string[]
  onChange?: (tags: string[]) => void
  [key: string]: any
}

const Root: ForwardRefExoticComponent<
  RootProps & RefAttributes<HTMLDivElement>
> = forwardRef(({ children, value, defaultValue, onChange, ...props }, ref) => {
  const [tags, setTags] = useState<string[]>(defaultValue || [])
  const controlledTags = value !== undefined ? value : tags
  const [focusedTagIndex, setFocusedTagIndex] = useState<number>(-1)
  const tagRefs = useRef<(HTMLElement | null)[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null)

  const addTag = (tag: string): void => {
    if (!tag.trim() || controlledTags.includes(tag.trim())) return
    const newTags = [...controlledTags, tag.trim()]
    setTags(newTags)
    onChange?.(newTags)
    setFocusedTagIndex(-1)
    inputRef.current?.focus()
  }

  // Modified removeTag to accept an optional keepInputFocus parameter
  const removeTag = (index: number, keepInputFocus: boolean = false): void => {
    const newTags = controlledTags.filter((_: string, i: number) => i !== index)
    setTags(newTags)
    onChange?.(newTags)

    if (keepInputFocus) {
      // When called from input, keep focus in input
      setFocusedTagIndex(-1)
      inputRef.current?.focus()
    } else {
      // Normal tag navigation behavior
      if (index >= newTags.length) {
        if (newTags.length > 0) {
          setFocusedTagIndex(newTags.length - 1)
          setTimeout(() => tagRefs.current[newTags.length - 1]?.focus(), 0)
        } else {
          setFocusedTagIndex(-1)
          inputRef.current?.focus()
        }
      } else {
        setFocusedTagIndex(index)
        setTimeout(() => tagRefs.current[index]?.focus(), 0)
      }
    }
  }

  const clearTags = (): void => {
    setTags([])
    onChange?.([])
    setFocusedTagIndex(-1)
    inputRef.current?.focus()
  }

  const focusTag = (index: number): void => {
    if (index >= 0 && index < controlledTags.length) {
      setFocusedTagIndex(index)
      tagRefs.current[index]?.focus()
    }
  }

  const handleTagKeyDown = (e: React.KeyboardEvent, index: number): void => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        if (index > 0) {
          focusTag(index - 1)
        }
        break
      case 'ArrowRight':
        e.preventDefault()
        if (index < controlledTags.length - 1) {
          focusTag(index + 1)
        } else {
          setFocusedTagIndex(-1)
          inputRef.current?.focus()
        }
        break
      case 'Backspace':
      case 'Delete':
        e.preventDefault()
        removeTag(index) // Normal removal from tag, not input
        break
    }
  }

  const registerInput = (
    ref: HTMLInputElement | null
  ): HTMLInputElement | null => {
    inputRef.current = ref
    return ref
  }

  const registerTagRef = (
    index: number,
    ref: HTMLElement | null
  ): HTMLElement | null => {
    if (ref) {
      tagRefs.current[index] = ref
    }
    return ref
  }

  return (
    <TagsInputContext.Provider
      value={{
        tags: controlledTags,
        addTag,
        removeTag,
        clearTags,
        focusedTagIndex,
        setFocusedTagIndex,
        handleTagKeyDown,
        registerTagRef,
        registerInput,
        inputRef,
        tagRefs,
      }}>
      <div ref={ref} {...props}>
        {children}
      </div>
    </TagsInputContext.Provider>
  )
})
Root.displayName = 'TagsInput.Root'

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode
}

// Label Component
const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, ...props }, ref) => {
    return (
      <label ref={ref} {...props}>
        {children}
      </label>
    )
  }
)
Label.displayName = 'TagsInput.Label'

interface ControlProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ((context: TagsInputContextType) => ReactNode) | ReactNode
}

// Control Component
const Control = forwardRef<HTMLDivElement, ControlProps>(
  ({ children, ...props }, ref) => {
    const context = useTagsInputContext()

    const renderedChildren: ReactNode =
      typeof children === 'function' ? children(context) : children

    return (
      <div ref={ref} {...props}>
        {renderedChildren}
      </div>
    )
  }
)
Control.displayName = 'TagsInput.Control'

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string
  onChange?: (value: string) => void
}

const Input: ForwardRefExoticComponent<
  InputProps & RefAttributes<HTMLInputElement>
> = forwardRef(({ value, onChange, ...props }, ref) => {
  const {
    addTag,
    tags,
    focusedTagIndex,
    setFocusedTagIndex,
    registerInput,
    removeTag,
    tagRefs,
  } = useTagsInputContext()

  const [inputValue, setInputValue] = useState<string>(value || '')
  const innerRef = useRef<HTMLInputElement | null>(null)

  const handleRef = (el: HTMLInputElement | null) => {
    innerRef.current = el
    registerInput(el)
    if (typeof ref === 'function') ref(el)
    else if (ref) ref.current = el
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault()
      if (e.key === ',') {
        const parts = inputValue.split(',')
        const firstPart = parts[0].trim()
        if (firstPart) {
          addTag(firstPart)
          const remainingParts = parts.slice(1).join(',').trim()
          setInputValue(remainingParts)
          onChange?.(remainingParts)
          innerRef.current?.focus()
          return
        }
      } else {
        addTag(inputValue.trim())
        setInputValue('')
        onChange?.('')
        innerRef.current?.focus()
      }
    } else if (e.key === 'Backspace' && tags.length > 0 && inputValue === '') {
      e.preventDefault()
      removeTag(tags.length - 1, true) // Tell removeTag to keep focus in input
    } else if (e.key === 'ArrowLeft' && tags.length > 0) {
      const cursorPosition = (e.target as HTMLInputElement).selectionStart
      if (cursorPosition === 0) {
        e.preventDefault()
        setFocusedTagIndex(tags.length - 1)
        tagRefs.current[tags.length - 1]?.focus()
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.includes(',')) {
      const parts = value.split(',')
      const firstPart = parts[0].trim()
      if (firstPart) {
        addTag(firstPart)
        const remainingValue = parts.slice(1).join(',').trim()
        setInputValue(remainingValue)
        onChange?.(remainingValue)
        innerRef.current?.focus()
        return
      }
    }
    setInputValue(value)
    onChange?.(value)
  }

  return (
    <input
      ref={handleRef}
      value={inputValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      {...props}
    />
  )
})
Input.displayName = 'TagsInput.Input'

// Tag Component
interface TagTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
}

// Tag Component
interface TagProps {
  index: number
  children: ReactNode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

const Tag: ForwardRefExoticComponent<
  TagProps & RefAttributes<HTMLSpanElement>
> = forwardRef(({ index, children, ...props }, ref) => {
  const { handleTagKeyDown, registerTagRef } = useTagsInputContext()

  const innerRef = useRef<HTMLElement | null>(null)

  const handleRef = (el: HTMLElement | null) => {
    innerRef.current = el
    registerTagRef(index, el)
    if (typeof ref === 'function') ref(el)
    else if (ref) ref.current = el
  }

  const handleClick = (e: React.MouseEvent) => {
    if (e.target === innerRef.current) {
      innerRef.current.focus()
    }
  }

  const getTagTextContent = (children: ReactNode): string => {
    const childrenArray = Array.isArray(children) ? children : [children]
    const tagTextChild = childrenArray.find(
      (child) => isValidElement(child) && child.type === TagText
    )
    if (isValidElement<TagTextProps>(tagTextChild)) {
      const childContent = tagTextChild.props.children
      if (typeof childContent === 'string') return childContent
      if (typeof childContent === 'number' || typeof childContent === 'bigint')
        return childContent.toString()
      if (typeof childContent === 'boolean')
        return childContent ? 'true' : 'false'
      if (isValidElement(childContent)) return ''
      return ''
    }
    return ''
  }

  return (
    <span
      ref={handleRef}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => handleTagKeyDown(e, index)}
      role='button'
      aria-label={`Tag: ${getTagTextContent(children)}`}
      {...props}>
      {children}
    </span>
  )
})
Tag.displayName = 'TagsInput.Tag'

// TagText Component
interface TagTextProps {
  children: ReactNode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

const TagText: ForwardRefExoticComponent<
  TagTextProps & RefAttributes<HTMLSpanElement>
> = forwardRef(({ children, ...props }, ref) => {
  return (
    <span ref={ref} {...props}>
      {children}
    </span>
  )
})
TagText.displayName = 'TagsInput.TagText'

// TagDeleteTrigger Component
interface TagDeleteTriggerProps {
  index: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

const TagDeleteTrigger: ForwardRefExoticComponent<
  TagDeleteTriggerProps & RefAttributes<HTMLButtonElement>
> = forwardRef(({ index, ...props }, ref) => {
  const { removeTag } = useTagsInputContext()

  return (
    <button
      ref={ref}
      type='button'
      tabIndex={-1}
      aria-label='Remove tag'
      onClick={(e) => {
        e.stopPropagation()
        removeTag(index)
      }}
      {...props}>
      X
    </button>
  )
})
TagDeleteTrigger.displayName = 'TagsInput.TagDeleteTrigger'

// ClearTrigger Component
interface ClearTriggerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

const ClearTrigger: ForwardRefExoticComponent<
  ClearTriggerProps & RefAttributes<HTMLButtonElement>
> = forwardRef(({ ...props }, ref) => {
  const { clearTags } = useTagsInputContext()

  return (
    <button ref={ref} onClick={clearTags} {...props}>
      Clear All
    </button>
  )
})
ClearTrigger.displayName = 'TagsInput.ClearTrigger'

// TagList Component
interface TagListProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
}

const TagList: ForwardRefExoticComponent<
  TagListProps & RefAttributes<HTMLDivElement>
> = forwardRef(({ ...props }, ref) => {
  const { tags } = useTagsInputContext()

  return (
    <div ref={ref} {...props}>
      {tags.map((tag, index) => (
        <Tag key={index} index={index}>
          <TagText>{tag}</TagText>
          <TagDeleteTrigger index={index} />
        </Tag>
      ))}
    </div>
  )
})
TagList.displayName = 'TagsInput.TagList'

export const TagsInput = {
  Root,
  Label,
  Control,
  Input,
  Tag,
  TagText,
  TagDeleteTrigger,
  ClearTrigger,
  TagList,
}

{
  /* <TagsInput.Root defaultValue={['javascript', 'react']} className='mb-6'>
<TagsInput.Label className='block mb-2 font-medium'>
  Tags
</TagsInput.Label>
<TagsInput.Control className='flex flex-wrap items-center gap-2 p-2 border rounded-md'>
  {({ tags }) => (
    <>
      {tags.map((tag, index) => (
        <TagsInput.Tag
          key={index}
          index={index}
          className='flex items-center bg-orange-500 px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/80 focus-offset-1'>
          <TagsInput.TagText className='mr-1'>
            {tag}
          </TagsInput.TagText>
          <TagsInput.TagDeleteTrigger
            index={index}
            className='text-xs font-bold hover:text-red-500'
          />
        </TagsInput.Tag>
      ))}
      <TagsInput.Input
        placeholder='Add a tag...'
        className='flex-grow outline-none min-w-20'
      />
    </>
  )}
</TagsInput.Control>
<div className='mt-2 text-xs text-gray-500'>
  Press Enter or Comma to add a tag. Use arrow keys to navigate
  between tags. Press Backspace to delete a tag when focused.
</div>
<TagsInput.ClearTrigger className='mt-2 text-sm text-gray-500 hover:text-gray-700' />
</TagsInput.Root> */
}
