"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Contact, Deal, User, Conversation, Task, DealStage, TaskStatus, Message } from '../types';
import { CONTACTS, DEALS, USERS, CONVERSATIONS, TASKS } from '../data/seedData';

interface AppState {
  contacts: Contact[];
  deals: Deal[];
  users: User[];
  conversations: Conversation[];
  tasks: Task[];
  currentUser: User | null;
  darkMode: boolean;
  sidebarCollapsed: boolean;
}

type AppAction =
  | { type: 'SET_CONTACTS'; payload: Contact[] }
  | { type: 'ADD_CONTACT'; payload: Contact }
  | { type: 'UPDATE_CONTACT'; payload: Contact }
  | { type: 'DELETE_CONTACT'; payload: string }
  | { type: 'SET_DEALS'; payload: Deal[] }
  | { type: 'ADD_DEAL'; payload: Deal }
  | { type: 'UPDATE_DEAL_STAGE'; payload: { dealId: string; stage: DealStage } }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'SET_THEME'; payload: boolean }
  | { type: 'SET_SIDEBAR_COLLAPSED'; payload: boolean }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'UPDATE_TASK_STATUS'; payload: { taskId: string; status: TaskStatus } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'UPDATE_CONVERSATION'; payload: Conversation }
  | { type: 'ADD_MESSAGE'; payload: { convId: string; message: Message } };

const initialState: AppState = {
  contacts: CONTACTS,
  deals: DEALS,
  users: USERS,
  conversations: CONVERSATIONS,
  tasks: TASKS,
  currentUser: null,
  darkMode: false,
  sidebarCollapsed: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CONTACTS': return { ...state, contacts: action.payload };
    case 'ADD_CONTACT': return { ...state, contacts: [action.payload, ...state.contacts] };
    case 'UPDATE_CONTACT': return { ...state, contacts: state.contacts.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CONTACT': return { ...state, contacts: state.contacts.filter(c => c.id !== action.payload) };
    case 'SET_DEALS': return { ...state, deals: action.payload };
    case 'ADD_DEAL': return { ...state, deals: [action.payload, ...state.deals] };
    case 'UPDATE_DEAL_STAGE':
      return {
        ...state,
        deals: state.deals.map(d => d.id === action.payload.dealId ? { ...d, stage: action.payload.stage } : d)
      };
    case 'SET_USER': return { ...state, currentUser: action.payload };
    case 'ADD_USER': return { ...state, users: [...state.users, action.payload] };
    case 'UPDATE_USER': return { ...state, users: state.users.map(u => u.id === action.payload.id ? action.payload : u) };
    case 'TOGGLE_DARK_MODE': return { ...state, darkMode: !state.darkMode };
    case 'SET_THEME': return { ...state, darkMode: action.payload };
    case 'SET_SIDEBAR_COLLAPSED': return { ...state, sidebarCollapsed: action.payload };
    case 'ADD_TASK': return { ...state, tasks: [action.payload, ...state.tasks] };
    case 'UPDATE_TASK': return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'UPDATE_TASK_STATUS':
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.taskId ? { ...t, status: action.payload.status } : t)
      };
    case 'DELETE_TASK': return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map(c => c.id === action.payload.id ? action.payload : c)
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        conversations: state.conversations.map(c => 
          c.id === action.payload.convId 
            ? { ...c, messages: [...c.messages, action.payload.message] }
            : c
        )
      };
    default: return state;
  }
}

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<AppAction> } | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    dispatch({ type: 'SET_CONTACTS', payload: JSON.parse(localStorage.getItem('nova_contacts') || JSON.stringify(CONTACTS)) });
    dispatch({ type: 'SET_DEALS', payload: JSON.parse(localStorage.getItem('nova_deals') || JSON.stringify(DEALS)) });
    const savedUser = JSON.parse(localStorage.getItem('nova_user') || 'null');
    if (savedUser) dispatch({ type: 'SET_USER', payload: savedUser });
    if (localStorage.getItem('nova_dark_mode') === 'true') dispatch({ type: 'TOGGLE_DARK_MODE' });
    if (localStorage.getItem('nova_sidebar_collapsed') === 'true') dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: true });
  }, []);

  useEffect(() => {
    localStorage.setItem('nova_contacts', JSON.stringify(state.contacts));
    localStorage.setItem('nova_deals', JSON.stringify(state.deals));
    localStorage.setItem('nova_conversations', JSON.stringify(state.conversations));
    localStorage.setItem('nova_tasks', JSON.stringify(state.tasks));
    localStorage.setItem('nova_user', JSON.stringify(state.currentUser));
    localStorage.setItem('nova_app_users', JSON.stringify(state.users));
    localStorage.setItem('nova_dark_mode', String(state.darkMode));
    localStorage.setItem('nova_sidebar_collapsed', String(state.sidebarCollapsed));
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
