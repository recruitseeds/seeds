import { SVGProps } from 'react'

export default function Clipboard(props: SVGProps<SVGSVGElement>) {
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
        d="M16 3V3C18.2091 3 20 4.79086 20 7V14C20 16.8003 20 18.2004 19.455 19.27C18.9757 20.2108 18.2108 20.9757 17.27 21.455C16.2004 22 14.8003 22 12 22V22C9.19974 22 7.79961 22 6.73005 21.455C5.78924 20.9757 5.02433 20.2108 4.54497 19.27C4 18.2004 4 16.8003 4 14V7C4 4.79086 5.79086 3 8 3V3M16 3V3C16 1.89543 15.1046 1 14 1H10C8.89543 1 8 1.89543 8 3V3M16 3V3C16 4.10457 15.1046 5 14 5H10C8.89543 5 8 4.10457 8 3V3M9 11H15M9 15H13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
