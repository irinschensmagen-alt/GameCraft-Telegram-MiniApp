const sessions = new Map();

export function getSession(userId) {
  if (!sessions.has(userId)) sessions.set(userId, { currentProject: null, profile: null });
  return sessions.get(userId);
}

export function setProfile(userId, profile) {
  const s = getSession(userId);
  s.profile = profile;
  return s;
}

export function setProject(userId, project) {
  const s = getSession(userId);
  s.currentProject = project;
  return s;
}

export function resetSession(userId) {
  sessions.delete(userId);
}
