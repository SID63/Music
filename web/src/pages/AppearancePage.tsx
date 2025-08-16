import React from 'react';
import { useAppearance } from '@/components/AppearanceProvider';
import { Button } from '@/components/ui/button';

export default function AppearancePage() {
  const { appearance, setAppearance, reset } = useAppearance();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Appearance</h1>
        <p className="text-sm text-muted-foreground">Customize how Music Connect looks for you. Preferences are saved on this device.</p>
      </div>

      <div className="space-y-6">
        {/* Accent color */}
        <section className="card p-4">
          <h2 className="font-semibold mb-3">Accent color</h2>
          <div className="grid grid-cols-5 gap-3">
            {(['blue','purple','emerald','rose','amber'] as const).map(c => (
              <button
                key={c}
                onClick={() => setAppearance({ accent: c })}
                className={`h-10 rounded-xl border transition-all ${appearance.accent === c ? 'ring-2 ring-[var(--ring)]' : ''}`}
                style={{ background: 'var(--primary)' }}
                data-accent={c}
              >
                <span className="sr-only">{c}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">The accent influences primary buttons and highlights.</p>
        </section>

        {/* Radius */}
        <section className="card p-4">
          <h2 className="font-semibold mb-3">Corner radius</h2>
          <div className="flex gap-3">
            {(['sm','md','lg','xl'] as const).map(r => (
              <Button
                key={r}
                variant={appearance.radius === r ? 'default' : 'outline'}
                onClick={() => setAppearance({ radius: r })}
                className="capitalize"
              >
                {r}
              </Button>
            ))}
          </div>
        </section>

        {/* Density */}
        <section className="card p-4">
          <h2 className="font-semibold mb-3">Density</h2>
          <div className="flex gap-3">
            {(['comfortable','compact'] as const).map(d => (
              <Button
                key={d}
                variant={appearance.density === d ? 'default' : 'outline'}
                onClick={() => setAppearance({ density: d })}
                className="capitalize"
              >
                {d}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Compact makes controls slightly smaller and tighter.</p>
        </section>

        {/* Flair */}
        <section className="card p-4">
          <h2 className="font-semibold mb-3">Background flair</h2>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Subtle gradient glow behind the content.</p>
            <Button variant={appearance.flair ? 'default' : 'outline'} onClick={() => setAppearance({ flair: !appearance.flair })}>
              {appearance.flair ? 'On' : 'Off'}
            </Button>
          </div>
        </section>

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={reset}>Reset to defaults</Button>
        </div>
      </div>
    </div>
  );
}
