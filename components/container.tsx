export function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-6'>
      {children}
    </div>
  )
}
