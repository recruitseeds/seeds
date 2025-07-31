import { Button } from '@seeds/ui/button'
import { Separator } from '@seeds/ui/separator'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  CodeXml,
  Highlighter,
  ImagePlus,
  Italic,
  Link,
  List,
  Redo2,
  Strikethrough,
  Subscript,
  Superscript,
  TextQuote,
  Type,
  Underline,
  Undo2,
} from 'lucide-react'

export function ToolbarSkeleton() {
  return (
    <div className='sticky top-0 z-40 border-b border-dashed bg-background'>
      <div className='flex items-center'>
        <div className='flex-1 min-w-0 overflow-x-auto'>
          <div className='flex items-center gap-[6px] p-2 bg-background border-border overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-h-[48px]'>
            <div className='flex-1' />

            <div className='flex items-center gap-1' role='group'>
              <Button size='icon' variant='ghost' disabled>
                <Undo2 />
              </Button>
              <Button size='icon' variant='ghost' disabled>
                <Redo2 />
              </Button>
            </div>

            <Separator orientation='vertical' decorative className='h-6' />

            <div className='flex items-center gap-1' role='group'>
              <Button size='sm' variant='ghost' className='h-9 px-[10px]'>
                <Type />
                <ChevronDown className='h-3 w-3' />
              </Button>
              <Button size='sm' variant='ghost' className='h-9 px-[10px]'>
                <List />
                <ChevronDown />
              </Button>
              <Button size='icon' variant='ghost'>
                <TextQuote />
              </Button>
              <Button size='icon' variant='ghost'>
                <CodeXml />
              </Button>
            </div>

            <Separator orientation='vertical' decorative className='h-6' />

            <div className='flex items-center gap-1' role='group'>
              <Button size='icon' variant='ghost'>
                <Bold />
              </Button>
              <Button size='icon' variant='ghost'>
                <Italic />
              </Button>
              <Button size='icon' variant='ghost'>
                <Strikethrough />
              </Button>
              <Button size='icon' variant='ghost'>
                <CodeXml />
              </Button>
              <Button size='icon' variant='ghost'>
                <Underline />
              </Button>
              <Button size='icon' variant='ghost'>
                <Highlighter />
              </Button>
              <Button size='icon' variant='ghost'>
                <Link />
              </Button>
            </div>

            <Separator orientation='vertical' decorative className='h-6' />

            <div className='flex items-center gap-1' role='group'>
              <Button size='icon' variant='ghost'>
                <Superscript />
              </Button>
              <Button size='icon' variant='ghost'>
                <Subscript />
              </Button>
            </div>

            <Separator orientation='vertical' decorative className='h-6' />

            <div className='flex items-center gap-1' role='group'>
              <Button size='icon' variant='ghost'>
                <AlignLeft />
              </Button>
              <Button size='icon' variant='ghost'>
                <AlignCenter className='h-4 w-4' />
              </Button>
              <Button size='icon' variant='ghost'>
                <AlignRight />
              </Button>
              <Button size='icon' variant='ghost'>
                <AlignJustify />
              </Button>
            </div>

            <Separator orientation='vertical' decorative className='h-6' />

            <div className='flex items-center gap-1' role='group'>
              <Button size='sm' variant='ghost' className='h-9 px-[10px]'>
                <ImagePlus />
                <span className='text-sm'>Add</span>
              </Button>
            </div>

            <div className='flex-1' />
          </div>
        </div>
        <div className='flex-shrink-0 px-4 py-2 border-l border-dashed'>
          <div className='flex gap-2'>
            <Button variant='ghost' size='sm'>
              Discard
            </Button>
            <Button variant='brand' size='sm' disabled>
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
