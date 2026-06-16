'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toxicity, setToxicity] = useState(2);
  
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

  useEffect(() => {
    if (isAuthChecking) return;

    const loadData = async () => {
      let loadedSessions = [];
      const savedMoodFlag = localStorage.getItem('genz_has_selected_mood');
      
      if (savedMoodFlag) {
        setHasSelectedMood(true);
      } else {
        localStorage.setItem('genz_has_selected_mood', 'true');
      }

      if (authUser) {
        try {
          const { data } = await supabase.from('cloud_saves').select('sessions_data').eq('user_id', authUser.id).single();
          if (data && data.sessions_data) {
            loadedSessions = data.sessions_data;
          } else {
            const localSaved = localStorage.getItem('genz-bot-sessions');
            if (localSaved) {
              loadedSessions = JSON.parse(localSaved);
              await supabase.from('cloud_saves').upsert({ user_id: authUser.id, sessions_data: loadedSessions });
            }
          }
        } catch (e) { console.error('Gagal memuat data cloud', e); }
      } else {
        const saved = localStorage.getItem('genz-bot-sessions');
        if (saved) loadedSessions = JSON.parse(saved);
      }
      
      if (loadedSessions.length > 0) {
        setSessions(loadedSessions);
        setActiveSessionId(loadedSessions[0].id);
      } else {
        createNewSession();
      }
      
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

  // Sync sessions to Cloud or LocalStorage
  useEffect(() => {
    if (!isInitialized || isInitialLoad) return;
    
    if (authUser) {
      supabase.from('cloud_saves').upsert({ user_id: authUser.id, sessions_data: sessions })
        .then(({error}) => { 
          if(error) alert("Error nyimpen ke Cloud: " + error.message);
        });
    } else {
      localStorage.setItem('genz-bot-sessions', JSON.stringify(sessions));
    }
  }, [sessions, isInitialLoad, authUser, isInitialized]);

  const value = {
    sessions, setSessions,
    activeSessionId, setActiveSessionId,
    isSidebarOpen, setIsSidebarOpen,
    toxicity, setToxicity,
    authUser, isAuthChecking,
    hasSelectedMood, setHasSelectedMood,
    isInitialLoad, isInitialized,
    createNewSession, DEFAULT_MESSAGE
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}
