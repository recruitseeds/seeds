export const Container = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return <section className='flex flex-1 p-4 pt-0 mt-10'>{children}</section>
}
