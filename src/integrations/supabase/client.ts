
// This file is kept for compatibility but not actually used anymore
// The application now uses Firebase for real-time communication

export const supabase = {
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null })
      }),
      insert: async () => ({ error: null }),
      update: async () => ({ error: null })
    })
  }),
  channel: () => ({
    on: () => ({
      on: () => ({
        subscribe: () => {}
      })
    }),
    subscribe: () => {}
  })
};
