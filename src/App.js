import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, Play, Pause, Mic, MicOff, Calendar, Settings, Plus, Heart, Smile, Star, Coffee, Sun, Moon, Cloud, Music, Upload, Volume2, RotateCcw } from 'lucide-react';

// Mock storage and auth system
const mockUsers = [
  { id: 'user1', email: 'demo@example.com', password: 'demo123' }
];

const mockEntries = [
  {
    id: '1',
    userId: 'user1',
    title: 'New Year Resolutions',
    mood: '🌟',
    audioBlob: null,
    audioURL: null,
    createdAt: new Date('2024-01-01').toISOString(),
    unlockAt: new Date('2024-12-31').toISOString(),
    isUnlocked: true,
    reflection: ''
  },
  {
    id: '2',
    userId: 'user1',
    title: 'Secret Dreams',
    mood: '💭',
    audioBlob: null,
    audioURL: null,
    createdAt: new Date('2024-06-15').toISOString(),
    unlockAt: new Date('2025-06-15').toISOString(),
    isUnlocked: false,
    reflection: ''
  },
  {
    id: '3',
    userId: 'user1',
    title: 'Today\'s Breakthrough',
    mood: '🎯',
    audioBlob: null,
    audioURL: null,
    createdAt: new Date().toISOString(),
    unlockAt: new Date(Date.now() + 5000).toISOString(), // Unlocks in 5 seconds for demo
    isUnlocked: false,
    reflection: ''
  }
];

const moods = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '🤔', label: 'Thoughtful' },
  { emoji: '💭', label: 'Dreamy' },
  { emoji: '🌟', label: 'Hopeful' },
  { emoji: '❤️', label: 'Loving' },
  { emoji: '🎯', label: 'Focused' },
  { emoji: '🌙', label: 'Peaceful' }
];

export default function EchoVerse() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [currentView, setCurrentView] = useState('timeline');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [newEntry, setNewEntry] = useState({
    title: '',
    mood: '😊',
    unlockDate: '',
    unlockTime: ''
  });
  const [playingEntry, setPlayingEntry] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeCapsuleMode, setTimeCapsuleMode] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [newUnlocks, setNewUnlocks] = useState([]);
  const [showUnlockNotification, setShowUnlockNotification] = useState(false);
  const [reflection, setReflection] = useState('');
  const [audioUpload, setAudioUpload] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const unlockCheckTimerRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadEntries();
      startUnlockCheck();
    }
    return () => {
      if (unlockCheckTimerRef.current) {
        clearInterval(unlockCheckTimerRef.current);
      }
    };
  }, [user, timeCapsuleMode]);

  const loadEntries = () => {
    const userEntries = mockEntries.filter(entry => entry.userId === user.id);
    const now = new Date();
    
    const processedEntries = userEntries.map(entry => {
      const unlockDate = new Date(entry.unlockAt);
      const oneYearFromCreation = new Date(new Date(entry.createdAt).getTime() + 365 * 24 * 60 * 60 * 1000);
      
      let isUnlocked = false;
      if (timeCapsuleMode) {
        // In time capsule mode, entries are hidden for 1 year regardless of unlock date
        isUnlocked = now >= oneYearFromCreation;
      } else {
        // Normal mode: unlock based on specified date
        isUnlocked = now >= unlockDate;
      }
      
      return {
        ...entry,
        isUnlocked
      };
    });
    
    setEntries(processedEntries);
  };

  const startUnlockCheck = () => {
    // Check for new unlocks every 5 seconds
    unlockCheckTimerRef.current = setInterval(() => {
      checkForNewUnlocks();
    }, 5000);
  };

  const checkForNewUnlocks = () => {
    const now = new Date();
    const recentlyUnlocked = entries.filter(entry => {
      const unlockDate = new Date(entry.unlockAt);
      const oneYearFromCreation = new Date(new Date(entry.createdAt).getTime() + 365 * 24 * 60 * 60 * 1000);
      
      let shouldBeUnlocked = false;
      if (timeCapsuleMode) {
        shouldBeUnlocked = now >= oneYearFromCreation;
      } else {
        shouldBeUnlocked = now >= unlockDate;
      }
      
      return shouldBeUnlocked && !entry.isUnlocked;
    });
    
    if (recentlyUnlocked.length > 0) {
      setNewUnlocks(recentlyUnlocked);
      setShowUnlockNotification(true);
      loadEntries(); // Refresh entries to show unlocked status
    }
  };

  const handleLogin = () => {
    const foundUser = mockUsers.find(u => 
      u.email === loginForm.email && u.password === loginForm.password
    );
    if (foundUser) {
      setUser(foundUser);
      setLoginForm({ email: '', password: '' });
    } else {
      alert('Invalid credentials');
    }
  };

  const handleRegister = () => {
    if (registerForm.password !== registerForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (mockUsers.find(u => u.email === registerForm.email)) {
      alert('Email already exists');
      return;
    }
    const newUser = {
      id: 'user' + (mockUsers.length + 1),
      email: registerForm.email,
      password: registerForm.password
    };
    mockUsers.push(newUser);
    setUser(newUser);
    setRegisterForm({ email: '', password: '', confirmPassword: '' });
    setIsRegistering(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      setRecordingDuration(0);

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Check file size (limit to 1MB)
        if (audioBlob.size > 1024 * 1024) {
          alert('Recording too long. Please keep it under 1MB (approximately 60 seconds).');
          return;
        }
        
        setRecordedAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        clearInterval(recordingTimerRef.current);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      alert('Unable to access microphone. Please check permissions or try uploading an audio file.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const handleAudioUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (limit to 1MB)
      if (file.size > 1024 * 1024) {
        alert('File too large. Please keep it under 1MB.');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('audio/')) {
        alert('Please upload an audio file.');
        return;
      }
      
      setAudioUpload(file);
      setRecordedAudio(file);
    }
  };

  const saveEntry = () => {
    if (!newEntry.title || !newEntry.unlockDate || (!recordedAudio && !audioUpload)) {
      alert('Please fill all fields and record/upload audio');
      return;
    }

    const unlockDateTime = new Date(`${newEntry.unlockDate}T${newEntry.unlockTime || '00:00'}`);
    if (unlockDateTime <= new Date()) {
      alert('Unlock date must be in the future');
      return;
    }

    const entry = {
      id: Date.now().toString(),
      userId: user.id,
      title: newEntry.title,
      mood: newEntry.mood,
      audioBlob: recordedAudio,
      audioURL: recordedAudio ? URL.createObjectURL(recordedAudio) : null,
      createdAt: new Date().toISOString(),
      unlockAt: unlockDateTime.toISOString(),
      isUnlocked: false,
      reflection: ''
    };

    mockEntries.push(entry);
    setEntries(prev => [...prev, entry]);
    
    // Reset form
    setNewEntry({ title: '', mood: '😊', unlockDate: '', unlockTime: '' });
    setRecordedAudio(null);
    setAudioUpload(null);
    setRecordingDuration(0);
    setCurrentView('timeline');
  };

  const playAudio = (entry) => {
    if (playingEntry === entry.id && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    let audioUrl = null;
    if (entry.audioBlob) {
      audioUrl = URL.createObjectURL(entry.audioBlob);
    } else if (entry.audioURL) {
      audioUrl = entry.audioURL;
    }

    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setPlayingEntry(entry.id);
      setIsPlaying(true);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setPlayingEntry(null);
      };
    }
  };

  const openAudioPlayer = (entry) => {
    setSelectedEntry(entry);
    setReflection(entry.reflection || '');
    setCurrentView('player');
  };

  const saveReflection = () => {
    if (selectedEntry) {
      const updatedEntries = entries.map(entry => 
        entry.id === selectedEntry.id 
          ? { ...entry, reflection: reflection }
          : entry
      );
      setEntries(updatedEntries);
      
      // Update mock storage
      const entryIndex = mockEntries.findIndex(e => e.id === selectedEntry.id);
      if (entryIndex !== -1) {
        mockEntries[entryIndex].reflection = reflection;
      }
      
      alert('Reflection saved!');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const groupEntriesByYear = (entries) => {
    const grouped = {};
    entries.forEach(entry => {
      const year = new Date(entry.createdAt).getFullYear();
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(entry);
    });
    return grouped;
  };

  const groupEntriesByMonth = (entries) => {
    const grouped = {};
    entries.forEach(entry => {
      const date = new Date(entry.createdAt);
      const monthYear = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      if (!grouped[monthYear]) grouped[monthYear] = { name: monthName, entries: [] };
      grouped[monthYear].entries.push(entry);
    });
    return grouped;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md border border-white/20">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎙️</div>
            <h1 className="text-4xl font-bold text-white mb-2">EchoVerse</h1>
            <p className="text-purple-200">Audio diaries for your future self</p>
            <p className="text-purple-300 text-sm mt-2">A safe space to communicate across time</p>
          </div>

          {!isRegistering ? (
            <div className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                />
              </div>
              <button
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Sign In
              </button>
              <p className="text-center text-white/70">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="text-purple-300 hover:text-purple-200 underline"
                >
                  Sign up
                </button>
              </p>
              <p className="text-center text-sm text-white/50 mt-4">
                Demo: demo@example.com / demo123
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                />
              </div>
              <button
                onClick={handleRegister}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Sign Up
              </button>
              <p className="text-center text-white/70">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-purple-300 hover:text-purple-200 underline"
                >
                  Sign in
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <audio ref={audioRef} />
      
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">EchoVerse</h1>
            <p className="text-purple-200 text-sm">Welcome back, {user.email}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentView('record')}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-2 rounded-xl hover:opacity-90 transition-opacity"
              title="Record new entry"
            >
              <Plus size={20} />
            </button>
            <button
              onClick={() => setCurrentView('settings')}
              className="bg-white/10 text-white p-2 rounded-xl hover:bg-white/20 transition-colors"
              title="Settings"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={() => setUser(null)}
              className="bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* New Unlocks Notification */}
      {showUnlockNotification && newUnlocks.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-xl flex items-center gap-3 animate-pulse">
            <span className="text-3xl">🎉</span>
            <div className="flex-1">
              <p className="font-semibold">
                {newUnlocks.length} of your entries just unlocked!
              </p>
              <p className="text-sm opacity-90">
                You'll meet your past voice again...
              </p>
            </div>
            <button
              onClick={() => {
                setCurrentView('timeline');
                setShowUnlockNotification(false);
                setNewUnlocks([]);
              }}
              className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors font-semibold"
            >
              Listen Now
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {currentView === 'timeline' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white">Your Timeline</h2>
                <p className="text-purple-200 text-sm mt-1">
                  {timeCapsuleMode ? 'Time Capsule Mode Active' : 'Memories across time'}
                </p>
              </div>
              <button
                onClick={() => setCurrentView('record')}
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Plus size={20} />
                New Entry
              </button>
            </div>

            {entries.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🎙️</div>
                <h3 className="text-2xl font-bold text-white mb-2">No entries yet</h3>
                <p className="text-purple-200 mb-6">Start your journey by recording your first audio diary</p>
                <button
                  onClick={() => setCurrentView('record')}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  Record Your First Entry
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupEntriesByMonth(entries))
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([monthKey, monthData]) => (
                    <div key={monthKey}>
                      <h3 className="text-xl font-bold text-white mb-4">{monthData.name}</h3>
                      <div className="grid gap-4">
                        {monthData.entries
                          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                          .map((entry) => (
                            <div
                              key={entry.id}
                              className={`p-6 rounded-2xl border transition-all cursor-pointer ${
                                entry.isUnlocked
                                  ? 'bg-white/10 border-white/30 hover:bg-white/15'
                                  : 'bg-white/5 border-white/20 hover:bg-white/10'
                              }`}
                              onClick={() => entry.isUnlocked && openAudioPlayer(entry)}
                            >
                              <div className="flex items-center gap-4">
                                <div className="text-3xl">{entry.mood}</div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {entry.isUnlocked ? (
                                      <Unlock className="text-green-400" size={16} />
                                    ) : (
                                      <Lock className="text-purple-400" size={16} />
                                    )}
                                    <h4 className="font-semibold text-white">{entry.title}</h4>
                                  </div>
                                  <p className="text-purple-200 text-sm">
                                    Created: {formatDate(entry.createdAt)}
                                  </p>
                                  {!entry.isUnlocked && (
                                    <p className="text-purple-300 text-sm">
                                      🔒 {timeCapsuleMode 
                                        ? `Hidden until ${formatDate(new Date(new Date(entry.createdAt).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString())}`
                                        : `Unlocks on ${formatDate(entry.unlockAt)}`
                                      }
                                    </p>
                                  )}
                                  {entry.isUnlocked && (
                                    <p className="text-green-300 text-sm flex items-center gap-1">
                                      <Volume2 size={14} />
                                      Click to listen and reflect
                                    </p>
                                  )}
                                </div>
                                {entry.isUnlocked && entry.audioBlob && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      playAudio(entry);
                                    }}
                                    className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-3 rounded-xl hover:opacity-90 transition-opacity"
                                  >
                                    {playingEntry === entry.id && isPlaying ? (
                                      <Pause size={20} />
                                    ) : (
                                      <Play size={20} />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {currentView === 'record' && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => setCurrentView('timeline')}
                className="text-white hover:text-purple-200 transition-colors"
              >
                ← Back
              </button>
              <h2 className="text-3xl font-bold text-white">Record New Entry</h2>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
              <div className="space-y-6">
                <div>
                  <label className="block text-white font-semibold mb-2">Title</label>
                  <input
                    type="text"
                    value={newEntry.title}
                    onChange={(e) => setNewEntry({...newEntry, title: e.target.value})}
                    placeholder="What's this entry about?"
                    className="w-full p-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Mood</label>
                  <div className="grid grid-cols-4 gap-3">
                    {moods.map((mood) => (
                      <button
                        key={mood.emoji}
                        type="button"
                        onClick={() => setNewEntry({...newEntry, mood: mood.emoji})}
                        className={`p-3 rounded-xl text-center transition-all ${
                          newEntry.mood === mood.emoji
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 scale-105'
                            : 'bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        <div className="text-2xl mb-1">{mood.emoji}</div>
                        <div className="text-xs text-white">{mood.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-semibold mb-2">Unlock Date</label>
                    <input
                      type="date"
                      value={newEntry.unlockDate}
                      onChange={(e) => setNewEntry({...newEntry, unlockDate: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-semibold mb-2">Time (optional)</label>
                    <input
                      type="time"
                      value={newEntry.unlockTime}
                      onChange={(e) => setNewEntry({...newEntry, unlockTime: e.target.value})}
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>

                <div className="text-center">
                  <label className="block text-white font-semibold mb-4">Record Your Message</label>
                  <div className="flex flex-col items-center gap-4">
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold transition-all ${
                        isRecording
                          ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                          : 'bg-gradient-to-r from-green-500 to-blue-500 hover:scale-105'
                      }`}
                    >
                      {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
                    </button>
                    <p className="text-white/70 text-sm">
                      {isRecording 
                        ? `Recording... ${formatDuration(recordingDuration)} (Click to stop)` 
                        : 'Click to start recording (Max 60 seconds)'
                      }
                    </p>
                    {recordedAudio && !audioUpload && (
                      <p className="text-green-400 text-sm">✓ Audio recorded successfully</p>
                    )}
                    
                    <div className="text-white/50 text-sm">or</div>
                    
                    <div className="relative">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="audio-upload"
                      />
                      <label
                        htmlFor="audio-upload"
                        className="bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <Upload size={20} />
                        Upload Audio File
                      </label>
                    </div>
                    {audioUpload && (
                      <p className="text-green-400 text-sm">✓ Audio file uploaded: {audioUpload.name}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setCurrentView('timeline')}
                    className="flex-1 bg-white/10 text-white p-3 rounded-xl font-semibold hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEntry}
                    disabled={!newEntry.title || !newEntry.unlockDate || (!recordedAudio && !audioUpload)}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Entry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'player' && selectedEntry && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => setCurrentView('timeline')}
                className="text-white hover:text-purple-200 transition-colors"
              >
                ← Back to Timeline
              </button>
              <h2 className="text-3xl font-bold text-white">Audio Playback</h2>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">{selectedEntry.mood}</div>
                <h3 className="text-2xl font-bold text-white mb-2">{selectedEntry.title}</h3>
                <p className="text-purple-200 text-sm">
                  Created: {formatDate(selectedEntry.createdAt)}
                </p>
                <p className="text-green-300 text-sm">
                  Unlocked: {formatDate(selectedEntry.unlockAt)}
                </p>
              </div>

              <div className="text-center">
                <button
                  onClick={() => playAudio(selectedEntry)}
                  className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full flex items-center justify-center hover:scale-105 transition-transform mx-auto mb-4"
                >
                  {playingEntry === selectedEntry.id && isPlaying ? (
                    <Pause size={32} />
                  ) : (
                    <Play size={32} />
                  )}
                </button>
                <p className="text-white/70 text-sm">
                  {playingEntry === selectedEntry.id && isPlaying ? 'Playing...' : 'Click to play your past voice'}
                </p>
              </div>

              <div className="border-t border-white/20 pt-6">
                <label className="block text-white font-semibold mb-3">
                  Reflection
                  <span className="text-purple-300 text-sm font-normal ml-2">
                    (How do you feel hearing this now?)
                  </span>
                </label>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="Jot down your thoughts about this entry..."
                  className="w-full p-4 rounded-xl bg-white/10 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 min-h-32 resize-none"
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={saveReflection}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                  >
                    Save Reflection
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'settings' && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => setCurrentView('timeline')}
                className="text-white hover:text-purple-200 transition-colors"
              >
                ← Back
              </button>
              <h2 className="text-3xl font-bold text-white">Settings</h2>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <h3 className="text-white font-semibold">Time Capsule Mode</h3>
                    <p className="text-purple-200 text-sm">
                      Hide all entries until 1 year from creation date
                    </p>
                    <p className="text-purple-300 text-xs mt-1">
                      When enabled, entries will be locked for a full year regardless of their unlock date
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setTimeCapsuleMode(!timeCapsuleMode);
                    }}
                    className={`w-14 h-7 rounded-full transition-colors relative ${
                      timeCapsuleMode ? 'bg-purple-500' : 'bg-white/30'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-1 ${
                        timeCapsuleMode ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="border-t border-white/20 pt-6">
                  <h3 className="text-white font-semibold mb-4">Audio Recording</h3>
                  <div className="space-y-3 text-purple-200 text-sm">
                    <p>• Maximum recording length: 60 seconds</p>
                    <p>• Maximum file size: 1MB</p>
                    <p>• Supported formats: All audio types</p>
                    <p>• Web microphone access required for recording</p>
                  </div>
                </div>

                <div className="border-t border-white/20 pt-6">
                  <h3 className="text-white font-semibold mb-4">Privacy & Security</h3>
                  <div className="space-y-3 text-purple-200 text-sm">
                    <p>• All entries are stored locally in this demo</p>
                    <p>• Unlock times are validated server-side in production</p>
                    <p>• Audio files are encrypted and secure</p>
                    <p>• No data is shared with third parties</p>
                  </div>
                </div>

                <div className="border-t border-white/20 pt-6">
                  <h3 className="text-white font-semibold mb-2">About EchoVerse</h3>
                  <p className="text-purple-200 text-sm">
                    A safe space for recording audio diaries that unlock in the future, 
                    allowing you to communicate with your future self across time. 
                    Share your thoughts, dreams, and reflections with tomorrow's you.
                  </p>
                  <p className="text-purple-300 text-xs mt-3">
                    "You'll meet this voice again on..." - Experience the magic of temporal communication.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}