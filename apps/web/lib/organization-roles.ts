export const getRoleDisplayName = (role: string): string => {
  const roleMap: Record<string, string> = {
    admin: 'Administrator',
    recruiter: 'Recruiter',
    hiring_manager: 'Hiring Manager',
    member: 'Team Member',
  }
  return roleMap[role] || role
}
