import { useState } from 'react';
import { Play } from 'lucide-react';

const YOUTUBE_VIDEO_ID = "GnSlQz-14JY";

export default function ProductVideoSection() {
  const [playing, setPlaying] = useState(false);

  return (
    <section className="py-20 md:py-28 px-6 bg-black border-t border-zinc-900 relative">
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 bg-zinc-900 border border-zinc-800 px-4 py-1.5 rounded-full">
            PRODUCT DEMO
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-6 tracking-tight">
            From Dispute to Defense in 60 Seconds
          </h2>
          <p className="text-zinc-400 mt-3 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Watch how Flowshield automatically detects disputes, gathers courier delivery evidence, and compiles court-grade PDF defense packages.
          </p>
        </div>

        {/* Video container */}
        <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-sm group">
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
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/70 group-hover:bg-black/60 transition-colors duration-300" />

              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <Play className="w-6 h-6 fill-black ml-0.5" />
                </div>
              </div>

              {/* Duration badge */}
              <div className="absolute bottom-5 right-5 bg-black border border-zinc-800 text-white text-xs px-3 py-1 rounded font-mono">
                1:30
              </div>

              {/* "Watch demo" label */}
              <div className="absolute bottom-5 left-5 text-zinc-300 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Product Walkthrough
              </div>
            </div>
          ) : (
            /* YouTube embed */
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

        {/* Below video — metric strip */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mt-10 text-zinc-500 text-xs font-mono uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Live Engine
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">&lt;100ms</span>
            speed
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">100%</span>
            target recall
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">₹0</span>
            free start
          </div>
        </div>
      </div>
    </section>
  );
}
