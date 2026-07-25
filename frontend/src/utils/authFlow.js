export const resolvePostAuthRoute = (role, onboardingCompleted) => {
  if (role === 'club') return onboardingCompleted ? '/club/dashboard' : '/startup'
  if (role === 'athlete') return onboardingCompleted ? '/feed' : '/startup'
  return '/feed'
}
