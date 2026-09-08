import { DonorShell } from '../../components/donor/DonorShell'
import { ChatInterface } from '../../components/donor/ChatInterface'

export default function DonorMessagesPage() {
  return (
    <DonorShell fab={false}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Messages</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time coordination with NGOs and volunteers.
          </p>
        </div>

        {/* Top-Right Community Banner Card matching reference */}
        <div className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/25 text-slate-200 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <span className="text-sm">👥</span>
          </div>
          <div className="text-xs leading-tight">
            <p className="font-bold text-white">Build stronger communities</p>
            <p className="text-[11px] text-emerald-400/90">Every conversation leads to a fuller tomorrow.</p>
          </div>
        </div>
      </div>
      <ChatInterface role="donor" />
    </DonorShell>
  )
}
