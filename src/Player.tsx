import Hls from 'hls.js'
import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface PlayerProps {
  streamUrl: string
  onClose: () => void
}

const Player = ({ streamUrl, onClose }: PlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const urlRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(streamUrl)
      hls.attachMedia(video)
      hlsRef.current = hls

      video.play()
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl
      video.play()
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
      }
    }
  }, [streamUrl])

  const handleCustomUrl = () => {
    const url = urlRef.current?.value
    if (url && videoRef.current) {
      // Trigger re-mount or change source
      window.location.hash = url
      window.location.reload()
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-800">
        <div className="flex-1">
          <input
            ref={urlRef}
            type="url"
            placeholder="Enter stream URL (m3u8/mp4)"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
            defaultValue={streamUrl}
          />
        </div>
        <button 
          onClick={handleCustomUrl}
          className="ml-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors"
        >
          Play
        </button>
        <button 
          onClick={onClose}
          className="ml-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Video Player */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls
          autoPlay
          muted
          playsInline
        />
        
        {/* Fullscreen button */}
        <button className="absolute bottom-6 right-6 p-3 bg-black/50 hover:bg-black/70 rounded-full group">
          <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Player

