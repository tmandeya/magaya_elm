import { useState, useEffect } from 'react';
import { getWorkflows } from '@/lib/supabase';

export function useWorkflows(filters?: { type?: string; status?: string }) {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWorkflows(filters).then(({ data }) => {
      setWorkflows(data || []);
      setLoading(false);
    });
  }, [JSON.stringify(filters)]);

  return { workflows, loading };
}
