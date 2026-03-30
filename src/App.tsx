import { useState, useEffect } from 'react'
import { Play, Tv, Film, Maximize2, X } from 'lucide-react'
import Player from './Player.tsx'

interface Movie {
  title: string
  poster: string
  stream: string
}

interface Category {
  name: string
  icon: string
  movies: Movie[]
}

function App() {
  const [movies, setMovies] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState('Live Cricket')
  const [currentStream, setCurrentStream] = useState('')
  const [showPlayer, setShowPlayer] = useState(false)

  // Load data
  useEffect(() => {
    fetch('/data/movies.json')
      .then(res => res.json())
      .then(setMovies)
  }, [])

  const playStream = (stream: string) => {
    setCurrentStream(stream)
    setShowPlayer(true)
  }

  const categoryMovies = movies.find(cat => cat.name === selectedCategory)?.movies || []

  return (
    <>
      <div className="h-screen bg-gradient-to-br from-gray-900 to-black text-white overflow-hidden">
        {/* Sidebar */}
        <div className="fixed left-0 top-0 h-full w-64 bg-gray-900/80 backdrop-blur-lg border-r border-gray-800 z-20">
          <div className="p-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent mb-8">
              NS Player
            </h1>
            <nav className="space-y-2">
              {movies.map(cat => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    selectedCategory === cat.name
                      ? 'bg-emerald-500/20 border-emerald-500 border text-emerald-400 font-medium'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {categoryMovies.map((movie, i) => (
                <div key={i} className="group relative overflow-hidden rounded-2xl bg-gray-800/50 hover:bg-gray-700/50 transition-all cursor-pointer hover:scale-105 hover:-translate-y-2" onClick={() => playStream(movie.stream)}>
                  <div className="relative">
                    <img src={movie.poster} alt={movie.title} className="w-full h-64 object-cover group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <h3 className="font-bold text-lg mb-1 truncate">{movie.title}</h3>
                    </div>
                    <button className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 hover:bg-white/20 rounded-full p-4 transition-all">
                      <Play className="w-12 h-12 text-white" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showPlayer && (
        <Player streamUrl={currentStream} onClose={() => setShowPlayer(false)} />
      )}
    </>
  )
}

export default App

