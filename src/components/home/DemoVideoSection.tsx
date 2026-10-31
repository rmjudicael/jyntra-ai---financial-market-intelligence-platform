import React, { useMemo, useState } from 'react';
import { Play, ExternalLink, AlertCircle, Film } from 'lucide-react';
import { YOUTUBE_DEMO_URL, YOUTUBE_DEMO_ATTRIBUTION, parseYouTubeUrl } from '../../config/youtube';

interface DemoVideoSectionProps {
  videoUrl?: string;
  title?: string;
  subtitle?: string;
  attribution?: string;
}

export const DemoVideoSection: React.FC<DemoVideoSectionProps> = ({
  videoUrl,
  title = 'RAMIELSON Geoffroy Judicaël — JYNTRA AI en démonstration',
  subtitle = 'Démonstration de la plateforme JYNTRA AI : analyse de marché, intelligence multi-agents et assistante holographique LYNARA en action.',
  attribution = YOUTUBE_DEMO_ATTRIBUTION,
}) => {
  const configuredUrl = videoUrl ?? YOUTUBE_DEMO_URL;
  const parsed = useMemo(() => parseYouTubeUrl(configuredUrl), [configuredUrl]);
  const [playing, setPlaying] = useState(false);

  const hasUrl = configuredUrl.trim().length > 0;
  const isInvalid = hasUrl && !parsed;

  return (
    <section
      id="demo-video"
      data-reveal
      className="relative isolate py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 bg-[#06090E] overflow-hidden"
    >
      <div className="absolute inset-0 -z-10 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.10),transparent_60%)]" />

      <div className="max-w-6xl mx-auto space-y-9">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold font-mono uppercase tracking-widest">
              <Film className="w-3.5 h-3.5" />
              DÉMONSTRATION VIDÉO · JYNTRA AI
            </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white text-balance">{title}</h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed text-pretty">{subtitle}</p>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 border-cyan-500/20 shadow-2xl shadow-cyan-500/10 bg-slate-950 aspect-video">
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-950/90 border border-cyan-500/30 backdrop-blur text-[11px] font-mono text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            DÉMONSTRATION JYNTRA AI
          </div>
          {parsed ? (
            playing ? (
              <iframe
                src={`${parsed.embedUrl}&autoplay=1`}
                title={attribution || 'Vidéo pédagogique'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            ) : (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                className="group absolute inset-0 w-full h-full flex items-center justify-center"
                aria-label="Lire la vidéo"
              >
                <img
                  src={`https://i.ytimg.com/vi/${parsed.videoId}/maxresdefault.jpg`}
                  onError={(event) => {
                    (event.currentTarget as HTMLImageElement).src =
                      `https://i.ytimg.com/vi/${parsed.videoId}/hqdefault.jpg`;
                  }}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-85 transition-opacity"
                  loading="lazy"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/35 to-transparent" />
                <span className="relative z-10 flex flex-col items-center gap-3 keep-white">
                  <span className="w-20 h-20 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl shadow-black/40 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/25 group-active:scale-95">
                    <Play className="w-8 h-8 text-white fill-current translate-x-0.5" />
                  </span>
                </span>
              </button>
            )
          ) : isInvalid ? (
            <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
              <div className="space-y-3 max-w-md">
                <AlertCircle className="w-9 h-9 text-amber-400 mx-auto" />
                <h3 className="text-base font-bold text-white">Vidéo momentanément indisponible</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  La démonstration n'est pas accessible pour le moment. Merci de revenir un peu plus tard.
                </p>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
              <div className="space-y-4 max-w-md">
                <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto">
                  <Play className="w-6 h-6 text-slate-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">Démonstration bientôt disponible</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    La démonstration vidéo officielle de JYNTRA AI sera publiée ici prochainement. Aucune
                    vidéo de substitution n'est diffusée.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {parsed && (
          <div className="flex flex-col items-center gap-3 -mt-1">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
              <p className="text-xs text-slate-400 text-center sm:text-left max-w-md">
                La vidéo de démonstration est également disponible sur YouTube — clique sur le bouton pour t'y rendre.
              </p>
              <a
                href={parsed.watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/25 transition-all active:scale-95"
              >
                <ExternalLink className="w-4 h-4" />
                Voir sur YouTube
              </a>
            </div>
            {attribution && !playing && (
              <p className="text-[10px] text-slate-500 text-center max-w-2xl leading-relaxed">{attribution}</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
