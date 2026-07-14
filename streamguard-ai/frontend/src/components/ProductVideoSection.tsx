import { useState } from 'react';
import { Play } from 'lucide-react';

const YOUTUBE_VIDEO_ID = "dQw4w9WgXcQ"; // Default placeholder video ID, replace as needed

export default function ProductVideoSection() {
  const [playing, setPlaying] = useState(false);

  return (
    <section className="py-20 px-6 bg-[#0A0E1A] border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-10">
          <span className="text-blue-400 text-xs font-bold tracking-wider uppercase bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
            See It In Action
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-4 tracking-tight">
            From Dispute to Defense in 60 Seconds
          </h2>
          <p className="text-slate-400 mt-3 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Watch how Flowshield automatically detects disputes, gathers courier delivery evidence, and compiles audit-grade PDF defense packages.
          </p>
        </div>

        {/* Video container */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-500/5 group bg-slate-950">
          {!playing ? (
            /* Thumbnail with play button overlay */
            <div 
              className="relative cursor-pointer aspect-video flex items-center justify-center"
              onClick={() => setPlaying(true)}
            >
              {/* Thumbnail image */}
              <img
                src="/video-thumbnail.jpg"
                alt="Flowshield AI product walkthrough"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-all duration-300 backdrop-blur-xs" />

              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500 transition-all duration-300 shadow-xl shadow-blue-600/30">
                  <Play className="w-8 h-8 text-white fill-white ml-1" />
                </div>
              </div>

              {/* Duration badge */}
              <div className="absolute bottom-6 right-6 bg-slate-900/90 border border-white/10 text-white text-xs px-3 py-1.5 rounded-xl font-mono">
                1:30
              </div>

              {/* "Watch demo" label */}
              <div className="absolute bottom-6 left-6 text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Product Walkthrough
              </div>
            </div>
          ) : (
            /* YouTube embed — autoplay when play clicked */
            <div className="aspect-video">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&color=white`}
                title="Flowshield AI Product Walkthrough"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>

        {/* Below video — social proof strip */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mt-10 text-slate-400 text-xs font-medium uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live in Production
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">43ms</span>
            average speed
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">94%</span>
            accuracy
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">₹0</span>
            card-free start
          </div>
        </div>
      </div>
    </section>
  );
}
