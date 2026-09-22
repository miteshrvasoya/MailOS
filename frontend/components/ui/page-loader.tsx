import { MailOpen, Loader2 } from 'lucide-react'

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in duration-500">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing rings */}
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute -inset-4 border border-primary/30 rounded-full animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
        
        {/* Core Icon */}
        <div className="relative bg-card/50 backdrop-blur border border-border/50 shadow-2xl p-4 rounded-2xl flex items-center justify-center z-10 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-primary/10 animate-[spin_4s_linear_infinite]" />
          <MailOpen className="w-8 h-8 text-primary relative z-10 animate-pulse" />
        </div>
      </div>
      
      {/* Loading Text */}
      <div className="flex flex-col items-center gap-2">
        <h3 className="text-lg font-bold tracking-tight text-foreground flex items-center">
          Loading
          <span className="flex items-center ml-1 w-4">
            <span className="animate-[bounce_1.4s_infinite] [animation-delay:-0.32s]">.</span>
            <span className="animate-[bounce_1.4s_infinite] [animation-delay:-0.16s]">.</span>
            <span className="animate-[bounce_1.4s_infinite]">.</span>
          </span>
        </h3>
        <p className="text-sm text-muted-foreground animate-pulse">Syncing data...</p>
      </div>
    </div>
  )
}
