import { useState } from 'react'
import { X, Flame, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input, Select } from '../ui/Input'

interface UrgentFoodRequestModalProps {
  onClose: () => void
  onRequestSent: () => void
}

export function UrgentFoodRequestModal({ onClose, onRequestSent }: UrgentFoodRequestModalProps) {
  const [mealsNeeded, setMealsNeeded] = useState(80)
  const [peopleCount, setPeopleCount] = useState(80)
  const [dietaryType, setDietaryType] = useState('any')
  const [notes, setNotes] = useState('Immediate requirement for evening meal distribution at community centre.')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      onRequestSent()
      onClose()
    }, 400)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Broadcast Urgent Food Need</h2>
              <p className="text-xs text-slate-400">Direct alert to nearby verified commercial kitchens & restaurants</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>
              High-priority broadcast: FoodBridge logistics volunteers and nearby donors will be flagged immediately.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Urgent Meals Required"
              type="number"
              min={10}
              value={mealsNeeded}
              onChange={(e) => setMealsNeeded(Number(e.target.value))}
              required
            />
            <Input
              label="People on Site Now"
              type="number"
              min={10}
              value={peopleCount}
              onChange={(e) => setPeopleCount(Number(e.target.value))}
              required
            />
          </div>

          <Select
            label="Dietary Requirement"
            value={dietaryType}
            onChange={(e) => setDietaryType(e.target.value)}
            options={[
              { value: 'any', label: 'Any wholesome cooked meals (Veg or Non-Veg)' },
              { value: 'veg_only', label: 'Strictly Vegetarian Only' },
              { value: 'halal', label: 'Halal Certified Cooked Food' },
              { value: 'packaged', label: 'Packaged / Ready-to-Eat Food Only' },
            ]}
          />

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Urgency Note / Delivery Instructions
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary resize-none"
              placeholder="Provide drop-off gate or specific emergency coordinator contact..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={onClose} type="button" className="px-4 py-2 text-xs">
              Cancel
            </Button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Flame className="w-4 h-4" />
              {isSubmitting ? 'Broadcasting...' : 'Broadcast Urgent Need'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
