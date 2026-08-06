import { forwardRef } from 'react'

const VideoPlayer = forwardRef(function VideoPlayer({ src }, ref) {
  return (
    <div className="bg-chrome rounded-xl overflow-hidden border border-border/70 shadow-sm">
      <div className="hazard-bar" />
      <video ref={ref} src={src} controls className="w-full aspect-video bg-black" />
    </div>
  )
})

export default VideoPlayer