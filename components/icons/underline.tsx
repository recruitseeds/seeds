import { SVGProps } from 'react'

export function Underline(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M5.99976 21H17.9998M17.9998 3.00003V11C17.9998 14.3137 15.3135 17 11.9998 17C8.68605 17 5.99976 14.3137 5.99976 11V3.00003"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
