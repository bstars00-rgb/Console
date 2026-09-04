import { useState } from 'react'
import { Modal } from '../ui/Modal'

export function Footer() {
  const [doc, setDoc] = useState<null | 'privacy' | 'terms'>(null)
  return (
    <footer className="flex items-center justify-between border-t border-line bg-white px-5 py-3 text-caption text-muted">
      <div className="flex flex-col gap-0.5">
        <span>Customer Center : +82-2-733-0550 (Weekday 09:00 ~ 18:00 except holidays / UTC +09:00)</span>
        <span>© 2025 OHMYHOTEL GLOBAL PTE. LTD. All rights reserved.</span>
      </div>
      <ul className="flex gap-4">
        <li>
          <button className="hover:text-ink" onClick={() => setDoc('privacy')}>
            Privacy Policy
          </button>
        </li>
        <li>
          <button className="hover:text-ink" onClick={() => setDoc('terms')}>
            Terms &amp; Condition
          </button>
        </li>
      </ul>
      <Modal open={doc === 'privacy'} onClose={() => setDoc(null)} title="Privacy Policy" width={560}>
        <p className="text-base leading-relaxed text-ink">
          This prototype does not process real personal data. In the production console this section links to the
          Ohmyhotel privacy policy governing the handling of vendor and traveler information.
        </p>
      </Modal>
      <Modal open={doc === 'terms'} onClose={() => setDoc(null)} title="Terms & Condition" width={560}>
        <p className="text-base leading-relaxed text-ink">
          Prototype placeholder for the vendor terms and conditions. No agreement is formed by this demo.
        </p>
      </Modal>
    </footer>
  )
}
