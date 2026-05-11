// Remove this:
// import { employees } from '@/data/mockData';

// Use this instead:
import { useEmployees } from '@/hooks/useEmployees';

function EmployeesPage() {
  const { employees, loading } = useEmployees();
  
  if (loading) return <div>Loading employees...</div>;
  
  return (
    <table>
      {employees.map(emp => (
        <tr key={emp.id}>
          <td>{emp.employee_code}</td>
          <td>{emp.full_name}</td>
          <td>{emp.site?.name}</td>
        </tr>
      ))}
    </table>
  );
}
