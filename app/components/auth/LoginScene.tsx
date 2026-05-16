"use client"

export default function LoginScene() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-[18%] h-64 w-64 -translate-x-1/2 rounded-full bg-sky-400/18 blur-3xl sm:h-80 sm:w-80" />
      <div className="absolute right-[8%] top-[12%] h-40 w-40 rounded-full bg-blue-500/16 blur-3xl sm:h-56 sm:w-56" />
      <div className="absolute bottom-[14%] left-[10%] h-44 w-44 rounded-full bg-cyan-300/12 blur-3xl sm:h-60 sm:w-60" />

      <div className="absolute left-[12%] top-[22%] h-28 w-28 rounded-[2rem] border border-white/10 bg-white/6 shadow-[0_22px_44px_rgba(2,8,23,0.26)] backdrop-blur-2xl rotate-6 animate-[floatY_8s_ease-in-out_infinite]" />
      <div className="absolute right-[16%] top-[34%] h-24 w-24 rounded-full border border-sky-200/10 bg-sky-300/8 shadow-[0_20px_40px_rgba(2,8,23,0.22)] backdrop-blur-2xl animate-[floatY_10s_ease-in-out_infinite]" />
      <div className="absolute bottom-[18%] left-1/2 h-32 w-32 -translate-x-1/2 rounded-[2.5rem] border border-blue-200/10 bg-blue-300/8 shadow-[0_24px_50px_rgba(2,8,23,0.24)] backdrop-blur-2xl -rotate-12 animate-[floatY_9s_ease-in-out_infinite]" />
    </div>
  )
}
