import { create } from 'zustand';
import type { TeamMember } from '@/types';
import { sampleTeamMembers } from '@/data/sampleData';

interface TeamState {
  members: TeamMember[];

  // Actions
  setMembers: (members: TeamMember[]) => void;
  getMemberById: (id: string) => TeamMember | undefined;
  getMembersByStatus: (status: TeamMember['status']) => TeamMember[];
  updateMemberStatus: (id: string, status: TeamMember['status']) => void;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  members: sampleTeamMembers,

  setMembers: (members) => set({ members }),

  getMemberById: (id) => get().members.find((m) => m.id === id),

  getMembersByStatus: (status) => get().members.filter((m) => m.status === status),

  updateMemberStatus: (id, status) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.id === id ? { ...m, status } : m
      ),
    })),
}));
