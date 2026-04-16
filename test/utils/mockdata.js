//Mock data for supabase testing
export const mockValidUser = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User'
};

export const mockInvalidUser = {
  email: 'invalid-email',
  password: '123',
  name: ''
};

export const mockSupabaseResponse = {
  user: {
    id: '123',
    email: 'test@example.com',
    user_metadata: { name: 'Test User' }
  },
  session: {
    access_token: 'mock-token',
    expires_in: 3600
  }
};

export const mockSupabaseError = {
  message: 'Invalid login credentials',
  status: 400
};