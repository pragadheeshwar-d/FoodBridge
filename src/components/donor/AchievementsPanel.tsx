import { useDonationStats } from '../../hooks/useDonationStats'
import { computeAchievements, useNgosHelpedByDonor } from '../../hooks/useDynamicContent'

export function AchievementsPanel() {
  const { stats, loading } = useDonationStats()
  const ngosHelped = useNgosHelpedByDonor()

  const achievements = computeAchievements(
    { totalMeals: stats.totalMeals, totalDonationEvents: stats.totalDonationEvents },
    ngosHelped
  )

  return (
    <div className="glass-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-text dark:text-white">Achievements</h3>
        <p className="text-sm text-text-secondary mt-1">
          Milestones earned through consistent food rescue and community impact.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {achievements.map((a) => (
          <div key={a.title} className={`p-4 rounded-xl border transition-colors ${
            a.unlocked
              ? 'border-primary/20 bg-primary/5'
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30'
          }`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{a.title}</p>
                <p className="text-xs text-text-secondary mt-0.5">{a.description}</p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-secondary">Progress</span>
                    <span className="font-medium">{loading ? '—' : `${a.percent}%`}</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${a.unlocked ? 'bg-primary' : 'bg-primary/60'}`}
                      style={{ width: `${loading ? 0 : a.percent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
