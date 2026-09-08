import { ReceiverShell } from '../../components/receiver/ReceiverShell'
import { ChatInterface } from '../../components/donor/ChatInterface'

export default function ReceiverMessagesPage() {
  return (
    <ReceiverShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Messages</h1>
        <p className="text-text-secondary">Communicate securely with donors.</p>
      </div>

      <ChatInterface role="receiver" />
    </ReceiverShell>
  )
}
