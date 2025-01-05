import { Footer } from '@/components/footer'

export default function Page({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
      <Footer />
    </div>
  )
}
