import { useState, useEffect } from 'react';
import { getEmployees } from '@/lib/supabase';

export function useEmployees(filters?: any) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEmployees(filters).then(({ data }) => {
      setEmployees(data || []);
      setLoading(false);
    });
  }, [JSON.stringify(filters)]);

  return { employees, loading };
}
