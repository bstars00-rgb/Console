import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { MessageCircle, FileText } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { TabWorkspace } from './TabWorkspace'
import { Footer } from './Footer'
import { WorkspaceProvider } from './workspace'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/controls'
import { Checkbox } from '../ui/controls'
import { readJSON, writeJSON } from '../../lib/storage'

export function AppShell() {
  return (
    <WorkspaceProvider>
      <div className="flex h-screen w-full overflow-hidden bg-canvas">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <TabWorkspace />
          <main className="min-h-0 flex-1 overflow-auto bg-white p-5">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
      <NoticeModal />
      <ChatWidget />
    </WorkspaceProvider>
  )
}

/** Login-time notice popup, mirroring the original's asset-transfer notice. */
function NoticeModal() {
  const [open, setOpen] = useState(() => !readJSON<boolean>('noticeDismissed', false))
  const [dontShow, setDontShow] = useState(false)
  const close = () => {
    if (dontShow) writeJSON('noticeDismissed', true)
    setOpen(false)
  }
  return (
    <Modal
      open={open}
      onClose={close}
      title="Notice"
      width={640}
      footer={
        <div className="flex w-full items-center justify-between">
          <Checkbox checked={dontShow} onChange={setDontShow} label="Don't show again" />
          <Button variant="primary" onClick={close}>
            Close
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <h3 className="text-md font-semibold text-ink">
          Notice Regarding Transfer of Personal Information Due to Asset Transfer
        </h3>
        <p className="text-caption text-muted">Register Date : 2026-02-13 · Views : 180,187</p>
        <p className="text-base leading-relaxed text-ink">
          This is a prototype reproduction of the original login-time notice. In production this modal presents the
          notice regarding the transfer of personal information due to an asset transfer, with a downloadable PDF.
        </p>
        <a
          className="inline-flex w-fit items-center gap-1.5 text-base text-info hover:underline"
          href="#"
          onClick={(e) => e.preventDefault()}
        >
          <FileText size={14} />
          OhmyhotelAndCo_Privacy_Transfer_Notice_EN_v2.pdf
        </a>
      </div>
    </Modal>
  )
}

/** Static support-chat launcher (visual parity with the original widget). */
function ChatWidget() {
  return (
    <button
      className="fixed bottom-5 right-5 z-[9000] flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-modal hover:bg-primary-hover"
      aria-label="Open chat window"
      title="Support (prototype)"
    >
      <MessageCircle size={22} />
    </button>
  )
}
