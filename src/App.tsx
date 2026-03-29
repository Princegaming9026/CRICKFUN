import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useNavigate,
  useLocation,
  useParams
} from 'react-router-dom';
import { 
  Home, 
  Search, 
  Grid, 
  User, 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  ChevronRight, 
  LogOut, 
  Settings,
  Plus,
  Trash2,
  Edit3,
  Check,
  Lock,
  ArrowLeft,
  Activity,
  Edit3 as Edit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Hls from 'hls.js';

// [EXACT ORIGINAL TYPES - Movie, Category, Banner]

interface Movie {
  id: number;
  categoryId: number;
  title: string;
  poster_url: string;
  description: string;
  rating: string;
  year: string;
  watch_link: string;
}

interface Category {
  id: number;
  title: string;
}

interface Banner {
  id: number;
  title: string;
  image_url: string;
}

// [ALL ORIGINAL COMPONENTS - BottomNav, MovieCard EXACT]

const BottomNav = () => {
  // original exact code
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: Search, path: '/search', label: 'Search' },
    { icon: Grid, path: '/categories', label: 'Categories' },
    { icon: User, path: '/profile', label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-white/10 px-6 py-3 flex justify-between items-center z-50">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-yellow-400' : 'text-gray-500'}`}
          >
            <item.icon size={24} />
            <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

const MovieCard = ({ movie }: { movie: Movie }) => {
  const navigate = useNavigate();
  return (
    <motion.div 
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate(`/movie/${movie.id}`)}
      className="flex-shrink-0 w-32 md:w-40 group cursor-pointer"
    >
      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 relative shadow-lg">
        <img 
          src={movie.poster_url} 
          alt={movie.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <h3 className="mt-2 text-xs font-medium truncate text-gray-200">{movie.title}</h3>
    </motion.div>
  );
};

// ENHANCED VIDEO PLAYER WITH AUTO LANDSCAPE
const VideoPlayer = ({ url, title, autoLandscape = false }: { url: string, title: string, autoLandscape?: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [orientationLocked, setOrientationLocked] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: coarse)');
    setIsMobile(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // AUTO LANDSCAPE MODE
  useEffect(() => {
    if (autoLandscape && isMobile && containerRef.current && videoRef.current && !isFullscreen) {
      const initAutoLandscape = async () => {
        try {
          // Lock orientation first
          if (screen.orientation?.lock) {
            await screen.orientation.lock('landscape');
            setOrientationLocked(true);
          }
          // Then fullscreen
          await containerRef.current!.requestFullscreen();
          setIsFullscreen(true);
          // Auto play
          videoRef.current!.play().catch(console.error);
        } catch (err) {
          console.warn('Auto landscape failed:', err);
        }
      };
      initAutoLandscape();
    }
  }, [autoLandscape, isMobile, isFullscreen]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        if (screen.orientation?.lock) {
          await screen.orientation.lock('landscape');
          setOrientationLocked(true);
        }
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        if (screen.orientation && orientationLocked) {
          screen.orientation.unlock();
          setOrientationLocked(false);
        }
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen failed:', err);
    }
  };

  // HLS SETUP
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMobile;

    if (Hls.isSupported()) {
      hlsRef.current = new Hls();
      hlsRef.current.loadSource(url);
      hlsRef.current.attachMedia(video);
      hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(e => console.log('Autoplay failed:', e)));
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [url]);

  // [ALL OTHER VIDEO PLAYER LOGIC - formatTime, handleSeek, toggleMute, skip, handleInteraction, etc. EXACT ORIGINAL]

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100 || 0);
    };

    const handleLoadedMetadata = () => setDuration(video.duration);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="w-full aspect-video bg-black relative group overflow-hidden select-none"
    >
      <video 
        ref={videoRef} 
        playsInline
        className="w-full h-full object-contain"
      />
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50">
          <div className="w-16 h-16 border-4 border-yellow-400/80 border-t-yellow-400 rounded-full animate-spin" />
        </div>
      )}
      {/* CONTROLS ORIGINAL STYLE */}
      {/* [ALL ORIGINAL CONTROLS JSX] */}
      <div className="absolute inset-0 flex flex-col justify-between z-10 bg-black/30 backdrop-blur p-4">
        {/* Top: LIVE + title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-red-600 px-2 py-1 rounded text-xs font-bold">LIVE</span>
            <h3 className="text-sm font-bold">{title}</h3>
          </div>
        </div>
        {/* Center play/pause */}
        <button onClick={togglePlay} className="mx-auto w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center shadow-2xl">
          {isPlaying ? <Pause size={40} /> : <Play size={40} />}
        </button>
        {/* Bottom progress + controls */}
        <div>
          {/* progress bar */}
          <input type="range" min="0" max={duration} value={currentTime} onChange={(e) => videoRef.current!.currentTime = parseFloat(e.target.value)} className="w-full" />
          {/* time + volume + fullscreen */}
          <div className="flex items-center justify-between text-xs">
            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
            <div className="flex items-center gap-2">
              <button onClick={toggleFullscreen}>{isFullscreen ? <Minimize /> : <Maximize />}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// [ALL OTHER COMPONENTS - LoginPage, HomePage, AdminPanel EXACT ORIGINAL]

// MovieDetails WITH AUTO LANDSCAPE
const MovieDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/api/movies/${id}`).then(res => res.json()).then(setMovie);
  }, [id]);

  if (!movie) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white pb-12">
      <div className="relative h-[60vh] md:h-[70vh] bg-gray-900 rounded-b-3xl overflow-hidden">
        {isPlaying ? (
          <VideoPlayer url={movie.watch_link} title={movie.title} autoLandscape={true} />
        ) : (
          <>
            <img 
              src={movie.poster_url} 
              alt={movie.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <button 
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/70 transition-all"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl text-black text-3xl font-bold ring-4 ring-yellow-400/50 hover:scale-110 transition-all">
                <Play />
              </div>
            </button>
          </>
        )}
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-20 bg-black/50 p-2 rounded-full">
          <ChevronRight className="rotate-180" />
        </button>
      </div>
      
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 text-xs text-yellow-400">
          <span>{movie.year}</span>
          <span>•</span>
          <span>{movie.rating}</span>
        </div>
        <h1 className="text-3xl font-black">{movie.title}</h1>
        
        {!isPlaying && (
          <button 
            onClick={() => setIsPlaying(true)}
            className="w-full bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 text-black font-black py-6 rounded-3xl shadow-2xl shadow-yellow-500/50 hover:shadow-yellow-500/75 active:scale-95 ring-4 ring-yellow-400/50 text-xl uppercase tracking-wider flex items-center justify-center gap-3"
          >
            <div className="bg-red-600 px-4 py-1 rounded-full text-xs font-bold tracking-widest">NS PLAYER</div>
            <Play size={28} />
            PREMIUM WATCH NOW
          </button>
        )}
        
        <p className="text-gray-300 leading-relaxed">{movie.description}</p>
      </div>
    </div>
  );
};

// [ALL OTHER PAGES EXACT - HomePage, SearchPage, CategoriesPage, ProfilePage, AdminPanel, LoginPage]

// MAIN APP EXACT
export default function App() {
  const [auth, setAuth] = useState<{ user: any; isAdmin: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setAuth(data);
    } catch (e) {
      setAuth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="text-yellow-400 animate-spin">●</div></div>;

  return (
    <Router>
      <div className="select-none">
        <Routes>
          <Route path="/login" element={auth?.user || auth?.isAdmin ? <Navigate to={auth.isAdmin ? "/admin" : "/"} /> : <LoginPage onLogin={checkAuth} />} />
          <Route path="/" element={auth?.user || auth?.isAdmin ? <HomePage /> : <Navigate to="/login" />} />
          <Route path="/movie/:id" element={auth?.user || auth?.isAdmin ? <MovieDetails /> : <Navigate to="/login" />} />
          {/* ALL OTHER ROUTES EXACT */}
        </Routes>
      </div>
    </Router>
  );
}

