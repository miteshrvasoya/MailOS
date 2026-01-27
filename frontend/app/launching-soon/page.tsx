'use client'

import { Button } from '@/components/ui/button'
import { PartyPopper, ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

export default function LaunchingSoonPage() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px]" />
        </div>

        <style jsx global>{`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
        `}</style>
      
      <div className="z-10 text-center space-y-8 max-w-2xl px-6">
        <div className="animate-float inline-flex justify-center mb-4">
             <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl border border-white/[0.02] backdrop-blur-sm shadow-2xl shadow-indigo-500/5">
                <PartyPopper className="w-12 h-12 text-indigo-400" />
             </div>
        </div>

        <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/50">
            MailOS is <span className="text-indigo-400">coming</span>
            </h1>
            
            <p className="text-xl text-slate-400 max-w-lg mx-auto leading-relaxed">
            Your inbox, finally intelligent. We are rolling out access gradually. 
            <br />
            <span className="text-indigo-300 font-medium">You are on the waitlist!</span>
            </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button 
                variant="outline" 
                size="lg"
                className="border-white/5 hover:bg-white/[0.02] text-slate-300 hover:text-white transition-all duration-300"
                onClick={() => signOut({ callbackUrl: '/' })}
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Sign Out
            </Button>
            
            <Button 
                variant="ghost" 
                size="lg"
                className="text-slate-400 hover:text-white hover:bg-white/[0.02]"
                asChild
            >
                <Link href="/">Go back to Home</Link>
            </Button>
        </div>
      </div>

      <div className="absolute bottom-10 text-slate-700 text-sm">
        Crafted for efficiency.
      </div>
    </main>
  )
}
