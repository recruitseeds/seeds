import { forwardRef } from 'react'

import NextLink from 'next/link'


const WEB_URL = 'http://localhost:3000';

import { cn } from './lib/utils'
import { linkType } from './utils'

export type LinkProps = React.ComponentProps<typeof NextLink> & {
  forceInternalLinksBlank?: boolean
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  const {
    className,
    onClick,
    href,
    forceInternalLinksBlank = false,
    ...rest
  } = props
  const classes = cn('callout-none', className)
  const hrefString = props.href.toString()
  const type = linkType(hrefString)
  const replaceInternalHref =
    !forceInternalLinksBlank && type === 'internal' && props.target === '_blank'
  const cleanedHref = replaceInternalHref
    ? hrefString.replace(WEB_URL, '')
    : href

  return (
    <NextLink
      {...rest}
      ref={ref}
      href={cleanedHref}
      className={classes}
      target={replaceInternalHref ? '_self' : props.target}
      onClick={(e) => {
        if (desktopOnClickOverride) {
          if (type === 'call') {
            desktopJoinCall(hrefString)
          } else if (type === 'desktop_oauth' || type === 'public_share') {
            os.openURL(hrefString)
          }

          e.preventDefault()
        } else if (
          isDesktopApp &&
          forceInternalLinksBlank &&
          props.target === '_blank'
        ) {
          /*
           * Ideally we'd use the normal link handling provided by our <Link> component.
           * Unfortunately, when we open a window programmatically with ToDesktop, like we do with calls,
           * those windows ignore the application "internal URL" settings, causing all links to open in
           * Desktop app windows. The safest thing to do until that bug is resolved is to open all links,
           * including internal links, in browser windows.
           *
           * https://github.com/vercel/next.js/issues/49387
           */
          e.preventDefault()
          os.openURL(hrefString)
        }

        onClick?.(e)
      }}
    />
  )
})

Link.displayName = 'Link'
