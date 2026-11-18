import { api } from './api';

export interface TeamMember {
  id: string;
  name: string;
  userCode: string;
  referralCode: string;
  phone: string;
  level: number;
  levelLabel: string;
  totalShopping: number;
  monthlyVegetablePurchase?: number;
  monthlyOtherPurchase?: number;
  status: 'Active' | 'Inactive';
  isActive: boolean;
  isVerified: boolean;
  joinedAt: string;
  avatarInitial: string;
}

export interface MyTeamResponse {
  targetUser: {
    id: string;
    name: string;
    userCode: string;
  };
  users: TeamMember[];
  totalUsers: number;
  levelCounts: Record<string, number>;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MemberTransactionDetails {
  member: {
    id: string;
    name: string;
    userCode: string;
    phone: string;
    totalShopping: number;
    totalIncomeGenerated: number;
    isVerified: boolean;
    joinedAt: string;
  };
  incomeTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    date: string;
    description: string;
  }>;
  shoppingOrders: Array<{
    orderNumber: string;
    amount: number;
    status: string;
    date: string;
    itemsCount: number;
  }>;
}

export const TeamService = {
  async getMyTeam(params: {
    level?: string;
    search?: string;
    sortBy?: string;
    targetUserId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data?: MyTeamResponse; message?: string }> {
    const queryParts: string[] = [];
    if (params.level) queryParts.push(`level=${encodeURIComponent(params.level)}`);
    if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
    if (params.sortBy) queryParts.push(`sortBy=${encodeURIComponent(params.sortBy)}`);
    if (params.targetUserId) queryParts.push(`targetUserId=${encodeURIComponent(params.targetUserId)}`);
    if (params.page) queryParts.push(`page=${params.page}`);
    if (params.limit) queryParts.push(`limit=${params.limit}`);

    const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return api.get<MyTeamResponse>(`/users/my-team${qs}`);
  },

  async getMemberTransactions(targetUserId: string): Promise<{
    success: boolean;
    data?: MemberTransactionDetails;
    message?: string;
  }> {
    return api.get<MemberTransactionDetails>(`/users/team-member-transactions/${targetUserId}`);
  },
};
