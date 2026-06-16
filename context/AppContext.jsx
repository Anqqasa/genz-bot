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
  const [chatMode, setChatMode] = useState('solo'); // 'solo' or 'group'
  
  // Auth & Cloud State
  const [authUser, setAuthUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [hasSelectedMood, setHasSelectedMood] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState(''); // NEW

  // Fetch broadcast
  useEffect(() => {
    fetch(`/api/admin?t=${new Date().getTime()}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.message) setBroadcastMessage(data.message);
      })
      .catch(e => console.error("Gagal fetch broadcast", e));
  }, []);

  // Default initial message
  const DEFAULT_MESSAGE = { 
    role: 'model', 
    content: 'Sup? Gua AI lu yang paling skibidi. Ada yang mau ditanya atau mau adu mekanik aja?' 
  };

  const saveState = async (newSessions, newMemory, newTheme) => {
    // Selalu simpan di lokal sebagai backup
    localStorage.setItem('genz-bot-sessions', JSON.stringify(newSessions));
    localStorage.setItem('genz-bot-memory', JSON.stringify(newMemory));
    localStorage.setItem('genz_theme', newTheme);

    if (authUser) {
      try {
        const { data } = await supabase.from('cloud_saves').select('id').eq('user_id', authUser.id).limit(1);
        if (data && data.length > 0) {
          await supabase.from('cloud_saves').update({ 
            sessions_data: newSessions,
            memory_data: newMemory,
            updated_at: new Date().toISOString()
          }).eq('id', data[0].id);
        } else {
          await supabase.from('cloud_saves').insert({ 
            user_id: authUser.id, 
            sessions_data: newSessions,
            memory_data: newMemory
          });
        }
      } catch (err) {
        console.error("Error nyimpen ke Cloud: ", err.message);
      }
    }
  };

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession = { id: newId, title: `Chat ${new Date().toLocaleTimeString()}`, messages: [DEFAULT_MESSAGE] };
    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    setActiveSessionId(newId);
    setIsSidebarOpen(false);
    saveState(updatedSessions, userMemory, theme);
  };

  const clearAllSessions = async () => {
    const defaultNewId = Date.now().toString();
    const newSession = { id: defaultNewId, title: 'Chat Baru', messages: [DEFAULT_MESSAGE] };
    const newSessions = [newSession];
    setSessions(newSessions);
    setActiveSessionId(defaultNewId);
    setIsSidebarOpen(false);
    
    // Langsung hapus userMemory juga biar benar-benar bersih
    setUserMemory([]);
    await saveState(newSessions, [], theme);
  };

  const updateSessionMessages = (sessionId, msgs) => {
    let updatedSessions = [];
    setSessions(prev => {
      updatedSessions = prev.map(s => {
        if (s.id === sessionId) {
          return { ...s, messages: msgs };
        }
        return s;
      });
      return updatedSessions;
    });
    // Panggil saveState async
    setTimeout(() => saveState(updatedSessions, userMemory, theme), 100);
  };

  const updateSessionTitle = (sessionId, newTitle) => {
    let updatedSessions = [];
    setSessions(prev => {
      updatedSessions = prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s);
      return updatedSessions;
    });
    setTimeout(() => saveState(updatedSessions, userMemory, theme), 100);
  };

  const deleteSessionById = (id) => {
    let newSessions = sessions.filter(s => s.id !== id);
    if (newSessions.length === 0) {
       const newId = Date.now().toString();
       newSessions = [{ id: newId, title: 'Chat Baru', messages: [DEFAULT_MESSAGE] }];
    }
    setSessions(newSessions);
    if (activeSessionId === id) {
      setActiveSessionId(newSessions[0].id);
    }
    saveState(newSessions, userMemory, theme);
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
          const { data } = await supabase.from('cloud_saves')
            .select('sessions_data, memory_data')
            .eq('user_id', authUser.id)
            .order('updated_at', { ascending: false })
            .limit(1);
            
          if (data && data.length > 0) {
            if (data[0].sessions_data) loadedSessions = data[0].sessions_data;
            if (data[0].memory_data) loadedMemory = data[0].memory_data;
          } else {
            const localSaved = localStorage.getItem('genz-bot-sessions');
            const localMemory = localStorage.getItem('genz-bot-memory');
            if (localSaved) loadedSessions = JSON.parse(localSaved);
            if (localMemory) loadedMemory = JSON.parse(localMemory);
            
            await saveState(loadedSessions, loadedMemory, savedTheme);
          }
        } catch (e) { 
          console.error('Gagal memuat data cloud', e);
          const localSaved = localStorage.getItem('genz-bot-sessions');
          const localMemory = localStorage.getItem('genz-bot-memory');
          if (localSaved) loadedSessions = JSON.parse(localSaved);
          if (localMemory) loadedMemory = JSON.parse(localMemory);
        }
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

  const value = {
    sessions, setSessions,
    activeSessionId, setActiveSessionId,
    isSidebarOpen, setIsSidebarOpen,
    toxicity, setToxicity,
    theme, setTheme,
    chatMode, setChatMode,
    userMemory, setUserMemory,
    authUser, isAuthChecking,
    hasSelectedMood, setHasSelectedMood,
    isInitialLoad, isInitialized,
    createNewSession, clearAllSessions, updateSessionMessages, updateSessionTitle, deleteSessionById, DEFAULT_MESSAGE,
    broadcastMessage
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}
