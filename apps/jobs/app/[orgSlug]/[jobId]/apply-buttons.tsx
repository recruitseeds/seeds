'use client'

import { Button } from '@seeds/ui/button'

export function ApplyButtons() {
  const handleApply = () => {
    const applySection = document.getElementById('apply')
    if (applySection) {
      const elementPosition = applySection.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - 100

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  const handleRefer = () => {
    const subject = encodeURIComponent('Check out this job opportunity')
    const body = encodeURIComponent(
      `I thought you might be interested in this Senior Frontend Developer position at TechCorp: ${window.location.href}`
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  return (
    <div className='flex gap-3'>
      <Button variant='default' onClick={handleApply}>
        Apply
      </Button>
      <Button variant='outline' onClick={handleRefer}>
        Refer someone
      </Button>
    </div>
  )
}
