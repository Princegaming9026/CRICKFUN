import React, { useState, useEffect, useCallback } from 'react';
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

// --- Types ---
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

// --- Components ---

const BottomNav = () => {
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

const MovieCard = ({ movie }: { movie: Movie, key?: any }) => {
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

const VideoPlayer = ({ url, title }: { url: string, title: string }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
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
  const controlsTimeout = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: coarse)');
    setIsMobile(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
      if ('vibrate' in navigator && isMobile) navigator.vibrate(50);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setProgress((time / duration) * 100);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        if (screen.orientation && screen.orientation.lock) {
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
      console.warn('Fullscreen/Orientation lock failed:', err);
    }
  };

  const skip = (amount: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
    }
  };

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
    if ('vibrate' in navigator && isMobile) navigator.vibrate(20);
  };

  const handleVideoInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    togglePlay();
  };

  const handleMouseMove = handleInteraction;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100 || 0);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    const handleOrientationChange = () => {
      if (screen.orientation) {
        setOrientationLocked(screen.orientation.type.includes('landscape'));
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    screen.orientation?.addEventListener('change', handleOrientationChange);

    // Mobile auto-mute for autoplay policy
    if (isMobile) video.muted = true;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.log('Autoplay failed:', e));
      });
      return () => {
        hls.destroy();
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('waiting', handleWaiting);
        video.removeEventListener('playing', handlePlaying);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        screen.orientation?.removeEventListener('change', handleOrientationChange);
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(e => console.log('Autoplay failed:', e));
      });
    }

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      screen.orientation?.removeEventListener('change', handleOrientationChange);
    };
  }, [url, isMobile]);

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleInteraction}
      className="w-full aspect-video bg-black relative group overflow-hidden select-none touch-target"
    >
      <video 
        ref={videoRef} 
        playsInline
        muted={isMobile}
        className="w-full h-full object-contain"
        onClick={handleVideoInteraction}
        onTouchStart={handleVideoInteraction}
      />

      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50">
          <div className="w-16 h-16 border-4 border-yellow-400/80 border-t-yellow-400 rounded-full animate-spin-sharp player-sharp shadow-2xl" />
        </div>
      )}

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col justify-between z-10"
          >
            {/* Top Bar */}
            <div className="bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-red-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <Activity size={10} /> LIVE
                </div>
                <h3 className="text-sm font-bold truncate max-w-[200px]">{title}</h3>
              </div>
              <div className="flex items-center gap-4">
  <Settings size={18} className="text-white/70 hover:text-white cursor-pointer player-sharp touch-target" onClick={() => { /* Quality modal */ }} />
              </div>
            </div>

            {/* Center Controls */}
            <div className="flex items-center justify-center gap-12">
              <button onClick={() => skip(-10)} onTouchStart={(e) => { e.preventDefault(); skip(-10); }} className="text-white/70 hover:text-white p-3 rounded-full bg-black/30 backdrop-blur player-sharp touch-target transition-transform active:scale-90 hover:bg-white/20">
                <RotateCcw size={36} strokeWidth={2.5} className="player-sharp" />
              </button>
              <button 
                onClick={togglePlay}
                onTouchStart={(e) => { e.preventDefault(); togglePlay(); }}
                className="w-20 h-20 touch-target rounded-full bg-yellow-400/90 backdrop-blur flex items-center justify-center text-black font-bold shadow-2xl ring-4 ring-yellow-400/50 player-sharp transition-all active:scale-90 hover:shadow-yellow-500/50 hover:bg-yellow-400"
              >
                {isPlaying ? <Pause fill="currentColor" size={32} /> : <Play fill="currentColor" className="ml-1" size={32} />}
              </button>
              <button onClick={() => skip(10)} onTouchStart={(e) => { e.preventDefault(); skip(10); }} className="text-white/70 hover:text-white p-3 rounded-full bg-black/30 backdrop-blur player-sharp touch-target transition-transform active:scale-90 hover:bg-white/20">
                <RotateCw size={36} strokeWidth={2.5} className="player-sharp" />
              </button>
            </div>

            {/* Bottom Bar */}
            <div className="bg-gradient-to-t from-black/80 to-transparent p-4 space-y-2">
              {/* Progress Bar */}
                <div className="relative group/progress h-2 flex items-center cursor-pointer touch-target">
                  <input 
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden sharp-thumb">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full relative player-sharp"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-400 sharp-thumb scale-75 group-hover/progress:scale-100 transition-all shadow-lg z-20" />
                    </div>
                  </div>
                </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-[10px] font-mono font-bold tracking-widest text-white/70">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={toggleMute} onTouchStart={(e) => { e.preventDefault(); toggleMute(); }} className="text-white/70 hover:text-white p-2 rounded-full bg-black/30 backdrop-blur player-sharp touch-target">
                      {isMuted || volume === 0 ? <VolumeX size={20} strokeWidth={2} className="player-sharp" /> : <Volume2 size={20} strokeWidth={2} className="player-sharp" />}
                    </button>
                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setVolume(v);
                        if (videoRef.current) videoRef.current.volume = v;
                        setIsMuted(v === 0);
                      }}
                      className="w-20 h-2 bg-white/20 rounded-full accent-yellow-400 cursor-pointer sharp-thumb player-sharp"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={toggleFullscreen} onTouchStart={(e) => { e.preventDefault(); toggleFullscreen(); }} className="text-white/70 hover:text-white p-2 rounded-full bg-black/30 backdrop-blur player-sharp touch-target">
                    {isFullscreen ? <Minimize size={22} strokeWidth={2} className="player-sharp" /> : <Maximize size={22} strokeWidth={2} className="player-sharp" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Pages ---

const LoginPage = ({ onLogin }: { onLogin: () => void }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const endpoint = isAdmin ? '/api/auth/admin-login' : (isSignup ? '/api/auth/signup' : '/api/auth/login');
    const body = isAdmin ? { key: adminKey } : { username, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        if (isSignup) {
          setIsSignup(false);
          setError('Signup success! Please login.');
        } else {
          onLogin();
          navigate(isAdmin ? '/admin' : '/');
        }
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Connection failed');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-black tracking-tighter text-yellow-400 italic">CRICKFUN</h1>
          <p className="text-gray-500 mt-2 text-sm uppercase tracking-[0.2em]">Live IPL 2026 & Movies</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => setIsAdmin(false)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${!isAdmin ? 'bg-yellow-400 text-black' : 'bg-white/5 text-gray-400'}`}
            >
              User
            </button>
            <button 
              onClick={() => setIsAdmin(true)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${isAdmin ? 'bg-yellow-400 text-black' : 'bg-white/5 text-gray-400'}`}
            >
              Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isAdmin ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Admin Key</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    type="password" 
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="Enter Key"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-400 transition"
                    required
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Username</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-400 transition"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-400 transition"
                    required
                  />
                </div>
              </>
            )}

            {error && <p className="text-red-500 text-xs font-medium text-center">{error}</p>}

            <button 
              type="submit"
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-black py-4 rounded-2xl shadow-lg shadow-yellow-400/20 transition-all active:scale-95 uppercase tracking-widest"
            >
              {isAdmin ? 'Access Admin' : (isSignup ? 'Create Account' : 'Login Now')}
            </button>
          </form>

          {!isAdmin && (
            <button 
              onClick={() => setIsSignup(!isSignup)}
              className="w-full mt-6 text-xs text-gray-500 hover:text-white transition font-medium"
            >
              {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign up"}
            </button>
          )}
        </div>
        
        <div className="text-center opacity-30 text-[10px] uppercase tracking-[0.3em] text-white">
          Developed by BERLIN • @BERLIN_IS_BERLIN
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/banners').then(res => res.json()).then(setBanners);
    fetch('/api/categories').then(res => res.json()).then(setCategories);
    fetch('/api/movies').then(res => res.json()).then(setMovies);
  }, []);

  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners]);

  return (
    <div className="pb-24 bg-black min-h-screen text-white">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <h1 className="text-2xl font-black italic text-yellow-400 tracking-tighter">CRICKFUN</h1>
        <div className="flex gap-4">
          <button onClick={() => navigate('/search')} className="text-gray-400 hover:text-white transition-colors">
            <Search size={22} />
          </button>
          <button onClick={() => navigate('/profile')} className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-black font-bold text-xs hover:scale-110 transition-transform">
            B
          </button>
        </div>
      </header>

      {/* Hero Slider */}
      <div className="px-6 mb-8">
        <div className="relative aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl">
          <AnimatePresence mode="wait">
            {banners.length > 0 && (
              <motion.div
                key={banners[currentBanner].id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0"
              >
                <img 
                  src={banners[currentBanner].image_url} 
                  alt={banners[currentBanner].title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <span className="bg-red-600 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest mb-2 inline-block">Live Now</span>
                  <h2 className="text-2xl font-black leading-tight">{banners[currentBanner].title}</h2>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Categories & Movies */}
      <div className="space-y-8">
        {categories.map((cat) => (
          <div key={cat.id} className="space-y-4">
            <div className="px-6 flex justify-between items-end">
              <h2 className="text-lg font-black tracking-tight">{cat.title}</h2>
              <button className="text-yellow-400 text-xs font-bold flex items-center gap-1 uppercase tracking-widest">
                View All <ChevronRight size={14} />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-hide">
              {movies.filter(m => m.categoryId === cat.id).map(movie => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MovieDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/api/movies/${id}`).then(res => res.json()).then(setMovie);
  }, [id]);

  if (!movie) return null;

  return (
    <div className="min-h-screen bg-black text-white pb-12">
      <div className="relative aspect-[2/3] md:aspect-video bg-gray-900">
        {isPlaying ? (
          <VideoPlayer url={movie.watch_link} title={movie.title} />
        ) : (
          <>
            <img 
              src={movie.poster_url} 
              alt={movie.title} 
              className="w-full h-full object-cover opacity-60"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <button 
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 flex items-center justify-center group"
            >
              <div className="w-20 h-20 rounded-full bg-yellow-400 flex items-center justify-center text-black shadow-2xl group-hover:scale-110 transition-transform">
                <Play fill="currentColor" size={32} />
              </div>
            </button>
          </>
        )}
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10 z-20"
        >
          <ChevronRight className="rotate-180" size={20} />
        </button>
      </div>

      <div className="px-6 mt-8 relative z-10 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-xs font-bold text-yellow-400 uppercase tracking-widest">
            <span>{movie.year}</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span>{movie.rating} Rating</span>
          </div>
          <h1 className="text-4xl font-black leading-none">{movie.title}</h1>
        </div>

        {!isPlaying && (
          <button 
            onClick={() => setIsPlaying(true)}
            className="w-full bg-yellow-400 text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-yellow-400/20 active:scale-95 transition-transform"
          >
            <Play fill="currentColor" size={24} />
            WATCH NOW
          </button>
        )}

        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Description</h3>
          <p className="text-gray-300 leading-relaxed text-sm">{movie.description}</p>
        </div>
      </div>
    </div>
  );
};

const AdminPanel = ({ onLogout }: { onLogout: () => void }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newMovie, setNewMovie] = useState({
    title: '',
    categoryId: 0,
    poster_url: '',
    description: '',
    rating: '',
    year: '',
    watch_link: ''
  });
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/movies').then(res => res.json()).then(setMovies);
    fetch('/api/categories').then(res => res.json()).then(setCategories);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        onLogout();
      }
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      handleUpdateMovie(e);
    } else {
      const res = await fetch('/api/admin/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMovie)
      });
      if (res.ok) {
        const added = await res.json();
        setMovies([...movies, added]);
        setNewMovie({ title: '', categoryId: 0, poster_url: '', description: '', rating: '', year: '', watch_link: '' });
      }
    }
  };

  const handleUpdateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editingMovie) return;
    const res = await fetch(`/api/admin/movies/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMovie)
    });
    if (res.ok) {
      const updated = await res.json();
      setMovies(movies.map(m => m.id === editingId ? updated.movie : m));
      setEditingId(null);
      setEditingMovie(null);
      setNewMovie({ title: '', categoryId: 0, poster_url: '', description: '', rating: '', year: '', watch_link: '' });
    }
  };

  const handleEditMovie = (movie: Movie) => {
    setEditingId(movie.id);
    setEditingMovie(movie);
    setNewMovie({
      title: movie.title,
      categoryId: movie.categoryId,
      poster_url: movie.poster_url,
      description: movie.description,
      rating: movie.rating,
      year: movie.year,
      watch_link: movie.watch_link
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingMovie(null);
    setNewMovie({ title: '', categoryId: 0, poster_url: '', description: '', rating: '', year: '', watch_link: '' });
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/admin/movies/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setMovies(movies.filter(m => m.id !== id));
      setIsDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')} 
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-black italic text-yellow-400 tracking-tighter">ADMIN PANEL</h1>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-2 rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all font-bold text-xs uppercase tracking-widest"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div className="space-y-8">
        {/* Add/Edit Movie Form */}
        <section className="bg-white/5 rounded-3xl p-6 border border-white/10">
          <h2 className="text-lg font-black mb-6 flex items-center gap-2">
            {editingId ? (
              <>
                <Edit3 size={20} className="text-yellow-400" /> EDIT CONTENT
              </>
            ) : (
              <>
                <Plus size={20} className="text-yellow-400" /> ADD NEW CONTENT
              </>
            )}
          </h2>
          <div className="mb-4">
            {editingMovie && (
              <div className="text-xs text-yellow-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                Editing: <span className="truncate">{editingMovie.title}</span>
              </div>
            )}
          </div>
          <form onSubmit={handleAddMovie} className="space-y-4">
            <input 
              type="text" placeholder="Title" required
              className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm focus:border-yellow-400 outline-none"
              value={newMovie.title} onChange={e => setNewMovie({...newMovie, title: e.target.value})}
            />
            <select 
              required className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm focus:border-yellow-400 outline-none"
              value={newMovie.categoryId} onChange={e => setNewMovie({...newMovie, categoryId: parseInt(e.target.value)})}
            >
              <option value={0}>Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <input 
              type="url" placeholder="Poster URL" required
              className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm focus:border-yellow-400 outline-none"
              value={newMovie.poster_url} onChange={e => setNewMovie({...newMovie, poster_url: e.target.value})}
            />
            <textarea 
              placeholder="Description" required
              className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm focus:border-yellow-400 outline-none h-24"
              value={newMovie.description} onChange={e => setNewMovie({...newMovie, description: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="text" placeholder="Rating (e.g. 4.5)" required
                className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm focus:border-yellow-400 outline-none"
                value={newMovie.rating} onChange={e => setNewMovie({...newMovie, rating: e.target.value})}
              />
              <input 
                type="text" placeholder="Year" required
                className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm focus:border-yellow-400 outline-none"
                value={newMovie.year} onChange={e => setNewMovie({...newMovie, year: e.target.value})}
              />
            </div>
            <input 
              type="url" placeholder="Watch Link" required
              className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm focus:border-yellow-400 outline-none"
              value={newMovie.watch_link} onChange={e => setNewMovie({...newMovie, watch_link: e.target.value})}
            />
            <button type="submit" className="w-full bg-yellow-400 text-black font-black py-4 rounded-xl shadow-lg active:scale-95 transition">
              {editingId ? 'UPDATE MOVIE' : 'PUBLISH NOW'}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancelEdit} className="w-full bg-gray-700 text-white font-bold py-4 rounded-xl hover:bg-gray-600 transition">
                CANCEL EDIT
              </button>
            )}
          </form>
        </section>

        {/* Manage Categories */}
        <section className="bg-white/5 rounded-3xl p-6 border border-white/10">
          <h2 className="text-lg font-black mb-6 flex items-center gap-2">
            <Grid size={20} className="text-yellow-400" /> MANAGE CATEGORIES
          </h2>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const title = (e.target as any).elements.catTitle.value;
            const res = await fetch('/api/admin/categories', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title })
            });
            if (res.ok) {
              const added = await res.json();
              setCategories([...categories, added]);
              (e.target as any).reset();
            }
          }} className="flex gap-2 mb-6">
            <input 
              name="catTitle" type="text" placeholder="Category Name" required
              className="flex-1 bg-black border border-white/10 rounded-xl p-4 text-sm focus:border-yellow-400 outline-none"
            />
            <button type="submit" className="bg-yellow-400 text-black font-black px-6 rounded-xl active:scale-95 transition">ADD</button>
          </form>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white/5 px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                <span className="text-xs font-bold">{cat.title}</span>
                <button 
                  onClick={async () => {
                    const res = await fetch(`/api/admin/categories/${cat.id}`, { method: 'DELETE' });
                    if (res.ok) setCategories(categories.filter(c => c.id !== cat.id));
                  }}
                  className="text-red-500 hover:text-red-400 transition"
                ><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </section>

        {/* Manage Content */}
        <section className="bg-white/5 rounded-3xl p-6 border border-white/10">
          <h2 className="text-lg font-black mb-6 flex items-center gap-2">
            <Grid size={20} className="text-yellow-400" /> MANAGE CONTENT
          </h2>
          <div className="space-y-3">
            {movies.map(m => (
              <div key={m.id} className="bg-white/5 p-4 rounded-2xl flex items-center justify-between border border-white/5">
                <div className="flex items-center gap-4">
                  <img src={m.poster_url} className="w-12 h-16 object-cover rounded-lg" referrerPolicy="no-referrer" />
                  <div>
                    <h4 className="font-bold text-sm">{m.title}</h4>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">{categories.find(c => c.id === m.categoryId)?.title}</p>
                  </div>
                </div>
                {isDeleting === m.id ? (
                  <div className="flex gap-2">
                    <button onClick={() => handleDelete(m.id)} className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-lg">YES</button>
                    <button onClick={() => setIsDeleting(null)} className="bg-white/10 text-white text-[10px] font-black px-3 py-1 rounded-lg">NO</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => handleEditMovie(m)} className="text-yellow-400 p-2 hover:bg-yellow-400/10 rounded-lg transition">
                      <Edit3 size={18} />
                    </button>
                    <button onClick={() => setIsDeleting(m.id)} className="text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition">
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

// --- Main App ---

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/movies?search=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24">
      <header className="mb-8">
        <h1 className="text-2xl font-black italic text-yellow-400 tracking-tighter mb-6">SEARCH</h1>
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search matches or movies..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-400 transition"
          />
        </form>
      </header>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {results.map(movie => (
            <div key={movie.id} className="space-y-2">
              <MovieCard movie={movie} />
            </div>
          ))}
          {results.length === 0 && query && !loading && (
            <div className="col-span-full text-center py-12 text-gray-500">No results found for "{query}"</div>
          )}
        </div>
      )}
      <BottomNav />
    </div>
  );
};

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/categories').then(res => res.json()).then(setCategories);
    fetch('/api/movies').then(res => res.json()).then(setMovies);
  }, []);

  const filteredMovies = selectedCat ? movies.filter(m => m.categoryId === selectedCat) : movies;

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24">
      <h1 className="text-2xl font-black italic text-yellow-400 tracking-tighter mb-8">CATEGORIES</h1>
      
      <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide">
        <button 
          onClick={() => setSelectedCat(null)}
          className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition ${selectedCat === null ? 'bg-yellow-400 text-black' : 'bg-white/5 text-gray-500'}`}
        >
          All
        </button>
        {categories.map(cat => (
          <button 
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition ${selectedCat === cat.id ? 'bg-yellow-400 text-black' : 'bg-white/5 text-gray-500'}`}
          >
            {cat.title}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filteredMovies.map(movie => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
      <BottomNav />
    </div>
  );
};

const ProfilePage = ({ user, onLogout }: { user: any, onLogout: () => void }) => {
  const [showPlayerSettings, setShowPlayerSettings] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);
  const [incognito, setIncognito] = useState(false);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        onLogout();
      }
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const Toggle = ({ active, onToggle }: { active: boolean, onToggle: () => void }) => (
    <button 
      onClick={onToggle}
      className={`w-12 h-6 rounded-full transition-colors ${active ? 'bg-yellow-400' : 'bg-gray-700'} relative`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${active ? 'left-7' : 'left-1'}`} />
    </button>
  );

  return (
    <div className="p-6 text-white min-h-screen pb-24 relative overflow-hidden">
      <div className="flex flex-col items-center gap-6 mt-12 mb-12">
        <div className="w-24 h-24 rounded-full bg-yellow-400 flex items-center justify-center text-black text-4xl font-black shadow-2xl shadow-yellow-400/20">
          {user.username[0].toUpperCase()}
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black">{user.username}</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Premium User</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-2">Account Settings</h3>
        <div className="bg-white/5 rounded-3xl overflow-hidden border border-white/10">
          <button 
            onClick={() => setShowPlayerSettings(true)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                <Settings size={20} />
              </div>
              <span className="text-sm font-bold">Player Settings</span>
            </div>
            <ChevronRight size={18} className="text-gray-600" />
          </button>
          <button 
            onClick={() => setShowPrivacy(true)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                <Lock size={20} />
              </div>
              <span className="text-sm font-bold">Privacy & Security</span>
            </div>
            <ChevronRight size={18} className="text-gray-600" />
          </button>
          <button 
            onClick={handleLogout}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors text-red-500"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <LogOut size={20} />
              </div>
              <span className="text-sm font-bold">Logout Session</span>
            </div>
            <ChevronRight size={18} className="text-gray-600" />
          </button>
        </div>

        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-2 mt-8">Support & Contact</h3>
        <div className="bg-white/5 rounded-3xl overflow-hidden border border-white/10">
          <button 
            onClick={() => window.open('https://t.me/BERLIN_IS_BERLIN', '_blank')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-400/20 flex items-center justify-center text-yellow-400">
                <User size={20} />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold block">Contact Developer</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">@BERLIN_IS_BERLIN</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Player Settings Modal */}
      <AnimatePresence>
        {showPlayerSettings && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-black p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-2xl font-black italic text-yellow-400">PLAYER SETTINGS</h2>
              <button onClick={() => setShowPlayerSettings(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                <ChevronRight className="rotate-90" size={20} />
              </button>
            </div>
            <div className="space-y-8">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-3xl border border-white/5">
                <div>
                  <h4 className="font-bold text-sm">Auto-play</h4>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Play next video automatically</p>
                </div>
                <Toggle active={autoPlay} onToggle={() => setAutoPlay(!autoPlay)} />
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-3xl border border-white/5">
                <div>
                  <h4 className="font-bold text-sm">Data Saver</h4>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Reduce quality on mobile data</p>
                </div>
                <Toggle active={dataSaver} onToggle={() => setDataSaver(!dataSaver)} />
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-3xl border border-white/5 opacity-50">
                <div>
                  <h4 className="font-bold text-sm">Video Quality</h4>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Default: 1080p (Auto)</p>
                </div>
                <Settings size={18} className="text-gray-500" />
              </div>
            </div>
            <div className="mt-auto text-center p-6 bg-yellow-400/5 rounded-3xl border border-yellow-400/10">
              <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Settings will be applied to all streams</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy Modal */}
      <AnimatePresence>
        {showPrivacy && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-black p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-2xl font-black italic text-yellow-400">PRIVACY & SECURITY</h2>
              <button onClick={() => setShowPrivacy(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                <ChevronRight className="rotate-90" size={20} />
              </button>
            </div>
            <div className="space-y-8">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-3xl border border-white/5">
                <div>
                  <h4 className="font-bold text-sm">Incognito Mode</h4>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Don't save watch history</p>
                </div>
                <Toggle active={incognito} onToggle={() => setIncognito(!incognito)} />
              </div>
              <div className="p-4 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                <h4 className="font-bold text-sm">Security Info</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-gray-500">Device ID</span>
                    <span className="text-white">#9928-1102</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-gray-500">Last Login</span>
                    <span className="text-white">Just Now</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-auto text-center p-6">
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">Your data is encrypted and secure</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-12 text-center opacity-20">
        <h1 className="text-2xl font-black italic text-yellow-400 tracking-tighter">CRICKFUN</h1>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Version 2.0.1 • Berlin Edition</p>
      </div>

      <BottomNav />
    </div>
  );
};

export default function App() {
  const [auth, setAuth] = useState<{ user: any, isAdmin: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setAuth(data);
    } catch (e) {
      setAuth({ user: null, isAdmin: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    
    // Disable right-click, selection, and zoom
    const handleContext = (e: MouseEvent) => e.preventDefault();
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '0' || e.key === 'u' || e.key === 's')) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handleContext);
    document.addEventListener('keydown', handleKey);
    
    return () => {
      document.removeEventListener('contextmenu', handleContext);
      document.removeEventListener('keydown', handleKey);
    };
  }, [checkAuth]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-yellow-400 font-black animate-pulse text-2xl italic">CRICKFUN...</div>
    </div>
  );

  return (
    <Router>
      <div className="select-none">
        <Routes>
          <Route path="/login" element={auth?.user || auth?.isAdmin ? <Navigate to={auth?.isAdmin ? "/admin" : "/"} /> : <LoginPage onLogin={checkAuth} />} />
          
          <Route path="/" element={auth?.user || auth?.isAdmin ? <><HomePage /><BottomNav /></> : <Navigate to="/login" />} />
          <Route path="/movie/:id" element={auth?.user || auth?.isAdmin ? <MovieDetails /> : <Navigate to="/login" />} />
          <Route path="/search" element={auth?.user || auth?.isAdmin ? <SearchPage /> : <Navigate to="/login" />} />
          <Route path="/categories" element={auth?.user || auth?.isAdmin ? <CategoriesPage /> : <Navigate to="/login" />} />
          <Route path="/profile" element={auth?.user ? <ProfilePage user={auth.user} onLogout={checkAuth} /> : (auth?.isAdmin ? <Navigate to="/admin" /> : <Navigate to="/login" />)} />

          <Route path="/admin" element={auth?.isAdmin ? <AdminPanel onLogout={checkAuth} /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}
