function extractYoutubeId(url: string): string {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m?.[1] || url
}

export function YoutubeEmbed({ url, className }: { url: string; className?: string }) {
  return (
    <div className={className}>
      <div className="overflow-hidden rounded-lg border">
        <iframe
          className="aspect-video w-full"
          src={`https://www.youtube.com/embed/${extractYoutubeId(url)}?rel=0&modestbranding=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  )
}
