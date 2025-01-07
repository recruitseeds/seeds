import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'

export function JobFilter() {
  return (
    <div className="flex gap-4">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Filter by location" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Locations</SelectLabel>
            <SelectItem value="all">All locations</SelectItem>
            <SelectItem value="us">United States</SelectItem>
            <SelectItem value="remote">Remote</SelectItem>
            <SelectItem value="europe">Europe</SelectItem>
            <SelectItem value="asia">Asia Pacific</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Filter by department" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Departments</SelectLabel>
            <SelectItem value="all">All departments</SelectItem>
            <SelectItem value="engineering">Engineering</SelectItem>
            <SelectItem value="growth">Growth</SelectItem>
            <SelectItem value="design">Design</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button variant="accent" asChild>
        <Link href="/dashboard/jobs/create">
          Create job posting
          <Plus />
        </Link>
      </Button>
    </div>
  )
}

const Plus = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    className="stroke-background"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 12H12M19 12H12M12 12V5M12 12V19"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
