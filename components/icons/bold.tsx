import { SVGProps } from 'react'

export function Bold(props: SVGProps<SVGSVGElement>) {
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
        d="M4 12H15.5C17.9853 12 20 14.0147 20 16.5V16.5C20 18.9853 17.9853 21 15.5 21H5.77778C4.79594 21 4 20.2041 4 19.2222V12ZM4 12H12.5C14.9853 12 17 9.98528 17 7.5V7.5C17 5.01472 14.9853 3 12.5 3H5.44444C4.6467 3 4 3.6467 4 4.44444V12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
