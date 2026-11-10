export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1600px] px-4 md:px-10 ${className}`}>{children}</div>;
}
