'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toxicity, setToxicity] = useState(2);
  
  const [theme, setTheme] = useState('cyberpunk');
  const [userMemory, setUserMemory] = useState([]); // Array of strings (facts)
  
  // Auth & Cloud State
  const [authUser, setAuthUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [hasSelectedMood, setHasSelectedMood] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Default initial message
  const DEFAULT_MESSAGE = { 
    role: 'model', 
    content: 'Sup? Gua AI lu yang paling skibidi. Ada yang mau ditanya atau mau adu mekanik aja?' 
  };

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession = { id: newId, title: `Chat ${new Date().toLocaleTimeString()}`, messages: [DEFAULT_MESSAGE] };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setIsSidebarOpen(false);
  };

  const clearAllSessions = () => {
    const defaultNewId = Date.now().toString();
    const newSession = { id: defaultNewId, title: 'Chat Baru', messages: [DEFAULT_MESSAGE] };
    setSessions([newSession]);
    setActiveSessionId(defaultNewId);
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthUser(session?.user || null);
      setIsAuthChecking(false);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user || null);
      setIsAuthChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Theme application
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (isAuthChecking) return;

    const loadData = async () => {
      let loadedSessions = [];
      let loadedMemory = [];
      
      const savedMoodFlag = localStorage.getItem('genz_has_selected_mood');
      const savedTheme = localStorage.getItem('genz_theme') || 'cyberpunk';
      setTheme(savedTheme);

      if (savedMoodFlag) {
        setHasSelectedMood(true);
      } else {
        localStorage.setItem('genz_has_selected_mood', 'true');
      }

      if (authUser) {
        try {
          const { data } = await supabase.from('cloud_saves').select('sessions_data, memory_data').eq('user_id', authUser.id).single();
          if (data) {
            if (data.sessions_data) loadedSessions = data.sessions_data;
            if (data.memory_data) loadedMemory = data.memory_data;
          } else {
            const localSaved = localStorage.getItem('genz-bot-sessions');
            const localMemory = localStorage.getItem('genz-bot-memory');
            if (localSaved) loadedSessions = JSON.parse(localSaved);
            if (localMemory) loadedMemory = JSON.parse(localMemory);
            
            await supabase.from('cloud_saves').upsert({ 
              user_id: authUser.id, 
              sessions_data: loadedSessions,
              memory_data: loadedMemory 
            });
          }
        } catch (e) { console.error('Gagal memuat data cloud', e); }
      } else {
        const saved = localStorage.getItem('genz-bot-sessions');
        const savedMem = localStorage.getItem('genz-bot-memory');
        if (saved) loadedSessions = JSON.parse(saved);
        if (savedMem) loadedMemory = JSON.parse(savedMem);
      }
      
      if (loadedSessions.length > 0) {
        setSessions(loadedSessions);
        setActiveSessionId(loadedSessions[0].id);
      } else {
        createNewSession();
      }
      
      setUserMemory(loadedMemory);
      setIsInitialized(true);
      setIsInitialLoad(false);
    };
    
    if (!isInitialized) {
      loadData();
    } else {
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, isAuthChecking]);

  // Sync sessions & memory to Cloud or LocalStorage
  useEffect(() => {
    if (!isInitialized || isInitialLoad) return;
    
    if (authUser) {
      supabase.from('cloud_saves').upsert({ 
        user_id: authUser.id, 
        sessions_data: sessions,
        memory_data: userMemory
      }).then(({error}) => { 
        if(error) console.error("Error nyimpen ke Cloud: ", error.message);
      });
    } else {
      localStorage.setItem('genz-bot-sessions', JSON.stringify(sessions));
      localStorage.setItem('genz-bot-memory', JSON.stringify(userMemory));
    }
    localStorage.setItem('genz_theme', theme);
  }, [sessions, userMemory, theme, isInitialLoad, authUser, isInitialized]);

  const value = {
    sessions, setSessions,
    activeSessionId, setActiveSessionId,
    isSidebarOpen, setIsSidebarOpen,
    toxicity, setToxicity,
    theme, setTheme,
    userMemory, setUserMemory,
    authUser, isAuthChecking,
    hasSelectedMood, setHasSelectedMood,
    isInitialLoad, isInitialized,
    createNewSession, clearAllSessions, DEFAULT_MESSAGE
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}
