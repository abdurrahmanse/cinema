"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Gauge, Loader2, Maximize, Minimize, PictureInPicture2, Pause, Play, RotateCcw, RotateCw, Volume1, Volume2, VolumeX,
} from "lucide-react";
import { formatClock } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Slider } from "@/shared/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";
import type { Playback } from "../types";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const IDLE_MS = 2600;

export function VideoPlayer({ playback, poster, title }: { playback: Playback; poster?: string | null; title: string }) {
  if (playback.kind === "youtube") {
    return (
      <div className="aspect-video w-full bg-black ring-1 ring-border">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${playback.key}?rel=0&modestbranding=1`}
          title={`${title} — ${playback.label}`}
          loading="lazy"
          allow="encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }
  return <NativePlayer src={playback.url} hls={playback.kind === "hls"} poster={poster} title={title} />;
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

function NativePlayer({ src, hls, poster, title }: { src: string; hls: boolean; poster?: string | null; title: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastSaved = useRef(0);
  const dragging = useRef(false);

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
  const [error, setError] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [hover, setHover] = useState<{ pct: number; t: number } | null>(null);
  const [flash, setFlash] = useState<{ side: "left" | "right"; id: number } | null>(null);
  const [resumeAt, setResumeAt] = useState<number | null>(null);
  // Menu portals into the player so it stays visible in fullscreen
  const [wrapEl, setWrapEl] = useState<HTMLDivElement | null>(null);

  const storageKey = `cinema:pos:${src}`;

  // ---- HLS: native on Safari, hls.js elsewhere
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hls || video.canPlayType("application/vnd.apple.mpegurl")) return;
    let instance: { destroy(): void } | undefined;
    import("hls.js").then(({ default: Hls }) => {
      if (!Hls.isSupported()) return setError(true);
      const h = new Hls();
      h.loadSource(src);
      h.attachMedia(video);
      h.on(Hls.Events.ERROR, (_, data) => data.fatal && setError(true));
      instance = h;
    });
    return () => instance?.destroy();
  }, [src, hls]);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => () => clearTimeout(idleTimer.current), []);

  // ---- controls visibility (auto-hide while playing)
  const wake = useCallback(() => {
    setUiVisible(true);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setUiVisible(false);
    }, IDLE_MS);
  }, []);

  // ---- actions
  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused || v.ended) v.play().catch(() => setError(true));
    else v.pause();
  }, []);

  const seekTo = useCallback((t: number) => {
    const v = videoRef.current;
    if (!v) return;
    const next = Math.min(Math.max(0, t), v.duration || t);
    v.currentTime = next;
    setTime(next);
  }, []);

  const skip = useCallback((delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    seekTo(v.currentTime + delta);
    setFlash({ side: delta > 0 ? "right" : "left", id: Date.now() });
  }, [seekTo]);

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
    } catch { /* unsupported */ }
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

  // ---- keyboard
  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('[role="slider"], [role="menu"]') && e.key.startsWith("Arrow")) return;
    const keyActions: Record<string, () => void> = {
      " ": toggle,
      k: toggle,
      ArrowRight: () => skip(10),
      l: () => skip(10),
      ArrowLeft: () => skip(-10),
      j: () => skip(-10),
      ArrowUp: () => changeVolume(0.1),
      ArrowDown: () => changeVolume(-0.1),
      m: () => setMuted((m) => !m),
      f: toggleFullscreen,
      p: togglePip,
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

  // ---- seek bar (pointer drag + hover preview)
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

  // ---- double-tap zones
  const onSurfaceDoubleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    if (x < 0.33) skip(-10);
    else if (x > 0.66) skip(10);
    else toggleFullscreen();
  };

  // ---- resume position
  const persist = (t: number) => {
    if (Math.abs(t - lastSaved.current) < 5) return;
    lastSaved.current = t;
    try {
      localStorage.setItem(storageKey, String(Math.floor(t)));
    } catch { /* storage blocked */ }
  };

  const onLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const d = e.currentTarget.duration;
    setDuration(d);
    try {
      const saved = Number(localStorage.getItem(storageKey));
      if (saved > 15 && saved < d * 0.95) setResumeAt(saved);
    } catch { /* storage blocked */ }
  };

  const updateBuffered = (v: HTMLVideoElement) => {
    const { buffered: b, currentTime } = v;
    for (let i = 0; i < b.length; i++) {
      if (b.start(i) <= currentTime && currentTime <= b.end(i)) return setBuffered(b.end(i));
    }
  };

  const isMuted = muted || volume === 0;
  const VolumeIcon = isMuted ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const playedPct = duration ? (time / duration) * 100 : 0;
  const bufferedPct = duration ? (buffered / duration) * 100 : 0;
  const showUi = uiVisible || !playing || ended;

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
          "group relative aspect-video w-full overflow-hidden bg-black ring-1 ring-border outline-none select-none",
          !showUi && "cursor-none",
          fullscreen && "ring-0",
        )}
      >
        <video
          ref={videoRef}
          src={hls ? undefined : src}
          poster={poster ?? undefined}
          preload="metadata"
          playsInline
          muted={muted}
          onPlay={() => { setPlaying(true); setStarted(true); setEnded(false); setResumeAt(null); wake(); }}
          onPause={() => { setPlaying(false); setUiVisible(true); }}
          onEnded={() => { setEnded(true); setPlaying(false); try { localStorage.removeItem(storageKey); } catch { /* noop */ } }}
          onWaiting={() => setBuffering(true)}
          onCanPlay={() => setBuffering(false)}
          onPlaying={() => setBuffering(false)}
          onProgress={(e) => updateBuffered(e.currentTarget)}
          onTimeUpdate={(e) => {
            if (!dragging.current) setTime(e.currentTarget.currentTime);
            updateBuffered(e.currentTarget);
            persist(e.currentTarget.currentTime);
          }}
          onLoadedMetadata={onLoadedMetadata}
          onVolumeChange={(e) => setVolume(e.currentTarget.volume)}
          onError={() => setError(true)}
          className="h-full w-full object-contain"
        />

        {/* click / double-click surface */}
        <div
          className="absolute inset-0"
          onClick={(e) => {
            if (e.detail === 1) toggle();
          }}
          onDoubleClick={onSurfaceDoubleClick}
        />

        {/* skip flash */}
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

        {/* title (top) */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 to-transparent px-6 pb-12 pt-5 transition-opacity duration-300",
            showUi && started ? "opacity-100" : "opacity-0",
          )}
        >
          <p className="font-serif text-xl text-white/90">{title}</p>
        </div>

        {/* big play / replay / error / spinner */}
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/85 p-6 text-center font-serif text-xl text-muted-foreground">
            This film can’t be played right now.
          </div>
        ) : buffering && playing ? (
          <Loader2 className="pointer-events-none absolute inset-0 m-auto size-12 animate-spin text-primary" aria-label="Buffering" />
        ) : !playing ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black/30">
            <button
              onClick={toggle}
              aria-label={ended ? "Replay" : "Play"}
              className="flex size-24 items-center justify-center rounded-full border border-primary/70 bg-black/40 text-primary shadow-[0_0_60px_-10px] shadow-primary/60 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-primary hover:text-primary-foreground"
            >
              {ended ? <RotateCcw className="size-9" /> : <Play className="size-9 translate-x-0.5 fill-current" />}
            </button>
            {resumeAt && !started && (
              <button
                onClick={() => { seekTo(resumeAt); toggle(); }}
                className="border border-white/20 bg-black/50 px-5 py-2 text-[11px] uppercase tracking-[0.22em] text-white/90 backdrop-blur-md transition-colors hover:border-primary hover:text-primary"
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
            showUi ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
          )}
        >
          {/* seek bar */}
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
                className="pointer-events-none absolute -top-7 -translate-x-1/2 border border-white/10 bg-black/80 px-2 py-0.5 text-[11px] tabular-nums tracking-wider text-white backdrop-blur-md"
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
                    <DropdownMenuRadioItem key={s} value={String(s)}>
                      {s === 1 ? "Normal" : `${s}×`}
                    </DropdownMenuRadioItem>
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
