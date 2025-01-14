import { SVGProps } from 'react'

export function Strikethrough(props: SVGProps<SVGSVGElement>) {
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
        d="M10.8886 12H13.1108C15.5654 12 17.5553 14.0147 17.5553 16.5C17.5553 18.9853 15.5654 21 13.1108 21H10.8886C8.43402 21 6.44417 18.9853 6.44417 16.5M17.5553 7.5C17.5553 5.01472 15.5654 3 13.1108 3H10.8886C8.43402 3 6.44417 5.01472 6.44417 7.5C6.44417 7.88846 6.49279 8.26543 6.58419 8.625M3 12H21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
