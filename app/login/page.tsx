"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Gamepad2, Zap } from "lucide-react";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-zinc-950 font-display">

            {/* Background with CSS Gradient (Temporary until image generation works) */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-300 via-blue-200 to-green-300 opacity-20"></div>
            <div className="absolute inset-0 bg-[url('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/25.gif')] bg-no-repeat bg-center opacity-10 blur-xl scale-150"></div>

            {/* Content */}
            <div className="relative z-10 text-center space-y-8 animate-in fade-in zoom-in duration-1000">

                {/* Title */}
                <div className="space-y-4">
                    <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_4px_0_rgba(0,0,0,0.5)] tracking-tighter">
                        FocusRPG
                    </h1>
                    <p className="text-xl md:text-2xl text-yellow-100 font-bold tracking-widest uppercase drop-shadow-md">
                        Gotta Focus 'Em All!
                    </p>
                </div>

                {/* Start Button */}
                <div className="pt-12">
                    <Button
                        size="lg"
                        onClick={() => signIn("google", { callbackUrl: "/" })}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold text-lg px-12 py-8 rounded-full border-b-4 border-red-900 active:translate-y-1 active:border-b-0 transition-all shadow-xl group"
                    >
                        <Gamepad2 className="w-6 h-6 mr-3 group-hover:animate-pulse" />
                        PRESS START
                    </Button>
                    <p className="mt-4 text-xs text-white/50 font-mono tracking-wide">
                        © 2026 Focus Corp.
                    </p>
                </div>

            </div>

            {/* Decorative Elements */}
            <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-zinc-950 to-transparent"></div>
        </div>
    );
}
