'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import { Alert, AlertDescription, AlertTitle } from '@seeds/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@seeds/ui/avatar'
import { Badge } from '@seeds/ui/badge'
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@seeds/ui/breadcrumb'
import { Button } from '@seeds/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@seeds/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@seeds/ui/dropdown-menu'
import { Input } from '@seeds/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@seeds/ui/select'
import { Switch } from '@seeds/ui/switch'
import {
  Bluetooth,
  CreditCard,
  Laptop,
  Loader2,
  LogOut,
  Mail,
  MoreHorizontal,
  Orbit,
  Search,
  Settings,
  Terminal,
  User,
  Wifi,
} from 'lucide-react'
import { useState } from 'react'

export default function Page() {
  const [showStatusBar, setShowStatusBar] = useState(true)
  const [showActivityBar, setShowActivityBar] = useState(false)
  const [wifiEnabled, setWifiEnabled] = useState(true)
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false)
  const [airplaneMode, setAirplaneMode] = useState(false)

  // State for radio items
  const [position, setPosition] = useState('top')
  return (
    <div className='mx-8'>
      <div className='flex justify-between h-14 items-center'>
        <h1 className='text-2xl font-bold'>Components preview</h1>
        <ThemeToggle />
      </div>

      <section className='mb-8'>
        <h2 className='text-xl font-semibold mb-4'>Buttons</h2>

        <div className='space-y-6'>
          {/* Button sections remain unchanged */}
          <div className='space-y-2'>
            <h3 className='text-lg font-medium'>Default</h3>
            <div className='flex gap-4 items-center'>
              <Button variant='default' size='sm'>
                Small
              </Button>
              <Button variant='default' size='default'>
                Default
              </Button>
              <Button variant='default' size='lg'>
                Large
              </Button>
              <Button variant='default' size='icon'>
                <Orbit />
              </Button>
            </div>
          </div>

          {/* Secondary button sizes */}
          <div className='space-y-2'>
            <h3 className='text-lg font-medium'>Secondary</h3>
            <div className='flex gap-4 items-center'>
              <Button variant='secondary' size='sm'>
                Small
              </Button>
              <Button variant='secondary' size='default'>
                Default
              </Button>
              <Button variant='secondary' size='lg'>
                Large
              </Button>
              <Button variant='secondary' size='icon'>
                <Orbit />
              </Button>
            </div>
          </div>

          <div className='space-y-2'>
            <h3 className='text-lg font-medium'>Brand</h3>
            <div className='flex gap-4 items-center'>
              <Button variant='brand' size='sm'>
                Small
              </Button>
              <Button variant='brand' size='default'>
                Default
              </Button>
              <Button variant='brand' size='lg'>
                Large
              </Button>
              <Button variant='brand' size='icon'>
                <Orbit />
              </Button>
            </div>
          </div>

          <div className='space-y-2'>
            <h3 className='text-lg font-medium'>Outline</h3>
            <div className='flex gap-4 items-center'>
              <Button variant='outline' size='sm'>
                Small
              </Button>
              <Button variant='outline' size='default'>
                Default
              </Button>
              <Button variant='outline' size='lg'>
                Large
              </Button>
              <Button variant='outline' size='icon'>
                <Orbit />
              </Button>
            </div>
          </div>

          {/* Destructive button sizes */}
          <div className='space-y-2'>
            <h3 className='text-lg font-medium'>Destructive</h3>
            <div className='flex gap-4 items-center'>
              <Button variant='destructive' size='sm'>
                Small
              </Button>
              <Button variant='destructive' size='default'>
                Default
              </Button>
              <Button variant='destructive' size='lg'>
                Large
              </Button>
              <Button variant='destructive' size='icon'>
                <Orbit />
              </Button>
            </div>
          </div>

          {/* Ghost button sizes */}
          <div className='space-y-2'>
            <h3 className='text-lg font-medium'>Ghost</h3>
            <div className='flex gap-4 items-center'>
              <Button variant='ghost' size='sm'>
                Small
              </Button>
              <Button variant='ghost' size='default'>
                Default
              </Button>
              <Button variant='ghost' size='lg'>
                Large
              </Button>
              <Button variant='ghost' size='icon'>
                <Orbit />
              </Button>
            </div>
          </div>

          {/* Link button sizes */}
          <div className='space-y-2'>
            <h3 className='text-lg font-medium'>Link</h3>
            <div className='flex gap-4 items-center'>
              <Button variant='link' size='sm'>
                Small
              </Button>
              <Button variant='link' size='default'>
                Default
              </Button>
              <Button variant='link' size='lg'>
                Large
              </Button>
            </div>
          </div>

          <div className='space-y-2'>
            <h3 className='text-lg font-medium'>States</h3>
            <div className='flex gap-4 items-center'>
              <Button variant='default' disabled>
                Disabled
              </Button>
              <Button variant='default' active>
                Active
              </Button>
              <Button disabled>
                <Loader2 className='animate-spin' />
                Please wait
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className='mb-8'>
        <h2 className='text-xl font-semibold mb-4'>Alerts</h2>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <h3 className='text-lg font-medium'>Default</h3>
            <Alert>
              <Terminal className='h-4 w-4' />
              <AlertTitle>Heads up!</AlertTitle>
              <AlertDescription>
                You can add components to your app using the cli.
              </AlertDescription>
            </Alert>
          </div>

          <div className='space-y-2'>
            <h3 className='text-lg font-medium'>Destructive</h3>
            <Alert variant='destructive'>
              <Terminal className='h-4 w-4' />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                There was a problem with your request.
              </AlertDescription>
            </Alert>
          </div>

          <div className='space-y-2'>
            <h3 className='text-lg font-medium'>Success</h3>
            <Alert variant='success'>
              <Terminal className='h-4 w-4' />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                Your changes have been saved successfully.
              </AlertDescription>
            </Alert>
          </div>

          <div className='space-y-2'>
            <h3 className='text-lg font-medium'>Warning</h3>
            <Alert variant='warning'>
              <Terminal className='h-4 w-4' />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                This action might have unexpected consequences.
              </AlertDescription>
            </Alert>
          </div>

          <div className='space-y-2'>
            <h3 className='text-lg font-medium'>Info</h3>
            <Alert variant='info'>
              <Terminal className='h-4 w-4' />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>
                Here&apos;s some information you might find useful.
              </AlertDescription>
            </Alert>
          </div>

          <div className='space-y-2'>
            <h3 className='text-lg font-medium'>Avatar</h3>
            <div className='flex gap-4 items-center'>
              <Avatar>
                <AvatarImage
                  src='https://github.com/alexwhitmore.png'
                  alt='@theAlexWhitmore'
                />
                <AvatarFallback>XS</AvatarFallback>
              </Avatar>
            </div>
          </div>

          <section className='mb-8'>
            <h2 className='text-xl font-semibold mb-4'>Badges</h2>

            <div className='flex flex-wrap gap-4'>
              <Badge variant='default'>Default</Badge>
              <Badge variant='secondary'>Secondary</Badge>
              <Badge variant='destructive'>Destructive</Badge>
              <Badge variant='outline'>Outline</Badge>
              <Badge variant='success'>Success</Badge>
              <Badge variant='info'>Info</Badge>
              <Badge variant='warning'>Warning</Badge>
              <Badge variant='brand'>Brand</Badge>
            </div>

            <div className='mt-4 flex flex-wrap gap-4'>
              <Badge variant='default'>
                <Terminal className='mr-1' />
                With Icon
              </Badge>
              <Badge variant='secondary'>
                <Terminal className='mr-1' />
                With Icon
              </Badge>
              <Badge variant='destructive'>
                <Terminal className='mr-1' />
                With Icon
              </Badge>
            </div>
          </section>

          <section className='mb-8'>
            <h2 className='text-xl font-semibold mb-4'>Breadcrumbs</h2>

            <div className='space-y-6'>
              {/* Basic breadcrumb */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>Basic</h3>
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href='/'>Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink href='/components'>
                        Components
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>

              {/* With ellipsis */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>With Ellipsis</h3>
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href='/'>Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <DropdownMenu>
                        <DropdownMenuTrigger className='flex items-center gap-1'>
                          <BreadcrumbEllipsis className='h-4 w-4' />
                          <span className='sr-only'>Toggle menu</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='start'>
                          <DropdownMenuItem>Documentation</DropdownMenuItem>
                          <DropdownMenuItem>Themes</DropdownMenuItem>
                          <DropdownMenuItem>GitHub</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink href='/components/breadcrumb'>
                        Components
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>

              {/* Nested paths */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>Nested Paths</h3>
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href='/'>Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink href='/dashboard'>
                        Dashboard
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink href='/dashboard/settings'>
                        Settings
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink href='/dashboard/settings/profile'>
                        Profile
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Edit</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </div>
          </section>

          <section className='mb-8'>
            <h2 className='text-xl font-semibold mb-4'>Dialogs</h2>

            <div className='space-y-6'>
              {/* Basic dialog */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>Basic Dialog</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant='default'>Open Dialog</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Basic Dialog</DialogTitle>
                      <DialogDescription>
                        This is a basic dialog example showing title and
                        description.
                      </DialogDescription>
                    </DialogHeader>
                    <p className='py-4'>
                      This is the main content of the dialog.
                    </p>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Confirmation dialog */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>Confirmation Dialog</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Delete Item</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Are you sure?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently
                        delete the item.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant='outline'>Cancel</Button>
                      <Button variant='destructive'>Delete</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </section>

          <section className='mb-8'>
            <h2 className='text-xl font-semibold mb-4'>Dropdown Menus</h2>

            <div className='space-y-6'>
              {/* Basic dropdown */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>Basic Dropdown</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='secondary'>Open Menu</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Profile</DropdownMenuItem>
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Logout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Dropdown with icons and shortcuts */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>With Icons & Shortcuts</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline'>Account</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className='w-56'>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem>
                        <User className='mr-2 h-4 w-4' />
                        <span>Profile</span>
                        <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <CreditCard className='mr-2 h-4 w-4' />
                        <span>Billing</span>
                        <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className='mr-2 h-4 w-4' />
                        <span>Settings</span>
                        <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant='destructive'>
                      <LogOut className='mr-2 h-4 w-4' />
                      <span>Log out</span>
                      <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Dropdown with checkbox items */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>With Checkboxes</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline'>View Options</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className='w-56'>
                    <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={showStatusBar}
                      onCheckedChange={setShowStatusBar}>
                      Status Bar
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={showActivityBar}
                      onCheckedChange={setShowActivityBar}>
                      Activity Bar
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Dropdown with radio items */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>With Radio Items</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline'>Position: {position}</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className='w-56'>
                    <DropdownMenuLabel>Position</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup
                      value={position}
                      onValueChange={setPosition}>
                      <DropdownMenuRadioItem value='top'>
                        Top
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value='right'>
                        Right
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value='bottom'>
                        Bottom
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value='left'>
                        Left
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Dropdown with submenu */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>With Submenu</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline'>More Options</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Main Option 1</DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        More Tools
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem>Sub Option 1</DropdownMenuItem>
                        <DropdownMenuItem>Sub Option 2</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Sub Option 3</DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Main Option 2</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Dropdown with inset items */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>With Inset Items</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline'>
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem inset>Regular Item</DropdownMenuItem>
                    <DropdownMenuItem inset>Another Item</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem inset variant='destructive'>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </section>

          <section className='mb-8'>
            <h2 className='text-xl font-semibold mb-4'>Inputs</h2>

            <div className='space-y-6'>
              {/* Default input */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>Default Input</h3>
                <div className='max-w-sm'>
                  <Input placeholder='Enter your name' />
                </div>
              </div>

              {/* Input with label (using regular HTML) */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>With Label</h3>
                <div className='max-w-sm'>
                  <label
                    htmlFor='email'
                    className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-2'>
                    Email
                  </label>
                  <Input
                    id='email'
                    type='email'
                    placeholder='name@example.com'
                  />
                </div>
              </div>

              {/* Disabled input */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>Disabled</h3>
                <div className='max-w-sm'>
                  <Input disabled placeholder='Disabled input' />
                </div>
              </div>

              {/* Input with icon */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>With Icon</h3>
                <div className='max-w-sm relative'>
                  <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
                    <Mail className='h-4 w-4 text-muted-foreground' />
                  </div>
                  <Input className='pl-10' placeholder='Enter your email' />
                </div>
              </div>

              {/* Search input */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>Search Input</h3>
                <div className='max-w-sm relative'>
                  <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
                    <Search className='h-4 w-4 text-muted-foreground' />
                  </div>
                  <Input
                    type='search'
                    className='pl-10'
                    placeholder='Search...'
                  />
                </div>
              </div>

              {/* Input with error */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>With Error</h3>
                <div className='max-w-sm'>
                  <Input aria-invalid='true' placeholder='Invalid input' />
                  <p className='text-destructive text-sm mt-1'>
                    This field is required
                  </p>
                </div>
              </div>

              {/* File input */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>File Input</h3>
                <div className='max-w-sm'>
                  <Input type='file' />
                </div>
              </div>
            </div>
          </section>

          <section className='mb-8'>
            <h2 className='text-xl font-semibold mb-4'>Select</h2>

            <div className='space-y-6'>
              {/* Basic select */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>Basic Select</h3>
                <div className='max-w-sm'>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder='Select an option' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='option1'>Option 1</SelectItem>
                      <SelectItem value='option2'>Option 2</SelectItem>
                      <SelectItem value='option3'>Option 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Select with label */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>With Label</h3>
                <div className='max-w-sm'>
                  <label
                    htmlFor='framework'
                    className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-2'>
                    Framework
                  </label>
                  <Select>
                    <SelectTrigger id='framework'>
                      <SelectValue placeholder='Select framework' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='react'>React</SelectItem>
                      <SelectItem value='nextjs'>Next.js</SelectItem>
                      <SelectItem value='vue'>Vue</SelectItem>
                      <SelectItem value='angular'>Angular</SelectItem>
                      <SelectItem value='svelte'>Svelte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Disabled select */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>Disabled</h3>
                <div className='max-w-sm'>
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder='Disabled select' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='option1'>Option 1</SelectItem>
                      <SelectItem value='option2'>Option 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Select with groups */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>With Groups</h3>
                <div className='max-w-sm'>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a timezone' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>North America</SelectLabel>
                        <SelectItem value='est'>
                          Eastern Standard Time (EST)
                        </SelectItem>
                        <SelectItem value='cst'>
                          Central Standard Time (CST)
                        </SelectItem>
                        <SelectItem value='mst'>
                          Mountain Standard Time (MST)
                        </SelectItem>
                        <SelectItem value='pst'>
                          Pacific Standard Time (PST)
                        </SelectItem>
                      </SelectGroup>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel>Europe</SelectLabel>
                        <SelectItem value='gmt'>
                          Greenwich Mean Time (GMT)
                        </SelectItem>
                        <SelectItem value='cet'>
                          Central European Time (CET)
                        </SelectItem>
                        <SelectItem value='eet'>
                          Eastern European Time (EET)
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Select with disabled options */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>With Disabled Options</h3>
                <div className='max-w-sm'>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a fruit' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='apple'>Apple</SelectItem>
                      <SelectItem value='banana'>Banana</SelectItem>
                      <SelectItem value='orange' disabled>
                        Orange (Out of Stock)
                      </SelectItem>
                      <SelectItem value='grape'>Grape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Select with form validation */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>With Form Validation</h3>
                <div className='max-w-sm'>
                  <Select>
                    <SelectTrigger aria-invalid='true'>
                      <SelectValue placeholder='Select an option' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='option1'>Option 1</SelectItem>
                      <SelectItem value='option2'>Option 2</SelectItem>
                      <SelectItem value='option3'>Option 3</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className='text-destructive text-sm mt-1'>
                    Please select an option
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className='mb-8'>
            <h2 className='text-xl font-semibold mb-4'>Switches</h2>

            <div className='space-y-6'>
              {/* Basic switches */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>Basic Switches</h3>
                <div className='flex gap-4 items-center'>
                  <Switch id='airplane-mode' checked={true} />
                  <label htmlFor='airplane-mode' className='text-sm'>
                    Checked
                  </label>

                  <Switch id='airplane-mode-off' />
                  <label htmlFor='airplane-mode-off' className='text-sm'>
                    Unchecked
                  </label>
                </div>
              </div>

              {/* Disabled switches */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>Disabled Switches</h3>
                <div className='flex gap-4 items-center'>
                  <Switch disabled checked={true} />
                  <label className='text-sm text-muted-foreground'>
                    Disabled (On)
                  </label>

                  <Switch disabled />
                  <label className='text-sm text-muted-foreground'>
                    Disabled (Off)
                  </label>
                </div>
              </div>

              {/* Interactive switches */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>Interactive Switches</h3>
                <div className='space-y-3 max-w-sm'>
                  <div className='flex items-center space-x-2'>
                    <Switch
                      id='wifi'
                      checked={wifiEnabled}
                      onCheckedChange={setWifiEnabled}
                    />
                    <label
                      htmlFor='wifi'
                      className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                      <div className='flex items-center gap-2'>
                        <Wifi className='h-4 w-4' />
                        <span>Wi-Fi</span>
                      </div>
                    </label>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <Switch
                      id='bluetooth'
                      checked={bluetoothEnabled}
                      onCheckedChange={setBluetoothEnabled}
                    />
                    <label
                      htmlFor='bluetooth'
                      className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                      <div className='flex items-center gap-2'>
                        <Bluetooth className='h-4 w-4' />
                        <span>Bluetooth</span>
                      </div>
                    </label>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <Switch
                      id='airplane'
                      checked={airplaneMode}
                      onCheckedChange={setAirplaneMode}
                    />
                    <label
                      htmlFor='airplane'
                      className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                      <div className='flex items-center gap-2'>
                        <Laptop className='h-4 w-4' />
                        <span>Airplane Mode</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Switch in a form */}
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>In a Form</h3>
                <div className='max-w-sm p-4 border rounded-md'>
                  <div className='space-y-4'>
                    <div>
                      <h4 className='text-sm font-medium mb-3'>
                        Notification Settings
                      </h4>
                      <div className='space-y-2'>
                        <div className='flex items-center justify-between'>
                          <label htmlFor='email-notifs' className='text-sm'>
                            Email notifications
                          </label>
                          <Switch id='email-notifs' />
                        </div>
                        <div className='flex items-center justify-between'>
                          <label htmlFor='push-notifs' className='text-sm'>
                            Push notifications
                          </label>
                          <Switch id='push-notifs' defaultChecked={true} />
                        </div>
                        <div className='flex items-center justify-between'>
                          <label htmlFor='sms-notifs' className='text-sm'>
                            SMS notifications
                          </label>
                          <Switch id='sms-notifs' />
                        </div>
                      </div>
                    </div>
                    <Button className='w-full'>Save preferences</Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}
