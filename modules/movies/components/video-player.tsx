"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize, Minimize, Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX } from "lucide-react";
import { formatClock } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { Slider } from "@/shared/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";
import type { Playback } from "../types";

export function VideoPlayer({ playback, poster, title }: { playback: Playback; poster?: string | null; title: string }) {
  if (playback.kind === "youtube") {
    return (
      <div className="aspect-video w-full bg-black ring-1 ring-border">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${playback.key}?rel=0`}
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
        <Button variant="ghost" size="icon" onClick={onClick} aria-label={label} className="text-foreground/80">
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function NativePlayer({ src, hls, poster, title }: { src: string; hls: boolean; poster?: string | null; title: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState(false);

  // HLS: native on Safari, hls.js elsewhere
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

  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => setError(true));
    else v.pause();
  }, []);

  const seekBy = (delta: number) => {
    const v = videoRef.current;
    if (v) v.currentTime = Math.min(Math.max(0, v.currentTime + delta), v.duration || Infinity);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else wrapRef.current?.requestFullscreen?.();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === "INPUT") return;
    const actions: Record<string, () => void> = {
      " ": toggle,
      k: toggle,
      ArrowRight: () => seekBy(10),
      ArrowLeft: () => seekBy(-10),
      f: toggleFullscreen,
      m: () => setMuted((m) => !m),
    };
    const action = actions[e.key];
    if (action) {
      e.preventDefault();
      action();
    }
  };

  const isMuted = muted || volume === 0;

  return (
    <TooltipProvider>
      <div
        ref={wrapRef}
        tabIndex={0}
        role="group"
        aria-label={`${title} video player`}
        onKeyDown={onKeyDown}
        className="group relative aspect-video w-full bg-black ring-1 ring-border outline-none"
      >
        <video
          ref={videoRef}
          src={hls ? undefined : src}
          poster={poster ?? undefined}
          preload="metadata"
          playsInline
          muted={muted}
          onClick={toggle}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onWaiting={() => setBuffering(true)}
          onCanPlay={() => setBuffering(false)}
          onPlaying={() => setBuffering(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onVolumeChange={(e) => setVolume(e.currentTarget.volume)}
          onError={() => setError(true)}
          className="h-full w-full object-contain"
        />

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center font-serif text-xl text-muted-foreground">
            This film can’t be played right now.
          </div>
        )}

        {!playing && !error && (
          <button
            onClick={toggle}
            aria-label="Play"
            className="absolute inset-0 m-auto flex size-20 items-center justify-center rounded-full border border-primary bg-black/50 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <Play className="size-7 translate-x-0.5 fill-current" />
          </button>
        )}
        {buffering && playing && (
          <span className="absolute right-4 top-4 text-[11px] uppercase tracking-[0.25em] text-primary">Buffering…</span>
        )}

        <div
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-4 pb-3 pt-12 transition-opacity ${
            playing ? "opacity-0 focus-within:opacity-100 group-hover:opacity-100" : "opacity-100"
          }`}
        >
          <Slider
            min={0}
            max={duration || 1}
            step={1}
            value={[time]}
            aria-label="Seek"
            onValueChange={([v]) => {
              if (videoRef.current) videoRef.current.currentTime = v;
              setTime(v);
            }}
          />
          <div className="mt-1 flex items-center gap-1">
            <Control label={playing ? "Pause" : "Play"} onClick={toggle}>
              {playing ? <Pause className="fill-current" /> : <Play className="fill-current" />}
            </Control>
            <Control label="Back 10 seconds" onClick={() => seekBy(-10)}><RotateCcw /></Control>
            <Control label="Forward 10 seconds" onClick={() => seekBy(10)}><RotateCw /></Control>
            <span className="ml-3 text-xs tabular-nums tracking-wider text-muted-foreground">
              {formatClock(time)} / {formatClock(duration)}
            </span>
            <span className="flex-1" />
            <Control label={isMuted ? "Unmute" : "Mute"} onClick={() => setMuted((m) => !m)}>
              {isMuted ? <VolumeX /> : <Volume2 />}
            </Control>
            <Slider
              className="hidden w-24 sm:flex"
              min={0}
              max={1}
              step={0.05}
              value={[isMuted ? 0 : volume]}
              aria-label="Volume"
              onValueChange={([v]) => {
                const el = videoRef.current;
                if (!el) return;
                el.volume = v;
                setMuted(false);
              }}
            />
            <Control label={fullscreen ? "Exit full screen" : "Full screen"} onClick={toggleFullscreen}>
              {fullscreen ? <Minimize /> : <Maximize />}
            </Control>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
