"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle, Gauge, Loader2, Maximize, Minimize, PictureInPicture2, Pause, Play, RotateCcw, RotateCw, Server,
  Volume1, Volume2, VolumeX,
} from "lucide-react";
import { clearProgress, getProgress, saveProgress, type SavedItem } from "@/modules/library/store";
import { formatClock } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Slider } from "@/shared/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";
import type { Playback, StreamSource } from "../types";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const IDLE_MS = 2600;
/** A server that stays in "buffering" this long is considered dead and we move to the next one. */
const STALL_MS = 15_000;

export function VideoPlayer({
  playback,
  poster,
  title,
  meta,
}: {
  playback: Playback;
  poster?: string | null;
  title: string;
  meta: SavedItem;
}) {
  if (playback.kind === "youtube") return <YouTubeEmbed id={playback.key} title={`${title} — ${playback.label}`} />;
  return <StreamPlayer sources={playback.sources} trailerKey={playback.trailerKey} poster={poster} title={title} meta={meta} />;
}

function YouTubeEmbed({ id, title }: { id: string; title: string }) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl shadow-black/60 ring-1 ring-white/10">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`}
        title={title}
        loading="lazy"
        allow="encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}

function Control({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          aria-label={label}
          className="flex size-10 items-center justify-center text-white/85 transition-colors hover:text-primary [&_svg]:size-5"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function StreamPlayer({
  sources,
  trailerKey,
  poster,
  title,
  meta,
}: {
  sources: StreamSource[];
  trailerKey?: string | null;
  poster?: string | null;
  title: string;
  meta: SavedItem;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastSaved = useRef(0);
  const dragging = useRef(false);
  const idxRef = useRef(0);
  const wantPlay = useRef(false);
  /** Where to continue after switching server / retrying */
  const resume = useRef<{ t: number; play: boolean } | null>(null);
  const hlsErrors = useRef(0);

  const [idx, setIdx] = useState(0);
  const [allFailed, setAllFailed] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [hover, setHover] = useState<{ pct: number; t: number } | null>(null);
  const [flash, setFlash] = useState<{ side: "left" | "right"; id: number } | null>(null);
  const [resumeAt, setResumeAt] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = getProgress(meta);
    return saved && saved.position > 15 ? saved.position : null;
  });
  const [wrapEl, setWrapEl] = useState<HTMLDivElement | null>(null);

  const source = sources[idx];

  useEffect(() => {
    idxRef.current = idx;
  }, [idx]);

  // ---- server failover ---------------------------------------------------
  const failover = useCallback(
    (reason: string) => {
      const v = videoRef.current;
      resume.current = { t: v?.currentTime ?? 0, play: wantPlay.current };
      const next = idxRef.current + 1;
      if (next < sources.length) {
        hlsErrors.current = 0;
        setNotice(`${reason} — switching to ${sources[next].label}…`);
        setBuffering(true);
        setIdx(next);
      } else {
        setBuffering(false);
        setPlaying(false);
        setAllFailed(true);
      }
    },
    [sources],
  );

  const chooseServer = (value: string) => {
    const next = Number(value);
    if (next === idxRef.current) return;
    const v = videoRef.current;
    resume.current = { t: v?.currentTime ?? 0, play: wantPlay.current || !!v && !v.paused };
    setNotice(`Connecting to ${sources[next].label}…`);
    setBuffering(true);
    setAllFailed(false);
    setIdx(next);
  };

  const retryAll = () => {
    resume.current = { t: videoRef.current?.currentTime ?? 0, play: true };
    setAllFailed(false);
    setNotice("Reconnecting…");
    setBuffering(true);
    setIdx(0);
  };

  // The <video> can fail before React hydrates (events are then missed) — check on mount and on every source change.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || source.type === "hls") return;
    const t = setTimeout(() => {
      if (v.error) failover("Server unavailable");
    }, 0);
    return () => clearTimeout(t);
  }, [source.url, source.type, failover]);

  // Stall watchdog: stuck buffering on a server -> try the next one
  useEffect(() => {
    if (!buffering || allFailed) return;
    const t = setTimeout(() => failover("Server is not responding"), STALL_MS);
    return () => clearTimeout(t);
  }, [buffering, allFailed, idx, failover]);

  // ---- HLS (native on Safari, hls.js elsewhere) ---------------------------
  useEffect(() => {
    const video = videoRef.current;
    if (!video || source.type !== "hls" || video.canPlayType("application/vnd.apple.mpegurl")) return;
    let instance: { destroy(): void } | undefined;
    let cancelled = false;
    import("hls.js").then(({ default: Hls }) => {
      if (cancelled) return;
      if (!Hls.isSupported()) return failover("Playback is not supported");
      const h = new Hls({ maxBufferLength: 30, enableWorker: true });
      h.loadSource(source.url);
      h.attachMedia(video);
      h.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return;
        // Try in-place recovery once before changing server
        if (hlsErrors.current++ < 2) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) return h.startLoad();
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) return h.recoverMediaError();
        }
        failover("Stream error");
      });
      instance = h;
    });
    return () => {
      cancelled = true;
      instance?.destroy();
    };
  }, [source.url, source.type, failover]);

  // ---- misc effects -------------------------------------------------------
  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => () => clearTimeout(idleTimer.current), []);

  // Save position when leaving the page
  useEffect(() => {
    const flush = () => {
      const v = videoRef.current;
      if (v && v.currentTime > 5) saveProgress(meta, v.currentTime, v.duration);
    };
    window.addEventListener("pagehide", flush);
    return () => {
      flush();
      window.removeEventListener("pagehide", flush);
    };
  }, [meta]);

  const wake = useCallback(() => {
    setUiVisible(true);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setUiVisible(false);
    }, IDLE_MS);
  }, []);

  // ---- actions ------------------------------------------------------------
  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused || v.ended) {
      wantPlay.current = true;
      if (v.error) return failover("Server unavailable");
      v.play().catch(() => {
        if (v.error) failover("Server unavailable");
        /* otherwise autoplay policy / interrupted — user can press play again */
      });
    } else {
      wantPlay.current = false;
      v.pause();
    }
  }, [failover]);

  const seekTo = useCallback((t: number) => {
    const v = videoRef.current;
    if (!v) return;
    const next = Math.min(Math.max(0, t), v.duration || t);
    v.currentTime = next;
    setTime(next);
  }, []);

  const skip = useCallback(
    (delta: number) => {
      const v = videoRef.current;
      if (!v) return;
      seekTo(v.currentTime + delta);
      setFlash({ side: delta > 0 ? "right" : "left", id: Date.now() });
    },
    [seekTo],
  );

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    else wrapRef.current?.requestFullscreen?.();
  }, []);

  const togglePip = useCallback(async () => {
    const v = videoRef.current;
    if (!v || !document.pictureInPictureEnabled) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await v.requestPictureInPicture();
    } catch {
      /* unsupported */
    }
  }, []);

  const changeVolume = useCallback((delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = Math.min(1, Math.max(0, v.volume + delta));
    setMuted(false);
  }, []);

  const changeSpeed = (value: string) => {
    const rate = Number(value);
    if (videoRef.current) videoRef.current.playbackRate = rate;
    setSpeed(rate);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('[role="slider"], [role="menu"]') && e.key.startsWith("Arrow")) return;
    const keyActions: Record<string, () => void> = {
      " ": toggle, k: toggle,
      ArrowRight: () => skip(10), l: () => skip(10),
      ArrowLeft: () => skip(-10), j: () => skip(-10),
      ArrowUp: () => changeVolume(0.1), ArrowDown: () => changeVolume(-0.1),
      m: () => setMuted((m) => !m), f: toggleFullscreen, p: togglePip,
    };
    const action = keyActions[e.key];
    if (action) {
      e.preventDefault();
      wake();
      action();
    } else if (/^[0-9]$/.test(e.key) && duration) {
      e.preventDefault();
      seekTo((Number(e.key) / 10) * duration);
    }
  };

  // ---- seek bar -----------------------------------------------------------
  const ratioFromPointer = (clientX: number) => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect || !rect.width) return 0;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  const onBarMove = (e: React.PointerEvent) => {
    const pct = ratioFromPointer(e.clientX);
    setHover({ pct, t: pct * duration });
    if (dragging.current) seekTo(pct * duration);
  };

  const onSurfaceDoubleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    if (x < 0.33) skip(-10);
    else if (x > 0.66) skip(10);
    else toggleFullscreen();
  };

  // ---- video events -------------------------------------------------------
  const onLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    setDuration(v.duration);
    setBuffering(false); // metadata arrived: the server is alive (waiting/stalled will set it again if needed)
    setNotice(null);
    v.playbackRate = speed;
    if (resume.current) {
      const { t, play } = resume.current;
      resume.current = null;
      if (t > 0) v.currentTime = t;
      if (play) v.play().catch(() => {});
    }
  };

  const updateBuffered = (v: HTMLVideoElement) => {
    const { buffered: b, currentTime } = v;
    for (let i = 0; i < b.length; i++) {
      if (b.start(i) <= currentTime && currentTime <= b.end(i)) return setBuffered(b.end(i));
    }
  };

  const onTimeUpdate = (v: HTMLVideoElement) => {
    if (!dragging.current) setTime(v.currentTime);
    updateBuffered(v);
    if (Math.abs(v.currentTime - lastSaved.current) >= 5) {
      lastSaved.current = v.currentTime;
      saveProgress(meta, v.currentTime, v.duration);
    }
  };

  const isMuted = muted || volume === 0;
  const VolumeIcon = isMuted ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const playedPct = duration ? (time / duration) * 100 : 0;
  const bufferedPct = duration ? (buffered / duration) * 100 : 0;
  const showUi = uiVisible || !playing || ended;

  // Last resort: trailer
  if (showTrailer && trailerKey) return <YouTubeEmbed id={trailerKey} title={`${title} — trailer`} />;

  return (
    <TooltipProvider>
      <div
        ref={(el) => {
          wrapRef.current = el;
          setWrapEl(el);
        }}
        tabIndex={0}
        role="group"
        aria-label={`${title} video player`}
        onKeyDown={onKeyDown}
        onPointerMove={wake}
        onPointerLeave={() => playing && setUiVisible(false)}
        className={cn(
          "group relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl shadow-black/60 ring-1 ring-white/10 outline-none select-none",
          !showUi && "cursor-none",
          fullscreen && "ring-0",
        )}
      >
        <video
          ref={videoRef}
          src={source.type === "hls" ? undefined : source.url}
          poster={poster ?? undefined}
          preload="metadata"
          playsInline
          muted={muted}
          onPlay={() => { wantPlay.current = true; setPlaying(true); setStarted(true); setEnded(false); setResumeAt(null); wake(); }}
          onPause={() => { setPlaying(false); setUiVisible(true); }}
          onEnded={() => { wantPlay.current = false; setEnded(true); setPlaying(false); clearProgress(meta); }}
          onWaiting={() => setBuffering(true)}
          onStalled={() => wantPlay.current && setBuffering(true)}
          onCanPlay={() => { setBuffering(false); setNotice(null); }}
          onPlaying={() => { setBuffering(false); setNotice(null); }}
          onProgress={(e) => updateBuffered(e.currentTarget)}
          onTimeUpdate={(e) => onTimeUpdate(e.currentTarget)}
          onLoadedMetadata={onLoadedMetadata}
          onVolumeChange={(e) => setVolume(e.currentTarget.volume)}
          onError={() => failover("Playback error")}
          className="h-full w-full object-contain"
        />

        {/* click / double-click surface */}
        <div className="absolute inset-0" onClick={(e) => e.detail === 1 && toggle()} onDoubleClick={onSurfaceDoubleClick} />

        {flash && (
          <div
            key={flash.id}
            onAnimationEnd={() => setFlash(null)}
            className={cn(
              "pointer-events-none absolute top-1/2 flex -translate-y-1/2 flex-col items-center gap-1 rounded-full bg-black/55 px-8 py-6 text-white backdrop-blur-md animate-in fade-in-0 zoom-in-90 duration-300",
              flash.side === "left" ? "left-[12%]" : "right-[12%]",
            )}
          >
            {flash.side === "left" ? <RotateCcw className="size-7" /> : <RotateCw className="size-7" />}
            <span className="text-xs tracking-[0.2em]">10s</span>
          </div>
        )}

        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/80 to-transparent px-6 pb-12 pt-5 transition-opacity duration-300",
            showUi && started ? "opacity-100" : "opacity-0",
          )}
        >
          <p className="font-display text-lg font-bold text-white/90">{title}</p>
          {sources.length > 1 && <span className="text-xs font-medium text-white/60">{source.label}</span>}
        </div>

        {/* switching-server notice */}
        {notice && !allFailed && (
          <div className="pointer-events-none absolute inset-x-0 top-6 flex justify-center">
            <span className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm font-medium text-white backdrop-blur-md">
              <Loader2 className="size-3.5 animate-spin" /> {notice}
            </span>
          </div>
        )}

        {/* big overlays */}
        {allFailed ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black/90 p-6 text-center">
            <AlertTriangle className="size-9 text-primary" />
            <p className="max-w-md font-display text-2xl font-bold">We couldn’t reach any server for this film.</p>
            <p className="max-w-md text-sm text-muted-foreground">Check your connection and try again — we’ll reconnect from the start of the list.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={retryAll}
                className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Try again
              </button>
              {trailerKey && (
                <button
                  onClick={() => setShowTrailer(true)}
                  className="rounded-md bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                >
                  Watch trailer instead
                </button>
              )}
            </div>
          </div>
        ) : buffering && (playing || notice) ? (
          <Loader2 className="pointer-events-none absolute inset-0 m-auto size-12 animate-spin text-primary" aria-label="Buffering" />
        ) : !playing ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black/30">
            <button
              onClick={toggle}
              aria-label={ended ? "Replay" : "Play"}
              className="flex size-20 items-center justify-center rounded-full bg-primary text-white shadow-[0_0_60px_-8px] shadow-primary/70 transition-all duration-300 hover:scale-110 md:size-24"
            >
              {ended ? <RotateCcw className="size-9" /> : <Play className="size-9 translate-x-0.5 fill-current" />}
            </button>
            {resumeAt && !started && (
              <button
                onClick={() => { resume.current = { t: resumeAt, play: true }; toggle(); }}
                className="rounded-full bg-black/60 px-5 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-black/80"
              >
                Resume from {formatClock(resumeAt)}
              </button>
            )}
          </div>
        ) : null}

        {/* control bar */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-4 pb-4 pt-16 transition-all duration-300 sm:px-6",
            showUi && !allFailed ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
          )}
        >
          <div
            ref={barRef}
            role="slider"
            tabIndex={0}
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.floor(duration)}
            aria-valuenow={Math.floor(time)}
            aria-valuetext={`${formatClock(time)} of ${formatClock(duration)}`}
            onPointerDown={(e) => {
              dragging.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              seekTo(ratioFromPointer(e.clientX) * duration);
            }}
            onPointerMove={onBarMove}
            onPointerUp={() => { dragging.current = false; }}
            onPointerLeave={() => setHover(null)}
            className="group/bar relative flex h-5 cursor-pointer touch-none items-center"
          >
            <div className="relative h-[3px] w-full bg-white/20 transition-[height] group-hover/bar:h-[5px]">
              <div className="absolute inset-y-0 left-0 bg-white/30" style={{ width: `${bufferedPct}%` }} />
              <div className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${playedPct}%` }} />
              <div
                className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary opacity-0 shadow-[0_0_12px] shadow-primary transition-opacity group-hover/bar:opacity-100"
                style={{ left: `${playedPct}%` }}
              />
            </div>
            {hover && duration > 0 && (
              <span
                className="pointer-events-none absolute -top-8 -translate-x-1/2 rounded-md bg-black/80 px-2 py-1 text-xs font-medium tabular-nums text-white backdrop-blur-md"
                style={{ left: `${hover.pct * 100}%` }}
              >
                {formatClock(hover.t)}
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center">
            <Control label={playing ? "Pause (k)" : ended ? "Replay" : "Play (k)"} onClick={toggle}>
              {playing ? <Pause className="fill-current" /> : <Play className="fill-current" />}
            </Control>
            <Control label="Back 10s (j)" onClick={() => skip(-10)}><RotateCcw /></Control>
            <Control label="Forward 10s (l)" onClick={() => skip(10)}><RotateCw /></Control>

            <div className="group/vol ml-1 flex items-center">
              <Control label={isMuted ? "Unmute (m)" : "Mute (m)"} onClick={() => setMuted((m) => !m)}>
                <VolumeIcon />
              </Control>
              <Slider
                className="w-0 overflow-hidden opacity-0 transition-all duration-300 group-focus-within/vol:w-20 group-focus-within/vol:opacity-100 group-hover/vol:w-20 group-hover/vol:opacity-100"
                min={0}
                max={1}
                step={0.05}
                value={[isMuted ? 0 : volume]}
                aria-label="Volume"
                onValueChange={([v]) => {
                  if (videoRef.current) videoRef.current.volume = v;
                  setMuted(false);
                }}
              />
            </div>

            <span className="ml-3 text-xs tabular-nums tracking-wider text-white/70">
              {formatClock(time)} <span className="text-white/35">/</span> {formatClock(duration)}
            </span>

            <span className="flex-1" />

            {sources.length > 1 && (
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button aria-label="Choose server" className="flex h-10 items-center gap-1.5 px-2 text-white/85 transition-colors hover:text-primary">
                        <Server className="size-5" />
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Server</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" container={wrapEl}>
                  <DropdownMenuLabel>Server</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={String(idx)} onValueChange={chooseServer}>
                    {sources.map((s, i) => (
                      <DropdownMenuRadioItem key={s.url} value={String(i)}>{s.label}</DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label="Playback speed"
                      className="flex h-10 items-center gap-1.5 px-2 text-xs tabular-nums tracking-wider text-white/85 transition-colors hover:text-primary"
                    >
                      <Gauge className="size-5" />
                      {speed !== 1 && <span>{speed}×</span>}
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Speed</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" container={wrapEl}>
                <DropdownMenuLabel>Speed</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={String(speed)} onValueChange={changeSpeed}>
                  {SPEEDS.map((s) => (
                    <DropdownMenuRadioItem key={s} value={String(s)}>{s === 1 ? "Normal" : `${s}×`}</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <span className="hidden sm:block">
              <Control label="Picture in picture (p)" onClick={togglePip}><PictureInPicture2 /></Control>
            </span>
            <Control label={fullscreen ? "Exit full screen (f)" : "Full screen (f)"} onClick={toggleFullscreen}>
              {fullscreen ? <Minimize /> : <Maximize />}
            </Control>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
